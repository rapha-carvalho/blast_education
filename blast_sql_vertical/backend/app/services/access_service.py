import time
from typing import Any

from app.services.user_db import ACCESS_STATUS_VALUES, update_user_access_state

ACCESS_GRANTED_STATUSES = {"active", "manual_grant"}


def normalize_access_status(raw_status: str | None) -> str:
    status = (raw_status or "").strip()
    if status in ACCESS_STATUS_VALUES:
        return status
    return "expired"


def compute_effective_access_status(
    raw_status: str | None,
    expires_at: int | None,
    *,
    now_ts: int | None = None,
) -> str:
    status = normalize_access_status(raw_status)
    now = int(now_ts or time.time())
    if status in ACCESS_GRANTED_STATUSES and expires_at is not None and int(expires_at) <= now:
        return "expired"
    return status


def has_active_course_access(
    raw_status: str | None,
    expires_at: int | None,
    *,
    now_ts: int | None = None,
) -> bool:
    effective = compute_effective_access_status(raw_status, expires_at, now_ts=now_ts)
    now = int(now_ts or time.time())
    if effective not in ACCESS_GRANTED_STATUSES:
        return False
    if expires_at is None:
        return True
    return int(expires_at) > now


def sync_user_effective_status(user_row: dict[str, Any], *, now_ts: int | None = None) -> dict[str, Any]:
    now = int(now_ts or time.time())
    current_status = normalize_access_status(str(user_row.get("access_status") or ""))
    expires_at_raw = user_row.get("expires_at")
    expires_at = int(expires_at_raw) if expires_at_raw is not None else None
    effective_status = compute_effective_access_status(current_status, expires_at, now_ts=now)
    if effective_status == current_status:
        return user_row
    updated = update_user_access_state(
        int(user_row["id"]),
        access_status=effective_status,
        expires_at=expires_at,
        access_managed_by=str(user_row.get("access_managed_by") or "stripe"),
        access_updated_at=now,
    )
    return updated or user_row
