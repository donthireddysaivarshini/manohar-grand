"""
MSG91 WhatsApp Notification Service for Hotel Manohar Grand.
Dispatches automated, template-based booking confirmations:
1. Customer Voucher: Sent to the guest's mobile number using 'booking_confirmation' template.
2. Admin Alert: Sent to hotel management at 8179993330 using 'admin_new_booking_alert' template.
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
    Extracts the 9 required template parameters for the customer's 'booking_confirmation' template:
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
    guest_name = (booking.guest_name or "Guest").strip()
    booking_ref = booking.booking_reference

    category_names = []
    for br in booking.rooms.all():
        if br.category and br.category.name not in category_names:
            category_names.append(br.category.name)
    room_category_str = ", ".join(category_names) if category_names else "Standard Room"

    total_rooms = booking.total_rooms_count or 1
    rooms_str = str(total_rooms)
    adults_str = str(booking.total_adults if booking.total_adults is not None else 1)
    children_str = str(booking.total_children if booking.total_children is not None else 0)

    check_in_str = booking.check_in_date.strftime("%d %b %Y") if booking.check_in_date else "-"
    check_out_str = booking.check_out_date.strftime("%d %b %Y") if booking.check_out_date else "-"

    if hasattr(booking, 'price_snapshot') and booking.price_snapshot:
        gross_val = booking.price_snapshot.gross_total
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


def extract_admin_booking_template_parameters(booking) -> List[str]:
    """
    Extracts the 10 required template parameters for the admin's 'admin_new_booking_alert' template:
    {{1}}: Booking ID
    {{2}}: Guest Name
    {{3}}: Guest Phone
    {{4}}: Room Category
    {{5}}: Rooms Booked
    {{6}}: Adult Count
    {{7}}: Child Count
    {{8}}: Check-in Date
    {{9}}: Check-out Date
    {{10}}: Total Amount Paid
    """
    booking_ref = booking.booking_reference
    guest_name = (booking.guest_name or "Guest").strip()
    guest_phone = booking.guest_phone or "-"

    category_names = []
    for br in booking.rooms.all():
        if br.category and br.category.name not in category_names:
            category_names.append(br.category.name)
    room_category_str = ", ".join(category_names) if category_names else "Standard Room"

    total_rooms = booking.total_rooms_count or 1
    rooms_str = str(total_rooms)
    adults_str = str(booking.total_adults if booking.total_adults is not None else 1)
    children_str = str(booking.total_children if booking.total_children is not None else 0)

    check_in_str = booking.check_in_date.strftime("%d %b %Y") if booking.check_in_date else "-"
    check_out_str = booking.check_out_date.strftime("%d %b %Y") if booking.check_out_date else "-"

    if hasattr(booking, 'price_snapshot') and booking.price_snapshot:
        gross_val = booking.price_snapshot.gross_total
        total_paid_str = f"{gross_val:,.2f}".replace(".00", "")
    else:
        total_paid_str = "0"

    return [
        booking_ref,
        guest_name,
        guest_phone,
        room_category_str,
        rooms_str,
        adults_str,
        children_str,
        check_in_str,
        check_out_str,
        total_paid_str,
    ]


def _call_msg91_whatsapp_api(
    to_phone: str,
    template_name: str,
    parameters: List[str],
    booking_reference: str,
    recipient_type: str = "customer"
) -> Dict[str, Any]:
    """Helper to dispatch payload to MSG91 WhatsApp endpoint."""
    auth_key = getattr(settings, 'MSG91_AUTH_KEY', '') or ''
    sender_number = getattr(settings, 'MSG91_WHATSAPP_NUMBER', '917997022999') or '917997022999'

    if not auth_key:
        logger.info(
            f"[MSG91 Mock - {recipient_type.upper()}] No MSG91_AUTH_KEY. Mock message to {to_phone} ({template_name}) for {booking_reference} with params: {parameters}"
        )
        return {
            "success": True,
            "mock": True,
            "recipient_type": recipient_type,
            "phone": to_phone,
            "template": template_name,
            "parameters": parameters,
        }

    url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"
    headers = {
        "authkey": auth_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    body_parameters = [{"type": "text", "text": str(p)} for p in parameters]

    payload = {
        "integrated_number": sender_number,
        "content_type": "template",
        "payload": {
            "to": to_phone,
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
        f"[MSG91 WhatsApp - {recipient_type.upper()}] Sent to {to_phone} for {booking_reference}. Status: {response.status_code}, Response: {resp_data}"
    )

    return {
        "success": response.status_code in (200, 201),
        "status_code": response.status_code,
        "response": resp_data,
        "recipient_type": recipient_type,
    }


def send_booking_whatsapp_confirmation(booking) -> Dict[str, Any]:
    """Dispatches WhatsApp confirmation voucher to the customer."""
    try:
        phone = format_phone_number_for_whatsapp(booking.guest_phone)
        if not phone:
            logger.warning(
                f"[MSG91 WhatsApp] Skipped customer notification: Booking {booking.booking_reference} has invalid guest phone '{booking.guest_phone}'."
            )
            return {"success": False, "reason": "Missing or invalid phone number"}

        template_name = getattr(settings, 'MSG91_WHATSAPP_TEMPLATE', 'booking_confirmation') or 'booking_confirmation'
        params = extract_booking_template_parameters(booking)

        result = _call_msg91_whatsapp_api(
            to_phone=phone,
            template_name=template_name,
            parameters=params,
            booking_reference=booking.booking_reference,
            recipient_type="customer"
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
                'type': 'customer_voucher',
                'result': result,
            },
            reason=f"Customer WhatsApp voucher dispatched via MSG91 for {booking.booking_reference}",
        )
        return result

    except Exception as exc:
        logger.error(f"[MSG91 WhatsApp Error] Failed sending customer voucher for {booking.booking_reference}: {exc}", exc_info=True)
        return {"success": False, "error": str(exc)}


def send_admin_new_booking_alert(booking) -> Dict[str, Any]:
    """Dispatches real-time WhatsApp alert to hotel admin (8179993330) when a new booking is confirmed."""
    try:
        raw_admin_phone = getattr(settings, 'MSG91_ADMIN_WHATSAPP_NUMBER', '918179993330') or '918179993330'
        admin_phone = format_phone_number_for_whatsapp(raw_admin_phone)

        if not admin_phone:
            logger.warning(f"[MSG91 WhatsApp] Skipped admin alert: Invalid admin phone '{raw_admin_phone}'.")
            return {"success": False, "reason": "Missing or invalid admin phone number"}

        template_name = getattr(settings, 'MSG91_ADMIN_TEMPLATE', 'admin_new_booking_alert') or 'admin_new_booking_alert'
        params = extract_admin_booking_template_parameters(booking)

        result = _call_msg91_whatsapp_api(
            to_phone=admin_phone,
            template_name=template_name,
            parameters=params,
            booking_reference=booking.booking_reference,
            recipient_type="admin"
        )

        record_audit_log(
            action='notification',
            resource_type='Booking',
            resource_id=str(booking.id),
            actor=None,
            old_values=None,
            new_values={
                'channel': 'whatsapp',
                'recipient': admin_phone,
                'type': 'admin_booking_alert',
                'result': result,
            },
            reason=f"Admin WhatsApp alert dispatched to {admin_phone} for {booking.booking_reference}",
        )
        return result

    except Exception as exc:
        logger.error(f"[MSG91 WhatsApp Error] Failed sending admin alert for {booking.booking_reference}: {exc}", exc_info=True)
        return {"success": False, "error": str(exc)}


def send_all_booking_confirmations(booking) -> Dict[str, Any]:
    """Sends both the Customer Confirmation Voucher AND the Admin Alert."""
    customer_res = send_booking_whatsapp_confirmation(booking)
    admin_res = send_admin_new_booking_alert(booking)
    return {
        "customer": customer_res,
        "admin": admin_res,
    }


def _async_notification_worker(booking_id: Any) -> None:
    """Background worker executing both dispatches with thread-safe DB lifecycle."""
    try:
        from apps.bookings.models import Booking
        fresh_booking = (
            Booking.objects.select_related('customer', 'price_snapshot')
            .prefetch_related('rooms__category')
            .filter(id=booking_id)
            .first()
        )
        if fresh_booking:
            send_all_booking_confirmations(fresh_booking)
        else:
            logger.warning(f"[MSG91 WhatsApp] Async dispatch skipped: Booking ID {booking_id} not found.")
    except Exception as exc:
        logger.error(f"[MSG91 WhatsApp Error] Async background dispatch failed for booking ID {booking_id}: {exc}", exc_info=True)
    finally:
        try:
            from django.db import connections
            connections.close_all()
        except Exception:
            pass


def send_booking_whatsapp_async(booking) -> None:
    """
    Fires both WhatsApp notifications in a separate daemon thread so it does not add
    any latency to the user checkout HTTP response.
    Accepts either a Booking instance or a booking primary key.
    """
    booking_id = getattr(booking, 'id', booking)
    thread = threading.Thread(target=_async_notification_worker, args=(booking_id,), daemon=True)
    thread.start()
