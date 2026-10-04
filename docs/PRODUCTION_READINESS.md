# Manohar Grand Hotel — Production Readiness & Deployment Architecture

## 1. System Overview & Architecture Freeze

The **Manohar Grand Hotel Direct Booking Platform** has completed full implementation across Phases 1 through 7 and is officially **architecture-frozen** for production deployment.

### System Architecture
```
┌────────────────────────────────────────────────────────┐
│               Frontend Single Page Application          │
│               React 18 + TypeScript + Vite             │
│               Port: 5173 (Dev) / Static CDN (Prod)     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (credentials: 'include')
                           │ CSRF Token Header + Session Cookie
                           ▼
┌────────────────────────────────────────────────────────┐
│               Reverse Proxy & Load Balancer            │
│               Nginx / AWS ALB / Cloudflare             │
│               (Terminates SSL, Passes X-Forwarded-Proto)│
└──────────────────────────┬─────────────────────────────┘
                           │ WSGI / Gunicorn
                           ▼
┌────────────────────────────────────────────────────────┐
│               Django 5.2 REST API Server               │
│  - Authentication & Google OAuth (django-allauth)      │
│  - Authoritative Pricing & Availability Engine         │
│  - Transactional Hold & Concurrency Manager            │
│  - Razorpay Verification & Webhook Ingestion Engine    │
│  - Read-Only Admin Reporting & Analytics Engine        │
└──────────────────────────┬─────────────────────────────┘
                           │ PostgreSQL Connection Pool (Port 5432)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Authoritative PostgreSQL 16+ DB          │
│  - 28 Physical Units Baseline (18 AC, 10 Non-AC)       │
│  - Immutable BookingPriceSnapshot Ledger               │
│  - ACID Row-Level Locks (`select_for_update`)          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variables Specification

Production deployments must define the following environment variables. **No default placeholder credentials must ever be used in live environments.**

| Variable | Type | Example / Format | Required | Description |
| :--- | :--- | :--- | :---: | :--- |
| `DJANGO_SETTINGS_MODULE` | string | `manohar_grand.settings.production` | **Yes** | Active Django settings module for production. |
| `DJANGO_SECRET_KEY` | string | `50+ character high-entropy random string` | **Yes** | Cryptographic secret for signing sessions and tokens. |
| `DEBUG` | boolean | `False` | **Yes** | Disables tracebacks, test endpoints, and debug bars. |
| `ALLOWED_HOSTS` | csv | `manohargrand.com,api.manohargrand.com` | **Yes** | Whitelisted HTTP Host header hostnames. |
| `FRONTEND_URL` | url | `https://manohargrand.com` | **Yes** | Origin URL for OAuth callbacks and redirects. |
| `BACKEND_URL` | url | `https://api.manohargrand.com` | **Yes** | Base API domain URL. |
| `CORS_ALLOWED_ORIGINS` | csv | `https://manohargrand.com` | **Yes** | Whitelisted origins permitted for CORS requests. |
| `CSRF_TRUSTED_ORIGINS` | csv | `https://manohargrand.com,https://api.manohargrand.com` | **Yes** | Whitelisted origins permitted for state-changing CSRF requests. |
| `DATABASE_URL` | url | `postgresql://user:pass@db-host:5432/manohar_grand_prod` | **Yes** | Production PostgreSQL 16+ connection URI. |
| `DB_CONN_MAX_AGE` | int | `600` | No | Database connection pooling lifetime (seconds). |
| `GOOGLE_CLIENT_ID` | string | `*.apps.googleusercontent.com` | **Yes** | Google Cloud OAuth 2.0 Web Client ID. |
| `GOOGLE_CLIENT_SECRET` | string | `Secret key from Google Cloud Console` | **Yes** | Google OAuth client secret. |
| `RAZORPAY_KEY_ID` | string | `rzp_live_*` (or `rzp_test_*` for UAT) | **Yes** | Public key identifier for Razorpay Checkout JS. |
| `RAZORPAY_KEY_SECRET` | string | `Razorpay Key Secret` | **Yes** | Backend secret for HMAC-SHA256 signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | string | `Webhook Signing Secret` | **Yes** | Secret for verifying incoming Razorpay webhook events. |
| `RAZORPAY_CURRENCY` | string | `INR` | No | Default transaction currency (default: `INR`). |
| `SECURE_SSL_REDIRECT` | boolean | `True` | No | Enforces automatic HTTP -> HTTPS redirection. |
| `SECURE_HSTS_SECONDS` | int | `31536000` | No | Strict Transport Security duration (1 year). |

