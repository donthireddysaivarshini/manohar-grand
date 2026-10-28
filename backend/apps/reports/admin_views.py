from datetime import date, timedelta
from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from apps.reports.services import ReportingService


@staff_member_required
def admin_occupancy_dashboard_view(request):
    """
    Native Django Admin view for hotel staff and managers to view
    day-by-day room bookings, occupancy forecast, arrivals, and departures.
    """
    today = timezone.localdate()
    from_date_str = request.GET.get('from_date', today.isoformat())
    to_date_str = request.GET.get('to_date', (today + timedelta(days=14)).isoformat())

    occupancy_data = ReportingService.get_occupancy_report(from_date_str, to_date_str)
    overview_data = ReportingService.get_overview_kpis()
    frontdesk_data = ReportingService.get_frontdesk_report(target_date_str=today.isoformat())

    context = {
        'title': 'Daily Room Occupancy & Booking Forecast',
        'from_date': from_date_str,
        'to_date': to_date_str,
        'occupancy': occupancy_data,
        'overview': overview_data,
        'frontdesk': frontdesk_data,
        'has_permission': True,
        'site_title': 'Manohar Grand Admin',
        'site_header': 'Manohar Grand',
        'frontend_reports_url': '/admin/analytics-bridge/',
    }
    return render(request, 'admin/occupancy_dashboard.html', context)


@staff_member_required
def admin_analytics_bridge_view(request):
    """
    Seamless Single Sign-On (SSO) bridge from Django Admin to Frontend Advanced Analytics Suite.
    Generates a secure JWT token pair for the authenticated staff member and redirects
    to the frontend reports page, passing tokens so the frontend can auto-authenticate.
    """
    frontend_base = getattr(settings, 'FRONTEND_URL', 'https://www.manohargrand.com').rstrip('/')
    if not frontend_base or 'vercel.app' in frontend_base:
        frontend_base = 'https://www.manohargrand.com'

    # Generate JWT for current authenticated admin/staff user
    refresh = RefreshToken.for_user(request.user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    target_url = f"{frontend_base}/admin/reports?token={access_token}&refresh={refresh_token}"
    return redirect(target_url)
