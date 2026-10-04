# Architecture Decision Records (ADR)

## ADR 1: Development Database Strategy (SQLite Dev $\to$ PostgreSQL Production)
- **Status**: Approved.
- **Context**: Development is targeted for local SQLite (`db.sqlite3`) for simplicity and rapid prototyping, while production requires PostgreSQL 16+ for robust concurrency, row-level locking (`SELECT FOR UPDATE`), and high availability.
- **Decision**: Design all models and queries strictly compliant with portable ANSI-SQL / Django ORM abstractions. Avoid DB-specific dialect tricks. Enable WAL mode (`PRAGMA journal_mode=WAL;`) on SQLite during development to minimize database file contention.
- **Consequences**: SQLite is strictly for development/testing and does **NOT** provide PostgreSQL-equivalent row-locking or concurrency guarantees. PostgreSQL 16+ is mandatory for production deployment.

---

## ADR 2: Authoritative Physical Inventory & Unified Multi-Channel Capacity
- **Status**: Approved.
- **Context**: The hotel has 28 physical rooms (20 AC, 8 Non-AC). Both online direct website bookings and offline front-desk walk-ins/phone reservations must share the exact same inventory without risking double-booking.
- **Decision**: `PhysicalRoom` records are the sole authoritative physical inventory. `RoomCategory.total_inventory` is strictly a derived/read-only property. Availability is computed dynamically per night across the date range ($D_{in} \le \text{night} < D_{out}$) by subtracting confirmed bookings, active temporary holds, and maintenance blocks from the active physical rooms in that category.
- **Consequences**: Single source of truth; 100% unified inventory across online direct and offline front-desk channels; zero drift.

---

## ADR 3: Configurable Temporary Inventory Hold Mechanism
- **Status**: Approved.
- **Context**: When a customer enters checkout, inventory must be temporarily reserved while they complete payment. If payment fails or is abandoned, rooms must be released automatically.
- **Decision**: Introduce a `HELD` status with `hold_expires_at = now() + timedelta(minutes=BOOKING_HOLD_DURATION_MINUTES)` (default: 15 minutes, configurable). Active holds reduce bookable capacity. Expired holds are invalidated lazily during availability queries and cleaned up periodically by a background task.
- **Consequences**: Prevents checkout collisions while guaranteeing that abandoned sessions do not permanently block inventory.

---

## ADR 4: Customer Authentication via Google OAuth & Staff Authentication via Controlled Accounts
- **Status**: Approved.
- **Context**: Customers require a frictionless "Continue with Google" sign-in, while hotel staff require strictly controlled administrative accounts with RBAC.
- **Decision**: Customer authentication uses standard Django social-auth (`django-allauth`) with Google OAuth 2.0. Google credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are loaded from environment variables. Successful token validation issues an internal secure Django session cookie. Staff accounts authenticate via email/password (PBKDF2/Argon2) with role-based access control (`SUPER_ADMIN`, `MANAGER`, `RECEPTIONIST`). Phone OTP and Email Magic Links are explicitly excluded.
- **Consequences**: Secure, industry-standard authentication without custom OAuth wheel-reinvention; clear segregation between guest and staff credentials.

---

## ADR 5: Immutable Booking Price Snapshots & Dynamic Tax Rules
- **Status**: Approved.
- **Context**: Room rates, extra guest fees, taxes, and promotional discounts change over time. Historical bookings must preserve the exact financial figures agreed upon at the time of reservation.
- **Decision**: Every confirmed booking creates an immutable `BookingPriceSnapshot` storing complete line-item breakdowns. Tax calculations are driven by active, configurable `TaxRule` records rather than hardcoded percentages (12% is treated as demo/configurable).
- **Consequences**: Past bookings and invoices remain immutable regardless of future tariff or tax policy changes.

---

## ADR 6: Authoritative Backend Payment Verification & Non-Refundable Cancellation Baseline
- **Status**: Approved.
- **Context**: Frontend clients cannot be trusted for financial verification, advance deposits, or cancellation policy enforcement.
- **Decision**:
  - Payment verification validates booking ownership/session, booking status (`HELD`), server-calculated 50% advance amount in paise, order ID, payment ID, and cryptographic HMAC-SHA256 signature.
  - Cancellation policy baseline is strictly **non-refundable (0% refund)** once confirmed and paid. However, the policy engine (`CancellationPolicy` & `CancellationPolicyRule`) is centrally configurable in the backend so rules can be adjusted dynamically without code changes.
