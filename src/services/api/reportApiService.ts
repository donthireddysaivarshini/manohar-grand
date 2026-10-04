/**
 * ReportApiService - Authoritative frontend API service for Admin Reports & Analytics.
 * Connects to /api/v1/admin/reports/ endpoints with credentials: "include".
 */
import { fetchApi } from '../apiClient';

export interface OverviewKPIResponse {
  period: {
    from_date: string;
    to_date: string;
    today: string;
  };
  today_frontdesk: {
    expected_check_ins: number;
    completed_check_ins: number;
    expected_check_outs: number;
    completed_check_outs: number;
    in_house_bookings: number;
  };
  today_inventory: {
    total_physical_rooms: number;
    operational_rooms: number;
    occupied_rooms: number;
    available_rooms: number;
    maintenance_rooms: number;
    blocked_rooms: number;
    occupancy_rate_percent: number;
  };
  financial_kpi: {
    period_gross_revenue: string;
    period_advance_due: string;
    period_balance_due: string;
    period_captured_payments: string;
    outstanding_balance: string;
  };
  reconciliation_alerts_count: number;
  recent_bookings: Array<{
    booking_reference: string;
    guest_name: string;
    status: string;
    check_in_date: string;
    check_out_date: string;
    gross_total: string;
    created_at: string;
  }>;
  recent_payments: Array<{
    payment_id: string;
    booking_reference: string;
    amount: string;
    status: string;
    purpose: string;
    created_at: string;
  }>;
}

export interface BookingReportResponse {
  period: {
    from_date: string;
    to_date: string;
    date_dimension: string;
  };
  summary: {
    total_bookings: number;
    by_status: Record<string, number>;
    by_source: Record<string, { label: string; count: number; revenue: string }>;
    by_category: Record<string, { name: string; bookings_count: number; room_quantity_booked: number }>;
  };
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  bookings: Array<{
    booking_reference: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    status: string;
    status_display: string;
    source: string;
    source_display: string;
    check_in_date: string;
    check_out_date: string;
    nights_count: number;
    total_rooms_count: number;
    gross_total: string;
    advance_due: string;
    balance_due: string;
    is_overbooking: boolean;
    created_at: string;
  }>;
}

export interface OccupancyReportResponse {
  period: {
    from_date: string;
    to_date: string;
    days_count: number;
  };
  summary: {
    total_physical_rooms: number;
    operational_physical_rooms: number;
    total_room_nights_available: number;
    total_room_nights_occupied: number;
    total_room_nights_held: number;
    total_room_nights_blocked: number;
    average_occupancy_rate_percent: number;
  };
  daily_occupancy: Array<{
    date: string;
    total_operational_rooms: number;
    rooms_occupied: number;
    rooms_held: number;
    rooms_blocked: number;
    rooms_available: number;
    occupancy_rate_percent: number;
  }>;
}

export interface CategoryPerformanceResponse {
  period: {
    from_date: string;
    to_date: string;
    days_count: number;
  };
  categories: Array<{
    category_id: string;
    category_name: string;
    category_slug: string;
    operational_rooms_count: number;
    capacity_room_nights: number;
    bookings_count: number;
    room_nights_sold: number;
    occupancy_rate_percent: number;
    total_revenue: string;
    average_daily_rate: string;
    revpar: string;
  }>;
}

export interface RevenueReportResponse {
  period: {
    from_date: string;
    to_date: string;
    date_dimension: string;
  };
  summary: {
    gross_booking_value: string;
    room_subtotal: string;
    extra_guest_charges: string;
    late_checkout_charges: string;
    taxable_subtotal: string;
    taxes_collected: string;
    discounts_granted: string;
    advance_amount_due: string;
    balance_amount_due: string;
    captured_payments: string;
    outstanding_receivables: string;
  };
}

