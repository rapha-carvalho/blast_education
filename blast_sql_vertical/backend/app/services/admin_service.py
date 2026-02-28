import json
import math
import time
from typing import Any

from fastapi import HTTPException, status

from app.config import BILLING_COURSE_ID, IMPERSONATION_TTL_MINUTES
from app.services.access_service import (
    compute_effective_access_status,
    has_active_course_access,
    sync_user_effective_status,
)
from app.services.auth_service import (
    create_access_token_for_user,
    hash_password,
    is_valid_email,
    validate_password_strength,
)
from app.services.content_loader import load_courses
from app.services.user_db import (
    ACCESS_STATUS_VALUES,
    _connect,
    create_admin_audit_log,
    create_admin_impersonation_session,
    create_user,
    get_user_by_email,
    get_user_by_id,
    list_progress_for_lessons,
    list_purchases_for_user,
    list_recent_sessions_for_user,
    stop_admin_impersonation_by_token_hash,
    update_user_access_state,
    upsert_access_grant,
    upsert_lesson_progress,
)

VALID_SORT_FIELDS = {"last_login_at", "expires_at", "progress_pct", "created_at"}
ACCESS_GRANTED_STATUSES = {"active", "manual_grant"}


def _now_ts() -> int:
    return int(time.time())


def _effective_status_sql() -> str:
    return (
        "CASE "
        "WHEN u.access_status IN ('active', 'manual_grant') "
        "AND u.expires_at IS NOT NULL "
        "AND u.expires_at <= :now "
        "THEN 'expired' "
        "ELSE u.access_status "
        "END"
    )


def _course_lessons() -> tuple[str, list[str], list[dict[str, Any]]]:
    course_id = BILLING_COURSE_ID
    courses = load_courses().get("courses", [])
    course = next((item for item in courses if item.get("id") == course_id), None)
    if not course and courses:
        course = courses[0]
        course_id = str(course.get("id") or course_id)
    if not course:
        return course_id, [], []
    lesson_ids: list[str] = []
    modules: list[dict[str, Any]] = []
    for module in course.get("modules", []) or []:
        module_lessons: list[dict[str, str]] = []
        for lesson in module.get("lessons", []) or []:
            if isinstance(lesson, str):
                lesson_id = lesson
                lesson_title = lesson
            else:
                lesson_id = str(lesson.get("id") or "")
                lesson_title = str(lesson.get("title") or lesson_id)
            if not lesson_id:
                continue
            lesson_ids.append(lesson_id)
            module_lessons.append({"id": lesson_id, "title": lesson_title})
        modules.append(
            {
                "id": str(module.get("id") or ""),
                "title": str(module.get("title") or ""),
                "lessons": module_lessons,
            }
        )
    return course_id, lesson_ids, modules


def _is_row_completed(row: dict[str, Any] | None) -> bool:
    if not row:
        return False
    progress = row.get("progress") if isinstance(row.get("progress"), dict) else {}
    return bool(row.get("is_completed")) or bool(progress.get("lessonCompleted"))


def _progress_snapshot(lesson_ids: list[str], progress_rows: dict[str, dict]) -> dict[str, Any]:
    completed_ids: list[str] = []
    for lesson_id in lesson_ids:
        if _is_row_completed(progress_rows.get(lesson_id)):
            completed_ids.append(lesson_id)
    total = len(lesson_ids)
    completed = len(completed_ids)
    pct = round((completed / total) * 100.0, 2) if total else 0.0
    return {
        "total_lessons": total,
        "completed_lessons": completed,
        "completion_pct": pct,
        "completed_lesson_ids": completed_ids,
    }


def _upsert_lesson_completion(
    *,
    user_id: int,
    lesson_id: str,
    is_completed: bool,
    current_row: dict[str, Any] | None,
) -> None:
    progress = {}
    if current_row and isinstance(current_row.get("progress"), dict):
        progress = {**current_row.get("progress")}
    progress["lessonCompleted"] = bool(is_completed)
    progress["updatedAt"] = int(time.time() * 1000)
    upsert_lesson_progress(user_id=user_id, lesson_id=lesson_id, progress=progress, is_completed=bool(is_completed))


