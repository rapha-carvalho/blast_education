# Admin Impersonation Security Model

## Overview

Admin impersonation uses a server-issued bearer token with a short TTL. The token maps to an `admin_impersonation_sessions` record and an ordinary `user_sessions` entry for the target user. The platform treats the session as the target user for normal app requests while preserving impersonation metadata for UI and audit.

## Token Model

- `POST /api/admin/impersonate` requires admin auth.
- Server creates:
  - new target-user access token (short TTL)
  - `admin_impersonation_sessions` row with:
    - `admin_user_id`
    - `target_user_id`
    - `admin_token_hash`
    - `impersonation_token_hash`
    - start metadata (`started_at`, `started_ip`, `started_user_agent`)
    - expiry metadata (`expires_at`)
- Client switches to the impersonation token.

## TTL and Revocation

- TTL is controlled by `IMPERSONATION_TTL_MINUTES` and clamped to 15-60 minutes (default 30).
- Expired impersonations are automatically stopped on auth resolution and the token session is removed.
- `POST /api/admin/impersonate/stop`:
  - requires active impersonation token
  - marks `stopped_at`, `stopped_ip`, `stopped_user_agent`, `stop_reason=manual_stop`
  - invalidates impersonation token session
  - issues a fresh admin token server-side

## Privilege Boundaries

- Impersonated identity does not gain admin permissions.
- `/api/admin/*` routes still enforce `role=admin` on effective authenticated user.
- Starting impersonation is blocked for:
  - self-impersonation
  - targets with `role=admin`

## UI Safety

- `GET /api/auth/me` includes:
  - `is_impersonating`
  - `impersonation_admin_id`
  - `impersonation_started_at`
  - `impersonation_expires_at`
- A global banner is shown while impersonating, with explicit "Stop impersonation" action.

## Audit Trail

All sensitive events are written to `admin_audit_logs` with timestamps and before/after context:

- `impersonation_started`
- `impersonation_stopped`
- plus other admin events (`user_created`, entitlement changes, progress changes).

For impersonation events, metadata includes actor, target user, start/end timestamps, and IP/user-agent capture where available.