- **Consequences**: Complete protection against client-side tampering, amount manipulation, or double-refunding.

---

## ADR 7: Digital Aadhaar Document Storage Architecture
- **Status**: Approved for Future Phase.
- **Context**: The client confirmed the requirement to upload and store copies/photos of guest Aadhaar IDs. Aadhaar is sensitive identity data.
- **Decision**: Aadhaar documents will be uploaded via authenticated, secure APIs to private storage. Files will have strict staff-only access, no public URLs, comprehensive audit logging, and will not be logged or exposed in public API envelopes. (Scheduled for future implementation phase; not in Phase 1).
- **Consequences**: Satisfies hotel operational guest verification while adhering to strict privacy and data security standards.

---

## ADR 8: Split Advance Payment Model & Admin Overbooking Override
- **Status**: Approved.
- **Context**: Online direct guests pay 50% advance to confirm booking; the remaining 50% balance is payable at check-in. The hotel owner also requires the capability to create overbookings under exceptional circumstances.
- **Decision**:
  - `BookingPriceSnapshot` explicitly tracks `gross_total`, `advance_amount_due` (50%), and `balance_amount_due` (50%).
  - Owner / `SUPER_ADMIN` is authorized to perform manual overbooking overrides with mandatory justification notes and audit logging.
- **Consequences**: Clear separation between online advance deposits and front-desk balance settlement; controlled, traceable emergency overbooking.

---

## ADR 10: Separation of Physical Room Operational Status from Transient Reservation Occupancy
- **Status**: Proposed for Phase 2.
- **Context**: A room's state can be viewed from a physical maintenance perspective (operational, undergoing AC repair, deep cleaning) or a reservation occupancy perspective (occupied by a guest for a specific calendar night).
- **Decision**: `PhysicalRoom.operational_status` stores strictly the physical/housekeeping readiness (`operational`, `maintenance`, `blocked`, `inactive`). Reservation occupancy is NEVER stored as a static manual field on `PhysicalRoom`; it is computed dynamically by the availability engine from active bookings and temporary holds covering specific stay dates.
- **Consequences**: Eliminates data desynchronization between front-desk room toggles and booking calendars; prevents accidental manual overwriting of active reservations.

---

## ADR 11: Effective-Dated Dynamic Pricing Master Data & Historical Versioning
- **Status**: Approved.
- **Context**: Hotel room tariffs (AC ₹1,599, Non-AC ₹1,299), extra occupant surcharges (Adult ₹350, Child ₹300), late checkout hourly rates (AC ₹150/hr, Non-AC ₹100/hr), and GST (5%) fluctuate over time. Changing current rates must not alter existing booking snapshots, past accounting reports, or historical pricing records.
- **Decision**: Model `RoomRatePlan` and `TaxRule` as effective-dated version rows (`effective_from`, `effective_to`, `is_active`). When tariffs change, administrators create new rate plan records or bound existing ones rather than destructively mutating past rows in place. All booking transactions store an immutable `BookingPriceSnapshot` captured at confirmation time.
- **Consequences**: Complete preservation of past pricing history; zero retroactivity bugs on existing transactions; cleanly supports future seasonal tariffs and GST regime adjustments.

---

## ADR 12: Headless CMS Architecture & Structured Content Boundaries
- **Status**: Approved.
- **Context**: Dynamic public website content (hero banner narratives, welcome copy, why-choose-us highlights, FAQs) must be configurable by staff via Django Admin without modifying React source code or requiring redeployments.
- **Decision**: Implement generic `CMSSection` with stable unique keys (`section_key`) and structured JSON `metadata` for component-level attributes, alongside categorized `FAQ` items. Content fields describe text and structured items; visual styling and page layout remain strictly controlled by the React frontend. Unconfirmed client marketing copy, phone numbers, addresses, and fake FAQs are strictly excluded from master seed data. In Django Admin, full CMS modification is restricted to `SUPER_ADMIN` (Owner) per `10.ADMIN_PANEL_REQUIREMENTS.md` Table 3; `MANAGER` has read-only access (pending client confirmation baseline); `RECEPTIONIST` is strictly denied.
- **Consequences**: Complete backend content configurability without hardcoded React strings; clean separation of presentation layout from dynamic data; safe against XSS and unverified client marketing claims; strict principle-of-least-privilege RBAC alignment.