def _validate_completed_lesson_ids(lesson_ids: list[str], raw_ids: list[str]) -> list[str]:
    allowed = set(lesson_ids)
    if not raw_ids:
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in raw_ids:
        lesson_id = str(item or "").strip()
        if not lesson_id:
            continue
        if lesson_id not in allowed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown lesson id: {lesson_id}")
        if lesson_id in seen:
            continue
        cleaned.append(lesson_id)
        seen.add(lesson_id)
    return cleaned


def _build_target_completed_ids(
    lesson_ids: list[str],
    current_completed_ids: list[str],
    overall_percent: float,
) -> list[str]:
    total_lessons = len(lesson_ids)
    target_count = int(round((total_lessons * float(overall_percent)) / 100.0))
    target_count = max(0, min(total_lessons, target_count))

    selected = set(current_completed_ids)
    if target_count > len(selected):
        for lesson_id in lesson_ids:
            if lesson_id in selected:
                continue
            selected.add(lesson_id)
            if len(selected) >= target_count:
                break
    elif target_count < len(selected):
        for lesson_id in reversed(lesson_ids):
            if lesson_id not in selected:
                continue
            selected.remove(lesson_id)
            if len(selected) <= target_count:
                break

    return [lesson_id for lesson_id in lesson_ids if lesson_id in selected]


def _apply_progress_payload(user_id: int, payload: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    _, lesson_ids, _ = _course_lessons()
    if not lesson_ids:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Course lessons are not available")

    has_overall = payload.get("overall_percent") is not None
    has_lessons = payload.get("completed_lesson_ids") is not None
    if has_overall == has_lessons:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide exactly one of overall_percent or completed_lesson_ids",
        )

    progress_rows = list_progress_for_lessons(user_id, lesson_ids)
    before = _progress_snapshot(lesson_ids, progress_rows)
    current_completed = set(before["completed_lesson_ids"])

    if has_overall:
        overall_percent = float(payload.get("overall_percent"))
        if overall_percent < 0 or overall_percent > 100:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="overall_percent must be between 0 and 100")
        target_completed_ids = _build_target_completed_ids(lesson_ids, before["completed_lesson_ids"], overall_percent)
    else:
        raw_ids = payload.get("completed_lesson_ids") or []
        if not isinstance(raw_ids, list):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="completed_lesson_ids must be a list")
        target_completed_ids = _validate_completed_lesson_ids(lesson_ids, [str(item) for item in raw_ids])

    target_completed = set(target_completed_ids)
    for lesson_id in lesson_ids:
        current_done = lesson_id in current_completed
        next_done = lesson_id in target_completed
        if current_done == next_done:
            continue
        _upsert_lesson_completion(
            user_id=user_id,
            lesson_id=lesson_id,
            is_completed=next_done,
            current_row=progress_rows.get(lesson_id),
        )

    after_rows = list_progress_for_lessons(user_id, lesson_ids)
    after = _progress_snapshot(lesson_ids, after_rows)
    return before, after


def _resolve_expires_at(payload: dict[str, Any]) -> int | None:
    has_absolute = "expires_at" in payload
    has_days = "expires_in_days" in payload
    has_months = "expires_in_months" in payload
    if sum([1 if has_absolute else 0, 1 if has_days else 0, 1 if has_months else 0]) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide only one of expires_at, expires_in_days, or expires_in_months",
        )

    if has_absolute:
        raw = payload.get("expires_at")
        return int(raw) if raw is not None else None

    now = _now_ts()
    if has_days:
        days = int(payload.get("expires_in_days"))
        if days <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="expires_in_days must be > 0")
        return now + days * 86_400

    if has_months:
        months = int(payload.get("expires_in_months"))
        if months <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="expires_in_months must be > 0")
        return now + months * 30 * 86_400

    return None


