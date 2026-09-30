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



