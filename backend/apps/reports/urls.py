"""
URL routing for Admin Reports domain (/api/v1/admin/reports/).
"""
from django.urls import path
from .views import (
    report_overview,
    report_bookings,
    report_occupancy,
    report_category_performance,
    report_revenue,
    report_payments,
    report_frontdesk,
    report_sources,
    report_room_utilization,
    report_overbookings,
    report_reconciliation,
)

app_name = 'reports'

urlpatterns = [
    path('overview/', report_overview, name='report-overview'),
    path('bookings/', report_bookings, name='report-bookings'),
    path('occupancy/', report_occupancy, name='report-occupancy'),
    path('categories/', report_category_performance, name='report-categories'),
    path('revenue/', report_revenue, name='report-revenue'),
    path('payments/', report_payments, name='report-payments'),
    path('frontdesk/', report_frontdesk, name='report-frontdesk'),
    path('check-ins/', report_frontdesk, name='report-checkins-alias'),
    path('sources/', report_sources, name='report-sources'),
    path('rooms/utilization/', report_room_utilization, name='report-room-utilization'),
    path('overbookings/', report_overbookings, name='report-overbookings'),
    path('reconciliation/', report_reconciliation, name='report-reconciliation'),
]