def get_admin_stats() -> dict[str, Any]:
    now = _now_ts()
    effective_status_expr = _effective_status_sql()
    status_counts = {status_key: 0 for status_key in ACCESS_STATUS_VALUES}

    with _connect() as conn:
        total_row = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()
        total_users = int(total_row["n"] if total_row else 0)

        rows = conn.execute(
            f"""
            SELECT effective_status, COUNT(*) AS n
            FROM (
                SELECT {effective_status_expr} AS effective_status
                FROM users u
            )
            GROUP BY effective_status
            """,
            {"now": now},
        ).fetchall()
        for row in rows:
            status_key = str(row["effective_status"] or "")
            if status_key in status_counts:
                status_counts[status_key] = int(row["n"] or 0)

        activity_7 = conn.execute(
            "SELECT COUNT(*) AS n FROM users WHERE last_login_at IS NOT NULL AND last_login_at >= ?",
            (now - 7 * 86_400,),
        ).fetchone()
        activity_30 = conn.execute(
            "SELECT COUNT(*) AS n FROM users WHERE last_login_at IS NOT NULL AND last_login_at >= ?",
            (now - 30 * 86_400,),
        ).fetchone()

        def _count_expiring(days: int) -> int:
            row = conn.execute(
                f"""
                SELECT COUNT(*) AS n
                FROM users u
                WHERE u.expires_at IS NOT NULL
                  AND u.expires_at > :now
                  AND u.expires_at <= :until_ts
                  AND ({effective_status_expr}) IN ('active', 'manual_grant')
                """,
                {"now": now, "until_ts": now + days * 86_400},
            ).fetchone()
            return int(row["n"] if row else 0)

        expirations_next_7d = _count_expiring(7)
        expirations_next_14d = _count_expiring(14)
        expirations_next_30d = _count_expiring(30)

        return {
            "total_users": total_users,
            "status_counts": status_counts,
            "active_last_7d": int(activity_7["n"] if activity_7 else 0),
            "active_last_30d": int(activity_30["n"] if activity_30 else 0),
            "expirations_next_7d": expirations_next_7d,
            "expirations_next_14d": expirations_next_14d,
            "expirations_next_30d": expirations_next_30d,
        }


