"""
Central Availability Service for Manohar Grand Hotel Platform.

Authoritative Rules:
1. PhysicalRoom records are the sole authoritative inventory.
2. Capacity is derived dynamically — no separate editable inventory counter exists.
3. Consumed stay dates follow [check_in, check_out) night interval semantics.
4. Operational physical rooms (operational_status='operational', is_active=True) form the baseline capacity.
5. Dated blocks (RoomBlock, MaintenanceBlock) reduce available physical rooms without mutating persistent room statuses. Overlapping blocks on the same physical room are deduplicated.
6. Bookings with status in ('confirmed', 'checked_in') or unexpired ('held' with hold_expires_at > now) consume category-level capacity (BookingRoom.room_quantity).
7. Expired holds (status='held' with hold_expires_at <= now), cancelled, expired, checked_out, and no_show bookings do NOT consume future availability.
8. Physical room assignment (physical_room FK on BookingRoom) is operational data and does NOT cause double-counting.
9. Stay-level availability is the bottleneck minimum across all consumed nights: min(nightly_available).
"""
import collections
from datetime import date, datetime
from typing import List, Dict, Any, Optional, Set

from django.db.models import Q
from django.utils import timezone

from apps.inventory.services import get_stay_nights
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import RoomBlock, MaintenanceBlock, StopSell
from apps.bookings.models import Booking, BookingRoom


