# Frontend-Backend Integration & Real Razorpay Checkout Guide

This document defines the comprehensive contract, lifecycle sequences, and security rules governing the end-to-end customer booking flow, Django session authentication, dynamic pricing, room availability, and Razorpay Checkout integration for the **Manohar Grand Hotel Booking Platform**.

---

## 1. End-to-End Customer Booking Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React Frontend (Vite)
    participant Django as Django Backend (/api/v1/)
    participant RZP as Razorpay Gateway

    Customer->>Frontend: Access /rooms or /booking
    Frontend->>Django: GET /api/v1/availability/search/?check_in=...&check_out=...&rooms=...
    Django-->>Frontend: Real-time Category Availability & Capacities
    Customer->>Frontend: Select Room Category & Quantity
    Customer->>Frontend: Click "Proceed to Checkout"
    
    alt Unauthenticated
        Frontend->>Frontend: Redirect to /account/login?redirect=/checkout
        Customer->>Frontend: Click "Continue with Google"
        Frontend->>Django: /accounts/google/login/ (OAuth Authorization Code)
        Django-->>Frontend: Redirect /auth/callback & set sessionid cookie
    end

    Frontend->>Django: POST /api/v1/bookings/hold/ (Credentials: include, CSRF Token)
    Note over Django: Lock inventory, calculate BookingPriceSnapshot, create 15-min hold
    Django-->>Frontend: 201 Created (booking_reference, access_token, hold_expires_at)
    
    Frontend->>Frontend: Navigate to /checkout?ref={booking_reference}
    Frontend->>Django: GET /api/v1/bookings/{ref}/checkout/
    Django-->>Frontend: Authoritative Pre-Payment Summary & 15-min Countdown
    
    Customer->>Frontend: Complete/Review Lead Guest Details
    Frontend->>Django: PATCH /api/v1/bookings/{ref}/ (guest info update)
    Django-->>Frontend: 200 OK (Updated Guest Details)
    
    Customer->>Frontend: Click "Pay ₹X Advance"
    Frontend->>Django: POST /api/v1/payments/orders/ (booking_reference)
    Django->>RZP: client.order.create(amount_paise, INR, receipt)
    RZP-->>Django: razorpay_order_id
    Django-->>Frontend: 201 Created (razorpay_order_id, razorpay_key_id, amount_paise)
    
    Frontend->>RZP: Razorpay(options).open() (standard checkout.js modal)
    Customer->>RZP: Complete Test Payment (UPI / Card / NetBanking)
    RZP-->>Frontend: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    
    Frontend->>Django: POST /api/v1/payments/verify/ (Signature, Order ID, Payment ID)
    Note over Django: HMAC-SHA256 verification, lock rows, mark CAPTURED, CONFIRM booking
    Django-->>Frontend: 200 OK (booking_status: 'confirmed', advance_paid, balance_due)
    
    Frontend->>Frontend: Navigate to /booking/confirmation/{booking_reference}
    Frontend->>Django: GET /api/v1/bookings/{ref}/
    Django-->>Frontend: Official Confirmed Voucher Details
```

---

## 2. API Endpoint Catalog & Request/Response Contracts

All API requests from the frontend must include:
- `credentials: "include"` (ensures Django `sessionid` cookie is transmitted).
- Header `X-CSRFToken: <csrftoken_cookie>` on unsafe HTTP methods (`POST`, `PATCH`, `PUT`, `DELETE`).

### 2.1 Room Categories (`GET /api/v1/rooms/categories/`)
- **Method**: `GET`
- **Auth**: Public (`AllowAny`)
- **Query Params**: None
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "784b1a43-6c70-4fc7-b3f4-3d6a9a08e123",
      "slug": "deluxe-ac-room",
      "name": "Deluxe AC Room",
      "tagline": "Climate-controlled comfort in Kukatpally",
      "description": "Spacious AC room with Wakefit memory foam bedding...",
      "included_adults": 2,
      "included_children": 0,
      "max_adults": 4,
      "max_children": 2,
      "max_total_occupancy": 4,
      "active_physical_room_count": 20,
      "total_physical_room_count": 20,
      "primary_image": "http://localhost:8000/media/rooms/ac-deluxe.jpg",
      "images": [],
      "amenities": [],
      "base_price_per_night": "1599.00",
      "currency": "INR"
    }
  ]
}
```