def list_admin_users(
    *,
    search: str | None = None,
    status_filter: str | None = None,
    expires_window: str | None = None,
    progress_min: float | None = None,
    progress_max: float | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    now = _now_ts()
    safe_page = max(1, int(page))
    safe_page_size = max(1, min(100, int(page_size)))
    safe_sort_by = sort_by if sort_by in VALID_SORT_FIELDS else "created_at"
    safe_sort_dir = "asc" if str(sort_dir).lower() == "asc" else "desc"

    _, lesson_ids, _ = _course_lessons()
    total_lessons = len(lesson_ids)
    denominator = max(1, total_lessons)
    effective_status_expr = _effective_status_sql()
    progress_expr = f"ROUND(COALESCE(lp.completed_lessons, 0) * 100.0 / {denominator}, 2)"

    where: list[str] = []
    params: dict[str, Any] = {"now": now}

    if search:
        params["search"] = f"%{search.strip().lower()}%"
        where.append("(LOWER(u.email) LIKE :search OR LOWER(COALESCE(u.full_name, '')) LIKE :search)")

    if status_filter:
        if status_filter not in ACCESS_STATUS_VALUES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")
        params["status_filter"] = status_filter
        where.append(f"{effective_status_expr} = :status_filter")

    if expires_window:
        window_days = {"next_7d": 7, "next_14d": 14, "next_30d": 30}.get(expires_window)
        if window_days is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid expires_window")
        params["expires_until"] = now + window_days * 86_400
        where.append("u.expires_at IS NOT NULL AND u.expires_at > :now AND u.expires_at <= :expires_until")

    if progress_min is not None:
        params["progress_min"] = float(progress_min)
        where.append(f"{progress_expr} >= :progress_min")
    if progress_max is not None:
        params["progress_max"] = float(progress_max)
        where.append(f"{progress_expr} <= :progress_max")

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    order_map = {
        "created_at": "u.created_at",
        "last_login_at": "u.last_login_at",
        "expires_at": "u.expires_at",
        "progress_pct": progress_expr,
    }
    order_sql = order_map[safe_sort_by]

    base_from = """
        FROM users u
        LEFT JOIN (
            SELECT user_id, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) AS completed_lessons
            FROM lesson_progress
            GROUP BY user_id
        ) lp ON lp.user_id = u.id
        LEFT JOIN purchases p ON p.id = (
            SELECT p2.id FROM purchases p2
            WHERE p2.user_id = u.id
            ORDER BY p2.created_at DESC
            LIMIT 1
        )
    """

    count_sql = f"SELECT COUNT(*) AS n {base_from} {where_sql}"
    data_sql = f"""
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.created_at,
            u.last_login_at,
            u.access_status,
            {effective_status_expr} AS effective_access_status,
            u.expires_at,
            u.stripe_customer_id,
            COALESCE(lp.completed_lessons, 0) AS completed_lessons,
            {progress_expr} AS progress_pct,
            p.status AS latest_purchase_status,
            p.stripe_payment_intent_id,
            p.stripe_checkout_session_id
        {base_from}
        {where_sql}
        ORDER BY {order_sql} {safe_sort_dir}, u.id DESC
        LIMIT :limit OFFSET :offset
    """

    with _connect() as conn:
        count_row = conn.execute(count_sql, params).fetchone()
        total_items = int(count_row["n"] if count_row else 0)
        data_params = {**params, "limit": safe_page_size, "offset": (safe_page - 1) * safe_page_size}
        rows = conn.execute(data_sql, data_params).fetchall()

    items = []
    for row in rows:
        row_dict = dict(row)
        items.append(
            {
                "id": int(row_dict["id"]),
                "full_name": row_dict.get("full_name"),
                "email": str(row_dict.get("email") or ""),
                "created_at": int(row_dict.get("created_at") or 0),
                "last_login_at": int(row_dict["last_login_at"]) if row_dict.get("last_login_at") is not None else None,
                "access_status": str(row_dict.get("access_status") or "expired"),
                "effective_access_status": str(row_dict.get("effective_access_status") or "expired"),
                "expires_at": int(row_dict["expires_at"]) if row_dict.get("expires_at") is not None else None,
                "progress_pct": float(row_dict.get("progress_pct") or 0.0),
                "completed_lessons": int(row_dict.get("completed_lessons") or 0),
                "total_lessons": total_lessons,
                "stripe_customer_id": row_dict.get("stripe_customer_id"),
                "stripe_payment_intent_id": row_dict.get("stripe_payment_intent_id"),
                "stripe_checkout_session_id": row_dict.get("stripe_checkout_session_id"),
                "latest_purchase_status": row_dict.get("latest_purchase_status"),
            }
        )

    total_pages = math.ceil(total_items / safe_page_size) if total_items > 0 else 0
    return {
        "items": items,
        "page": safe_page,
        "page_size": safe_page_size,
        "total_items": total_items,
        "total_pages": total_pages,
    }


def _list_recent_audit_logs(user_id: int, limit: int = 20) -> list[dict[str, Any]]:
    safe_limit = max(1, min(100, int(limit)))
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, admin_id, target_user_id, action_type, reason, before_json, after_json, created_at
            FROM admin_audit_logs
            WHERE target_user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, safe_limit),
        ).fetchall()
    output: list[dict[str, Any]] = []
    for row in rows:
        data = dict(row)
        try:
            before = json.loads(data.get("before_json") or "{}")
        except Exception:
            before = {}
        try:
            after = json.loads(data.get("after_json") or "{}")
        except Exception:
            after = {}
        output.append(
            {
                "id": int(data.get("id") or 0),
                "admin_id": int(data.get("admin_id") or 0),
                "target_user_id": int(data.get("target_user_id") or 0),
                "action_type": str(data.get("action_type") or ""),
                "reason": str(data.get("reason") or ""),
                "before": before if isinstance(before, dict) else {},
                "after": after if isinstance(after, dict) else {},
                "created_at": int(data.get("created_at") or 0),
            }
        )
    return output


