"""
Admin URL routing for Bookings management endpoints (/api/v1/admin/bookings/).
"""
from django.urls import path
from .admin_views import (
    AdminBookingListView,
    AdminBookingDetailView,
    AdminAssignRoomsView,
    AdminCheckInView,
    AdminCheckOutView,
    AdminWalkInBookingCreateView,
    AdminOverbookingCreateView,
)

urlpatterns = [
    path('', AdminBookingListView.as_view(), name='admin-booking-list'),
    path('walk-in/', AdminWalkInBookingCreateView.as_view(), name='admin-booking-walkin'),
    path('overbooking/', AdminOverbookingCreateView.as_view(), name='admin-booking-overbooking'),
    path('<str:identifier>/', AdminBookingDetailView.as_view(), name='admin-booking-detail'),
    path('<str:identifier>/assign-rooms/', AdminAssignRoomsView.as_view(), name='admin-booking-assign-rooms'),
    path('<str:identifier>/assign-room/', AdminAssignRoomsView.as_view(), name='admin-booking-assign-room-alias'),
    path('<str:identifier>/check-in/', AdminCheckInView.as_view(), name='admin-booking-checkin'),
    path('<str:identifier>/check-out/', AdminCheckOutView.as_view(), name='admin-booking-checkout'),
]
