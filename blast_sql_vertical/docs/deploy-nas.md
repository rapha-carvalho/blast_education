# NAS Deployment Runbook
### blast_sql_vertical → education.blastgroup.org

> **Goal**: zero-downtime deployments where an update is a single `docker compose pull && docker compose up -d`.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Cloudflare Tunnel — first-time setup](#2-cloudflare-tunnel--first-time-setup)
3. [Stripe Webhook — register the production endpoint](#3-stripe-webhook--register-the-production-endpoint)
4. [GitHub — push repo and configure secrets](#4-github--push-repo-and-configure-secrets)
5. [NAS — first deployment](#5-nas--first-deployment)
6. [Day-to-day updates](#6-day-to-day-updates)
7. [Automated backups](#7-automated-backups)
8. [Rollback](#8-rollback)
9. [Admin access via Cloudflare Access (optional)](#9-admin-access-via-cloudflare-access-optional)
10. [Performance & scalability notes](#10-performance--scalability-notes)

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| NAS with Docker Engine + Compose v2 | Synology DSM 7.2+, QNAP, Unraid, or plain Linux |
| `blastgroup.org` in Cloudflare | DNS managed by Cloudflare (not just registered) |
| Cloudflare Zero Trust account | Free tier is enough |
| GitHub account | GHCR is used for the container registry — no extra auth needed |
| Stripe live account | With a product + price created |
| Resend account | Verified sending domain for password-reset emails |

---

## 2. Cloudflare Tunnel — first-time setup

This is the only step that requires manual clicking. Do it **once**, then everything else is automated.

### 2.1 Create the tunnel

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) → select your account.
2. Go to **Zero Trust** (left sidebar) → **Networks** → **Tunnels**.
3. Click **Add a tunnel** → choose **Cloudflared** → click Next.
4. Name the tunnel: `blast-education-nas` → click **Save tunnel**.
5. Cloudflare shows you an installation command. **Copy only the token** — it looks like:
   ```
   eyJhIjoiMTIzYWJj...  (very long base64 string)
   ```
   Save it somewhere safe — you will need it in step 5.

### 2.2 Configure the public hostname

Still in the tunnel wizard (or edit it later from the Tunnels list):

| Field | Value |
|-------|-------|
| **Subdomain** | `education` |
| **Domain** | `blastgroup.org` |
| **Type** | HTTP |
| **URL** | `frontend:80` |

> **Why `frontend:80`?** The `cloudflared` container runs inside the same Docker Compose network as the `frontend` container, so it resolves the service by name.

Click **Save hostname**.

### 2.3 Where to point things

```
Internet
  └─ Cloudflare edge (TLS termination at Cloudflare)
       └─ Cloudflare Tunnel (outbound from your NAS — no inbound port needed)
            └─ cloudflared container (docker network: blast-prod)
                 └─ frontend:80  (nginx — serves React SPA + proxies /api/ → backend:8000)
                      └─ backend:8000  (FastAPI — not exposed to host or internet)
```

Stripe webhooks arrive at:
```
https://education.blastgroup.org/api/billing/stripe-webhook
```
which resolves to `backend:8000/billing/stripe-webhook` through the nginx proxy.

### 2.4 Required environment variable

```
CLOUDFLARE_TUNNEL_TOKEN=<paste the token from step 2.1>
```

Set this in `deploy/.env.prod` (covered in step 5).

---

## 3. Stripe Webhook — register the production endpoint

Do this **after** the tunnel is working (or pre-register and activate later).

1. Open [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. **Endpoint URL**:
   ```
   https://education.blastgroup.org/api/billing/stripe-webhook
   ```
4. **Events to listen to** (select all of these):
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `customer.subscription.deleted`
   - `charge.dispute.created`
5. Click **Add endpoint**.
6. Click **Reveal** next to *Signing secret* → copy the `whsec_...` value.
7. Set `STRIPE_WEBHOOK_SECRET=whsec_xxx` in `deploy/.env.prod`.

> The local `stripe-listener` Docker service is **not** used in production. It only runs when you use `docker-compose.yml` (local dev).

---

## 4. GitHub — push repo and configure secrets

### 4.1 Push the repository

```bash
cd /path/to/blast_education   # repo root

git remote add origin https://github.com/YOUR_ORG/blast-education.git
git push -u origin master
```

### 4.2 GitHub Actions required secrets

Go to **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Value |
|-------------|-------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe **live** publishable key (`pk_live_xxx`) |

That's the only secret needed — `GITHUB_TOKEN` is injected automatically and is used to push images to GHCR.

### 4.3 Verify the workflow runs

After pushing, go to **Actions** tab → the *Build & Push Docker Images* workflow should appear.
On success, two packages will be visible under your GitHub profile:
- `ghcr.io/<your-org>/blast-sql-backend:latest`
- `ghcr.io/<your-org>/blast-sql-frontend:latest`

The packages are **public by default** (images contain no secrets — secrets are only injected at runtime). If you prefer private, go to `Packages → Package settings → Change visibility`.

---

## 5. NAS — first deployment

### 5.1 SSH into your NAS

```bash
ssh admin@<nas-ip>
```

### 5.2 Create the working directory

```bash
mkdir -p /volume1/docker/blast-education
cd /volume1/docker/blast-education
```

### 5.3 Copy the production compose file

Either:
- **Option A** — clone the repo and symlink:
  ```bash
  git clone https://github.com/YOUR_ORG/blast-education.git repo
  cd repo/blast_sql_vertical
  ```
- **Option B** — copy just the two files you need:
  ```bash
  # From your development machine
  scp blast_sql_vertical/deploy/docker-compose.prod.yml admin@<nas-ip>:/volume1/docker/blast-education/
  scp blast_sql_vertical/deploy/.env.prod.example      admin@<nas-ip>:/volume1/docker/blast-education/.env.prod
  ```

### 5.4 Fill in `.env.prod`

```bash
nano /volume1/docker/blast-education/.env.prod
```

Fill every blank line. Minimum required values:

```env
GHCR_OWNER=your-github-username-or-org
IMAGE_TAG=latest

CLOUDFLARE_TUNNEL_TOKEN=eyJ...

APP_BASE_URL=https://education.blastgroup.org

INITIAL_ADMIN_EMAIL=admin@blastgroup.org
INITIAL_ADMIN_PASSWORD=very-strong-password-here

STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

CHECKOUT_SUCCESS_URL=https://education.blastgroup.org/checkout/success
CHECKOUT_CANCEL_URL=https://education.blastgroup.org/checkout/cancelled
CHECKOUT_RETURN_URL=https://education.blastgroup.org/checkout/success

CPF_ENCRYPTION_KEY=<64 hex chars — generate below>

RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@blastgroup.org
```

Generate the encryption key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Protect the file:
```bash
chmod 600 .env.prod
```

### 5.5 Authenticate with GHCR (only if images are private)

If you left the packages public, skip this. If private:

```bash
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 5.6 Pull and start

```bash
cd /volume1/docker/blast-education

docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### 5.7 Verify

```bash
# All three containers should be healthy
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

# Backend health
curl -s http://localhost:8000/health   # from NAS shell
# → {"status": "ok"}

# Public URL (via tunnel — may take 30s to appear)
curl -s https://education.blastgroup.org/api/health
# → {"status": "ok"}
```

Visit `https://education.blastgroup.org` — you should see the course page.

---

## 6. Day-to-day updates

After GitHub Actions publishes a new image (every push to `master`), deploy it to the NAS with:

```bash
cd /volume1/docker/blast-education

docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Docker Compose will restart only the containers whose image changed.
The SQLite database in the `backend_data` named volume is untouched.

To deploy a specific git-sha tag instead of `latest`:

```bash
IMAGE_TAG=sha-abc1234 docker compose -f docker-compose.prod.yml --env-file .env.prod pull
IMAGE_TAG=sha-abc1234 docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 7. Automated backups

### 7.1 Copy backup script to NAS

```bash
scp blast_sql_vertical/deploy/backup.sh admin@<nas-ip>:/volume1/docker/blast-education/
chmod +x /volume1/docker/blast-education/backup.sh
```

### 7.2 Test it manually

```bash
BACKUP_DIR=/volume1/backups/blast-sql \
COMPOSE_FILE=/volume1/docker/blast-education/docker-compose.prod.yml \
ENV_FILE=/volume1/docker/blast-education/.env.prod \
bash /volume1/docker/blast-education/backup.sh
```

### 7.3 Schedule with cron (Synology Task Scheduler or crontab)

```bash
# crontab -e
0 3 * * * BACKUP_DIR=/volume1/backups/blast-sql \
           COMPOSE_FILE=/volume1/docker/blast-education/docker-compose.prod.yml \
           ENV_FILE=/volume1/docker/blast-education/.env.prod \
           bash /volume1/docker/blast-education/backup.sh \
           >> /var/log/blast-backup.log 2>&1
```

Backups are named `users_YYYYMMDD_HHMMSS.db` and rotated after 14 days (`RETAIN_DAYS`).

### 7.4 Restore from backup

```bash
# Stop backend
docker compose -f docker-compose.prod.yml --env-file .env.prod stop backend

# Copy backup file into the container's data directory
docker compose -f docker-compose.prod.yml --env-file .env.prod \
    cp /volume1/backups/blast-sql/users_20260101_030000.db backend:/app/data/users.db

# Restart
docker compose -f docker-compose.prod.yml --env-file .env.prod start backend
```

---

## 8. Rollback

Pin to the previous image tag (visible in GitHub Actions run history):

```bash
# Example: roll back to a specific SHA
IMAGE_TAG=sha-abc1234 docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Or re-run the previous GitHub Actions workflow run → it pushed the image → re-deploy.

The database is never modified by container restarts — only application code changes.

---

## 9. Admin access via Cloudflare Access (optional, recommended)

Protect `/admin/*` behind a Cloudflare Access policy so only your email can reach the admin UI.

1. Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. **Application name**: `Blast Admin`
3. **Application domain**: `education.blastgroup.org` / path: `/admin`
4. **Policy**: allow your Google/email address.
5. Save.

Anyone hitting `/admin` will now see a Cloudflare login prompt before reaching your app.

---

## 10. Performance & scalability notes

### Expected concurrency

| Scenario | Estimate |
|----------|----------|
| Concurrent active learners | 5–50 (course platform) |
| Peak checkout events | 1–5 simultaneous |
| PDF render (Playwright) | 1 concurrent (heavyweight) |

### Bottlenecks

| Bottleneck | Where | Mitigation |
|-----------|-------|------------|
| NAS uplink | Cloudflare Tunnel egress | Cloudflare caches static assets at the edge automatically |
| SQLite writes | `users.db` | WAL mode (already enabled in `user_db.py` via `PRAGMA journal_mode=WAL`) — safe up to ~50 concurrent writers |
| Playwright/PDF | Memory + CPU | Limit to 1 concurrent render; 1.5 GB memory limit in compose |
| DuckDB sessions | In-memory per request | Each SQL query uses an isolated DuckDB; fine for current load |

### Static asset caching

The nginx config already sets `Cache-Control: public, immutable` for all Vite-hashed asset files (JS/CSS/fonts). Cloudflare caches these at the edge — repeat visitors load assets from Cloudflare PoPs, not your NAS.

### Minimal load test plan (k6)

```js
// k6 smoke test — install k6 and run: k6 run smoke.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
};

export default function () {
  // Home page
  const res = http.get("https://education.blastgroup.org/");
  check(res, { "status 200": (r) => r.status === 200 });

  // Health
  const health = http.get("https://education.blastgroup.org/api/health");
  check(health, { "health ok": (r) => r.status === 200 });

  sleep(1);
}
```

**Metrics to watch** (Docker stats + Cloudflare analytics):

| Metric | Alert threshold |
|--------|----------------|
| p95 API latency | > 1 s |
| Backend memory | > 1.2 GB |
| Docker CPU (backend) | > 80% sustained |
| SQLite WAL file size | > 100 MB (run checkpoint) |
| Cloudflare 5xx rate | > 1% |

Run `docker stats` on the NAS during a test session to observe memory usage during PDF rendering.