def get_admin_user_detail(user_id: int) -> dict[str, Any]:
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = sync_user_effective_status(user)

    _, lesson_ids, modules = _course_lessons()
    progress_rows = list_progress_for_lessons(user_id, lesson_ids)
    total_lessons = len(lesson_ids)
    completed_lessons = 0
    module_items: list[dict[str, Any]] = []
    for module in modules:
        module_completed = 0
        lesson_items: list[dict[str, Any]] = []
        for lesson in module.get("lessons", []):
            lesson_id = str(lesson.get("id") or "")
            row = progress_rows.get(lesson_id)
            is_done = _is_row_completed(row)
            if is_done:
                completed_lessons += 1
                module_completed += 1
            lesson_items.append(
                {
                    "lesson_id": lesson_id,
                    "lesson_title": str(lesson.get("title") or lesson_id),
                    "is_completed": is_done,
                }
            )
        module_total = len(module.get("lessons", []))
        module_pct = round((module_completed / module_total) * 100.0, 2) if module_total else 0.0
        module_items.append(
            {
                "module_id": str(module.get("id") or ""),
                "module_title": str(module.get("title") or ""),
                "total_lessons": module_total,
                "completed_lessons": module_completed,
                "completion_pct": module_pct,
                "lessons": lesson_items,
            }
        )

    overall_pct = round((completed_lessons / total_lessons) * 100.0, 2) if total_lessons else 0.0
    purchases = list_purchases_for_user(user_id=user_id, limit=1)
    latest_purchase = purchases[0] if purchases else {}
    effective_status = compute_effective_access_status(user.get("access_status"), user.get("expires_at"))

    return {
        "profile": {
            "id": int(user["id"]),
            "full_name": user.get("full_name"),
            "email": str(user.get("email") or ""),
            "role": str(user.get("role") or "student"),
            "created_at": int(user.get("created_at") or 0),
            "last_login_at": int(user["last_login_at"]) if user.get("last_login_at") is not None else None,
        },
        "access": {
            "status": str(user.get("access_status") or "expired"),
            "effective_status": effective_status,
            "expires_at": int(user["expires_at"]) if user.get("expires_at") is not None else None,
            "access_managed_by": str(user.get("access_managed_by") or "stripe"),
            "access_updated_at": int(user["access_updated_at"]) if user.get("access_updated_at") is not None else None,
            "has_access": has_active_course_access(user.get("access_status"), user.get("expires_at")),
        },
        "payment": {
            "latest_purchase_status": latest_purchase.get("status"),
            "latest_paid_at": latest_purchase.get("paid_at"),
            "latest_refunded_at": latest_purchase.get("refunded_at"),
            "refunded": bool(
                latest_purchase and (latest_purchase.get("status") == "refunded" or latest_purchase.get("refunded_at"))
            ),
            "stripe_customer_id": user.get("stripe_customer_id"),
            "stripe_payment_intent_id": latest_purchase.get("stripe_payment_intent_id"),
            "stripe_checkout_session_id": latest_purchase.get("stripe_checkout_session_id"),
            "purchase_id": latest_purchase.get("id"),
        },
        "progress": {
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "completion_pct": overall_pct,
            "modules": module_items,
        },
        "activity": {
            "last_login_at": int(user["last_login_at"]) if user.get("last_login_at") is not None else None,
            "sessions": list_recent_sessions_for_user(user_id, limit=10),
        },
        "audit_logs": _list_recent_audit_logs(user_id, limit=20),
    }


