import json
from decimal import Decimal
from django.contrib import admin
from django.forms.models import model_to_dict
from django.utils.html import format_html, mark_safe, escape
from core.services import record_audit_log
from .models import RoomRatePlan, TaxRule, BookingPriceSnapshot


def safe_float(val, default=0.0):
    try:
        if val is None:
            return default
        return float(val)
    except (ValueError, TypeError):
        return default


def render_itemized_breakdown_html(obj):
    """
    Renders an executive, human-readable stay summary, room rate schedule,
    and tax calculation breakdown for the client and hotel front desk.
    """
    if not obj:
        return "-"
    data = obj.itemized_breakdown or {}
    if not isinstance(data, dict) or not data:
        return mark_safe('<span style="color: #9CA3AF;">No itemized breakdown recorded for this snapshot.</span>')

    currency = data.get('currency', obj.currency or 'INR')
    currency_symbol = '₹' if currency == 'INR' else f"{currency} "

    check_in = data.get('check_in_date', '-')
    check_out = data.get('check_out_date', '-')
    nights = data.get('nights_count', '-')
    rooms_count = data.get('total_rooms', 1)
    adults = data.get('total_adults', 0)
    children = data.get('total_children', 0)

    extra_adults = data.get('extra_adults', 0)
    extra_children = data.get('extra_children', 0)
    extra_guest_total = safe_float(data.get('extra_guest_total', obj.extra_guest_total))

    tax_rule_name = escape(str(data.get('tax_rule_name', obj.tax_rule_name or 'GST')))
    tax_type = data.get('tax_type', 'percentage')
    tax_rate = data.get('tax_rate_percent', str(obj.tax_rate_percent))
    tax_amount = safe_float(data.get('tax_amount', obj.tax_amount))

    room_subtotal = safe_float(data.get('room_subtotal', obj.room_subtotal))
    taxable_subtotal = safe_float(data.get('taxable_subtotal', obj.taxable_subtotal))
    gross_total = safe_float(data.get('gross_total', obj.gross_total))
    advance_due = safe_float(data.get('advance_amount_due', obj.advance_amount_due))
    balance_due = safe_float(data.get('balance_amount_due', obj.balance_amount_due))
    late_checkout_total = safe_float(data.get('late_checkout_total', obj.late_checkout_total))
    misc_charges = safe_float(data.get('miscellaneous_charges', obj.miscellaneous_charges))
    discount_amount = safe_float(data.get('discount_amount', obj.discount_amount))

    # Build room rows
    rooms_html = []
    rooms_list = data.get('rooms', [])
    for room in rooms_list:
        cat_name = escape(str(room.get('category_name', 'Room Category')))
        room_qty = room.get('room_quantity', 1)
        nightly_rates = room.get('nightly_rates', [])

        rates_rows = []
        for nr in nightly_rates:
            date = escape(str(nr.get('date', '-')))
            plan_name = escape(str(nr.get('rate_plan_name', 'Standard Tariff')))
            base_price = safe_float(nr.get('base_price_per_night', 0.0))
            qty = nr.get('quantity', 1)
            night_total = safe_float(nr.get('night_total', 0.0))
            rates_rows.append(f"""
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 12px; font-size: 13px; color: #374151;">{date}</td>
                    <td style="padding: 8px 12px; font-size: 13px; color: #374151;">{plan_name}</td>
                    <td style="padding: 8px 12px; font-size: 13px; text-align: right; color: #374151;">{currency_symbol}{base_price:,.2f}</td>
                    <td style="padding: 8px 12px; font-size: 13px; text-align: center; color: #374151;">{qty}</td>
                    <td style="padding: 8px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #111827;">{currency_symbol}{night_total:,.2f}</td>
                </tr>
            """)

        rates_table = "".join(rates_rows)
        room_sub = safe_float(room.get('room_subtotal', 0.0))
        rooms_html.append(f"""
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 14px; color: #1e293b;">🏨 {cat_name} <span style="font-weight: 400; color: #64748b; font-size: 13px;">({room_qty} room{'s' if room_qty > 1 else ''})</span></span>
                    <span style="font-weight: 700; font-size: 14px; color: #0f172a;">Room Subtotal: {currency_symbol}{room_sub:,.2f}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
                            <th style="padding: 7px 12px;">Stay Date</th>
                            <th style="padding: 7px 12px;">Tariff Plan</th>
                            <th style="padding: 7px 12px; text-align: right;">Base Price / Night</th>
                            <th style="padding: 7px 12px; text-align: center;">Qty</th>
                            <th style="padding: 7px 12px; text-align: right;">Night Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates_table}
                    </tbody>
                </table>
            </div>
        """)

    all_rooms_html = "".join(rooms_html) if rooms_html else "<p style='color: #6b7280; font-size: 13px;'>No itemized room rates recorded.</p>"

    # Tax description
    if tax_type == 'percentage':
        tax_desc = f"{tax_rule_name} ({tax_rate}%)"
    else:
        tax_desc = f"{tax_rule_name} (Fixed ₹{safe_float(tax_rate):,.2f})"

    # JSON formatted for collapsible raw view
    formatted_json = escape(json.dumps(data, indent=2))

    extra_guest_line = f"""
        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #4b5563;">
            <span>Extra Occupant Surcharges ({extra_adults} adults, {extra_children} children):</span>
            <span style="font-weight: 600; color: #111827;">+{currency_symbol}{extra_guest_total:,.2f}</span>
        </div>
    """ if extra_guest_total > 0 else ""

    late_checkout_line = f"""
        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #4b5563;">
            <span>Late Checkout Surcharges:</span>
            <span style="font-weight: 600; color: #111827;">+{currency_symbol}{late_checkout_total:,.2f}</span>
        </div>
    """ if late_checkout_total > 0 else ""

    misc_line = f"""
        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #4b5563;">
            <span>Miscellaneous Charges:</span>
            <span style="font-weight: 600; color: #111827;">+{currency_symbol}{misc_charges:,.2f}</span>
        </div>
    """ if misc_charges > 0 else ""

    discount_line = f"""
        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #059669;">
            <span>Discount / Coupon Applied:</span>
            <span style="font-weight: 600;">-{currency_symbol}{discount_amount:,.2f}</span>
        </div>
    """ if discount_amount > 0 else ""

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 900px; color: #1f2937;">
        
        <!-- Summary Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Stay Duration</div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px;">{nights} Night(s)</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">{check_in} &rarr; {check_out}</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Reserved Rooms & Guests</div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px;">{rooms_count} Room(s)</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">{adults} Adults, {children} Children</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Extra Guest Surcharges</div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px;">{currency_symbol}{extra_guest_total:,.2f}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">+{extra_adults} extra adults, +{extra_children} children</div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; color: #2563eb; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Gross Total Payable</div>
                <div style="font-size: 20px; font-weight: 800; color: #1e40af; margin-top: 2px;">{currency_symbol}{gross_total:,.2f}</div>
                <div style="font-size: 11px; color: #3b82f6; margin-top: 2px; font-weight: 600;">Advance: {currency_symbol}{advance_due:,.2f} | Balance: {currency_symbol}{balance_due:,.2f}</div>
            </div>
        </div>

        <!-- Room Tariff Breakdown -->
        <h4 style="margin: 16px 0 10px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">Room Accommodation & Rate Schedule</h4>
        {all_rooms_html}

        <!-- Financial Calculation Summary Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-top: 14px;">
            <h4 style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Billing & Tax Breakdown</h4>
            
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #4b5563;">
                <span>Base Accommodation Subtotal:</span>
                <span style="font-weight: 600; color: #111827;">{currency_symbol}{room_subtotal:,.2f}</span>
            </div>
            
            {extra_guest_line}
            {late_checkout_line}
            {misc_line}
            {discount_line}

            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0 4px 0; color: #334155; border-top: 1px dashed #cbd5e1; margin-top: 6px; font-weight: 600;">
                <span>Taxable Amount:</span>
                <span style="color: #0f172a;">{currency_symbol}{taxable_subtotal:,.2f}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #4b5563;">
                <span>Tax & GST ({tax_desc}):</span>
                <span style="font-weight: 600; color: #111827;">+{currency_symbol}{tax_amount:,.2f}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 16px; padding: 12px 0 8px 0; border-top: 2px solid #334155; margin-top: 10px; font-weight: 800; color: #0f172a;">
                <span>Authoritative Gross Total:</span>
                <span style="color: #047857;">{currency_symbol}{gross_total:,.2f}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px 14px;">
                    <div style="font-size: 11px; color: #065f46; text-transform: uppercase; font-weight: 700;">50% Advance Online Deposit</div>
                    <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 2px;">{currency_symbol}{advance_due:,.2f}</div>
                    <div style="font-size: 11px; color: #059669; margin-top: 2px;">Paid securely during booking checkout</div>
                </div>
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px;">
                    <div style="font-size: 11px; color: #92400e; text-transform: uppercase; font-weight: 700;">50% Balance Due At Hotel Check-In</div>
                    <div style="font-size: 16px; font-weight: 800; color: #b45309; margin-top: 2px;">{currency_symbol}{balance_due:,.2f}</div>
                    <div style="font-size: 11px; color: #d97706; margin-top: 2px;">Payable at front desk on arrival</div>
                </div>
            </div>
        </div>

        <!-- Collapsible Raw Data for Technical Inspection -->
        <details style="margin-top: 18px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #ffffff;">
            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #64748b; outline: none;">
                Technical Raw JSON Payload (Developer View)
            </summary>
            <pre style="margin-top: 10px; background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 6px; font-size: 11px; line-height: 1.45; overflow-x: auto; max-height: 320px;">{formatted_json}</pre>
        </details>
    </div>
    """
    return mark_safe(html)


@admin.register(RoomRatePlan)
class RoomRatePlanAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'currency',
        'base_price_per_night',
        'extra_adult_charge',
        'extra_child_charge',
        'late_checkout_hourly_rate',
        'effective_from',
        'effective_to',
        'is_active',
    )
    list_filter = ('is_active', 'category', 'currency', 'effective_from')
    search_fields = ('name', 'category__name')
    readonly_fields = ('id', 'created_at', 'updated_at')

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            # Only superadmin role can edit pricing in current baseline
            return request.user.staff_profile.role == 'superadmin'
        return False

    def has_add_permission(self, request):
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'price_change' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = RoomRatePlan.objects.get(pk=obj.pk)
                old_values = {
                    'base_price_per_night': str(old_instance.base_price_per_night),
                    'extra_adult_charge': str(old_instance.extra_adult_charge),
                    'extra_child_charge': str(old_instance.extra_child_charge),
                    'late_checkout_hourly_rate': str(old_instance.late_checkout_hourly_rate),
                    'is_active': old_instance.is_active,
                }
            except RoomRatePlan.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'base_price_per_night': str(obj.base_price_per_night),
            'extra_adult_charge': str(obj.extra_adult_charge),
            'extra_child_charge': str(obj.extra_child_charge),
            'late_checkout_hourly_rate': str(obj.late_checkout_hourly_rate),
            'is_active': obj.is_active,
        }

        record_audit_log(
            action=action,
            resource_type='RoomRatePlan',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason="Modified via Django admin interface" if change else "Created via Django admin interface",
        )


@admin.register(TaxRule)
class TaxRuleAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'tax_rate',
        'tax_type',
        'effective_from',
        'effective_to',
        'is_active',
        'created_at',
    )
    list_filter = ('is_active', 'tax_type', 'effective_from')
    search_fields = ('name',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'staff_profile') and request.user.staff_profile:
            return request.user.staff_profile.role == 'superadmin'
        return False

    def has_add_permission(self, request):
        return self.has_change_permission(request)

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        old_values = {}
        action = 'config_change' if change else 'create'
        if change and obj.pk:
            try:
                old_instance = TaxRule.objects.get(pk=obj.pk)
                old_values = {
                    'tax_rate': str(old_instance.tax_rate),
                    'tax_type': old_instance.tax_type,
                    'is_active': old_instance.is_active,
                }
            except TaxRule.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        new_values = {
            'tax_rate': str(obj.tax_rate),
            'tax_type': obj.tax_type,
            'is_active': obj.is_active,
        }

        record_audit_log(
            action=action,
            resource_type='TaxRule',
            resource_id=str(obj.id),
            actor=request.user,
            old_values=old_values,
            new_values=new_values,
            reason="Modified via Django admin interface" if change else "Created via Django admin interface",
        )


@admin.register(BookingPriceSnapshot)
class BookingPriceSnapshotAdmin(admin.ModelAdmin):
    list_display = (
        'booking_link',
        'currency',
        'room_subtotal',
        'extra_guest_total',
        'late_checkout_total',
        'tax_rule_name',
        'tax_amount',
        'gross_total',
        'advance_amount_due',
        'balance_amount_due',
        'created_at',
    )
    search_fields = ('booking__booking_reference', 'booking__guest_name', 'booking__guest_email')
    readonly_fields = [
        'id',
        'booking_link',
        'currency',
        'room_subtotal',
        'extra_guest_total',
        'late_checkout_total',
        'miscellaneous_charges',
        'discount_amount',
        'taxable_subtotal',
        'tax_rule_name',
        'tax_rate_percent',
        'tax_amount',
        'gross_total',
        'advance_amount_due',
        'balance_amount_due',
        'itemized_breakdown_display',
        'created_at',
        'updated_at',
    ]

    fieldsets = (
        ('Reservation Association', {
            'fields': (
                ('booking_link', 'currency'),
            )
        }),
        ('Itemized Price Breakdown & Line Items', {
            'fields': (
                'itemized_breakdown_display',
            ),
            'description': 'Executive human-readable tariff breakdown, guest surcharges, and tax calculations.',
        }),
        ('Authoritative Totals', {
            'fields': (
                ('room_subtotal', 'extra_guest_total'),
                ('late_checkout_total', 'miscellaneous_charges', 'discount_amount'),
                ('taxable_subtotal', 'tax_rule_name', 'tax_rate_percent', 'tax_amount'),
                ('gross_total', 'advance_amount_due', 'balance_amount_due'),
            ),
            'classes': ('collapse',),
        }),
        ('System Audit', {
            'fields': (
                'id',
                ('created_at', 'updated_at'),
            ),
            'classes': ('collapse',),
        }),
    )

    def booking_link(self, obj):
        if not obj or not obj.booking:
            return "-"
        from django.urls import reverse
        try:
            url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
            return format_html('<a href="{}" style="font-weight: bold; color: #2563EB;">{} (Guest: {})</a>', url, obj.booking.booking_reference, obj.booking.guest_name)
        except Exception:
            return f"{obj.booking.booking_reference} ({obj.booking.guest_name})"
    booking_link.short_description = 'Booking Reservation'

    def itemized_breakdown_display(self, obj):
        return render_itemized_breakdown_html(obj)
    itemized_breakdown_display.short_description = 'Itemized Breakdown'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser
