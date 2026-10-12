"""
MSG91 WhatsApp Notification Service for Hotel Manohar Grand.
Dispatches automated, template-based booking confirmation vouchers to guests via WhatsApp Cloud API.
"""
import re
import logging
import threading
from typing import List, Dict, Any, Optional
import requests
from django.conf import settings
from core.services import record_audit_log

logger = logging.getLogger(__name__)


def format_phone_number_for_whatsapp(phone: Optional[str]) -> str:
    """
    Sanitizes and standardizes phone numbers into E.164 format with country code (default 91 for India).
    Examples:
        '7997044999' -> '917997022999'
        '+91 7997044999' -> '917997022999'
        '07997044999' -> '917997022999'
        '917997022999' -> '917997022999'
    """
    if not phone:
        return ""

    digits_only = re.sub(r'\D', '', str(phone).strip())
    if not digits_only:
        return ""

    # Leading zero cleanup (e.g. 07997044999)
    if digits_only.startswith('0') and len(digits_only) == 11:
        digits_only = digits_only[1:]

    # 10 digit Indian number
    if len(digits_only) == 10:
        return f"91{digits_only}"

    # 12 digit with India 91 prefix
    if len(digits_only) == 12 and digits_only.startswith('91'):
        return digits_only

    # Other international numbers with country code
    if len(digits_only) >= 10:
        return digits_only

    return ""


def extract_booking_template_parameters(booking) -> List[str]:
    """
    Extracts the 9 required template parameters matching the approved WhatsApp template:
    {{1}}: Guest Name
    {{2}}: Booking ID
    {{3}}: Room Category
    {{4}}: Rooms Booked
    {{5}}: Adult Count
    {{6}}: Child Count
    {{7}}: Check-in Date
    {{8}}: Check-out Date
    {{9}}: Total Amount Paid
    """
    # 1. Guest Name
    guest_name = (booking.guest_name or "Guest").strip()

    # 2. Booking Reference
    booking_ref = booking.booking_reference

    # 3. Room Category (e.g. Deluxe AC Room)
    category_names = []
    for br in booking.rooms.all():
        if br.category and br.category.name not in category_names:
            category_names.append(br.category.name)
    room_category_str = ", ".join(category_names) if category_names else "Standard Room"

    # 4. Total Rooms Booked
    total_rooms = booking.total_rooms_count or 1
    rooms_str = str(total_rooms)

    # 5. Adults Count
    adults_str = str(booking.total_adults if booking.total_adults is not None else 1)

    # 6. Children Count
    children_str = str(booking.total_children if booking.total_children is not None else 0)

    # 7. Check-in Date (e.g. 15 Oct 2026)
    check_in_str = booking.check_in_date.strftime("%d %b %Y") if booking.check_in_date else "-"

    # 8. Check-out Date (e.g. 17 Oct 2026)
    check_out_str = booking.check_out_date.strftime("%d %b %Y") if booking.check_out_date else "-"

    # 9. Total Amount Paid
    if hasattr(booking, 'price_snapshot') and booking.price_snapshot:
        gross_val = booking.price_snapshot.gross_total
        # Format as e.g. 3,358 or 3358
        total_paid_str = f"{gross_val:,.2f}".replace(".00", "")
    else:
        total_paid_str = "0"

    return [
        guest_name,
        booking_ref,
        room_category_str,
        rooms_str,
        adults_str,
        children_str,
        check_in_str,
        check_out_str,
        total_paid_str,
    ]


def send_booking_whatsapp_confirmation(booking) -> Dict[str, Any]:
    """
    Authoritative function to dispatch a WhatsApp booking confirmation message via MSG91.
    Guarantees:
    - Never raises unhandled exceptions or interrupts checkout transactions.
    - Sanitizes destination phone number.
    - Gracefully mocks if MSG91_AUTH_KEY is not configured yet.
    - Records AuditLog of dispatch status.
    """
    try:
        phone = format_phone_number_for_whatsapp(booking.guest_phone)
        if not phone:
            logger.warning(
                f"[MSG91 WhatsApp] Skipped notification: Booking {booking.booking_reference} has invalid or missing guest phone '{booking.guest_phone}'."
            )
            return {"success": False, "reason": "Missing or invalid phone number"}

        auth_key = getattr(settings, 'MSG91_AUTH_KEY', '') or ''
        sender_number = getattr(settings, 'MSG91_WHATSAPP_NUMBER', '917997022999') or '917997022999'
        template_name = getattr(settings, 'MSG91_WHATSAPP_TEMPLATE', 'booking_confirmation') or 'booking_confirmation'

        params = extract_booking_template_parameters(booking)

        # Mock mode if AuthKey has not been entered into settings
        if not auth_key:
            logger.info(
                f"[MSG91 WhatsApp Mock] No MSG91_AUTH_KEY configured. Mock message to {phone} for {booking.booking_reference} with params: {params}"
            )
            return {
                "success": True,
                "mock": True,
                "phone": phone,
                "template": template_name,
                "parameters": params,
            }

        # Real MSG91 API Payload
        url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"
        headers = {
            "authkey": auth_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        body_parameters = [{"type": "text", "text": str(p)} for p in params]

        payload = {
            "integrated_number": sender_number,
            "content_type": "template",
            "payload": {
                "to": phone,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {
                        "code": "en",
                        "policy": "deterministic",
                    },
                    "components": [
                        {
                            "type": "body",
                            "parameters": body_parameters,
                        }
                    ],
                },
            },
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)
        resp_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"raw": response.text}

        logger.info(
            f"[MSG91 WhatsApp] Sent confirmation to {phone} for {booking.booking_reference}. Status: {response.status_code}, Response: {resp_data}"
        )

        record_audit_log(
            action='notification',
            resource_type='Booking',
            resource_id=str(booking.id),
            actor=None,
            old_values=None,
            new_values={
                'channel': 'whatsapp',
                'recipient': phone,
                'status_code': response.status_code,
                'response': resp_data,
            },
            reason=f"WhatsApp booking confirmation dispatched via MSG91 for {booking.booking_reference}",
        )

        return {
            "success": response.status_code in (200, 201),
            "status_code": response.status_code,
            "response": resp_data,
        }

    except Exception as exc:
        logger.error(f"[MSG91 WhatsApp Error] Failed sending message for {booking.booking_reference}: {exc}", exc_info=True)
        return {
            "success": False,
            "error": str(exc),
        }


def send_booking_whatsapp_async(booking) -> None:
    """
    Fires the WhatsApp notification in a separate daemon thread so it does not add
    any latency to the user checkout HTTP response.
    """
    thread = threading.Thread(target=send_booking_whatsapp_confirmation, args=(booking,), daemon=True)
    thread.start()