export interface PaymentReportResponse {
  period: {
    from_date: string;
    to_date: string;
  };
  summary: {
    total_orders: number;
    by_status: Record<string, { label: string; count: number; amount: string }>;
    by_purpose: Record<string, { label: string; count: number; amount: string }>;
  };
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  payment_orders: Array<{
    payment_id: string;
    booking_reference: string;
    purpose: string;
    amount: string;
    amount_paise: number;
    currency: string;
    status: string;
    provider: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface FrontDeskReportResponse {
  target_date: string;
  summary: {
    expected_arrivals_count: number;
    completed_arrivals_count: number;
    expected_departures_count: number;
    completed_departures_count: number;
    in_house_count: number;
  };
  arrivals: Array<{
    booking_reference: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    status: string;
    status_display: string;
    total_adults: number;
    total_children: number;
    total_rooms_count: number;
    assigned_rooms: string[];
    is_fully_assigned: boolean;
    advance_paid: string;
    balance_due: string;
    special_requests: string;
  }>;
  departures: Array<{
    booking_reference: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    status: string;
    status_display: string;
    total_adults: number;
    total_children: number;
    total_rooms_count: number;
    assigned_rooms: string[];
    is_fully_assigned: boolean;
    advance_paid: string;
    balance_due: string;
    special_requests: string;
  }>;
  in_house_guests: Array<{
    booking_reference: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    status: string;
    status_display: string;
    total_adults: number;
    total_children: number;
    total_rooms_count: number;
    assigned_rooms: string[];
    is_fully_assigned: boolean;
    advance_paid: string;
    balance_due: string;
    special_requests: string;
  }>;
}

export interface SourcesReportResponse {
  period: {
    from_date: string;
    to_date: string;
  };
  summary: {
    total_bookings: number;
    total_revenue: string;
  };
  sources: Array<{
    source: string;
    label: string;
    total_bookings: number;
    percentage_share: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    total_revenue: string;
    average_booking_value: string;
  }>;
}

export interface RoomUtilizationResponse {
  period: {
    from_date: string;
    to_date: string;
    days_count: number;
  };
  rooms: Array<{
    room_id: string;
    room_number: string;
    floor: number;
    category_name: string;
    category_slug: string;
    operational_status: string;
    days_in_period: number;
    nights_occupied: number;
    nights_maintenance: number;
    nights_blocked: number;
    utilization_rate_percent: number;
  }>;
}

export interface OverbookingReportResponse {
  period: {
    from_date: string;
    to_date: string;
  };
  total_overbookings: number;
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  overbookings: Array<{
    booking_reference: string;
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    categories_booked: string;
    total_rooms: number;
    overbooking_reason: string;
    authorized_by: string;
    status: string;
    status_display: string;
    created_at: string;
  }>;
}

export interface ReconciliationReportResponse {
  current_status: {
    total_checked: number;
    flagged_discrepancies_count: number;
    discrepancies: Array<any>;
  };
  audit_history: Array<{
    id: string;
    action: string;
    resource_id: string;
    reason: string;
    actor: string;
    old_values: any;
    new_values: any;
    created_at: string;
  }>;
}

export const reportApiService = {
  getOverview: async (params?: { from_date?: string; to_date?: string }): Promise<OverviewKPIResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<OverviewKPIResponse>(`/api/v1/admin/reports/overview/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch overview KPIs');
  },

  getBookingsReport: async (params?: {
    from_date?: string;
    to_date?: string;
    status?: string;
    source?: string;
    category_slug?: string;
    date_dimension?: string;
    page?: number;
    page_size?: number;
  }): Promise<BookingReportResponse> => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetchApi<BookingReportResponse>(`/api/v1/admin/reports/bookings/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch bookings report');
  },

  getOccupancyReport: async (params?: { from_date?: string; to_date?: string; category_slug?: string }): Promise<OccupancyReportResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<OccupancyReportResponse>(`/api/v1/admin/reports/occupancy/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch occupancy report');
  },

  getCategoryPerformance: async (params?: { from_date?: string; to_date?: string }): Promise<CategoryPerformanceResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<CategoryPerformanceResponse>(`/api/v1/admin/reports/categories/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch room category performance');
  },

  getRevenueReport: async (params?: { from_date?: string; to_date?: string; date_dimension?: string }): Promise<RevenueReportResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<RevenueReportResponse>(`/api/v1/admin/reports/revenue/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch revenue report');
  },

  getPaymentReport: async (params?: { from_date?: string; to_date?: string; status?: string; purpose?: string; page?: number; page_size?: number }): Promise<PaymentReportResponse> => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetchApi<PaymentReportResponse>(`/api/v1/admin/reports/payments/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch payment report');
  },

  getFrontDeskReport: async (params?: { target_date?: string }): Promise<FrontDeskReportResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<FrontDeskReportResponse>(`/api/v1/admin/reports/frontdesk/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch front-desk report');
  },

  getSourcesReport: async (params?: { from_date?: string; to_date?: string }): Promise<SourcesReportResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<SourcesReportResponse>(`/api/v1/admin/reports/sources/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch booking sources report');
  },

  getRoomUtilization: async (params?: { from_date?: string; to_date?: string; category_slug?: string }): Promise<RoomUtilizationResponse> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetchApi<RoomUtilizationResponse>(`/api/v1/admin/reports/rooms/utilization/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch room utilization report');
  },

  getOverbookingReport: async (params?: { from_date?: string; to_date?: string; page?: number; page_size?: number }): Promise<OverbookingReportResponse> => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetchApi<OverbookingReportResponse>(`/api/v1/admin/reports/overbookings/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch overbooking report');
  },

  getReconciliationReport: async (params?: { limit?: number }): Promise<ReconciliationReportResponse> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetchApi<ReconciliationReportResponse>(`/api/v1/admin/reports/reconciliation/?${query}`);
    if (res.success && res.data) return res.data;
    throw new Error(res.error?.message || 'Failed to fetch reconciliation report');
  },
};