def create_admin_user(admin_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    email = str(payload.get("email") or "").strip().lower()
    if not is_valid_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "User already exists", "existing_user_id": int(existing["id"])},
        )

    password = str(payload.get("temporary_password") or "")
    password_err = validate_password_strength(password)
    if password_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_err)

    requested_status = str(payload.get("access_status") or "expired").strip() or "expired"
    if requested_status not in ACCESS_STATUS_VALUES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid access_status")

    expires_at = _resolve_expires_at(payload)
    final_status = "manual_grant" if requested_status in ACCESS_GRANTED_STATUSES else requested_status
    if final_status in ACCESS_GRANTED_STATUSES and expires_at is not None and int(expires_at) <= _now_ts():
        final_status = "expired"

    user = create_user(
        email=email,
        password_hash=hash_password(password),
        full_name=(str(payload.get("full_name") or "").strip() or None),
        role="student",
        access_status=final_status,
        expires_at=expires_at,
        access_managed_by="admin",
    )
    user_id = int(user["id"])

    entitlement_created = False
    if final_status in ACCESS_GRANTED_STATUSES and expires_at is not None:
        now = _now_ts()
        upsert_access_grant(
            user_id=user_id,
            course_id=BILLING_COURSE_ID,
            starts_at=now,
            expires_at=int(expires_at),
        )
        entitlement_created = True

    audit_reason = str(payload.get("reason") or "").strip()
    create_admin_audit_log(
        admin_id=admin_id,
        target_user_id=user_id,
        action_type="user_created",
        reason=audit_reason or "manual_user_creation",
        before={},
        after={
            "email": email,
            "full_name": user.get("full_name"),
            "access_status": final_status,
            "expires_at": expires_at,
            "access_managed_by": "admin",
        },
    )

    if entitlement_created:
        create_admin_audit_log(
            admin_id=admin_id,
            target_user_id=user_id,
            action_type="entitlement_created",
            reason=audit_reason or "manual_entitlement_creation",
            before={},
            after={
                "course_id": BILLING_COURSE_ID,
                "access_status": final_status,
                "expires_at": expires_at,
                "access_managed_by": "admin",
            },
        )

    if payload.get("overall_percent") is not None or payload.get("completed_lesson_ids") is not None:
        before, after = _apply_progress_payload(user_id, payload)
        create_admin_audit_log(
            admin_id=admin_id,
            target_user_id=user_id,
            action_type="progress_updated",
            reason=audit_reason or "initial_progress_setup",
            before=before,
            after=after,
        )

    return get_admin_user_detail(user_id)


def update_admin_user_progress(user_id: int, admin_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    reason = str(payload.get("reason") or "").strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reason is required")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    before, after = _apply_progress_payload(user_id, payload)
    create_admin_audit_log(
        admin_id=admin_id,
        target_user_id=user_id,
        action_type="progress_updated",
        reason=reason,
        before=before,
        after=after,
    )
    return get_admin_user_detail(user_id)


def update_admin_user_access(user_id: int, admin_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    reason = str(payload.get("reason") or "").strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reason is required")

    has_status = "status" in payload
    has_expires_at = "expires_at" in payload
    has_extend_days = "extend_days" in payload

    if not has_status and not has_expires_at and not has_extend_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided: status, expires_at, or extend_days",
        )
    if has_expires_at and has_extend_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide only one of expires_at or extend_days",
        )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = sync_user_effective_status(user)
    before = {
        "access_status": user.get("access_status"),
        "expires_at": user.get("expires_at"),
        "access_managed_by": user.get("access_managed_by"),
        "effective_status": compute_effective_access_status(user.get("access_status"), user.get("expires_at")),
    }

    next_status = user.get("access_status")
    next_expires: int | None = None
    expires_should_update = False
    if has_status:
        requested_status = str(payload.get("status") or "").strip()
        if requested_status not in ACCESS_STATUS_VALUES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
        next_status = requested_status

    if has_expires_at:
        raw_expires = payload.get("expires_at")
        next_expires = int(raw_expires) if raw_expires is not None else None
        expires_should_update = True
    elif has_extend_days:
        try:
            extend_days = int(payload.get("extend_days"))
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="extend_days must be an integer") from exc
        if extend_days <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="extend_days must be > 0")
        current_expires = int(user["expires_at"]) if user.get("expires_at") is not None else _now_ts()
        next_expires = current_expires + extend_days * 86_400
        expires_should_update = True

    update_kwargs: dict[str, Any] = {
        "access_status": str(next_status or "expired"),
        "access_managed_by": "admin",
    }
    if expires_should_update:
        update_kwargs["expires_at"] = next_expires

    updated = update_user_access_state(user_id, **update_kwargs)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updated = sync_user_effective_status(updated)
    after = {
        "access_status": updated.get("access_status"),
        "expires_at": updated.get("expires_at"),
        "access_managed_by": updated.get("access_managed_by"),
        "effective_status": compute_effective_access_status(updated.get("access_status"), updated.get("expires_at")),
    }

    create_admin_audit_log(
        admin_id=admin_id,
        target_user_id=user_id,
        action_type="entitlement_updated",
        reason=reason,
        before=before,
        after=after,
    )
    return get_admin_user_detail(user_id)