---

## ADR 13: Unified Inventory Authority & Category-Level Reservation Architecture
- **Status**: Approved.
- **Context**: The booking platform supports multi-channel reservations (Online Website, Front Desk Walk-In, Phone, WhatsApp, Reception, Corporate Deals). Inventory must be consistent across all channels without double-booking or desynchronization.
- **Decision**:
  1. **Authoritative Inventory Unit**: `PhysicalRoom` is the sole authoritative unit of physical inventory (`operational`, `maintenance`, `blocked`, `inactive`). No second editable inventory counter or duplicate integer exists.
  2. **RoomNightInventory Status**: Not implemented as an independent manual data store. Inventory availability is calculated dynamically across stay night intervals `[check_in, check_out)` against active physical rooms, confirmed reservations, unexpired holds, and operational blocks (`RoomBlock`, `MaintenanceBlock`).
  3. **Category-Level Reservation vs Room Assignment**: Customers reserve accommodation at the `RoomCategory` level (`BookingRoom`). Physical room door units (`physical_room`) remain nullable initially and are assigned by front desk receptionists prior to or upon check-in, supporting partial and staged assignment.
  4. **Strict Booking State Machine**: Booking lifecycle transitions are strictly enforced (`HELD` -> `CONFIRMED`/`EXPIRED`/`CANCELLED`; `CONFIRMED` -> `CHECKED_IN`/`CANCELLED`/`NO_SHOW`; `CHECKED_IN` -> `CHECKED_OUT`/`CANCELLED`). Direct mutation is prevented; transitions trigger append-only `AuditLog` records.
  5. **Temporary Hold Foundation**: Configurable hold duration (`BOOKING_HOLD_DURATION_MINUTES = 15`) with lazy invalidation in availability calculations and automatic expiration mechanics.
  6. **PostgreSQL Concurrency Boundary**: Concurrency protection in production utilizes PostgreSQL row-level locks (`select_for_update()`) on target `RoomCategory` rows inside atomic transactions (`@transaction.atomic`). SQLite in development/testing does not simulate multi-connection PostgreSQL row locking; true concurrent production validation requires PostgreSQL.
  7. **Overbooking Override Foundation**: Explicit `is_overbooking` and mandatory `overbooking_reason` fields allow authorized Owner/Admin overrides without silent overbooking.

---

## ADR 14: Front-Desk Physical Room Assignment, Check-In Validation & Customer Booking Ownership
- **Status**: Approved.
- **Context**: Customers reserve accommodation at the room category level. Front-desk staff must assign physical room units (`PhysicalRoom`) prior to or at check-in, ensure check-in occurs only when fully assigned, support offline walk-ins and SuperAdmin overbookings, and secure customer booking lookup against unauthorized inspection.
- **Decision**:
  1. **Physical Room Assignment Service (`assign_physical_rooms`)**:
     - Locks candidate `PhysicalRoom` rows using `select_for_update()` inside `transaction.atomic()`.
     - Validates category matching, operational readiness (`operational_status == 'operational'`), absence of active `RoomBlock` and `MaintenanceBlock` overlapping stay dates, and absence of overlapping active bookings.
     - Supports staged/partial assignments with explicit metrics (`assigned_quantity`, `required_quantity`, `remaining_quantity`).
     - Allows clearing assignments by providing an empty list, cleanly preserving category-level reservation quantities.
  2. **Check-In Validation Service (`admin_check_in_booking`)**:
     - Re-verifies room assignment completeness (`is_fully_assigned == True`) before allowing status transition to `CHECKED_IN`.
     - Re-checks operational status and blocks on assigned units inside transaction.
  3. **Authenticated Customer Booking Ownership**:
     - `GET /api/v1/bookings/` derives ownership strictly from `request.user` when authenticated.
     - Ignores or rejects client query parameters (`?customer_id=`) attempting to spoof ownership.
     - Public lookup (`GET /api/v1/bookings/{booking_reference}/`) requires either authenticated customer ownership, valid unguessable `access_token` (query param `?token=` or header `X-Booking-Token`), or staff role. Guessing reference alone returns HTTP 403 Forbidden.
  4. **Staff Roles & Offline Operations**:
     - `RECEPTIONIST`, `MANAGER`, `SUPER_ADMIN` can list bookings, view details, assign physical rooms, check in, check out, and create offline walk-in bookings.
     - `SUPER_ADMIN` exclusively holds the overbooking override capability (`POST /api/v1/admin/bookings/overbooking/`), requiring mandatory justification and emitting an immutable `AuditLog` record.