---

### 2.2 Availability Search (`GET /api/v1/availability/search/`)
- **Method**: `GET`
- **Auth**: Public (`AllowAny`)
- **Query Params**:
  - `check_in` (required, `YYYY-MM-DD`)
  - `check_out` (required, `YYYY-MM-DD`)
  - `rooms` (optional, integer, default 1)
  - `adults` (optional, integer, default 1)
  - `children` (optional, integer, default 0)
- **Response**:
```json
{
  "success": true,
  "data": {
    "check_in": "2026-10-15",
    "check_out": "2026-10-17",
    "nights_count": 2,
    "stay_nights": ["2026-10-15", "2026-10-16"],
    "requested_quantity": 1,
    "categories": [
      {
        "category_id": "784b1a43-6c70-4fc7-b3f4-3d6a9a08e123",
        "category_slug": "deluxe-ac-room",
        "category_name": "Deluxe AC Room",
        "is_active": true,
        "total_operational_capacity": 20,
        "minimum_available_rooms": 19,
        "requested_quantity": 1,
        "is_available": true,
        "nightly_availability": [
          {
            "date": "2026-10-15",
            "total_operational": 20,
            "blocked_rooms": 0,
            "booked_rooms": 1,
            "available_rooms": 19
          }
        ]
      }
    ]
  }
}
```

---

### 2.3 Create Booking Hold (`POST /api/v1/bookings/hold/`)
- **Method**: `POST`
- **Auth**: Public (`AllowAny`, associates `request.user` if authenticated)
- **CSRF**: Required (`X-CSRFToken`)
- **Payload**:
```json
{
  "check_in": "2026-10-15",
  "check_out": "2026-10-17",
  "rooms": [
    {
      "category_id": "784b1a43-6c70-4fc7-b3f4-3d6a9a08e123",
      "room_quantity": 1
    }
  ],
  "guest_name": "Alice Sharma",
  "guest_phone": "9876543210",
  "guest_email": "alice@example.com",
  "total_adults": 2,
  "total_children": 0,
  "special_requests": "Ground floor preferred",
  "source": "website"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "9921b7c1-...",
    "booking_reference": "MG-2026-X8K9M",
    "access_token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "held",
    "status_display": "Held",
    "is_hold_valid": true,
    "hold_expires_at": "2026-10-03T15:45:00.000000Z",
    "check_in_date": "2026-10-15",
    "check_out_date": "2026-10-17",
    "nights_count": 2,
    "total_adults": 2,
    "total_children": 0,
    "total_rooms_count": 1,
    "guest_name": "Alice Sharma",
    "rooms": [...],
    "pricing": {
      "gross_total": "3357.90",
      "advance_amount_due": "1678.95",
      "balance_amount_due": "1678.95"
    }
  }
}
```

---

