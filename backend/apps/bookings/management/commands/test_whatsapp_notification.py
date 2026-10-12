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
    extract_booking_template_parameters,
    format_phone_number_for_whatsapp,
)


class Command(BaseCommand):
    help = "Test sending MSG91 WhatsApp confirmation notification for a booking"

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            help="Target phone number (e.g. 917997022999 or 7997044999)",
        )
        parser.add_argument(
            '--ref',
            type=str,
            help="Optional existing Booking reference to use (e.g. MG-2026-A8A27)",
        )

    def handle(self, *args, **options):
        phone = options.get('phone')
        ref = options.get('ref')

        auth_key = getattr(settings, 'MSG91_AUTH_KEY', '') or ''
        sender = getattr(settings, 'MSG91_WHATSAPP_NUMBER', '917997022999')
        template = getattr(settings, 'MSG91_WHATSAPP_TEMPLATE', 'booking_confirmation')

        self.stdout.write(self.style.NOTICE("=== MSG91 WhatsApp Notification Test ==="))
        self.stdout.write(f"Sender Number   : {sender}")
        self.stdout.write(f"Template Name   : {template}")
        self.stdout.write(f"AuthKey Config  : {'[Configured]' if auth_key else '[Not Configured - Mock Mode]'}")

        booking = None
        if ref:
            booking = Booking.objects.filter(booking_reference=ref).first()
            if not booking:
                self.stderr.write(self.style.ERROR(f"Booking reference '{ref}' not found."))
                return

        if not booking:
            # Pick latest confirmed or existing booking
            booking = Booking.objects.order_by('-created_at').first()

        if not booking:
            self.stderr.write(self.style.ERROR("No bookings found in database. Create a booking first."))
            return

        # Override phone if passed explicitly
        if phone:
            booking.guest_phone = phone

        params = extract_booking_template_parameters(booking)
        dest_phone = format_phone_number_for_whatsapp(booking.guest_phone)

        self.stdout.write("\nExtracted 9 Template Parameters:")
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
        for label, val in zip(labels, params):
            self.stdout.write(f"  • {label:<22}: {val}")

        self.stdout.write(f"\nDispatching to: {dest_phone} ...")
        result = send_booking_whatsapp_confirmation(booking)

        if result.get('mock'):
            self.stdout.write(self.style.WARNING("\n[MOCK MODE] Success! Add MSG91_AUTH_KEY to .env to send live message."))
        elif result.get('success'):
            self.stdout.write(self.style.SUCCESS(f"\n[LIVE DISPATCH SUCCESS] Status {result.get('status_code')}: {result.get('response')}"))
        else:
            self.stdout.write(self.style.ERROR(f"\n[DISPATCH FAILED]: {result}"))