---

## ADR 15: Authoritative Backend Pricing Engine & Immutable Financial Snapshots
- **Status**: Approved.
- **Context**: The Manohar Grand hotel booking system requires authoritative calculation of room tariffs, extra guest fees, late checkout surcharges, and dynamic GST. Client-submitted prices or totals cannot be trusted, and subsequent tariff or tax rate changes must never retroactively alter historical booking financials.
- **Decision**:
  1. **Backend as Sole Pricing Authority**: The calculation pipeline (`calculate_booking_quote`) strictly derives all subtotals, extra guest charges, late checkout fees, GST (5%), and 50% advance / 50% balance splits on the server using `Decimal` arithmetic. Client-submitted prices, subtotals, discounts, or taxes are strictly ignored.
  2. **Deterministic Rate Plan Resolution (`resolve_rate_plan`)**: Resolves active `RoomRatePlan` records based on stay dates and category. Rejects missing active rates and fails clearly on ambiguous overlapping rates.
  3. **Occupancy Ceiling Validations**: Enforces `max_total_occupancy` (AC: 4 PAX; Non-AC: 2 PAX working baseline pending client confirmation) and optional adult ceilings.
  4. **Late Checkout Window**: Enforces `HotelConfiguration.max_late_checkout_hours` (3 hours maximum) and applies hourly rates (AC: ₹150/hr, Non-AC: ₹100/hr).
  5. **Immutable Price Snapshots (`BookingPriceSnapshot`)**: Persisted as a `OneToOneField` on `Booking`. Stores both summary totals and complete structured itemized breakdowns (`itemized_breakdown` JSONField). Future rate or tax modifications do not alter existing snapshots.
  6. **Unified Engine**: Shared identically by public quote calculation (`POST /api/v1/pricing/calculate/`), checkout holds (`POST /api/v1/bookings/hold/`), and staff offline reservations (`walk-in` / `overbooking`).
- **Consequences**: Zero floating-point rounding errors; complete protection against client price tampering; absolute historical financial reproducibility; unified pricing behavior across all booking channels.

---