### 2.4 Checkout Summary (`GET /api/v1/bookings/{booking_reference}/checkout/`)
- **Method**: `GET`
- **Auth**: Authenticated Customer / Staff / Access Token (`?token=`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "booking_reference": "MG-2026-X8K9M",
    "status": "held",
    "status_display": "Held",
    "is_hold_valid": true,
    "hold_expires_at": "2026-10-03T15:45:00.000000Z",
    "check_in_date": "2026-10-15",
    "check_out_date": "2026-10-17",
    "nights_count": 2,
    "total_adults": 2,
    "total_children": 0,
    "total_rooms_count": 1,
    "guest_name": "Alice Sharma",
    "rooms": [...],
    "pricing": {
      "room_subtotal": "3198.00",
      "extra_guest_total": "0.00",
      "taxable_subtotal": "3198.00",
      "tax_rule_name": "GST 5%",
      "tax_rate_percent": "5.00",
      "tax_amount": "159.90",
      "gross_total": "3357.90",
      "advance_amount_due": "1678.95",
      "balance_amount_due": "1678.95"
    },
    "cancellation_policy": "Confirmed direct reservations are non-refundable.",
    "hotel_info": {
      "hotel_name": "Hotel Manohar Grand",
      "check_in_time": "12:00:00",
      "check_out_time": "11:00:00"
    }
  }
}
```

---

### 2.5 Razorpay Payment Order Creation (`POST /api/v1/payments/orders/`)
- **Method**: `POST`
- **Auth**: Authenticated Customer / Staff / Access Token
- **CSRF**: Required (`X-CSRFToken`)
- **Payload**:
```json
{
  "booking_reference": "MG-2026-X8K9M",
  "idempotency_key": "fe_1727970000_abc123"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "booking_reference": "MG-2026-X8K9M",
    "payment_id": "c1f7535b-1234-4567-89ab-cdef01234567",
    "razorpay_order_id": "order_Rz9876543210ab",
    "razorpay_key_id": "rzp_test_XXXXXXXXXXXXXX",
    "amount": 167895,
    "amount_inr": "1678.95",
    "currency": "INR",
    "purpose": "advance",
    "status": "created"
  }
}
```

---

### 2.6 Razorpay Payment Verification (`POST /api/v1/payments/verify/`)
- **Method**: `POST`
- **Auth**: Authenticated Customer / Staff / Access Token
- **CSRF**: Required (`X-CSRFToken`)
- **Payload**:
```json
{
  "razorpay_order_id": "order_Rz9876543210ab",
  "razorpay_payment_id": "pay_RzABC123456789",
  "razorpay_signature": "0123456789abcdef0123456789abcdef..."
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "booking_reference": "MG-2026-X8K9M",
    "booking_status": "confirmed",
    "payment_status": "captured",
    "payment_id": "c1f7535b-1234-4567-89ab-cdef01234567",
    "razorpay_order_id": "order_Rz9876543210ab",
    "razorpay_payment_id": "pay_RzABC123456789",
    "advance_amount": "1678.95",
    "balance_amount": "1678.95",
    "currency": "INR",
    "confirmed_at": "2026-10-03T15:46:20.000000Z"
  },
  "meta": {
    "already_confirmed": false
  }
}
```

---

## 3. Security & Financial Invariants

1. **Backend as Sole Financial Authority**: The frontend NEVER submits or alters monetary values. The payable advance amount (`advance_amount_due * 100` paise) is strictly derived from the immutable `BookingPriceSnapshot`.
2. **Session Security**: Authentication is managed solely through HTTP-only Django session cookies (`sessionid`). No JWT or localStorage tokens are used.
3. **Double Submission Prevention**: The "Pay Advance" CTA is immediately disabled upon click, and an `idempotency_key` is passed to ensure network retries return the existing `PaymentOrder`.
4. **Hold Invariance**: If a hold expires (`hold_expires_at <= now`), payment order generation and payment verification will reject with `HOLD_EXPIRED`. The client UI displays a prominent hold countdown.
5. **No Secrets on Frontend**: `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly server-side. The frontend only receives the public `razorpay_key_id`.

---

## 4. Local Environment Configuration

### Frontend (`.env` or `.env.local`)
```bash
VITE_BACKEND_URL=http://localhost:8000
```

### Backend (`.env` or environment variables)
```bash
DJANGO_SECRET_KEY=your-secure-django-key
DJANGO_DEBUG=True
DATABASE_URL=postgres://manohar_user:password@localhost:5432/manohar_grand
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```