---

## 3. Database Architecture & PostgreSQL Requirements

1. **PostgreSQL 16+ as Sole Source of Truth**:
   - Production relies on PostgreSQL row-level locking (`select_for_update()`) on `Booking`, `RoomCategory`, `PaymentOrder`, and `WebhookEventLog` to guarantee zero double-bookings or concurrent payment confirmations.
2. **Migration Runbook**:
   ```bash
   python manage.py migrate --noinput
   ```
3. **Master Data Seeding**:
   ```bash
   python manage.py seed_phase2_master_data
   ```
   *Idempotently provisions the 2 Room Categories (AC Room, Non-AC Room), 28 Physical Units, 8 Curated Property Amenities, and Standard Rate Plans without creating duplicate records.*

---

## 4. Razorpay Gateway & Webhook Deployment Runbook

1. **Webhook URL Endpoint**:
   ```
   POST https://api.manohargrand.com/api/v1/payments/webhook/razorpay/
   ```
2. **Subscribed Events in Razorpay Dashboard**:
   - `payment.captured`
   - `order.paid`
   - `payment.failed`
3. **Webhook Secret**:
   - Configure the exact secret in Razorpay Dashboard Webhooks and supply via `RAZORPAY_WEBHOOK_SECRET`.
4. **Idempotency & Race Handling**:
   - All webhook deliveries are idempotently recorded in `WebhookEventLog`.
   - Simultaneous direct verification and webhook confirmation resolve safely using row-level database locks.

---

## 5. Security & RBAC Enforcement Summary

| Capability | Public / Guest | Customer | Receptionist | Manager | Super Administrator |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Browse Rooms, Amenities, CMS Content | Allowed | Allowed | Allowed | Allowed | Allowed |
| Check Real-Time Availability & Pricing | Allowed | Allowed | Allowed | Allowed | Allowed |
| Create 15-Min Temporary Hold | Login Req | Allowed | Allowed | Allowed | Allowed |
| Checkout & Razorpay 50% Advance | Login Req | Own Only | Allowed | Allowed | Allowed |
| Manage Account & Guest Manifest | Denied | Own Only | Allowed | Allowed | Allowed |
| Front Desk Check-in / Check-out | Denied | Denied | Allowed | Allowed | Allowed |
| Room Assignment & Walk-in Bookings | Denied | Denied | Allowed | Allowed | Allowed |
| Operational Reports (Overview, Frontdesk, Occupancy) | Denied | Denied | Allowed | Allowed | Allowed |
| Financial Reports (Revenue, Payments, Sources) | Denied | Denied | Denied | Allowed | Allowed |
| State Reconciliation & Overbooking Audit | Denied | Denied | Denied | Allowed | Allowed |
| Rate Plan & Tax Rule Modification | Denied | Denied | Denied | Denied | Allowed |
| SuperAdmin Overbooking Overrides | Denied | Denied | Denied | Denied | Allowed |

---

## 6. Pre-Flight Production Checklist

- [x] `DEBUG = False` verified in production settings.
- [x] `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True`.
- [x] `SameSite = 'Lax'` on session and CSRF cookies.
- [x] CORS restricted to explicit `CORS_ALLOWED_ORIGINS` (zero wildcard origins).
- [x] Unhandled exceptions return sanitized JSON without exposing stack traces.
- [x] Database migrations verified with zero pending changes (`python manage.py makemigrations --check`).
- [x] Static assets built cleanly via Vite (`npm run build`).
- [x] Verified zero secrets or private API credentials committed in Git.
- [x] Corporate / Bulk booking page configured as an inquiry and contact channel.
- [x] Immutable `BookingPriceSnapshot` preserves historical booking values.