## ADR 16: Customer Booking Management, Stay Guest Roster & Authoritative Cancellation Rules
- **Status**: Approved.
- **Context**: Phase 4 Step 2 requires authenticated customer account management, secure reservation history/detail lookup, stay guest information and roster management, and authoritative enforcement of hotel cancellation policy rules.
- **Decision**:
  1. **Customer Profile & Ownership Isolation**:
     - Customer details retrieval (`GET /api/v1/auth/me/`) and profile updates (`PATCH /api/v1/auth/profile/`) allow modifying only non-critical demographic fields (`first_name`, `last_name`, `phone`, `city`, `state`). Customer cannot alter `role`, `is_staff`, `is_superuser`, `is_active`, `auth_provider`, or audit fields.
     - Customer booking history (`GET /api/v1/bookings/`) strictly filters by `customer=request.user`, disallowing client-supplied owner spoofing. Supports query filters (`?status=`, `?view=upcoming`, `?view=past`).
     - Access tokens are omitted from customer list responses to prevent accidental token leakage.
  2. **Stay Guest Roster & Stay Information Updates (`BookingGuest`)**:
     - Introduces `BookingGuest` model (`booking`, `full_name`, `guest_type` ['adult', 'child'], `age`, `phone`, `email`, `is_primary`) to distinguish the account holder from individual staying guests.
     - Stay info updates (`PATCH /api/v1/bookings/{ref}/` and `/guests/`) allow booking owner or valid token holder to update contact details, special requests, and guest roster.
     - Allowed only when booking is in `held` or `confirmed` status.
     - Enforces total guest count against maximum allowable capacity of booked rooms (`max_total_occupancy`).
     - Strictly forbids mutating rates, stay dates, room quantities, categories, discounts, or price snapshots. Emits `AuditLog` records.
  3. **Authoritative Cancellation Rules**:
     - **Temporary Holds (`held`)**: Customer, token holder, or staff can cancel/release hold via `POST /api/v1/bookings/{ref}/cancel/` or `/release/`, transitioning status to `cancelled` and immediately freeing temporary inventory.
     - **Confirmed Reservations (`confirmed`)**: Customers CANNOT cancel or refund confirmed reservations per client-confirmed policy (Strict Non-Refundable 0% policy). Customer cancellation requests are rejected with HTTP 400 (`CANCELLATION_NOT_PERMITTED`). Receptionists cannot cancel confirmed reservations.
     - **Staff Administrative Override**: Only `MANAGER` and `SUPER_ADMIN` can perform emergency administrative cancellations on confirmed reservations with mandatory justification reason.
     - **Financial Immutability**: Cancellation never mutates `BookingPriceSnapshot` and never creates unauthorized refund records.
- **Consequences**: Strict customer data isolation; zero risk of customer-side booking tampering; exact alignment with client-confirmed non-refundable policy while maintaining administrative emergency flexibility.

---

## ADR 17: Checkout Readiness & Authoritative Pre-Payment Booking Workflow
- **Status**: Approved.
- **Context**: Phase 4 Step 3 establishes the authoritative checkout validation and summary service preceding payment gateway handoff (Phase 5). The backend must ensure all hold invariants, category capacities, and pricing snapshots are verified before presenting final review data to customers or generating payment orders.
- **Decision**:
  1. **Checkout Summary Endpoint (`GET /api/v1/bookings/{booking_reference}/checkout/`)**:
     - Exposes authoritative pre-payment review data: stay dates, nights, booked categories, guest roster, full immutable `BookingPriceSnapshot` breakdown (base tariff, extra charges, taxable subtotal, GST 5%, gross total, 50% advance due, 50% remaining balance), non-refundable cancellation policy, and hotel check-in/check-out operational timings.
     - Strictly read-only (`GET` only; mutation methods return HTTP 405).
     - Protected by customer ownership (`booking.customer == request.user`), valid access token (`?token=` or `X-Booking-Token`), or staff role (`is_staff`).
  2. **Domain Validation Engine (`validate_booking_for_checkout`)**:
     - Verifies: booking is in `held` status, hold has not expired (`hold_expires_at > now`), check-out > check-in, booked categories exist and are active, guest count does not exceed total category capacity, and authoritative `BookingPriceSnapshot` exists and is internally consistent (`gross_total == advance + balance`).
     - Stale holds are lazily transitioned to `expired` status to release inventory, returning code `HOLD_EXPIRED`.
     - Confirmed bookings return code `ALREADY_CONFIRMED`.
  3. **Payment Handoff Contract (`prepare_booking_for_payment`)**:
     - Dedicated isolated backend service for Phase 5 Razorpay order creation.
     - Derives payable amounts strictly from `BookingPriceSnapshot` (`advance_amount_due`, `advance_amount_paise`).
     - Guarantees that payment preparation NEVER alters booking state to `confirmed` and NEVER accepts client-supplied amounts.
  4. **RBAC Integrity**:
     - Confirmed matrix: `SUPER_ADMIN` has exclusive mutation permissions on Room Rates and Tax Rules. `MANAGER` and `RECEPTIONIST` have read-only access (mutations return HTTP 403 Forbidden).
- **Consequences**: Zero risk of client price or date tampering; clean separation between pre-payment readiness (Phase 4 Step 3) and Razorpay execution/verification (Phase 5); robust hold expiry enforcement.

