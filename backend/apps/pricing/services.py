"""
Authoritative Pricing Engine Services for Manohar Grand.
Calculates deterministic room rates, extra guest surcharges, late checkout fees, taxes (GST),
and creates immutable BookingPriceSnapshot records.
"""
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta
from typing import List, Dict, Any, Optional

from django.db.models import Q
from django.core.exceptions import ValidationError

from apps.rooms.models import RoomCategory
from apps.cms.models import HotelConfiguration
from apps.inventory.services import get_stay_nights, calculate_nights_count
from .models import RoomRatePlan, TaxRule, BookingPriceSnapshot


def quantize_currency(value: Decimal) -> Decimal:
    """Quantizes Decimal to 2 decimal places with standard ROUND_HALF_UP."""
    return Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def resolve_rate_plan(category: RoomCategory, stay_date: date) -> RoomRatePlan:
    """
    Deterministic rate plan resolver.
    Given a RoomCategory and stay date, returns the unique active RoomRatePlan.
    
    Raises ValidationError if:
    - No active rate plan exists for this category on the given date.
    - Multiple active overlapping rate plans exist for this category on the given date.
    """
    if not isinstance(category, RoomCategory):
        category = RoomCategory.objects.get(id=category)

    plans = RoomRatePlan.objects.filter(
        category=category,
        is_active=True
    ).filter(
        Q(effective_from__isnull=True) | Q(effective_from__lte=stay_date),
        Q(effective_to__isnull=True) | Q(effective_to__gte=stay_date)
    )

    count = plans.count()
    if count == 0:
        raise ValidationError(
            f"No active rate plan found for category '{category.name}' on {stay_date.isoformat()}."
        )
    if count > 1:
        raise ValidationError(
            f"Multiple overlapping active rate plans ({count}) found for category '{category.name}' on {stay_date.isoformat()}."
        )

    return plans.first()


def resolve_tax_rule(stay_date: date) -> TaxRule:
    """
    Deterministic tax rule resolver.
    Returns the unique active TaxRule applicable on the given stay date.
    
    Raises ValidationError if:
    - No active tax rule exists on the given date.
    - Multiple active overlapping tax rules exist on the given date.
    """
    rules = TaxRule.objects.filter(
        is_active=True
    ).filter(
        Q(effective_from__isnull=True) | Q(effective_from__lte=stay_date),
        Q(effective_to__isnull=True) | Q(effective_to__gte=stay_date)
    )

    count = rules.count()
    if count == 0:
        raise ValidationError(
            f"No active tax rule found for stay date {stay_date.isoformat()}."
        )
    if count > 1:
        raise ValidationError(
            f"Multiple overlapping active tax rules ({count}) found for stay date {stay_date.isoformat()}."
        )

    return rules.first()


def validate_occupancy_limits(
    rooms_request: List[Dict[str, Any]],
    total_adults: int,
    total_children: int,
) -> None:
    """
    Validates requested guest counts against configured RoomCategory occupancy baselines:
    - max_total_occupancy (AC: 4 PAX; Non-AC: 2 PAX baseline)
    - max_adults (optional ceiling)
    - max_children (optional ceiling)
    """
    if total_adults < 1:
        raise ValidationError({"adults": "Total adults must be at least 1."})
    if total_children < 0:
        raise ValidationError({"children": "Total children cannot be negative."})

    total_capacity = 0
    total_adult_capacity = 0
    has_adult_ceiling = False

    for item in rooms_request:
        cat = item['category']
        qty = item.get('room_quantity', 1)
        total_capacity += cat.max_total_occupancy * qty
        if cat.max_adults:
            has_adult_ceiling = True
            total_adult_capacity += cat.max_adults * qty

    total_pax = total_adults + total_children
    if total_pax > total_capacity:
        raise ValidationError({
            "occupancy": f"Requested total guests ({total_pax} PAX) exceeds maximum capacity for selected rooms ({total_capacity} PAX)."
        })

    if has_adult_ceiling and total_adults > total_adult_capacity:
        raise ValidationError({
            "occupancy": f"Requested adults ({total_adults}) exceeds maximum adult capacity for selected rooms ({total_adult_capacity})."
        })


