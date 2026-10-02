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