---

## ADR 18: Razorpay Payment Foundation & Authoritative Order Creation
- **Status**: Approved.
- **Context**: Phase 5 Step 1 introduces the backend Razorpay integration foundation for the 50% advance deposit. The backend must remain the sole financial authority, preventing client amount tampering, ensuring idempotency, and isolating third-party gateway dependencies.
- **Decision**:
  1. **Isolated Provider Architecture (`RazorpayPaymentProvider`)**:
     - The core booking engine and REST APIs never interact with the Razorpay SDK directly.
     - `RazorpayPaymentProvider` encapsulates order creation (`client.order.create`), HMAC-SHA256 payment signature verification, and webhook signature verification.
     - Gateway credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) remain strictly server-side. Public `RAZORPAY_KEY_ID` is exposed to clients; secrets are never logged or returned in responses.
  2. **Authoritative Monetary Calculation**:
     - Payable amount is strictly derived from `BookingPriceSnapshot.advance_amount_due` in Decimal INR and converted to integer paise (`advance_amount_due * 100`).
     - Client-submitted `amount`, `currency`, or `purpose` fields are completely ignored.
  3. **Order Creation Endpoint (`POST /api/v1/payments/orders/`)**:
     - Accepts `{ "booking_reference": "..." }`.
     - Validates booking ownership (authenticated user or valid access token), runs `validate_booking_for_checkout`, verifies `held` status and hold expiry.
     - Returns public checkout parameters (`payment_id`, `razorpay_order_id`, `razorpay_key_id`, `amount` in paise, `currency`, `purpose`, `status`).
  4. **Idempotency & State Invariance**:
     - Re-requests for an active created order return the existing `PaymentOrder` without spawning duplicate gateway orders.
     - Creating a payment order **NEVER transitions booking status to `confirmed`**; the reservation strictly remains in `held` status until verified payment processing (Phase 5 Step 2).
  5. **Payment Domain Model (`PaymentOrder`)**:
     - Distinguishes internal UUID primary key from Razorpay `order_id` and `payment_id`.
     - Maintains immutable audit trail of payment order generations.
- **Consequences**: Complete protection against client price tampering; zero duplicate order creation; safe, testable gateway abstraction with full signature verification utilities ready for subsequent verification and webhook phases.

---

