# Blast SQL Learning Platform

A POC educational platform for teaching SQL interactively. Hosted on NAS with Cloudflare Tunnel at `school.blastgroup.org`.

## Architecture

- **Frontend**: React + Vite, Monaco SQL editor, served by Nginx
- **Backend**: FastAPI, in-memory DuckDB per session
- **Auth/Entitlement DB**: SQLite (`backend/data/users.db`) with purchases/access grants
- **Billing**: Stripe embedded Checkout (Blast page) + hosted fallback + webhook confirmation
- **Content**: JSON/YAML lesson files (no CMS)

## Quick Start

### Local development

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m playwright install chromium
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://localhost:8000`.

Copy env template and fill Stripe keys:

```bash
cp .env.example .env
```

Required billing vars:

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID=price_xxx
CHECKOUT_SUCCESS_URL=http://localhost/checkout/success
CHECKOUT_CANCEL_URL=http://localhost/checkout/cancelled
CHECKOUT_RETURN_URL=http://localhost/checkout/success
CPF_ENCRYPTION_KEY=replace-with-strong-random-secret
CHECKOUT_SIGNUP_INTENT_TTL_HOURS=24
```

Use the same key for `STRIPE_PUBLISHABLE_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`.
`VITE_STRIPE_PUBLISHABLE_KEY` is build-time and allows Stripe JS to warm up earlier on `/checkout`.

Optional billing vars:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES=card,pix
STRIPE_CHECKOUT_LOCALE=pt-BR
STRIPE_CARD_INSTALLMENTS_ENABLED=1
STRIPE_WEBHOOK_FORWARD_EVENTS=checkout.session.completed,payment_intent.succeeded,charge.refunded,customer.subscription.deleted,charge.dispute.created
STRIPE_AUTOMATIC_TAX_ENABLED=0
BILLING_COURSE_ID=sql-basics
ACCESS_DURATION_MONTHS=6
REFUND_WINDOW_DAYS=14
```

`REFUND_WINDOW_DAYS` (default 14): number of days after purchase during which users can request a refund from the My Account page. Outside this window, refunds must be handled via support.

### Master Challenge PDF renderer

Frontend flag:

```bash
VITE_MASTER_CHALLENGE_PDF_RENDERER=playwright_v2  # default
# or
VITE_MASTER_CHALLENGE_PDF_RENDERER=legacy_canvas
```

Backend PDF settings (optional):

```bash
PDF_RENDER_TIMEOUT_MS=45000
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=
PLAYWRIGHT_CHROMIUM_ARGS=--disable-dev-shm-usage,--no-sandbox
```

### Authentication bootstrap

The platform now includes a local user database (SQLite) and login flow.

You can create the first admin user by setting these env vars before starting backend:

```bash
INITIAL_ADMIN_EMAIL=admin@blastgroup.org
INITIAL_ADMIN_PASSWORD=change-me-please
```

A `users.db` file is created at `backend/data/users.db` (or `USER_DB_PATH`).

### Password reset (Resend)

Forgot-password and reset-password flows use Resend for transactional emails.

Required for password reset emails:

```bash
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
APP_BASE_URL=http://localhost:5173
```

Optional:

```bash
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
```

