"""
URL routing for Bookings domain (/api/v1/bookings/).
"""
from django.urls import path
from .views import (
    customer_booking_list,
    booking_create_hold,
    booking_detail_lookup,
    booking_hold_release,
    booking_cancel,
    booking_checkout_summary,
)

app_name = 'bookings'

urlpatterns = [
    path('', customer_booking_list, name='customer-booking-list'),
    path('hold/', booking_create_hold, name='booking-create-hold'),
    path('<str:booking_reference>/', booking_detail_lookup, name='booking-detail-lookup'),
    path('<str:booking_reference>/checkout/', booking_checkout_summary, name='booking-checkout-summary'),
    path('<str:booking_reference>/guests/', booking_detail_lookup, name='booking-guests-update'),
    path('<str:booking_reference>/release/', booking_hold_release, name='booking-hold-release'),
    path('<str:booking_reference>/cancel/', booking_cancel, name='booking-cancel'),
]