class AvailabilityService:
    """
    Core service for computing real-time room category availability.
    """

    @classmethod
    def calculate_stay_availability(
        cls,
        check_in: date,
        check_out: date,
        category_ids: Optional[List[Any]] = None,
        category_slugs: Optional[List[str]] = None,
        requested_quantity: int = 1,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Calculate availability across a multi-night stay for one or more room categories.

        :param check_in: Check-in date (inclusive)
        :param check_out: Check-out date (exclusive)
        :param category_ids: Optional list of RoomCategory UUIDs
        :param category_slugs: Optional list of RoomCategory slugs
        :param requested_quantity: Number of rooms requested (default 1)
        :param now: Optional reference timestamp (defaults to timezone.now())
        :return: Structured dictionary with overall stay details and per-category breakdown
        """
        if check_out <= check_in:
            raise ValueError("check_out date must be strictly after check_in date.")

        if now is None:
            now = timezone.now()

        stay_nights = get_stay_nights(check_in, check_out)
        nights_count = len(stay_nights)

        # 1. Query active Room Categories
        categories_qs = RoomCategory.objects.all()
        if category_ids:
            categories_qs = categories_qs.filter(id__in=category_ids)
        if category_slugs:
            categories_qs = categories_qs.filter(slug__in=category_slugs)

        categories_list = list(categories_qs.order_by('display_order', 'name'))

        if not categories_list:
            return {
                "check_in": check_in.isoformat(),
                "check_out": check_out.isoformat(),
                "nights_count": nights_count,
                "stay_nights": [d.isoformat() for d in stay_nights],
                "requested_quantity": requested_quantity,
                "categories": []
            }

        # 2. Fetch operational physical rooms per category
        operational_rooms_qs = PhysicalRoom.objects.filter(
            category__in=categories_list,
            operational_status='operational'
        ).values('id', 'category_id')

        # category_id -> set of operational physical_room UUIDs
        category_operational_rooms: Dict[Any, Set[Any]] = collections.defaultdict(set)
        for r in operational_rooms_qs:
            category_operational_rooms[r['category_id']].add(r['id'])

        # 3. Fetch active RoomBlocks overlapping the stay window
        room_blocks_qs = RoomBlock.objects.filter(
            is_active=True,
            physical_room__category__in=categories_list,
            start_date__lt=check_out,
            end_date__gt=check_in,
        ).values('physical_room_id', 'physical_room__category_id', 'start_date', 'end_date')

        # 4. Fetch active MaintenanceBlocks overlapping the stay window
        maint_blocks_qs = MaintenanceBlock.objects.filter(
            is_active=True,
            physical_room__category__in=categories_list,
            start_date__lt=check_out,
            end_date__gt=check_in,
        ).values('physical_room_id', 'physical_room__category_id', 'start_date', 'end_date')

        # 5. Fetch active Bookings and their BookingRoom items in the stay window
        # Valid states: confirmed, checked_in, or held (ONLY if hold_expires_at > now)
        active_booking_rooms_qs = BookingRoom.objects.filter(
            category__in=categories_list,
            booking__check_in_date__lt=check_out,
            booking__check_out_date__gt=check_in,
        ).filter(
            Q(booking__status__in=['confirmed', 'checked_in']) |
            Q(booking__status='held', booking__hold_expires_at__gt=now)
        ).values(
            'category_id',
            'room_quantity',
            'booking__check_in_date',
            'booking__check_out_date',
            'booking__status',
        )

        active_booking_rooms_list = list(active_booking_rooms_qs)
        room_blocks_list = list(room_blocks_qs)
        maint_blocks_list = list(maint_blocks_qs)

        # 5b. Fetch active StopSell (Hotel Full Booked / Stop-Sell) records overlapping the stay
        stop_sells_qs = StopSell.objects.filter(
            is_active=True,
            start_date__lt=check_out,
            end_date__gt=check_in,
        ).filter(
            Q(is_hotel_wide=True) | Q(category__in=categories_list)
        ).values('is_hotel_wide', 'category_id', 'start_date', 'end_date', 'reason')
        stop_sells_list = list(stop_sells_qs)

        # 6. Compute availability per category across stay nights
        results_categories = []

        for category in categories_list:
            cat_id = category.id
            is_active_cat = category.is_active

            # If category is inactive, zero operational capacity is exposed
            if not is_active_cat:
                total_capacity = 0
                nightly_breakdown = [
                    {
                        "date": d.isoformat(),
                        "total_operational": 0,
                        "blocked_rooms": 0,
                        "booked_rooms": 0,
                        "available_rooms": 0,
                    }
                    for d in stay_nights
                ]
                min_available = 0
                is_available = False
            else:
                operational_room_ids = category_operational_rooms[cat_id]
                total_capacity = len(operational_room_ids)

                nightly_breakdown = []
                nightly_avail_counts = []

                for night in stay_nights:
                    # Set of distinct physical rooms blocked on this specific night
                    blocked_room_ids = set()

                    for b in room_blocks_list:
                        if b['physical_room__category_id'] == cat_id and b['start_date'] <= night < b['end_date']:
                            blocked_room_ids.add(b['physical_room_id'])

                    for mb in maint_blocks_list:
                        if mb['physical_room__category_id'] == cat_id and mb['start_date'] <= night < mb['end_date']:
                            blocked_room_ids.add(mb['physical_room_id'])

                    # Only operational rooms affected by blocks reduce baseline capacity
                    # (Globally inactive/maintenance rooms are already excluded from operational_room_ids)
                    operational_blocked_count = len(blocked_room_ids.intersection(operational_room_ids))

                    # Sum active booked room quantities for this category on this night
                    booked_count = sum(
                        br['room_quantity']
                        for br in active_booking_rooms_list
                        if br['category_id'] == cat_id and br['booking__check_in_date'] <= night < br['booking__check_out_date']
                    )

                    # Check if stop-sell applies to this night for this category or entire hotel
                    stop_sell_match = next(
                        (
                            s for s in stop_sells_list
                            if (s['is_hotel_wide'] or s['category_id'] == cat_id)
                            and s['start_date'] <= night < s['end_date']
                        ),
                        None
                    )

                    is_stop_sell_night = stop_sell_match is not None
                    if is_stop_sell_night:
                        avail_on_night = 0
                        stop_sell_reason = stop_sell_match['reason']
                    else:
                        avail_on_night = max(0, total_capacity - operational_blocked_count - booked_count)
                        stop_sell_reason = None

                    nightly_avail_counts.append(avail_on_night)

                    nightly_breakdown.append({
                        "date": night.isoformat(),
                        "total_operational": total_capacity,
                        "blocked_rooms": operational_blocked_count,
                        "booked_rooms": booked_count,
                        "available_rooms": avail_on_night,
                        "is_stop_sell": is_stop_sell_night,
                        "stop_sell_reason": stop_sell_reason,
                    })

                min_available = min(nightly_avail_counts) if nightly_avail_counts else 0
                is_available = (min_available >= requested_quantity) and (total_capacity > 0)

            cat_has_stop_sell = any(nb.get("is_stop_sell") for nb in nightly_breakdown)
            cat_stop_sell_reason = next(
                (nb.get("stop_sell_reason") for nb in nightly_breakdown if nb.get("is_stop_sell")),
                None
            )

            results_categories.append({
                "category_id": str(category.id),
                "category_slug": category.slug,
                "category_name": category.name,
                "is_active": is_active_cat,
                "total_operational_capacity": total_capacity,
                "minimum_available_rooms": min_available,
                "requested_quantity": requested_quantity,
                "is_available": is_available,
                "is_stop_sell": cat_has_stop_sell,
                "stop_sell_reason": cat_stop_sell_reason,
                "nightly_availability": nightly_breakdown,
            })

        hotel_wide_stop_sell = any(s['is_hotel_wide'] for s in stop_sells_list)
        return {
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "nights_count": nights_count,
            "stay_nights": [d.isoformat() for d in stay_nights],
            "requested_quantity": requested_quantity,
            "is_hotel_fully_booked": hotel_wide_stop_sell,
            "categories": results_categories
        }

    @classmethod
    def calculate_calendar_matrix(
        cls,
        start_date: date,
        end_date: date,
        category_ids: Optional[List[Any]] = None,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Calculate calendar-grid day-by-day availability across a given date range.
        Used for monthly overview and availability calendar views.
        """
        return cls.calculate_stay_availability(
            check_in=start_date,
            check_out=end_date,
            category_ids=category_ids,
            requested_quantity=1,
            now=now
        )