- `RESEND_API_KEY`: Resend API key (from Resend dashboard).
- `RESEND_FROM_EMAIL`: Verified sender address in Resend.
- `APP_BASE_URL`: Base URL of the frontend (used in reset links).
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`: Token expiry (default 60 minutes).

If `RESEND_API_KEY` is not set, the backend still returns success for forgot-password (no account enumeration) but does not send the email.

### Stripe checkout + entitlements (6 months)

Implemented endpoints:

- `POST /api/checkout/start` (public, email+password pre-checkout)
- `POST /api/billing/checkout-session` (auth required)
- `POST /api/billing/embedded-checkout-session` (auth required)
- `GET /api/billing/access-status` (auth required)
- `GET /api/account` (auth required) – account info, access status, refund eligibility
- `POST /api/account/refund` (auth required) – request refund for eligible purchase
- `POST /api/billing/stripe-webhook` (raw body + Stripe signature verification)

Behavior:

- Checkout creates an internal `purchases` row with `status=pending`.
- Stripe checkout session includes metadata: `purchase_id`, `user_id`, `course_id`.
- Public checkout start stores `checkout_signup_intents` with hashed password before redirecting to Stripe.
- Public hosted checkout asks for CPF via Stripe `custom_fields`.
- Real app user is created only after webhook confirms paid checkout for `checkout_intent_id`.
- Embedded checkout uses `ui_mode=embedded` and `allow_promotion_codes=true`.
- Coupon strategy at launch: Stripe Promotion Codes (single code per purchase).
- Access is granted only after webhook confirmation (`checkout.session.completed` with `payment_status=paid`).
- Entitlement expires exactly `paid_at + 6 months`.
- Refund event (`charge.refunded`) revokes access by expiring the active grant immediately and stores `stripe_refund_id` in purchases for audit.
- Handlers are idempotent (duplicate webhook deliveries do not create duplicate grants).

### Embedded checkout (Blast-branded) quick setup

Current UI path:

- User clicks `Comprar acesso (6 meses)` on home.
- Frontend routes to `/checkout` (Blast page).
- Frontend calls `POST /api/billing/embedded-checkout-session`.
- Stripe embedded module renders inside the Blast page.
- On completion, `/checkout/success` shows confirmation and redirects to `/login?payment=confirmed`.

### Public checkout start (signup + payment in one step)

Current guest path:

- User clicks `Comprar curso` on `/login`.
- Frontend routes to `/checkout/sql-zero-avancado`.
- User submits email + password to `POST /api/checkout/start`.
- Backend creates `checkout_signup_intent` (hashed password, TTL).
- If email already exists, start endpoint returns `409` and asks user to log in first.
- Backend creates hosted Stripe Checkout Session with:
  - `customer_email`
  - `allow_promotion_codes=true`
  - metadata `checkout_intent_id`, `course_id`
  - `custom_fields` for CPF collection
- On `checkout.session.completed` webhook:
  - backend verifies signature using raw body
  - creates user only then
  - stores encrypted CPF in `users.cpf_encrypted`
  - creates/marks purchase paid and grants 6-month access
- Success page redirects to `/login?payment=confirmed`.

Required env vars for embedded checkout:

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID=price_xxx
CHECKOUT_RETURN_URL=http://localhost/checkout/success
CHECKOUT_SUCCESS_URL=http://localhost/checkout/success
CHECKOUT_CANCEL_URL=http://localhost/checkout/cancelled
```

`POST /api/billing/checkout-session` remains available as hosted-checkout fallback.

### Coupons (launch behavior)

- Coupons are Stripe-native Promotion Codes.
- One promotion code per purchase (no stacking at launch).
- Embedded checkout enables code entry with `allow_promotion_codes=true`.
- Discount details are stored in `purchases.metadata` for reporting (`amount_discount`, promotion code IDs/codes when available).

### Docker auto webhook listener (no manual Stripe CLI needed)

When you run `docker-compose up -d`, a `stripe-listener` service starts automatically and:

1. runs `stripe listen` inside Docker,
2. forwards events to `http://backend:8000/billing/stripe-webhook`,
3. captures the runtime `whsec_...`,
4. writes it to `backend/data/stripe_webhook_secret.txt`.

The backend reads this file automatically via `STRIPE_WEBHOOK_SECRET_FILE`.

For this to work, set only:

```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID=price_xxx
CHECKOUT_SUCCESS_URL=http://localhost/checkout/success
CHECKOUT_CANCEL_URL=http://localhost/checkout/cancelled
CHECKOUT_RETURN_URL=http://localhost/checkout/success
```

Use `STRIPE_WEBHOOK_SECRET` only when you are configuring a fixed Dashboard endpoint secret.

### Stripe Dashboard setup (test mode)

1. Open Stripe Dashboard in **Test mode**.
2. Create one Product (example: `SQL do básico ao avançado`).
3. Create one Price for that product:
   - Type: one-time payment
   - Currency: BRL
4. Put this Price ID in `STRIPE_PRICE_ID`.
5. Enable payment methods in Dashboard:
   - Card
   - Pix (if your Stripe account supports Pix in your region/settings)
   - Keep your Price currency in BRL for Pix support
6. Enable coupons:
   - Create coupon + promotion code in Stripe Dashboard
   - Embedded checkout exposes "Adicionar codigo promocional" automatically