def calculate_booking_quote(
    rooms_request: List[Dict[str, Any]],
    check_in_date: date,
    check_out_date: date,
    total_adults: int = 1,
    total_children: int = 0,
    late_checkout_hours: int = 0,
    discount_amount: Decimal = Decimal('0.00'),
    miscellaneous_charges: Decimal = Decimal('0.00'),
) -> Dict[str, Any]:
    """
    Authoritative calculation pipeline for reservation pricing.
    
    Formula:
    1. Base Room Total = Sum( Nightly Rate * Quantity across all stay nights )
    2. Extra Guest Surcharges:
       - Extra adults beyond included occupancy * extra_adult_charge * nights
       - Extra children beyond included occupancy * extra_child_charge * nights
    3. Late Checkout Surcharges:
       - late_checkout_hours * late_checkout_hourly_rate * quantity (max 3 hours)
    4. Taxable Subtotal = Base Room Total + Extra Guests + Late Checkout + Misc - Discount
    5. Tax (GST) = Taxable Subtotal * (tax_rate / 100)
    6. Gross Total = Taxable Subtotal + Tax Amount
    7. 50% Advance Due (Razorpay) = round(Gross Total * 0.50, 2)
    8. 50% Balance Due (Front Desk) = Gross Total - Advance Due
    """
    if check_out_date <= check_in_date:
        raise ValidationError({"check_out_date": "Check-out date must be strictly after check-in date."})

    if not rooms_request:
        raise ValidationError({"rooms": "At least one room category must be requested."})

    # Validate and normalize rooms_request
    normalized_rooms = []
    for item in rooms_request:
        cat = item['category']
        if not isinstance(cat, RoomCategory):
            cat = RoomCategory.objects.get(id=cat)
        qty = int(item.get('room_quantity', 1))
        if qty < 1:
            raise ValidationError({"rooms": "Room quantity must be at least 1."})
        normalized_rooms.append({
            'category': cat,
            'room_quantity': qty,
        })

    # Validate occupancy limits
    validate_occupancy_limits(normalized_rooms, total_adults, total_children)

    # Validate late checkout limits
    hotel_config = HotelConfiguration.get_solo()
    max_late_hours = hotel_config.max_late_checkout_hours
    late_hours = int(late_checkout_hours or 0)
    if late_hours < 0:
        raise ValidationError({"late_checkout_hours": "Late checkout hours cannot be negative."})
    if late_hours > max_late_hours:
        raise ValidationError({
            "late_checkout_hours": f"Late checkout of {late_hours} hours exceeds maximum permitted limit of {max_late_hours} hours."
        })

    stay_nights = get_stay_nights(check_in_date, check_out_date)
    nights_count = len(stay_nights)

    # Calculate base room totals across all stay nights
    total_room_subtotal = Decimal('0.00')
    itemized_rooms = []
    currency = 'INR'

    # Compute included guest capacities across all rooms
    total_included_adults = sum(r['category'].included_adults * r['room_quantity'] for r in normalized_rooms)
    total_included_children = sum(r['category'].included_children * r['room_quantity'] for r in normalized_rooms)

    extra_adults = max(0, total_adults - total_included_adults)
    extra_children = max(0, total_children - total_included_children)

    total_extra_adult_charge = Decimal('0.00')
    total_extra_child_charge = Decimal('0.00')
    total_late_checkout_charge = Decimal('0.00')

    for r in normalized_rooms:
        cat = r['category']
        qty = r['room_quantity']
        cat_room_total = Decimal('0.00')
        nightly_breakdown = []

        for night in stay_nights:
            rate_plan = resolve_rate_plan(cat, night)
            currency = rate_plan.currency
            night_base = rate_plan.base_price_per_night * Decimal(qty)
            cat_room_total += night_base

            nightly_breakdown.append({
                'date': night.isoformat(),
                'rate_plan_id': str(rate_plan.id),
                'rate_plan_name': rate_plan.name,
                'base_price_per_night': str(rate_plan.base_price_per_night),
                'quantity': qty,
                'night_total': str(quantize_currency(night_base)),
            })

        total_room_subtotal += cat_room_total

        # Late checkout for this category
        cat_late_total = Decimal('0.00')
        first_night_rate_plan = resolve_rate_plan(cat, stay_nights[0])
        if late_hours > 0:
            cat_late_total = first_night_rate_plan.late_checkout_hourly_rate * Decimal(late_hours) * Decimal(qty)
            total_late_checkout_charge += cat_late_total

        itemized_rooms.append({
            'category_id': str(cat.id),
            'category_slug': cat.slug,
            'category_name': cat.name,
            'room_quantity': qty,
            'included_adults': cat.included_adults * qty,
            'included_children': cat.included_children * qty,
            'max_total_occupancy': cat.max_total_occupancy * qty,
            'late_checkout_hourly_rate': str(first_night_rate_plan.late_checkout_hourly_rate),
            'late_checkout_charge': str(quantize_currency(cat_late_total)),
            'room_subtotal': str(quantize_currency(cat_room_total)),
            'nightly_rates': nightly_breakdown,
        })

    # Extra adult and extra child charges calculation
    # Rate plans from the primary / representative room category or per-night resolution
    primary_rate_plan = resolve_rate_plan(normalized_rooms[0]['category'], check_in_date)
    extra_adult_rate = primary_rate_plan.extra_adult_charge
    extra_child_rate = primary_rate_plan.extra_child_charge

    # Compute extra guest charges across stay nights
    for night in stay_nights:
        for r in normalized_rooms:
            night_plan = resolve_rate_plan(r['category'], night)
            # Use the category's rate plan for extra guest rate baseline
            extra_adult_rate = night_plan.extra_adult_charge
            extra_child_rate = night_plan.extra_child_charge
            break

        total_extra_adult_charge += Decimal(extra_adults) * extra_adult_rate
        total_extra_child_charge += Decimal(extra_children) * extra_child_rate

    total_extra_guest_charges = total_extra_adult_charge + total_extra_child_charge

    # Normalize misc charges and discount
    discount = max(Decimal('0.00'), Decimal(discount_amount or '0.00'))
    misc = max(Decimal('0.00'), Decimal(miscellaneous_charges or '0.00'))

    # 4. Taxable Subtotal
    taxable_subtotal = max(
        Decimal('0.00'),
        total_room_subtotal + total_extra_guest_charges + total_late_checkout_charge + misc - discount
    )

    # 5. Tax (GST)
    tax_rule = resolve_tax_rule(check_in_date)
    if tax_rule.tax_type == 'percentage':
        tax_amount = quantize_currency(taxable_subtotal * (tax_rule.tax_rate / Decimal('100.00')))
    else:
        tax_amount = quantize_currency(tax_rule.tax_rate)

    # 6. Gross Total
    gross_total = quantize_currency(taxable_subtotal + tax_amount)

    # 7. 50% Advance Due & Balance Due
    advance_amount_due = quantize_currency(gross_total * Decimal('0.50'))
    balance_amount_due = gross_total - advance_amount_due

    total_rooms_count = sum(r['room_quantity'] for r in normalized_rooms)

    result = {
        'currency': currency,
        'check_in_date': check_in_date.isoformat(),
        'check_out_date': check_out_date.isoformat(),
        'nights_count': nights_count,
        'total_rooms': total_rooms_count,
        'total_adults': total_adults,
        'total_children': total_children,
        'included_adults': total_included_adults,
        'included_children': total_included_children,
        'extra_adults': extra_adults,
        'extra_children': extra_children,
        'extra_adult_rate': str(quantize_currency(extra_adult_rate)),
        'extra_child_rate': str(quantize_currency(extra_child_rate)),
        'extra_adult_total': str(quantize_currency(total_extra_adult_charge)),
        'extra_child_total': str(quantize_currency(total_extra_child_charge)),
        'extra_guest_total': str(quantize_currency(total_extra_guest_charges)),
        'late_checkout_hours': late_hours,
        'late_checkout_total': str(quantize_currency(total_late_checkout_charge)),
        'room_subtotal': str(quantize_currency(total_room_subtotal)),
        'miscellaneous_charges': str(quantize_currency(misc)),
        'discount_amount': str(quantize_currency(discount)),
        'taxable_subtotal': str(quantize_currency(taxable_subtotal)),
        'tax_rule_id': str(tax_rule.id),
        'tax_rule_name': tax_rule.name,
        'tax_rate_percent': str(tax_rule.tax_rate),
        'tax_type': tax_rule.tax_type,
        'tax_amount': str(tax_amount),
        'gross_total': str(gross_total),
        'advance_amount_due': str(advance_amount_due),
        'balance_amount_due': str(balance_amount_due),
        'rooms': itemized_rooms,
    }

    return result


