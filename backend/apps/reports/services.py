"""
Authoritative calculation engine for Admin Reports & Operational Analytics.
Provides read-only queries and aggregation over existing database models:
Booking, PhysicalRoom, RoomCategory, BookingPriceSnapshot, PaymentOrder,
RoomBlock, MaintenanceBlock, and AuditLog.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.db.models import Sum, Count, Q, F, Avg
from django.utils import timezone

from apps.bookings.models import Booking, BookingRoom, BookingGuest
from apps.rooms.models import RoomCategory, PhysicalRoom
from apps.inventory.models import RoomBlock, MaintenanceBlock
from apps.payments.models import PaymentOrder
from apps.pricing.models import BookingPriceSnapshot
from apps.payments.services import PaymentReconciliationService
from core.models import AuditLog


def _parse_date_range(from_date_str: Optional[str], to_date_str: Optional[str], default_days: int = 30) -> tuple[date, date]:
    """Utility to safely parse and validate ISO date ranges."""
    today = timezone.now().date()
    if from_date_str:
        try:
            from_d = date.fromisoformat(str(from_date_str).strip())
        except ValueError:
            from_d = today - timedelta(days=default_days)
    else:
        from_d = today - timedelta(days=default_days)

    if to_date_str:
        try:
            to_d = date.fromisoformat(str(to_date_str).strip())
        except ValueError:
            to_d = today
    else:
        to_d = today

    if to_d < from_d:
        to_d = from_d

    # Maximum 1-year range protection for performance
    if (to_d - from_d).days > 365:
        to_d = from_d + timedelta(days=365)

    return from_d, to_d


class ReportingService:
    """
    Core reporting service exposing read-only operational and financial metrics.
    """

    @classmethod
    def get_overview_kpis(cls, from_date_str: Optional[str] = None, to_date_str: Optional[str] = None) -> Dict[str, Any]:
        """
        High-level KPI dashboard overview for hotel owner and front desk managers.
        """
        today = timezone.now().date()
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)

        # 1. Front Desk Today
        expected_checkins = Booking.objects.filter(check_in_date=today, status='confirmed').count()
        completed_checkins = Booking.objects.filter(check_in_date=today, status='checked_in').count()
        expected_checkouts = Booking.objects.filter(check_out_date=today, status='checked_in').count()
        completed_checkouts = Booking.objects.filter(check_out_date=today, status='checked_out').count()
        in_house_guests = Booking.objects.filter(status='checked_in').count()

        # 2. Physical Room Inventory Status
        total_physical_rooms = PhysicalRoom.objects.count()
        operational_rooms = PhysicalRoom.objects.filter(operational_status='operational').count()
        maintenance_rooms = PhysicalRoom.objects.filter(operational_status='maintenance').count()
        blocked_rooms = PhysicalRoom.objects.filter(operational_status='blocked').count()

        # Occupied rooms today: operational rooms assigned to checked_in or confirmed arriving today
        active_assigned_today = BookingRoom.objects.filter(
            booking__status__in=['checked_in', 'confirmed'],
            booking__check_in_date__lte=today,
            booking__check_out_date__gt=today,
            physical_room__isnull=False
        ).values('physical_room').distinct().count()

        # Total rooms occupied by category count
        occupied_category_rooms = BookingRoom.objects.filter(
            booking__status__in=['checked_in', 'confirmed'],
            booking__check_in_date__lte=today,
            booking__check_out_date__gt=today
        ).aggregate(total=Sum('room_quantity'))['total'] or 0

        current_occupied = max(active_assigned_today, occupied_category_rooms)
        current_available = max(0, operational_rooms - current_occupied)
        current_occupancy_rate = round((current_occupied / operational_rooms * 100), 1) if operational_rooms > 0 else 0.0

        # 3. Monthly / Period Financial Performance
        period_bookings = Booking.objects.filter(
            created_at__date__gte=from_d,
            created_at__date__lte=to_d,
            status__in=['confirmed', 'checked_in', 'checked_out']
        )
        period_snapshots = BookingPriceSnapshot.objects.filter(booking__in=period_bookings)

        total_gross_revenue = period_snapshots.aggregate(total=Sum('gross_total'))['total'] or Decimal('0.00')
        total_advance_due = period_snapshots.aggregate(total=Sum('advance_amount_due'))['total'] or Decimal('0.00')
        total_balance_due = period_snapshots.aggregate(total=Sum('balance_amount_due'))['total'] or Decimal('0.00')

        captured_payments = PaymentOrder.objects.filter(
            status='captured',
            created_at__date__gte=from_d,
            created_at__date__lte=to_d
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # 4. Reconciliation Alerts
        reconciliation_discrepancies = AuditLog.objects.filter(
            resource_type='PaymentReconciliation',
            action='discrepancy_detected'
        ).count()

        # 5. Recent Activity
        recent_bookings = Booking.objects.select_related('customer', 'price_snapshot').order_by('-created_at')[:5]
        recent_payments = PaymentOrder.objects.select_related('booking').order_by('-created_at')[:5]

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
                "today": today.isoformat(),
            },
            "today_frontdesk": {
                "expected_check_ins": expected_checkins,
                "completed_check_ins": completed_checkins,
                "expected_check_outs": expected_checkouts,
                "completed_check_outs": completed_checkouts,
                "in_house_bookings": in_house_guests,
            },
            "today_inventory": {
                "total_physical_rooms": total_physical_rooms,
                "operational_rooms": operational_rooms,
                "occupied_rooms": current_occupied,
                "available_rooms": current_available,
                "maintenance_rooms": maintenance_rooms,
                "blocked_rooms": blocked_rooms,
                "occupancy_rate_percent": current_occupancy_rate,
            },
            "financial_kpi": {
                "period_gross_revenue": str(total_gross_revenue),
                "period_advance_due": str(total_advance_due),
                "period_balance_due": str(total_balance_due),
                "period_captured_payments": str(captured_payments),
                "outstanding_balance": str(max(Decimal('0.00'), total_gross_revenue - captured_payments)),
            },
            "reconciliation_alerts_count": reconciliation_discrepancies,
            "recent_bookings": [
                {
                    "booking_reference": b.booking_reference,
                    "guest_name": b.guest_name,
                    "status": b.status,
                    "check_in_date": b.check_in_date.isoformat(),
                    "check_out_date": b.check_out_date.isoformat(),
                    "gross_total": str(b.price_snapshot.gross_total) if hasattr(b, 'price_snapshot') and b.price_snapshot else "0.00",
                    "created_at": b.created_at.isoformat(),
                }
                for b in recent_bookings
            ],
            "recent_payments": [
                {
                    "payment_id": str(p.id),
                    "booking_reference": p.booking.booking_reference,
                    "amount": str(p.amount),
                    "status": p.status,
                    "purpose": p.purpose,
                    "created_at": p.created_at.isoformat(),
                }
                for p in recent_payments
            ],
        }

    @classmethod
    def get_booking_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        category_slug: Optional[str] = None,
        date_dimension: str = 'created_at',
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Comprehensive booking analysis with status, source, and category filters.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)

        # Base queryset with select_related
        qs = Booking.objects.select_related('customer', 'price_snapshot').prefetch_related('rooms__category')

        # Date dimension filtering
        if date_dimension == 'check_in':
            qs = qs.filter(check_in_date__gte=from_d, check_in_date__lte=to_d)
        elif date_dimension == 'check_out':
            qs = qs.filter(check_out_date__gte=from_d, check_out_date__lte=to_d)
        else:
            qs = qs.filter(created_at__date__gte=from_d, created_at__date__lte=to_d)

        # Filters
        if status:
            qs = qs.filter(status=status)
        if source:
            qs = qs.filter(source=source)
        if category_slug:
            qs = qs.filter(rooms__category__slug=category_slug).distinct()

        total_count = qs.count()

        # Aggregated Status Breakdown
        status_counts = {}
        for s_val, _ in Booking.STATUS_CHOICES:
            status_counts[s_val] = qs.filter(status=s_val).count()

        # Aggregated Source Breakdown
        source_counts = {}
        for src_val, src_label in Booking.SOURCE_CHOICES:
            cnt = qs.filter(source=src_val).count()
            rev = qs.filter(source=src_val, status__in=['confirmed', 'checked_in', 'checked_out']).aggregate(
                total=Sum('price_snapshot__gross_total')
            )['total'] or Decimal('0.00')
            source_counts[src_val] = {
                "label": src_label,
                "count": cnt,
                "revenue": str(rev),
            }

        # Aggregated Category Breakdown
        categories = RoomCategory.objects.filter(is_active=True)
        category_breakdown = {}
        for cat in categories:
            cat_qs = qs.filter(rooms__category=cat)
            room_qty = cat_qs.aggregate(total=Sum('rooms__room_quantity'))['total'] or 0
            category_breakdown[cat.slug] = {
                "name": cat.name,
                "bookings_count": cat_qs.count(),
                "room_quantity_booked": room_qty,
            }

        # Pagination
        offset = (page - 1) * page_size
        paginated_bookings = qs.order_by('-created_at')[offset:offset + page_size]

        bookings_list = []
        for b in paginated_bookings:
            snapshot = getattr(b, 'price_snapshot', None)
            bookings_list.append({
                "booking_reference": b.booking_reference,
                "guest_name": b.guest_name,
                "guest_phone": b.guest_phone,
                "guest_email": b.guest_email,
                "status": b.status,
                "status_display": b.get_status_display(),
                "source": b.source,
                "source_display": b.get_source_display(),
                "check_in_date": b.check_in_date.isoformat(),
                "check_out_date": b.check_out_date.isoformat(),
                "nights_count": b.nights_count,
                "total_rooms_count": b.total_rooms_count,
                "gross_total": str(snapshot.gross_total) if snapshot else "0.00",
                "advance_due": str(snapshot.advance_amount_due) if snapshot else "0.00",
                "balance_due": str(snapshot.balance_amount_due) if snapshot else "0.00",
                "is_overbooking": b.is_overbooking,
                "created_at": b.created_at.isoformat(),
            })

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
                "date_dimension": date_dimension,
            },
            "summary": {
                "total_bookings": total_count,
                "by_status": status_counts,
                "by_source": source_counts,
                "by_category": category_breakdown,
            },
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
            },
            "bookings": bookings_list,
        }

    @classmethod
    def get_occupancy_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None,
        category_slug: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authoritative room-night occupancy calculation across physical rooms.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=14)
        num_days = (to_d - from_d).days + 1

        # Physical capacity
        phys_qs = PhysicalRoom.objects.all()
        if category_slug:
            phys_qs = phys_qs.filter(category__slug=category_slug)

        total_physical_count = phys_qs.count()
        operational_physical_count = phys_qs.filter(operational_status='operational').count()

        total_room_nights_available = operational_physical_count * num_days
        total_room_nights_occupied = 0
        total_room_nights_held = 0
        total_room_nights_blocked = 0

        daily_breakdown = []
        current_date = from_d
        now = timezone.now()

        while current_date <= to_d:
            # 1. Confirmed / In-house bookings on this night
            occupied_count = BookingRoom.objects.filter(
                booking__status__in=['confirmed', 'checked_in', 'checked_out'],
                booking__check_in_date__lte=current_date,
                booking__check_out_date__gt=current_date,
            )
            if category_slug:
                occupied_count = occupied_count.filter(category__slug=category_slug)
            occupied_qty = occupied_count.aggregate(total=Sum('room_quantity'))['total'] or 0

            # 2. Active temporary holds
            held_count = BookingRoom.objects.filter(
                booking__status='held',
                booking__hold_expires_at__gt=now,
                booking__check_in_date__lte=current_date,
                booking__check_out_date__gt=current_date,
            )
            if category_slug:
                held_count = held_count.filter(category__slug=category_slug)
            held_qty = held_count.aggregate(total=Sum('room_quantity'))['total'] or 0

            # 3. Blocks & Maintenance
            maint_count = MaintenanceBlock.objects.filter(
                start_date__lte=current_date,
                end_date__gte=current_date
            )
            room_blocks_count = RoomBlock.objects.filter(
                start_date__lte=current_date,
                end_date__gte=current_date
            )
            if category_slug:
                maint_count = maint_count.filter(physical_room__category__slug=category_slug)
                room_blocks_count = room_blocks_count.filter(physical_room__category__slug=category_slug)

            blocked_qty = maint_count.count() + room_blocks_count.count()

            # Available
            available_qty = max(0, operational_physical_count - occupied_qty - held_qty - blocked_qty)
            occ_rate = round((occupied_qty / operational_physical_count * 100), 1) if operational_physical_count > 0 else 0.0

            daily_breakdown.append({
                "date": current_date.isoformat(),
                "total_operational_rooms": operational_physical_count,
                "rooms_occupied": occupied_qty,
                "rooms_held": held_qty,
                "rooms_blocked": blocked_qty,
                "rooms_available": available_qty,
                "occupancy_rate_percent": occ_rate,
            })

            total_room_nights_occupied += occupied_qty
            total_room_nights_held += held_qty
            total_room_nights_blocked += blocked_qty

            current_date += timedelta(days=1)

        avg_occupancy_rate = round((total_room_nights_occupied / total_room_nights_available * 100), 1) if total_room_nights_available > 0 else 0.0

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
                "days_count": num_days,
            },
            "summary": {
                "total_physical_rooms": total_physical_count,
                "operational_physical_rooms": operational_physical_count,
                "total_room_nights_available": total_room_nights_available,
                "total_room_nights_occupied": total_room_nights_occupied,
                "total_room_nights_held": total_room_nights_held,
                "total_room_nights_blocked": total_room_nights_blocked,
                "average_occupancy_rate_percent": avg_occupancy_rate,
            },
            "daily_occupancy": daily_breakdown,
        }

    @classmethod
    def get_category_performance_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates performance (Sold Nights, Occupancy %, Revenue, ADR, RevPAR) dynamically per active category.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)
        num_days = (to_d - from_d).days + 1

        categories = RoomCategory.objects.filter(is_active=True)
        results = []

        for cat in categories:
            phys_count = PhysicalRoom.objects.filter(category=cat, operational_status='operational').count()
            capacity_nights = phys_count * num_days

            # Confirmed reservations touching this date range
            booked_rooms = BookingRoom.objects.filter(
                category=cat,
                booking__status__in=['confirmed', 'checked_in', 'checked_out'],
                booking__check_in_date__lte=to_d,
                booking__check_out_date__gte=from_d,
            )

            bookings_count = booked_rooms.values('booking').distinct().count()

            # Room nights sold in period
            total_sold_nights = 0
            total_revenue = Decimal('0.00')

            for br in booked_rooms.select_related('booking', 'booking__price_snapshot'):
                # Overlap between stay dates and period
                overlap_start = max(br.booking.check_in_date, from_d)
                overlap_end = min(br.booking.check_out_date, to_d + timedelta(days=1))
                overlap_nights = max(0, (overlap_end - overlap_start).days)
                total_sold_nights += overlap_nights * br.room_quantity

                # Approximate category revenue attribution
                if hasattr(br.booking, 'price_snapshot') and br.booking.price_snapshot:
                    snap = br.booking.price_snapshot
                    if br.booking.nights_count > 0:
                        nightly_val = snap.room_subtotal / br.booking.nights_count
                        total_revenue += (nightly_val * overlap_nights)

            occ_rate = round((total_sold_nights / capacity_nights * 100), 1) if capacity_nights > 0 else 0.0
            adr = round((total_revenue / total_sold_nights), 2) if total_sold_nights > 0 else Decimal('0.00')
            revpar = round((total_revenue / capacity_nights), 2) if capacity_nights > 0 else Decimal('0.00')

            results.append({
                "category_id": str(cat.id),
                "category_name": cat.name,
                "category_slug": cat.slug,
                "operational_rooms_count": phys_count,
                "capacity_room_nights": capacity_nights,
                "bookings_count": bookings_count,
                "room_nights_sold": total_sold_nights,
                "occupancy_rate_percent": occ_rate,
                "total_revenue": str(total_revenue),
                "average_daily_rate": str(adr),
                "revpar": str(revpar),
            })

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
                "days_count": num_days,
            },
            "categories": results,
        }

    @classmethod
    def get_revenue_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None,
        date_dimension: str = 'created_at'
    ) -> Dict[str, Any]:
        """
        Authoritative revenue breakdown from BookingPriceSnapshot.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)

        # Valid confirmed/in-house/completed bookings
        qs = Booking.objects.filter(status__in=['confirmed', 'checked_in', 'checked_out'])

        if date_dimension == 'check_in':
            qs = qs.filter(check_in_date__gte=from_d, check_in_date__lte=to_d)
        else:
            qs = qs.filter(created_at__date__gte=from_d, created_at__date__lte=to_d)

        snapshots = BookingPriceSnapshot.objects.filter(booking__in=qs)

        gross_booking_value = snapshots.aggregate(total=Sum('gross_total'))['total'] or Decimal('0.00')
        room_subtotal = snapshots.aggregate(total=Sum('room_subtotal'))['total'] or Decimal('0.00')
        extra_guest_total = snapshots.aggregate(total=Sum('extra_guest_total'))['total'] or Decimal('0.00')
        late_checkout_total = snapshots.aggregate(total=Sum('late_checkout_total'))['total'] or Decimal('0.00')
        taxable_subtotal = snapshots.aggregate(total=Sum('taxable_subtotal'))['total'] or Decimal('0.00')
        tax_total = snapshots.aggregate(total=Sum('tax_amount'))['total'] or Decimal('0.00')
        discount_total = snapshots.aggregate(total=Sum('discount_amount'))['total'] or Decimal('0.00')
        advance_due = snapshots.aggregate(total=Sum('advance_amount_due'))['total'] or Decimal('0.00')
        balance_due = snapshots.aggregate(total=Sum('balance_amount_due'))['total'] or Decimal('0.00')

        # Captured payments in this window
        captured_payments = PaymentOrder.objects.filter(
            status='captured',
            created_at__date__gte=from_d,
            created_at__date__lte=to_d
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
                "date_dimension": date_dimension,
            },
            "summary": {
                "gross_booking_value": str(gross_booking_value),
                "room_subtotal": str(room_subtotal),
                "extra_guest_charges": str(extra_guest_total),
                "late_checkout_charges": str(late_checkout_total),
                "taxable_subtotal": str(taxable_subtotal),
                "taxes_collected": str(tax_total),
                "discounts_granted": str(discount_total),
                "advance_amount_due": str(advance_due),
                "balance_amount_due": str(balance_due),
                "captured_payments": str(captured_payments),
                "outstanding_receivables": str(max(Decimal('0.00'), gross_booking_value - captured_payments)),
            },
        }

    @classmethod
    def get_payment_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None,
        status: Optional[str] = None,
        purpose: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Authoritative gateway payment audit and order reconciliation metrics.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)

        qs = PaymentOrder.objects.select_related('booking').filter(
            created_at__date__gte=from_d,
            created_at__date__lte=to_d
        )

        if status:
            qs = qs.filter(status=status)
        if purpose:
            qs = qs.filter(purpose=purpose)

        total_count = qs.count()

        # Status summary
        status_summary = {}
        for s_val, s_label in PaymentOrder.STATUS_CHOICES:
            s_qs = qs.filter(status=s_val)
            cnt = s_qs.count()
            amt = s_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            status_summary[s_val] = {
                "label": s_label,
                "count": cnt,
                "amount": str(amt),
            }

        # Purpose summary
        purpose_summary = {}
        for p_val, p_label in PaymentOrder.PURPOSE_CHOICES:
            p_qs = qs.filter(purpose=p_val)
            purpose_summary[p_val] = {
                "label": p_label,
                "count": p_qs.count(),
                "amount": str(p_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')),
            }

        # Pagination
        offset = (page - 1) * page_size
        paginated_orders = qs.order_by('-created_at')[offset:offset + page_size]

        order_list = []
        for po in paginated_orders:
            order_list.append({
                "payment_id": str(po.id),
                "booking_reference": po.booking.booking_reference,
                "purpose": po.purpose,
                "amount": str(po.amount),
                "amount_paise": po.amount_paise,
                "currency": po.currency,
                "status": po.status,
                "provider": po.provider,
                "razorpay_order_id": po.razorpay_order_id,
                "razorpay_payment_id": po.razorpay_payment_id or "",
                "created_at": po.created_at.isoformat(),
                "updated_at": po.updated_at.isoformat(),
            })

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
            },
            "summary": {
                "total_orders": total_count,
                "by_status": status_summary,
                "by_purpose": purpose_summary,
            },
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
            },
            "payment_orders": order_list,
        }

    @classmethod
    def get_frontdesk_report(cls, target_date_str: Optional[str] = None) -> Dict[str, Any]:
        """
        Front desk operational daily manifest (Arrivals, Departures, In-house, No-shows).
        """
        if target_date_str:
            try:
                target_date = date.fromisoformat(str(target_date_str).strip())
            except ValueError:
                target_date = timezone.now().date()
        else:
            target_date = timezone.now().date()

        # 1. Expected Arrivals (Confirmed bookings arriving target_date)
        arrivals_qs = Booking.objects.select_related('customer', 'price_snapshot').prefetch_related('rooms__category', 'rooms__physical_room').filter(
            check_in_date=target_date,
            status__in=['confirmed', 'checked_in']
        )

        # 2. Departures (Checking out on target_date)
        departures_qs = Booking.objects.select_related('customer', 'price_snapshot').prefetch_related('rooms__category', 'rooms__physical_room').filter(
            check_out_date=target_date,
            status__in=['checked_in', 'checked_out']
        )

        # 3. In-house Guests (Checked in on target date)
        in_house_qs = Booking.objects.select_related('customer', 'price_snapshot').prefetch_related('rooms__category', 'rooms__physical_room').filter(
            status='checked_in'
        )

        def _format_booking_manifest(b):
            assigned_rooms = [
                f"{br.physical_room.room_number} ({br.category.name})"
                for br in b.rooms.all()
                if br.physical_room
            ]
            snapshot = getattr(b, 'price_snapshot', None)
            return {
                "booking_reference": b.booking_reference,
                "guest_name": b.guest_name,
                "guest_phone": b.guest_phone,
                "guest_email": b.guest_email,
                "status": b.status,
                "status_display": b.get_status_display(),
                "total_adults": b.total_adults,
                "total_children": b.total_children,
                "total_rooms_count": b.total_rooms_count,
                "assigned_rooms": assigned_rooms,
                "is_fully_assigned": b.is_fully_assigned,
                "advance_paid": str(snapshot.advance_amount_due) if snapshot and b.status in ['confirmed', 'checked_in', 'checked_out'] else "0.00",
                "balance_due": str(snapshot.balance_amount_due) if snapshot else "0.00",
                "special_requests": b.special_requests or "",
            }

        return {
            "target_date": target_date.isoformat(),
            "summary": {
                "expected_arrivals_count": arrivals_qs.filter(status='confirmed').count(),
                "completed_arrivals_count": arrivals_qs.filter(status='checked_in').count(),
                "expected_departures_count": departures_qs.filter(status='checked_in').count(),
                "completed_departures_count": departures_qs.filter(status='checked_out').count(),
                "in_house_count": in_house_qs.count(),
            },
            "arrivals": [_format_booking_manifest(b) for b in arrivals_qs],
            "departures": [_format_booking_manifest(b) for b in departures_qs],
            "in_house_guests": [_format_booking_manifest(b) for b in in_house_qs],
        }

    @classmethod
    def get_booking_source_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Distribution of bookings and revenue by acquisition channel.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)

        qs = Booking.objects.filter(created_at__date__gte=from_d, created_at__date__lte=to_d)
        total_bookings = qs.count()
        total_revenue = BookingPriceSnapshot.objects.filter(
            booking__in=qs.filter(status__in=['confirmed', 'checked_in', 'checked_out'])
        ).aggregate(total=Sum('gross_total'))['total'] or Decimal('0.00')

        sources_data = []
        for src_val, src_label in Booking.SOURCE_CHOICES:
            src_qs = qs.filter(source=src_val)
            src_count = src_qs.count()
            src_confirmed = src_qs.filter(status__in=['confirmed', 'checked_in', 'checked_out']).count()
            src_cancelled = src_qs.filter(status='cancelled').count()

            src_rev = BookingPriceSnapshot.objects.filter(
                booking__in=src_qs.filter(status__in=['confirmed', 'checked_in', 'checked_out'])
            ).aggregate(total=Sum('gross_total'))['total'] or Decimal('0.00')

            share_pct = round((src_count / total_bookings * 100), 1) if total_bookings > 0 else 0.0
            abv = round((src_rev / src_confirmed), 2) if src_confirmed > 0 else Decimal('0.00')

            sources_data.append({
                "source": src_val,
                "label": src_label,
                "total_bookings": src_count,
                "percentage_share": share_pct,
                "confirmed_bookings": src_confirmed,
                "cancelled_bookings": src_cancelled,
                "total_revenue": str(src_rev),
                "average_booking_value": str(abv),
            })

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
            },
            "summary": {
                "total_bookings": total_bookings,
                "total_revenue": str(total_revenue),
            },
            "sources": sources_data,
        }

    @classmethod
    def get_room_utilization_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None,
        category_slug: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Physical room utilization breakdown across the date period.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=30)
        num_days = (to_d - from_d).days + 1

        rooms_qs = PhysicalRoom.objects.select_related('category').order_by('floor', 'room_number')
        if category_slug:
            rooms_qs = rooms_qs.filter(category__slug=category_slug)

        rooms_data = []
        for r in rooms_qs:
            # Nights occupied: count nights overlapping with bookings assigned to this room
            assigned_bookings = BookingRoom.objects.filter(
                physical_room=r,
                booking__status__in=['confirmed', 'checked_in', 'checked_out'],
                booking__check_in_date__lte=to_d,
                booking__check_out_date__gte=from_d
            ).select_related('booking')

            occupied_nights = 0
            for ab in assigned_bookings:
                overlap_start = max(ab.booking.check_in_date, from_d)
                overlap_end = min(ab.booking.check_out_date, to_d + timedelta(days=1))
                occupied_nights += max(0, (overlap_end - overlap_start).days)

            # Maintenance nights
            maint_blocks = MaintenanceBlock.objects.filter(
                physical_room=r,
                start_date__lte=to_d,
                end_date__gte=from_d
            )
            maint_nights = 0
            for mb in maint_blocks:
                overlap_start = max(mb.start_date, from_d)
                overlap_end = min(mb.end_date, to_d)
                maint_nights += max(0, (overlap_end - overlap_start).days + 1)

            # Room block nights
            room_blocks = RoomBlock.objects.filter(
                physical_room=r,
                start_date__lte=to_d,
                end_date__gte=from_d
            )
            block_nights = 0
            for rb in room_blocks:
                overlap_start = max(rb.start_date, from_d)
                overlap_end = min(rb.end_date, to_d)
                block_nights += max(0, (overlap_end - overlap_start).days + 1)

            utilization_pct = round((occupied_nights / num_days * 100), 1) if num_days > 0 else 0.0

            rooms_data.append({
                "room_id": str(r.id),
                "room_number": r.room_number,
                "floor": r.floor,
                "category_name": r.category.name,
                "category_slug": r.category.slug,
                "operational_status": r.operational_status,
                "days_in_period": num_days,
                "nights_occupied": occupied_nights,
                "nights_maintenance": maint_nights,
                "nights_blocked": block_nights,
                "utilization_rate_percent": utilization_pct,
            })

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
                "days_count": num_days,
            },
            "rooms": rooms_data,
        }

    @classmethod
    def get_overbooking_report(
        cls,
        from_date_str: Optional[str] = None,
        to_date_str: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Audit report of administrative overbooking overrides.
        """
        from_d, to_d = _parse_date_range(from_date_str, to_date_str, default_days=90)

        qs = Booking.objects.filter(
            is_overbooking=True,
            created_at__date__gte=from_d,
            created_at__date__lte=to_d
        ).select_related('created_by', 'customer').prefetch_related('rooms__category')

        total_count = qs.count()

        offset = (page - 1) * page_size
        paginated = qs.order_by('-created_at')[offset:offset + page_size]

        items = []
        for ob in paginated:
            categories_str = ", ".join([f"{br.room_quantity}x {br.category.name}" for br in ob.rooms.all()])
            items.append({
                "booking_reference": ob.booking_reference,
                "guest_name": ob.guest_name,
                "check_in_date": ob.check_in_date.isoformat(),
                "check_out_date": ob.check_out_date.isoformat(),
                "categories_booked": categories_str,
                "total_rooms": ob.total_rooms_count,
                "overbooking_reason": ob.overbooking_reason or "No justification provided",
                "authorized_by": ob.created_by.username if ob.created_by else "SuperAdmin",
                "status": ob.status,
                "status_display": ob.get_status_display(),
                "created_at": ob.created_at.isoformat(),
            })

        return {
            "period": {
                "from_date": from_d.isoformat(),
                "to_date": to_d.isoformat(),
            },
            "total_overbookings": total_count,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
            },
            "overbookings": items,
        }

    @classmethod
    def get_reconciliation_report(cls, limit: int = 50) -> Dict[str, Any]:
        """
        Read-only inspection of detected payment state reconciliation discrepancies.
        """
        # Run non-destructive reconciliation detection
        recon_result = PaymentReconciliationService.reconcile_all(limit=limit, auto_resolve=False)

        # Query past reconciliation audit logs
        audit_records = AuditLog.objects.filter(
            resource_type='PaymentReconciliation'
        ).order_by('-timestamp')[:limit]

        audit_items = []
        for a in audit_records:
            audit_items.append({
                "id": str(a.id),
                "action": a.action,
                "resource_id": a.resource_id,
                "reason": a.reason,
                "actor": a.actor.username if a.actor else "System Engine",
                "old_values": a.old_values,
                "new_values": a.new_values,
                "created_at": a.timestamp.isoformat(),
            })

        return {
            "current_status": {
                "total_checked": recon_result.get('total_checked', 0),
                "flagged_discrepancies_count": recon_result.get('flagged_count', 0),
                "discrepancies": [d for d in recon_result.get('details', []) if d.get('discrepancies')],
            },
            "audit_history": audit_items,
        }