7. Configure webhook endpoint:
   - URL: `https://<your-domain>/api/billing/stripe-webhook`
   - Events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `charge.refunded`
     - `customer.subscription.deleted`
     - `charge.dispute.created`
8. Copy signing secret (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

If Pix does not appear in checkout:

1. confirm test/live mode in dashboard matches your API keys,
2. ensure the Stripe Price currency is `BRL`,
3. ensure Pix is enabled in Dashboard payment methods,
4. set `STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES=card,pix`,
5. restart backend after env changes.

Installments note:

- Backend now requests card installments via `payment_method_options.card.installments.enabled=true`.
- Availability is account/country/card-dependent; Stripe may still hide installments when unsupported.

### Local webhook testing with Stripe CLI

You can still run Stripe CLI manually if you are not using Docker.

1. Install and login Stripe CLI:

```bash
stripe login
```

2. Forward events to local backend:

```bash
stripe listen --forward-to localhost:8000/billing/stripe-webhook
```

3. Copy generated webhook secret from CLI output into `STRIPE_WEBHOOK_SECRET`.
4. Trigger or complete a test checkout payment.
5. Validate:
   - `purchases.status` transitions from `pending` to `paid`
   - `access_grants.expires_at` is set to `paid_at + 6 months`
   - Home/checkout success page reports `has_access=true`

### End-to-end test purchase (test mode)

1. Start stack:

```bash
docker-compose up -d --build
```

2. Open app at `http://localhost/login` and click `Comprar curso`.
3. On `/checkout/sql-zero-avancado`, submit email + password and continue to Stripe.
4. Complete payment with a Stripe test card:
   - card number: `4242 4242 4242 4242`
   - any future expiry/CVC/ZIP
5. Optional coupon test:
   - create a Promotion Code in Stripe Dashboard (test mode),
   - apply it in checkout via `Adicionar codigo promocional`.
6. Confirm backend logs receive:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (may arrive before/after)
7. Confirm webhook effects:
   - user created only after webhook
   - `users.cpf_encrypted` populated
   - `purchases.status=paid`
   - `access_grants.expires_at=paid_at + 6 months`
8. Success page redirects to `/login?payment=confirmed`.

### My Account (refund/cancellation)

- **Route**: `/account`
- **Display**: user identity, access status (Ativo / Expirado / Reembolsado), expiration date, purchase date.
- **Refund button**: shown when `eligible_for_refund` is true (status=paid, within `REFUND_WINDOW_DAYS`, has `stripe_payment_intent_id`).
- **Flow**: user clicks "Cancelar compra (reembolso)", confirms in modal with optional reason, backend creates Stripe refund via `stripe.Refund.create(payment_intent=...)`, then updates purchase and revokes access.
- **Webhook sync**: `charge.refunded` updates purchase status and revokes access even when refund is initiated from Stripe Dashboard.
- **Migrations/runtime bootstrap**: colunas `stripe_refund_id` e `refund_reason` em `purchases` sao garantidas pelo bootstrap de schema (`init_user_db`).

### Admin Backoffice

- **Routes UI**:
  - `/admin` (dashboard)
  - `/admin/users` (table com busca, filtros, ordenacao e paginacao)
  - `/admin/users/new` (cadastro manual de usuario)
  - `/admin/users/:id` (detalhes, progresso, atividade, acoes)
- **API**:
  - `GET /api/admin/stats`
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `GET /api/admin/users/:id`
  - `PATCH /api/admin/users/:id`
  - `PATCH /api/admin/users/:id/progress`
  - `POST /api/admin/users/:id/refresh-stripe`
  - `POST /api/admin/impersonate`
  - `POST /api/admin/impersonate/stop`
- **Autorizacao**:
  - backend exige `role=admin` em todas as rotas de administracao, incluindo criacao de usuario e edicao de progresso
  - frontend exibe menu "Admin" apenas para usuarios admin
- **Status de acesso**:
  - persistidos no usuario: `active`, `expired`, `refunded`, `canceled`, `blocked`, `manual_grant`
  - acesso ao curso so e permitido para `active` e `manual_grant` com `expires_at` valido
- **Override manual x webhook**:
  - mudancas manuais no admin marcam `access_managed_by=admin`
  - webhooks Stripe continuam atualizando dados de compra, mas nao sobrescrevem acesso manual
  - `refresh-stripe` pode sincronizar estado e informa quando override foi preservado
- **Auditoria**:
  - toda alteracao sensivel gera registro em `admin_audit_logs` com before/after e motivo quando aplicavel
  - eventos cobertos: `user_created`, `entitlement_created`, `entitlement_updated`, `progress_updated`, `impersonation_started`, `impersonation_stopped`
- **Impersonacao segura**:
  - sessao curta (configuravel por `IMPERSONATION_TTL_MINUTES`, default 30, clamp 15-60)
  - banner global indicando usuario impersonado + acao de encerramento
  - encerramento invalida token de impersonacao e retorna novo token admin emitido pelo servidor
  - detalhes do modelo em `docs/security/ADMIN_IMPERSONATION_SECURITY.md`
- **Rate limit**:
  - endpoints admin usam janela fixa em memoria (process-local), com `429` em excesso
- **Bootstrap de admin**:
  - `INITIAL_ADMIN_EMAIL` + `INITIAL_ADMIN_PASSWORD` criam o primeiro admin quando base esta vazia
  - quando a base ja existe, `INITIAL_ADMIN_EMAIL` e promovido para `role=admin` automaticamente se encontrado

### Manual regression checklist

1. New user purchase:
   - start at `/checkout/sql-zero-avancado`
   - submit new email+password
   - pay in Stripe test mode
   - confirm user is created only after webhook and access is granted.
2. Abandoned checkout:
   - start checkout, do not pay
   - wait past TTL (`CHECKOUT_SIGNUP_INTENT_TTL_HOURS`)
   - confirm intent status can become `expired`.
3. Webhook retry/idempotency:
   - replay same `checkout.session.completed`
   - confirm no duplicate user, purchase, or extra grant rows.
4. Existing email scenario:
   - call `POST /api/checkout/start` using an existing account email
   - expect `409` with login guidance.
5. CPF capture:
   - complete checkout with CPF in Stripe field
   - verify CPF is normalized then encrypted into `users.cpf_encrypted`.

### Database migrations

SQL migrations/examples are in:

- `backend/migrations/001_billing_stripe_sqlite.sql`
- `backend/migrations/001_billing_stripe_postgres.sql`
- `backend/migrations/002_checkout_signup_intents_sqlite.sql`
- `backend/migrations/002_checkout_signup_intents_postgres.sql`
- `backend/migrations/003_admin_backoffice_sqlite.sql`
- `backend/migrations/003_admin_backoffice_postgres.sql`
- `backend/migrations/004_password_reset_tokens_sqlite.sql`
- `backend/migrations/004_password_reset_tokens_postgres.sql`
- `backend/migrations/005_admin_impersonation_sqlite.sql`
- `backend/migrations/005_admin_impersonation_postgres.sql`

Runtime DB bootstrap for SQLite is also handled automatically in `init_user_db()`.

### Docker

```bash
docker-compose up -d
```

- Frontend: http://localhost (port 80)
- Backend: internal only (port 8000)
- API: http://localhost/api/* proxied to backend

### Tests

```bash
cd backend
pytest tests/ -v
```

Set `USER_DB_PATH` to a temp file for isolated test runs, e.g. `USER_DB_PATH=$TEMP/blast_sql_test.db pytest tests/ -v`.

### PT-BR content integrity

Run before shipping content changes:

```bash
python tools/validate_ptbr_content.py
```

This check fails on common encoding regressions (`Ã¡` style mojibake, `�`, and `aquisi??o` style corruption).
Backend startup enforces this validation by default (`STRICT_CONTENT_VALIDATION=1`).

## Project structure

```
blast_sql_vertical/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   └── content/
│       ├── courses.json
│       ├── seed.sql
│       └── sql_basics/module_1/*.json
└── frontend/
    └── src/
```

## Content

- **SQL Basics** course, Module 1 (SELECT Fundamentals)
- 5 lessons: Introduction to SELECT, WHERE, ORDER BY, LIMIT, Aggregations
- Demo tables: `customers`, `orders`, `products`

## Security

- Only `SELECT` allowed; destructive statements blocked
- Per-session DuckDB sandbox
- Query length limit (10KB)
- Backend uses token-based authentication for course and SQL endpoints
- Backend not exposed to internet

## Cloudflare Tunnel

See [cloudflare/DEPLOY.md](cloudflare/DEPLOY.md) for deployment behind Cloudflare Tunnel.