## ADR 19: Razorpay Payment Verification, Webhooks & Atomic Booking Confirmation
- **Status**: Approved.
- **Context**: Phase 5 Step 2 implements authoritative server-side payment verification for Razorpay Checkout, asynchronous webhook processing, atomic booking confirmation, and inventory consumption.
- **Decision**:
  1. **Dual Verification Ingress**:
     - Direct client verification endpoint (`POST /api/v1/payments/verify/`): accepts only gateway identifiers (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`). Derives ownership and booking association strictly on the server.
     - Asynchronous webhook endpoint (`POST /api/v1/payments/webhook/razorpay/`): unauthenticated, validates `X-Razorpay-Signature` over raw request body using `RAZORPAY_WEBHOOK_SECRET`.
  2. **Unified Confirmation Pipeline (`confirm_booking_after_verified_payment`)**:
     - Both verification endpoints invoke a single internal service wrapped in `transaction.atomic()`.
     - Acquires row-level locks via `select_for_update()` on `PaymentOrder`, `Booking`, and `RoomCategory` rows.
     - Performs strict re-validation of hold validity (`hold_expires_at > now`), booking state (`held`), and exact financial match against `BookingPriceSnapshot.advance_amount_due`.
     - Atomically transitions `PaymentOrder.status = 'captured'` and `Booking.status = 'confirmed'`, clears `hold_expires_at`, and emits immutable `AuditLog` records.
  3. **Idempotency & Deduplication**:
     - Payment confirmation safely detects already-captured/confirmed states and returns HTTP 200 without double-confirming inventory or duplicating audit entries.
     - `WebhookEventLog` enforces unique `(provider, event_id)` constraints in the database, allowing webhook retries to be safely acknowledged without duplicate side-effects.
  4. **Payment Failure Behavior**:
     - Failed payments (`payment.failed`) mark `PaymentOrder.status = 'failed'` without cancelling the booking or releasing the hold prematurely, allowing customers to retry within their 15-minute hold window.
  5. **Inventory Invariance**:
     - Confirmed category-level bookings consume physical room availability via existing category aggregation queries. No physical room assignment is performed at checkout (reception assigns physical rooms upon check-in).
- **Consequences**: Zero risk of unverified or client-tampered bookings; resilient against network failures and duplicate requests; absolute transactional consistency between payment and reservation state.

---

## ADR 20: Real Customer Booking Flow & Real Razorpay Checkout Frontend Integration
- **Status**: Approved.
- **Context**: Phase 5 Step 3 transitions the entire frontend booking, availability, pricing, and checkout workflows from demo/mock simulations to real backend DRF endpoints and real Razorpay Checkout modal execution.
- **Decision**:
  1. **Direct Backend API Layer (`src/services/api/`)**:
     - Introduces dedicated API services (`roomApiService`, `availabilityApiService`, `bookingApiService`, `paymentApiService`, `pricingApiService`) operating over standard `fetchApi` with `credentials: 'include'` and CSRF protection.
     - Mock services are completely decoupled from production customer paths.
  2. **Authoritative Booking & Hold Lifecycle**:
     - Room availability is queried in real-time from `GET /api/v1/availability/search/`.
     - Booking holds are authoritatively created on Django via `POST /api/v1/bookings/hold/`, returning authoritative `booking_reference`, `access_token`, and `hold_expires_at`.
     - Frontend enforces an active 15-minute countdown and prevents payment submission against expired holds.
  3. **Authoritative Checkout & Dynamic Pricing**:
     - Checkout page strictly renders numbers provided by `GET /api/v1/bookings/{ref}/checkout/` (sourced directly from `BookingPriceSnapshot`). No prices, taxes, or 50% advance splits are calculated independently on the client.
  4. **Razorpay Checkout JS Integration (`razorpayService`)**:
     - Dynamically loads official `https://checkout.razorpay.com/v1/checkout.js`.
     - Initiates gateway checkout using backend-created `razorpay_order_id`, public `razorpay_key_id`, and `amount` (in paise).
     - Upon payment completion, signature, payment ID, and order ID are sent immediately to `POST /api/v1/payments/verify/` for cryptographic verification and reservation confirmation.
  5. **Session-Authenticated Customer Gate**:
     - Unauthenticated guests attempting to create a hold are routed to Django session-backed Google sign-in.
- **Consequences**: Zero mock data in production flows; absolute financial alignment with server-side snapshots; seamless Razorpay test/live checkout user experience.

---

## ADR 21: Payment Lifecycle Hardening, Webhook Reliability & State Reconciliation
- **Status**: Approved.
- **Context**: Phase 5 Step 4 hardens the payment domain against concurrency anomalies, duplicate webhooks, out-of-order events, retry storms, hold expiration boundaries, and state drift.
- **Decision**:
  1. **Authoritative State Decoupling**:
     - `PaymentOrder` is the authoritative record of financial transactions (`created`, `captured`, `failed`, `cancelled`, `refunded`).
     - `Booking` is the authoritative record of reservation and inventory state (`held`, `confirmed`, `expired`, `cancelled`, `checked_in`, `checked_out`).
     - A booking transitions from `held` -> `confirmed` **strictly** inside `confirm_booking_after_verified_payment` when cryptographic signatures and monetary amounts are validated.
  2. **Webhook Idempotency & Concurrency Hardening**:
     - Webhook verification computes HMAC-SHA256 signature against `RAZORPAY_WEBHOOK_SECRET` over the raw request body before parsing.
     - `process_razorpay_webhook_event` locks `WebhookEventLog` using `select_for_update()`, deduplicating repeated webhook deliveries and returning `already_processed` cleanly.
     - Handles `order.paid` and `payment.captured` idempotently without duplicate audit log entries or side-effects.
  3. **Direct Verification & Webhook Race Resolution**:
     - Both verification endpoints execute with `select_for_update()` row locks on `PaymentOrder`, `Booking`, and `RoomCategory`.
     - Whichever transaction commits first transitions the booking to `confirmed`; the concurrent or subsequent verification returns `already_confirmed: True` with HTTP 200.
  4. **Hold Expiry Boundary Invariance**:
     - Both direct verification and webhooks re-evaluate `hold_expires_at <= timezone.now()` prior to confirmation.
     - Payments arriving after hold expiration transition the booking to `expired` and are rejected, preventing overbooking or invalid confirmation of released inventory.
  5. **Payment Retry Support**:
     - When an initial payment attempt fails (`handle_failed_payment`), `PaymentOrder.status = 'failed'` is recorded with error details, while the booking remains in `held` status (if within the 15-minute window).
     - Retrying with a valid payment under the same gateway order transitions `PaymentOrder` from `failed` -> `captured` and confirms the reservation.
  6. **Payment Reconciliation Engine (`PaymentReconciliationService`)**:
     - Inspects payment and booking states to detect anomalies (captured order on held booking, confirmed booking with unpaid order, stale created orders on expired bookings).
     - Non-destructive: auto-resolves safe unambiguous states (auto-confirms held bookings if hold is active; cancels stale orders on expired bookings).
     - Flags ambiguous discrepancies (such as payments captured on expired holds) with `DISCREPANCY_EXPIRED_HOLD_CAPTURED` and audit logs for administrative staff review without dangerous blind mutations.
     - Provides staff/admin API `POST /api/v1/payments/reconcile/`.
  7. **Sanitized Payment Visibility**:
     - Customer serializers expose `payment_status` (`unpaid`, `advance_paid`, `failed`).
     - Staff serializers expose read-only `payment_orders` without leaking gateway secrets.
- **Consequences**: Rock-solid resilience against payment retries, network race conditions, and webhook replays; full auditability of financial lifecycle events; zero security exposure.

---

## ADR 22: Operational Reporting Architecture & Server-Side Metrics Aggregation
- **Status**: Approved.
- **Context**: Phase 6 introduces an enterprise-grade operational and financial reporting suite for hotel managers and super administrators, providing real-time visibility into bookings, physical room occupancy, category RevPAR/ADR performance, revenue breakdowns, payment gateway statuses, front-desk manifests, physical room utilization, overbooking audit trails, and payment discrepancies.
- **Decision**:
  1. **Strict Read-Only Guarantee**:
     - All reporting endpoints (`/api/v1/admin/reports/*`) are strictly queries (`GET`) and never mutate reservations, inventory, pricing, or payment states.
  2. **Authoritative Relational Data Sources**:
     - Historical booking financials are sourced strictly from immutable `BookingPriceSnapshot` records.
     - Physical room inventory and occupancy calculations query `PhysicalRoom`, `BookingRoom`, `RoomBlock`, and `MaintenanceBlock` across discrete nightly intervals `[check_in, check_out)`.
     - Payment statistics are derived exclusively from `PaymentOrder` records.
     - Overbooking and reconciliation discrepancies query authoritative `AuditLog` events.
  3. **Role-Based Access Control (RBAC)**:
     - `SUPER_ADMIN` and `MANAGER`: Full access to all 11 reports including revenue, payments, overbookings, and reconciliation.
     - `RECEPTIONIST`: Restricted strictly to operational front-desk tools (`overview`, `frontdesk`, `occupancy`, `bookings`, `rooms_utilization`), with HTTP 403 Forbidden enforced on financial and reconciliation endpoints.
     - Public/Customer: Denied access (HTTP 401/403).
  4. **Performance & Aggregation**:
     - Leverages database aggregations (`Sum`, `Count`, `Avg`, `Q` filtering) and bulk interval evaluations to avoid N+1 queries.
     - Strict date boundary validation (`from_date <= to_date`, max 366 days window).
  5. **Sanitization & Privacy**:
     - Sensitive credentials (Razorpay API keys/secrets, webhook secrets, guest Aadhaar/Govt IDs, access tokens) are strictly excluded from report payloads.
- **Consequences**: Fast, reliable, and secure operational reporting; complete clarity on hotel financial health; full alignment with backend sources of truth without data drift.
