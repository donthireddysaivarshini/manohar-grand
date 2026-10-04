# Manohar Grand - Reporting & Admin Operations Architecture

## 1. Executive Summary

Phase 6 implements the authoritative operational, financial, and administrative reporting suite for Manohar Grand. The reporting subsystem queries the existing Django relational models (`Booking`, `PhysicalRoom`, `RoomCategory`, `BookingPriceSnapshot`, `PaymentOrder`, `RoomBlock`, `MaintenanceBlock`, `AuditLog`) to provide real-time KPIs, historical trends, front-desk operational manifests, and reconciliation auditing.

All report endpoints are strictly **read-only** and execute server-side aggregation.

---

## 2. Reporting Principles & Invariants

1. **Read-Only Invariance:**
   - Report endpoints never mutate bookings, alter payment orders, assign physical rooms, check guests in/out, modify tariffs, or trigger refunds.
2. **Server-Side Authoritative Aggregation:**
   - Financial totals are derived from immutable `BookingPriceSnapshot` records.
   - Physical room counts and availability are derived from `PhysicalRoom` operational inventory.
   - All calculations (ADR, RevPAR, Occupancy %, GST, Advance Due, Balance Due) are computed server-side with `Decimal` precision.
3. **Date Semantics & Timezone Awareness:**
   - All datetime queries use `django.utils.timezone` with the hotel's configured timezone (`Asia/Kolkata`).
   - Reports explicitly define their date dimension:
     - **Booking Date Dimension (`created_at`):** Used for reservation volume, source acquisition, and sales pacing.
     - **Stay Night Dimension (`[check_in_date, check_out_date)`):** Used for occupancy, physical room utilization, and room category performance.
     - **Operational Date Dimension (`check_in_date` / `check_out_date`):** Used for front-desk daily arrival, departure, and in-house manifests.
     - **Payment Date Dimension (`created_at` / `updated_at`):** Used for gateway payment volume and financial audit.
4. **Role-Based Access Control (RBAC):**
   - `SUPER_ADMIN` (Owner): Full access to all operational, financial, reconciliation, and audit reports.
   - `MANAGER`: Full access to operational, occupancy, revenue, category performance, and front-desk manifests.
   - `RECEPTIONIST`: Front-desk operational manifests (arrivals, departures, in-house), daily occupancy, and room utilization.
   - Public / Unauthenticated: Strictly denied (HTTP 401 / 403).

---

## 3. Available Report Endpoints

| Endpoint | Method | Date Dimension | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/reports/overview/` | `GET` | Current Date + 30 Days | High-level KPI dashboard (today's arrivals, departures, occupied rooms, occupancy %, monthly revenue, alerts). |
| `/api/v1/admin/reports/bookings/` | `GET` | `created_at` / `check_in` | Comprehensive reservation metrics, status breakdowns, source distribution, and paginated logs. |
| `/api/v1/admin/reports/occupancy/` | `GET` | Stay Nights `[D_in, D_out)` | Room-night occupancy, physical capacity utilization, maintenance/blocked room impact, night-by-night breakdown. |
| `/api/v1/admin/reports/categories/` | `GET` | Stay Nights `[D_in, D_out)` | Performance metrics per active category (Room-nights sold, Occupancy %, Revenue, ADR, RevPAR). |
| `/api/v1/admin/reports/revenue/` | `GET` | `created_at` / `check_in` | Authoritative financial breakdown (Gross total, base tariffs, extra guests, late checkouts, GST, advance paid, balance due). |
| `/api/v1/admin/reports/payments/` | `GET` | `created_at` | Gateway payment orders, captured deposits, failure rates, purpose breakdowns, and sanitized audit trail. |
| `/api/v1/admin/reports/frontdesk/` | `GET` | Operational Date (Today) | Front-desk daily manifest: expected arrivals, completed check-ins, departures, no-shows, in-house guests. |
| `/api/v1/admin/reports/sources/` | `GET` | `created_at` | Acquisition source breakdown (Website, Walk-in, Phone, WhatsApp, Reception, Corporate). |
| `/api/v1/admin/reports/rooms/utilization/` | `GET` | Stay Nights | Physical room unit utilization (operational status, occupied nights, maintenance days, utilization %). |
| `/api/v1/admin/reports/overbookings/` | `GET` | `created_at` | Administrative overbooking overrides audit log, justification reasons, and authorizing staff. |
| `/api/v1/admin/reports/reconciliation/` | `GET` | `created_at` | Read-only detection and audit of payment/booking state discrepancies. |

---

## 4. Key Calculation Formulas

1. **Occupancy Percentage (Period):**
   $$\text{Occupancy Rate} = \left( \frac{\text{Total Room Nights Occupied}}{\text{Total Physical Room Nights Operational}} \right) \times 100$$
2. **Average Daily Rate (ADR):**
   $$\text{ADR} = \frac{\text{Total Category Room Revenue}}{\text{Total Room Nights Sold}}$$
3. **Revenue Per Available Room (RevPAR):**
   $$\text{RevPAR} = \frac{\text{Total Category Room Revenue}}{\text{Total Physical Room Nights Operational}}$$
4. **Outstanding Balance:**
   $$\text{Outstanding Balance} = \text{Gross Booking Value} - \text{Total Captured Advance Payments}$$

---

## 5. Security & PII Protection

- Customer passwords, Google OAuth tokens, and session identifiers are never returned.
- Gateway secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are never accessed or returned.
- Sensitive guest identification (Aadhaar records) is excluded from reporting payloads.
- Payment identifiers (`razorpay_payment_id`, `razorpay_order_id`) are presented in sanitized read-only format for staff verification.
