"""
Django management command to test MSG91 WhatsApp notification dispatch.
Usage:
    python manage.py test_whatsapp_notification --phone 919876543210
    python manage.py test_whatsapp_notification --ref MG-2026-A8A27
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.bookings.models import Booking
from apps.bookings.notifications import (
    send_booking_whatsapp_confirmation,
    send_admin_new_booking_alert,
    extract_booking_template_parameters,
    extract_admin_booking_template_parameters,
    format_phone_number_for_whatsapp,
)


class Command(BaseCommand):
    help = "Test sending MSG91 WhatsApp confirmation notification for a booking"

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            help="Target phone number (e.g. 917997022999 or 8179993330)",
        )
        parser.add_argument(
            '--ref',
            type=str,
            help="Optional existing Booking reference to use (e.g. MG-2026-A8A27)",
        )
        parser.add_argument(
            '--target',
            type=str,
            choices=['customer', 'admin', 'both'],
            default='both',
            help="Which notification to test: 'customer', 'admin', or 'both' (default)",
        )

    def handle(self, *args, **options):
        phone = options.get('phone')
        ref = options.get('ref')
        target = options.get('target', 'both')

        auth_key = getattr(settings, 'MSG91_AUTH_KEY', '') or ''
        sender = getattr(settings, 'MSG91_WHATSAPP_NUMBER', '917997022999')
        cust_template = getattr(settings, 'MSG91_WHATSAPP_TEMPLATE', 'booking_confirmation')
        admin_template = getattr(settings, 'MSG91_ADMIN_TEMPLATE', 'admin_new_booking_alert')
        admin_number = getattr(settings, 'MSG91_ADMIN_WHATSAPP_NUMBER', '918179993330')

        self.stdout.write(self.style.NOTICE("=== MSG91 WhatsApp Notification Test ==="))
        self.stdout.write(f"Sender Number       : {sender}")
        self.stdout.write(f"Customer Template   : {cust_template}")
        self.stdout.write(f"Admin Template      : {admin_template}")
        self.stdout.write(f"Admin Target Phone  : {admin_number}")
        self.stdout.write(f"AuthKey Status      : {'[Configured]' if auth_key else '[Not Configured - Mock Mode]'}")
        self.stdout.write(f"Testing Target      : {target.upper()}")

        booking = None
        if ref:
            booking = Booking.objects.filter(booking_reference=ref).first()
            if not booking:
                self.stderr.write(self.style.ERROR(f"Booking reference '{ref}' not found."))
                return

        if not booking:
            booking = Booking.objects.order_by('-created_at').first()

        if not booking:
            self.stderr.write(self.style.ERROR("No bookings found in database. Create a booking first."))
            return

        if phone:
            booking.guest_phone = phone

        # 1. Customer Notification Test
        if target in ('customer', 'both'):
            self.stdout.write(self.style.HTTP_INFO("\n--- Testing [1/2] Customer Notification ---"))
            cust_phone = format_phone_number_for_whatsapp(booking.guest_phone)
            cust_params = extract_booking_template_parameters(booking)
            self.stdout.write(f"Recipient: {cust_phone}")
            self.stdout.write("Extracted 9 Customer Parameters:")
            labels = [
                "{{1}} Guest Name",
                "{{2}} Booking ID",
                "{{3}} Room Category",
                "{{4}} Rooms Booked",
                "{{5}} Adults Count",
                "{{6}} Children Count",
                "{{7}} Check-in Date",
                "{{8}} Check-out Date",
                "{{9}} Total Paid",
            ]
            for label, val in zip(labels, cust_params):
                self.stdout.write(f"  • {label:<22}: {val}")

            cust_result = send_booking_whatsapp_confirmation(booking)
            if cust_result.get('mock'):
                self.stdout.write(self.style.WARNING("  Result: [MOCK MODE] Success!"))
            elif cust_result.get('success'):
                self.stdout.write(self.style.SUCCESS(f"  Result: [LIVE SUCCESS] {cust_result.get('response')}"))
            else:
                self.stdout.write(self.style.ERROR(f"  Result: [FAILED] {cust_result}"))

        # 2. Admin Notification Test
        if target in ('admin', 'both'):
            self.stdout.write(self.style.HTTP_INFO("\n--- Testing [2/2] Admin Notification ---"))
            adm_phone = format_phone_number_for_whatsapp(admin_number)
            adm_params = extract_admin_booking_template_parameters(booking)
            self.stdout.write(f"Recipient: {adm_phone}")
            self.stdout.write("Extracted 10 Admin Parameters:")
            labels = [
                "{{1}} Booking ID",
                "{{2}} Guest Name",
                "{{3}} Guest Phone",
                "{{4}} Room Category",
                "{{5}} Rooms Booked",
                "{{6}} Adults Count",
                "{{7}} Children Count",
                "{{8}} Check-in Date",
                "{{9}} Check-out Date",
                "{{10}} Total Paid",
            ]
            for label, val in zip(labels, adm_params):
                self.stdout.write(f"  • {label:<22}: {val}")

            adm_result = send_admin_new_booking_alert(booking)
            if adm_result.get('mock'):
                self.stdout.write(self.style.WARNING("  Result: [MOCK MODE] Success!"))
            elif adm_result.get('success'):
                self.stdout.write(self.style.SUCCESS(f"  Result: [LIVE SUCCESS] {adm_result.get('response')}"))
            else:
                self.stdout.write(self.style.ERROR(f"  Result: [FAILED] {adm_result}"))