def start_admin_impersonation(
    *,
    admin_user: dict[str, Any],
    payload: dict[str, Any],
    requested_ip: str | None = None,
    requested_user_agent: str | None = None,
) -> dict[str, Any]:
    admin_id = int(admin_user["id"])
    admin_token_hash = str(admin_user.get("auth_token_hash") or "").strip()
    if not admin_token_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    target_user_id = int(payload.get("user_id") or 0)
    if target_user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user_id")
    if target_user_id == admin_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot impersonate yourself")

    target_user = get_user_by_id(target_user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(target_user.get("role") or "student") == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot impersonate an admin user")

    ttl_seconds = max(15, min(60, int(IMPERSONATION_TTL_MINUTES))) * 60
    impersonation_token, expires_at, impersonation_token_hash = create_access_token_for_user(
        target_user_id,
        ttl_seconds=ttl_seconds,
    )

    created = create_admin_impersonation_session(
        admin_user_id=admin_id,
        target_user_id=target_user_id,
        admin_token_hash=admin_token_hash,
        impersonation_token_hash=impersonation_token_hash,
        expires_at=expires_at,
        started_ip=requested_ip,
        started_user_agent=requested_user_agent,
    )

    reason = str(payload.get("reason") or "").strip() or "admin_impersonation"
    create_admin_audit_log(
        admin_id=admin_id,
        target_user_id=target_user_id,
        action_type="impersonation_started",
        reason=reason,
        before={},
        after={
            "impersonation_id": created.get("id"),
            "started_at": created.get("started_at"),
            "expires_at": created.get("expires_at"),
            "started_ip": created.get("started_ip"),
            "started_user_agent": created.get("started_user_agent"),
        },
    )

    return {
        "impersonation_access_token": impersonation_token,
        "token_type": "bearer",
        "expires_at": int(expires_at),
        "redirect_to": "/",
        "impersonated_user": {
            "id": int(target_user["id"]),
            "email": str(target_user.get("email") or ""),
            "full_name": target_user.get("full_name"),
            "role": str(target_user.get("role") or "student"),
            "is_impersonating": True,
            "impersonation_admin_id": admin_id,
            "impersonation_started_at": int(created.get("started_at") or _now_ts()),
            "impersonation_expires_at": int(created.get("expires_at") or expires_at),
        },
    }


def stop_admin_impersonation(
    *,
    auth_user: dict[str, Any],
    impersonation_token_hash: str,
    requested_ip: str | None = None,
    requested_user_agent: str | None = None,
) -> dict[str, Any]:
    if not bool(auth_user.get("is_impersonating")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active impersonation required")

    row = stop_admin_impersonation_by_token_hash(
        impersonation_token_hash=impersonation_token_hash,
        stop_reason="manual_stop",
        stopped_ip=requested_ip,
        stopped_user_agent=requested_user_agent,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Impersonation session not found")
    if not bool(row.get("updated")):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Impersonation session is already stopped")

    admin_user_id = int(row["admin_user_id"])
    target_user_id = int(row["target_user_id"])
    admin_access_token, _, _ = create_access_token_for_user(admin_user_id)

    create_admin_audit_log(
        admin_id=admin_user_id,
        target_user_id=target_user_id,
        action_type="impersonation_stopped",
        reason="manual_stop",
        before={
            "impersonation_id": row.get("id"),
            "started_at": row.get("started_at"),
            "expires_at": row.get("expires_at"),
            "started_ip": row.get("started_ip"),
            "started_user_agent": row.get("started_user_agent"),
        },
        after={
            "stopped_at": row.get("stopped_at"),
            "stopped_ip": row.get("stopped_ip"),
            "stopped_user_agent": row.get("stopped_user_agent"),
            "stop_reason": row.get("stop_reason"),
        },
    )

    return {
        "admin_access_token": admin_access_token,
        "token_type": "bearer",
        "redirect_to": f"/admin/users/{target_user_id}",
    }
