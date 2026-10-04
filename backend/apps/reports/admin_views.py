from datetime import date, timedelta
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from apps.reports.services import ReportingService


@staff_member_required
def admin_occupancy_dashboard_view(request):
    """
    Native Django Admin view for hotel staff and managers to view
    day-by-day room bookings, occupancy forecast, arrivals, and departures.
    """
    today = timezone.now().date()
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
    }
    return render(request, 'admin/occupancy_dashboard.html', context)
