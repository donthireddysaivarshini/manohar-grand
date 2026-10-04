import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  BedDouble, 
  Compass, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Building,
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { reportApiService, OverviewKPIResponse, BookingReportResponse, OccupancyReportResponse, CategoryPerformanceResponse, RevenueReportResponse, PaymentReportResponse, FrontDeskReportResponse, SourcesReportResponse, RoomUtilizationResponse, OverbookingReportResponse, ReconciliationReportResponse } from '../../services/api/reportApiService';

type ReportTab = 'overview' | 'bookings' | 'occupancy' | 'categories' | 'revenue' | 'payments' | 'frontdesk' | 'sources' | 'utilization' | 'overbookings' | 'reconciliation';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const fourteenDaysFutureStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Default to Next 14 Days forecast so upcoming bookings show immediately
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(fourteenDaysFutureStr);
  const [frontDeskDate, setFrontDeskDate] = useState<string>(todayStr);

  const setPresetRange = (type: 'next14' | 'next30' | 'past30' | 'thisMonth') => {
    const now = new Date();
    if (type === 'next14') {
      setFromDate(todayStr);
      setToDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } else if (type === 'next30') {
      setFromDate(todayStr);
      setToDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } else if (type === 'past30') {
      setFromDate(thirtyDaysAgoStr);
      setToDate(todayStr);
    } else if (type === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    }
  };

  // Report state data
  const [overviewData, setOverviewData] = useState<OverviewKPIResponse | null>(null);
  const [bookingData, setBookingData] = useState<BookingReportResponse | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyReportResponse | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryPerformanceResponse | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReportResponse | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentReportResponse | null>(null);
  const [frontDeskData, setFrontDeskData] = useState<FrontDeskReportResponse | null>(null);
  const [sourcesData, setSourcesData] = useState<SourcesReportResponse | null>(null);
  const [utilizationData, setUtilizationData] = useState<RoomUtilizationResponse | null>(null);
  const [overbookingData, setOverbookingData] = useState<OverbookingReportResponse | null>(null);
  const [reconData, setReconData] = useState<ReconciliationReportResponse | null>(null);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        const res = await reportApiService.getOverview({ from_date: fromDate, to_date: toDate });
        setOverviewData(res);
      } else if (activeTab === 'bookings') {
        const res = await reportApiService.getBookingsReport({ from_date: fromDate, to_date: toDate, page: 1, page_size: 50 });
        setBookingData(res);
      } else if (activeTab === 'occupancy') {
        const res = await reportApiService.getOccupancyReport({ from_date: fromDate, to_date: toDate });
        setOccupancyData(res);
      } else if (activeTab === 'categories') {
        const res = await reportApiService.getCategoryPerformance({ from_date: fromDate, to_date: toDate });
        setCategoryData(res);
      } else if (activeTab === 'revenue') {
        const res = await reportApiService.getRevenueReport({ from_date: fromDate, to_date: toDate });
        setRevenueData(res);
      } else if (activeTab === 'payments') {
        const res = await reportApiService.getPaymentReport({ from_date: fromDate, to_date: toDate, page: 1, page_size: 50 });
        setPaymentData(res);
      } else if (activeTab === 'frontdesk') {
        const res = await reportApiService.getFrontDeskReport({ target_date: frontDeskDate });
        setFrontDeskData(res);
      } else if (activeTab === 'sources') {
        const res = await reportApiService.getSourcesReport({ from_date: fromDate, to_date: toDate });
        setSourcesData(res);
      } else if (activeTab === 'utilization') {
        const res = await reportApiService.getRoomUtilization({ from_date: fromDate, to_date: toDate });
        setUtilizationData(res);
      } else if (activeTab === 'overbookings') {
        const res = await reportApiService.getOverbookingReport({ from_date: fromDate, to_date: toDate });
        setOverbookingData(res);
      } else if (activeTab === 'reconciliation') {
        const res = await reportApiService.getReconciliationReport({ limit: 50 });
        setReconData(res);
      }
    } catch (err: any) {
      console.error('Failed to load report data:', err);
      setError(err.message || 'Unable to load report metrics. Please check administrative permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, fromDate, toDate, frontDeskDate]);

  const tabs: Array<{ id: ReportTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview & KPIs', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'frontdesk', label: 'Front Desk Manifest', icon: <Clock className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings Analysis', icon: <Calendar className="w-4 h-4" /> },
    { id: 'occupancy', label: 'Occupancy & Nights', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'categories', label: 'Room Categories', icon: <BedDouble className="w-4 h-4" /> },
    { id: 'revenue', label: 'Revenue & Taxes', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments Audit', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'sources', label: 'Booking Sources', icon: <Compass className="w-4 h-4" /> },
    { id: 'utilization', label: 'Room Utilization', icon: <Building className="w-4 h-4" /> },
    { id: 'overbookings', label: 'Overbookings Log', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'reconciliation', label: 'Reconciliation', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="brand" size="md" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Administrative Operations
            </Badge>
            <Badge variant="default" size="md">Hotel Analytics</Badge>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Executive & Operational Reports</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Authoritative real-time metrics for Manohar Grand (28 Physical Rooms, Category Capacity & Financial Audits)
          </p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-neutral-200 shadow-sm flex-wrap">
          {activeTab === 'frontdesk' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-600">Manifest Date:</span>
              <input
                type="date"
                value={frontDeskDate}
                onChange={(e) => setFrontDeskDate(e.target.value)}
                className="text-xs border border-neutral-300 rounded px-2 py-1 text-neutral-800"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs border border-neutral-300 rounded px-2 py-1 text-neutral-800"
              />
              <span className="text-xs text-neutral-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs border border-neutral-300 rounded px-2 py-1 text-neutral-800"
              />
            </div>
          )}

          {activeTab !== 'frontdesk' && (
            <div className="flex items-center gap-1.5 border-l border-neutral-200 pl-2">
              <button
                type="button"
                onClick={() => setPresetRange('next14')}
                className="px-2 py-1 rounded text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
              >
                Next 14D Forecast
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('next30')}
                className="px-2 py-1 rounded text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
              >
                Next 30D
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('thisMonth')}
                className="px-2 py-1 rounded text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('past30')}
                className="px-2 py-1 rounded text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
              >
                Past 30D
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportData}
            disabled={loading}
            className="gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-100 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchReportData}>Retry</Button>
        </div>
      )}

      {/* Loading State */}
      {loading && !overviewData && (
        <div className="py-20 flex flex-col items-center justify-center text-neutral-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
          <p className="text-sm">Calculating server-side report metrics...</p>
        </div>
      )}

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && overviewData && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="bordered" className="bg-white p-5 border-l-4 border-l-emerald-500">
              <span className="text-xs font-medium text-neutral-500">Today's In-House</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold text-neutral-900">{overviewData.today_frontdesk.in_house_bookings}</span>
                <Badge variant="success" size="sm">Active Stays</Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                {overviewData.today_frontdesk.expected_check_ins} Arrivals Expected · {overviewData.today_frontdesk.expected_check_outs} Departures
              </p>
            </Card>

            <Card variant="bordered" className="bg-white p-5 border-l-4 border-l-blue-500">
              <span className="text-xs font-medium text-neutral-500">Current Occupancy</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold text-neutral-900">{overviewData.today_inventory.occupancy_rate_percent}%</span>
                <Badge variant="brand" size="sm">{overviewData.today_inventory.occupied_rooms}/{overviewData.today_inventory.operational_rooms} Rooms</Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                {overviewData.today_inventory.available_rooms} Available · {overviewData.today_inventory.maintenance_rooms} Maintenance
              </p>
            </Card>

            <Card variant="bordered" className="bg-white p-5 border-l-4 border-l-brand-primary">
              <span className="text-xs font-medium text-neutral-500">Period Gross Revenue</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold text-neutral-900">₹{Number(overviewData.financial_kpi.period_gross_revenue).toLocaleString()}</span>
                <Badge variant="brand" size="sm">Authoritative</Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                ₹{Number(overviewData.financial_kpi.period_captured_payments).toLocaleString()} Advance Captured
              </p>
            </Card>

            <Card variant="bordered" className="bg-white p-5 border-l-4 border-l-amber-500">
              <span className="text-xs font-medium text-neutral-500">Outstanding Receivables</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold text-neutral-900">₹{Number(overviewData.financial_kpi.outstanding_balance).toLocaleString()}</span>
                <Badge variant="warning" size="sm">Payable Check-in</Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-2">Balance Due upon Arrival</p>
            </Card>
          </div>

          {/* Activity Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="bordered" className="bg-white p-5">
              <CardHeader className="p-0 pb-4 border-b border-neutral-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-neutral-900">Recent Bookings</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')} className="text-xs gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 pt-4 divide-y divide-neutral-100">
                {overviewData.recent_bookings.map((b) => (
                  <div key={b.booking_reference} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900">{b.booking_reference}</span>
                      <span className="text-neutral-500 ml-2">{b.guest_name}</span>
                      <div className="text-[11px] text-neutral-400">{b.check_in_date} to {b.check_out_date}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-neutral-900">₹{Number(b.gross_total).toLocaleString()}</span>
                      <div>
                        <Badge variant={b.status === 'confirmed' ? 'success' : 'default'} size="sm">
                          {b.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card variant="bordered" className="bg-white p-5">
              <CardHeader className="p-0 pb-4 border-b border-neutral-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-neutral-900">Recent Gateway Payments</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('payments')} className="text-xs gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 pt-4 divide-y divide-neutral-100">
                {overviewData.recent_payments.map((p) => (
                  <div key={p.payment_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900">{p.booking_reference}</span>
                      <span className="text-neutral-400 ml-2 capitalize">({p.purpose})</span>
                      <div className="text-[11px] text-neutral-400">{new Date(p.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600">+₹{Number(p.amount).toLocaleString()}</span>
                      <div>
                        <Badge variant={p.status === 'captured' ? 'success' : 'error'} size="sm">
                          {p.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Front Desk Manifest */}
      {activeTab === 'frontdesk' && frontDeskData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Expected Arrivals</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{frontDeskData.summary.expected_arrivals_count}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Completed Check-ins</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{frontDeskData.summary.completed_arrivals_count}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Expected Departures</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{frontDeskData.summary.expected_departures_count}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">In-House Guests</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{frontDeskData.summary.in_house_count}</div>
            </Card>
          </div>

          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Today's Arrival Manifest</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Guest Name & Phone</th>
                    <th className="p-3">Rooms & Assigned</th>
                    <th className="p-3">PAX</th>
                    <th className="p-3">Advance Paid</th>
                    <th className="p-3">Balance Due</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {frontDeskData.arrivals.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-neutral-400">No arrivals scheduled for this date.</td></tr>
                  ) : (
                    frontDeskData.arrivals.map((b) => (
                      <tr key={b.booking_reference} className="hover:bg-neutral-50">
                        <td className="p-3 font-semibold text-neutral-900">{b.booking_reference}</td>
                        <td className="p-3">
                          <div className="font-medium text-neutral-800">{b.guest_name}</div>
                          <div className="text-[11px] text-neutral-400">{b.guest_phone || 'No phone'}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-neutral-700">{b.total_rooms_count} Room(s)</div>
                          <div className="text-[11px] text-neutral-500">
                            {b.assigned_rooms.length > 0 ? b.assigned_rooms.join(', ') : 'Unassigned'}
                          </div>
                        </td>
                        <td className="p-3">{b.total_adults}A {b.total_children > 0 ? `${b.total_children}C` : ''}</td>
                        <td className="p-3 font-medium text-emerald-600">₹{Number(b.advance_paid).toLocaleString()}</td>
                        <td className="p-3 font-bold text-neutral-900">₹{Number(b.balance_due).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={b.status === 'checked_in' ? 'success' : 'brand'} size="sm">
                            {b.status_display}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Bookings Analysis */}
      {activeTab === 'bookings' && bookingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Total Bookings</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{bookingData.summary.total_bookings}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Confirmed Stays</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{bookingData.summary.by_status?.confirmed || 0}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Active / Expired Holds</span>
              <div className="text-2xl font-bold text-neutral-600 mt-1">{(bookingData.summary.by_status?.held || 0)} / {(bookingData.summary.by_status?.expired || 0)}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Cancelled / No-shows</span>
              <div className="text-2xl font-bold text-red-600 mt-1">{(bookingData.summary.by_status?.cancelled || 0)} / {(bookingData.summary.by_status?.no_show || 0)}</div>
            </Card>
          </div>

          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Bookings Manifest ({bookingData.pagination.total_count} Records)</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Stay Dates</th>
                    <th className="p-3">Total Value</th>
                    <th className="p-3">Advance Due</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {bookingData.bookings.map((b) => (
                    <tr key={b.booking_reference} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-900">{b.booking_reference}</td>
                      <td className="p-3 font-medium text-neutral-800">{b.guest_name}</td>
                      <td className="p-3 capitalize text-neutral-600">{b.source_display || b.source}</td>
                      <td className="p-3 text-neutral-600">{b.check_in_date} to {b.check_out_date}</td>
                      <td className="p-3 font-bold text-neutral-900">₹{Number(b.gross_total).toLocaleString()}</td>
                      <td className="p-3 text-emerald-600 font-semibold">₹{Number(b.advance_due).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant={b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out' ? 'success' : b.status === 'cancelled' || b.status === 'expired' ? 'error' : 'warning'} size="sm">
                          {b.status_display}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Occupancy */}
      {activeTab === 'occupancy' && occupancyData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Average Occupancy</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{occupancyData.summary.average_occupancy_rate_percent}%</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Room-Nights Available</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{occupancyData.summary.total_room_nights_available}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Room-Nights Occupied</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{occupancyData.summary.total_room_nights_occupied}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Maintenance / Blocked</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{occupancyData.summary.total_room_nights_blocked}</div>
            </Card>
          </div>

          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Night-by-Night Occupancy Breakdown</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Night Date</th>
                    <th className="p-3">Operational Rooms</th>
                    <th className="p-3">Occupied</th>
                    <th className="p-3">Temporary Holds</th>
                    <th className="p-3">Blocked / Maint</th>
                    <th className="p-3">Available</th>
                    <th className="p-3">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {occupancyData.daily_occupancy.map((d) => (
                    <tr key={d.date} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-900">{d.date}</td>
                      <td className="p-3">{d.total_operational_rooms}</td>
                      <td className="p-3 font-medium text-emerald-600">{d.rooms_occupied}</td>
                      <td className="p-3 text-neutral-500">{d.rooms_held}</td>
                      <td className="p-3 text-amber-600">{d.rooms_blocked}</td>
                      <td className="p-3 font-semibold text-neutral-900">{d.rooms_available}</td>
                      <td className="p-3">
                        <span className={`font-bold ${d.occupancy_rate_percent >= 75 ? 'text-emerald-600' : d.occupancy_rate_percent >= 40 ? 'text-blue-600' : 'text-neutral-600'}`}>
                          {d.occupancy_rate_percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Room Categories */}
      {activeTab === 'categories' && categoryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryData.categories.map((cat) => (
              <Card key={cat.category_id} variant="bordered" className="bg-white p-5 border-t-4 border-t-brand-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">{cat.category_name}</h3>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider">{cat.category_slug}</span>
                  </div>
                  <Badge variant="brand" size="md">{cat.operational_rooms_count} Physical Units</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-neutral-100 text-xs">
                  <div>
                    <span className="text-neutral-500">Room Nights Sold:</span>
                    <p className="text-base font-bold text-neutral-900">{cat.room_nights_sold} / {cat.capacity_room_nights}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Occupancy Rate:</span>
                    <p className="text-base font-bold text-blue-600">{cat.occupancy_rate_percent}%</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Category Revenue:</span>
                    <p className="text-base font-bold text-emerald-600">₹{Number(cat.total_revenue).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Average Daily Rate (ADR):</span>
                    <p className="text-base font-bold text-neutral-900">₹{Number(cat.average_daily_rate).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Revenue */}
      {activeTab === 'revenue' && revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="bordered" className="bg-white p-5">
              <span className="text-xs font-semibold text-neutral-500">Gross Booking Value</span>
              <div className="text-3xl font-extrabold text-neutral-900 mt-1">₹{Number(revenueData.summary.gross_booking_value).toLocaleString()}</div>
              <p className="text-xs text-neutral-400 mt-2">Authoritative BookingPriceSnapshot Total</p>
            </Card>
            <Card variant="bordered" className="bg-white p-5">
              <span className="text-xs font-semibold text-neutral-500">Taxes Collected (GST 5%)</span>
              <div className="text-3xl font-extrabold text-blue-600 mt-1">₹{Number(revenueData.summary.taxes_collected).toLocaleString()}</div>
              <p className="text-xs text-neutral-400 mt-2">Taxable Subtotal: ₹{Number(revenueData.summary.taxable_subtotal).toLocaleString()}</p>
            </Card>
            <Card variant="bordered" className="bg-white p-5">
              <span className="text-xs font-semibold text-neutral-500">Gateway Captured Advance</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">₹{Number(revenueData.summary.captured_payments).toLocaleString()}</div>
              <p className="text-xs text-neutral-400 mt-2">50% Advance Online Deposits</p>
            </Card>
          </div>

          <Card variant="bordered" className="bg-white p-6">
            <h3 className="text-sm font-bold text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Authoritative Financial Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-neutral-500">Base Room Tariffs:</span>
                <p className="text-base font-bold text-neutral-800 mt-1">₹{Number(revenueData.summary.room_subtotal).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-neutral-500">Extra Guest Surcharges:</span>
                <p className="text-base font-bold text-neutral-800 mt-1">₹{Number(revenueData.summary.extra_guest_charges).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-neutral-500">Late Checkout Fees:</span>
                <p className="text-base font-bold text-neutral-800 mt-1">₹{Number(revenueData.summary.late_checkout_charges).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-neutral-500">Discounts Granted:</span>
                <p className="text-base font-bold text-red-600 mt-1">-₹{Number(revenueData.summary.discounts_granted).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Payments Audit */}
      {activeTab === 'payments' && paymentData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Total Gateway Orders</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{paymentData.summary.total_orders}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Captured Amount</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">₹{Number(paymentData.summary.by_status?.captured?.amount || 0).toLocaleString()}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Successful Payments</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{paymentData.summary.by_status?.captured?.count || 0}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Failed / Cancelled</span>
              <div className="text-2xl font-bold text-red-600 mt-1">{(paymentData.summary.by_status?.failed?.count || 0) + (paymentData.summary.by_status?.cancelled?.count || 0)}</div>
            </Card>
          </div>

          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Payment Orders Audit Trail ({paymentData.pagination.total_count} Records)</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Booking</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Gateway Order ID</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paymentData.payment_orders.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-900">{p.payment_id.substring(0, 8)}...</td>
                      <td className="p-3 font-medium text-neutral-800">{p.booking_reference}</td>
                      <td className="p-3 capitalize text-neutral-600">{p.purpose}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{Number(p.amount).toLocaleString()}</td>
                      <td className="p-3 text-neutral-500 font-mono">{p.razorpay_order_id || '—'}</td>
                      <td className="p-3 text-neutral-500">{new Date(p.created_at).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant={p.status === 'captured' ? 'success' : p.status === 'failed' || p.status === 'cancelled' ? 'error' : 'warning'} size="sm">
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Booking Sources */}
      {activeTab === 'sources' && sourcesData && (
        <div className="space-y-6">
          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Acquisition Channel Distribution</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Source Channel</th>
                    <th className="p-3">Total Reservations</th>
                    <th className="p-3">Share %</th>
                    <th className="p-3">Confirmed Stays</th>
                    <th className="p-3">Cancelled</th>
                    <th className="p-3">Total Revenue</th>
                    <th className="p-3">Avg Booking Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sourcesData.sources.map((s) => (
                    <tr key={s.source} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-900">{s.label}</td>
                      <td className="p-3">{s.total_bookings}</td>
                      <td className="p-3 font-medium text-blue-600">{s.percentage_share}%</td>
                      <td className="p-3 text-emerald-600 font-medium">{s.confirmed_bookings}</td>
                      <td className="p-3 text-neutral-400">{s.cancelled_bookings}</td>
                      <td className="p-3 font-bold text-neutral-900">₹{Number(s.total_revenue).toLocaleString()}</td>
                      <td className="p-3 font-medium text-neutral-700">₹{Number(s.average_booking_value).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Room Utilization */}
      {activeTab === 'utilization' && utilizationData && (
        <div className="space-y-6">
          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">28 Physical Rooms Utilization Audit</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Room #</th>
                    <th className="p-3">Floor</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Operational Status</th>
                    <th className="p-3">Occupied Nights</th>
                    <th className="p-3">Maintenance Days</th>
                    <th className="p-3">Blocked Days</th>
                    <th className="p-3">Utilization Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {utilizationData.rooms.map((r) => (
                    <tr key={r.room_id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-900">{r.room_number}</td>
                      <td className="p-3">Floor {r.floor}</td>
                      <td className="p-3 text-neutral-700">{r.category_name}</td>
                      <td className="p-3">
                        <Badge
                          variant={r.operational_status === 'operational' ? 'success' : r.operational_status === 'maintenance' ? 'warning' : 'error'}
                          size="sm"
                        >
                          {r.operational_status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-emerald-600">{r.nights_occupied}</td>
                      <td className="p-3 text-amber-600">{r.nights_maintenance}</td>
                      <td className="p-3 text-red-600">{r.nights_blocked}</td>
                      <td className="p-3 font-bold text-neutral-900">{r.utilization_rate_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Overbookings */}
      {activeTab === 'overbookings' && overbookingData && (
        <div className="space-y-6">
          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Administrative Overbooking Override Audit Trail</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3">Stay Dates</th>
                    <th className="p-3">Categories & Rooms</th>
                    <th className="p-3">Mandatory Justification Reason</th>
                    <th className="p-3">Authorized By</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {overbookingData.overbookings.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-neutral-400">No overbooking overrides recorded in this period.</td></tr>
                  ) : (
                    overbookingData.overbookings.map((ob) => (
                      <tr key={ob.booking_reference} className="hover:bg-neutral-50">
                        <td className="p-3 font-semibold text-neutral-900">{ob.booking_reference}</td>
                        <td className="p-3 text-neutral-800">{ob.guest_name}</td>
                        <td className="p-3 text-neutral-600">{ob.check_in_date} to {ob.check_out_date}</td>
                        <td className="p-3 font-medium text-neutral-700">{ob.categories_booked}</td>
                        <td className="p-3 text-amber-700 font-medium">{ob.overbooking_reason}</td>
                        <td className="p-3 text-neutral-600">{ob.authorized_by}</td>
                        <td className="p-3"><Badge variant="warning" size="sm">{ob.status_display}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Reconciliation */}
      {activeTab === 'reconciliation' && reconData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Reservations Checked</span>
              <div className="text-2xl font-bold text-neutral-900 mt-1">{reconData.current_status.total_checked}</div>
            </Card>
            <Card variant="bordered" className="bg-white p-4">
              <span className="text-xs font-semibold text-neutral-500">Flagged State Discrepancies</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{reconData.current_status.flagged_discrepancies_count}</div>
            </Card>
          </div>

          <Card variant="bordered" className="bg-white overflow-hidden">
            <CardHeader className="p-4 bg-neutral-50 border-b border-neutral-200">
              <CardTitle className="text-sm font-bold text-neutral-900">Reconciliation Audit History</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">Reason / Details</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {reconData.audit_history.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-neutral-400">All financial and reservation states are 100% reconciled.</td></tr>
                  ) : (
                    reconData.audit_history.map((a) => (
                      <tr key={a.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-semibold capitalize text-neutral-900">{a.action.replace('_', ' ')}</td>
                        <td className="p-3 text-neutral-700">{a.reason}</td>
                        <td className="p-3 text-neutral-500">{a.actor}</td>
                        <td className="p-3 text-neutral-400">{new Date(a.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
