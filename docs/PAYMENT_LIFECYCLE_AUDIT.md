# Manohar Grand - Payment Lifecycle Audit & Hardening Analysis

## 1. Executive Summary

This document audits the Manohar Grand payment infrastructure following Phase 5 Steps 1–3. It reviews the lifecycle transitions across `Booking`, `PaymentOrder`, and `WebhookEventLog`, documents existing concurrency and idempotency protections, identifies edge cases and failure modes, and outlines hardening improvements implemented in Phase 5 Step 4.

---

## 2. Current State Machine & Lifecycles

### A. PaymentOrder Lifecycle
```
                 ┌───────────────┐
                 │    created    │
                 └───────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
 │ authorized  │  │   captured  │  │    failed   │
 └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
        │                │                │
        │                │                ▼ (retry)
        │                │         ┌─────────────┐
        ▼                │         │  captured   │
 ┌─────────────┐         │         └─────────────┘
 │   captured  │         │
 └─────────────┘         ▼
                  ┌─────────────┐
                  │  refunded / │
                  │  partially  │
                  └─────────────┘
```

### B. Booking Lifecycle
```
                 ┌───────────────┐
                 │     held      │ (15-min hold)
                 └───────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                                 ▼
 ┌─────────────┐                   ┌─────────────┐
 │  confirmed  │                   │   expired   │
 └──────┬──────┘                   └─────────────┘
        │
 ┌──────┴──────┬──────────────┬──────────────┐
 ▼             ▼              ▼              ▼
checked_in   checked_out   cancelled      no_show
```

### C. Relationship Between Payment & Booking
- `PaymentOrder` is the authoritative record of gateway transactions.
- `Booking` is the authoritative record of reservation and inventory state.
- **Rule:** A `PaymentOrder.status == 'captured'` triggers `Booking.status == 'confirmed'` **only** when verified through the central atomic service `confirm_booking_after_verified_payment`.
- Payment order creation (`POST /api/v1/payments/orders/`) **never** confirms a booking; the booking remains `held`.

---

## 3. Existing Protections (Audit)

1. **Server-Side Authoritative Pricing:**
   - Client requests never supply price or currency.
   - Payable advance is read directly from `BookingPriceSnapshot.advance_amount_due`.
2. **Cryptographic Verification:**
   - Direct verification computes HMAC-SHA256 signature against `RAZORPAY_KEY_SECRET`.
   - Webhook verification computes HMAC-SHA256 signature against `RAZORPAY_WEBHOOK_SECRET` on the raw request body.
3. **Database Concurrency & Row Locking:**
   - `confirm_booking_after_verified_payment` executes inside an `@transaction.atomic` block with `select_for_update()` on `PaymentOrder`, `Booking`, and associated `RoomCategory` rows.
4. **Idempotency Safeguards:**
   - `PaymentOrder` creation reuses existing active `created` orders.
   - Direct verification returns `already_confirmed: True` without repeating side effects.
   - `WebhookEventLog` enforces unique `(provider, event_id)`.
5. **Ownership & Access Control:**
   - Customer authorization is strictly verified against `booking.customer` or `booking.access_token`.

---

## 4. Identified Gaps & Hardening Scope

| Area | Potential Risk / Edge Case | Hardening Solution |
| :--- | :--- | :--- |
| **Webhook Race Condition** | Concurrent webhooks for the same `event_id` could race on initial log creation. | Use database transaction with `select_for_update()` on `WebhookEventLog` and handle `IntegrityError` safely. |
| **Webhook Multi-Event Ordering** | `payment.captured` followed by `order.paid` (or vice-versa) arriving with different `event_id`s. | `confirm_booking_after_verified_payment` handles both gracefully with idempotent `already_confirmed: True`. |
| **Payment Retry After Failure** | Customer payment fails once (`PaymentOrder.status = 'failed'`), but succeeds on second attempt within same Razorpay order. | Allow transitioning `PaymentOrder` from `failed` -> `captured` if hold is still valid and signature is cryptographically verified. |
| **Hold Expiration Boundary** | Payment verified after hold timestamp has elapsed. | Strict hold expiration check in `confirm_booking_after_verified_payment` transitions booking to `expired` and rejects confirmation. |
| **State Discrepancy / Reconciliation** | Asynchronous network drop between Razorpay capture and local webhook delivery. | Implement `PaymentReconciliationService` to detect inconsistent states (`captured` payment + `held` booking, stale `created` orders) and resolve or flag for review. |
| **Admin & Customer Visibility** | Need safe, read-only representation of payment status on booking detail endpoints. | Expose `payment_status` and sanitized payment summaries on customer and staff serializers without leaking gateway secrets. |
| **Audit Logging** | Complete lifecycle traceability for disputes and reconciliation. | Standardize `AuditLog` emissions across order creation, verification, webhooks, failure handling, and reconciliation. |

---

## 5. Files Affected

- `backend/apps/payments/models.py`: Model constraints and helper properties.
- `backend/apps/payments/services.py`: Hardened webhook processing, `confirm_booking_after_verified_payment`, `handle_failed_payment`, and `PaymentReconciliationService`.
- `backend/apps/payments/views.py`: Admin reconciliation endpoint and error responses.
- `backend/apps/payments/serializers.py`: Staff payment order summary and reconciliation serializers.
- `backend/apps/bookings/serializers.py`: Added safe `payment_status` and staff payment order summaries.
- `backend/apps/payments/tests/`: Comprehensive test suite covering webhooks, retries, race conditions, hold boundaries, and reconciliation.
- `docs/DECISIONS.md`: ADR 21 recording payment lifecycle hardening decisions.