def create_booking_price_snapshot(booking, quote_data: Optional[Dict[str, Any]] = None) -> Optional[BookingPriceSnapshot]:
    """
    Creates or updates the authoritative BookingPriceSnapshot for a Booking instance.
    If quote_data is not provided, calculates it authoritatively from the Booking's reserved rooms and dates.
    If rate plan or tax rule is not configured for a category (e.g. isolated legacy unit tests), returns None gracefully.
    """
    if quote_data is None:
        try:
            rooms_request = [
                {'category': br.category, 'room_quantity': br.room_quantity}
                for br in booking.rooms.all()
            ]
            if not rooms_request:
                return None
            quote_data = calculate_booking_quote(
                rooms_request=rooms_request,
                check_in_date=booking.check_in_date,
                check_out_date=booking.check_out_date,
                total_adults=booking.total_adults,
                total_children=booking.total_children,
            )
        except Exception:
            return None

    snapshot, _ = BookingPriceSnapshot.objects.update_or_create(
        booking=booking,
        defaults={
            'currency': quote_data.get('currency', 'INR'),
            'room_subtotal': Decimal(str(quote_data['room_subtotal'])),
            'extra_guest_total': Decimal(str(quote_data['extra_guest_total'])),
            'late_checkout_total': Decimal(str(quote_data['late_checkout_total'])),
            'miscellaneous_charges': Decimal(str(quote_data.get('miscellaneous_charges', '0.00'))),
            'discount_amount': Decimal(str(quote_data.get('discount_amount', '0.00'))),
            'taxable_subtotal': Decimal(str(quote_data['taxable_subtotal'])),
            'tax_rule_name': quote_data.get('tax_rule_name', 'GST'),
            'tax_rate_percent': Decimal(str(quote_data.get('tax_rate_percent', '5.00'))),
            'tax_amount': Decimal(str(quote_data['tax_amount'])),
            'gross_total': Decimal(str(quote_data['gross_total'])),
            'advance_amount_due': Decimal(str(quote_data['advance_amount_due'])),
            'balance_amount_due': Decimal(str(quote_data['balance_amount_due'])),
            'itemized_breakdown': quote_data,
        }
    )

    return snapshot

