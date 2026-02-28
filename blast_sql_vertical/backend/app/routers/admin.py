from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.models import (
    AdminCreateUserRequest,
    AdminImpersonateRequest,
    AdminImpersonateResponse,
    AdminStatsResponse,
    AdminStopImpersonationResponse,
    AdminUserDetailResponse,
    AdminUserProgressUpdateRequest,
    AdminUserRefreshStripeResponse,
    AdminUsersResponse,
    AdminUserUpdateRequest,
)
from app.services.admin_service import (
    create_admin_user,
    get_admin_stats,
    get_admin_user_detail,
    list_admin_users,
    start_admin_impersonation,
    stop_admin_impersonation,
    update_admin_user_access,
    update_admin_user_progress,
)
from app.services.auth_service import require_admin_user, require_authenticated_user
from app.services.billing_service import refresh_user_from_stripe
from app.services.rate_limiter import check_fixed_window_limit

router = APIRouter()


def _enforce_admin_rate_limit(
    request: Request,
    admin_user: dict[str, Any],
    *,
    bucket: str,
    limit: int,
    window_seconds: int,
) -> None:
    admin_id = int(admin_user["id"])
    ip_addr = request.client.host if request.client else "unknown"
    key = f"admin:{bucket}:{admin_id}:{ip_addr}"
    allowed, retry_after = check_fixed_window_limit(key, limit=limit, window_seconds=window_seconds)
    if allowed:
        return
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Rate limit exceeded",
        headers={"Retry-After": str(retry_after)},
    )


def _request_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _request_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="stats_read",
        limit=120,
        window_seconds=60,
    )
    return get_admin_stats()


@router.get("/users", response_model=AdminUsersResponse)
def admin_users(
    request: Request,
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    expires_window: str | None = Query(default=None),
    progress_min: float | None = Query(default=None),
    progress_max: float | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="users_read",
        limit=90,
        window_seconds=60,
    )
    return list_admin_users(
        search=search,
        status_filter=status_filter,
        expires_window=expires_window,
        progress_min=progress_min,
        progress_max=progress_max,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.post("/users", response_model=AdminUserDetailResponse, status_code=201)
def admin_user_create(
    req: AdminCreateUserRequest,
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="user_create_write",
        limit=30,
        window_seconds=60,
    )
    if hasattr(req, "model_dump"):
        payload = req.model_dump(exclude_unset=True)
    else:  # pragma: no cover - pydantic v1 fallback
        payload = req.dict(exclude_unset=True)
    return create_admin_user(
        admin_id=int(admin_user["id"]),
        payload=payload,
    )


@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
def admin_user_detail(
    user_id: int,
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="user_detail_read",
        limit=120,
        window_seconds=60,
    )
    return get_admin_user_detail(user_id)


@router.patch("/users/{user_id}", response_model=AdminUserDetailResponse)
def admin_user_update(
    user_id: int,
    req: AdminUserUpdateRequest,
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="user_update_write",
        limit=30,
        window_seconds=60,
    )
    if hasattr(req, "model_dump"):
        payload = req.model_dump(exclude_unset=True)
    else:  # pragma: no cover - pydantic v1 fallback
        payload = req.dict(exclude_unset=True)
    return update_admin_user_access(
        user_id=user_id,
        admin_id=int(admin_user["id"]),
        payload=payload,
    )


@router.patch("/users/{user_id}/progress", response_model=AdminUserDetailResponse)
def admin_user_update_progress(
    user_id: int,
    req: AdminUserProgressUpdateRequest,
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="user_progress_write",
        limit=30,
        window_seconds=60,
    )
    if hasattr(req, "model_dump"):
        payload = req.model_dump(exclude_unset=True)
    else:  # pragma: no cover - pydantic v1 fallback
        payload = req.dict(exclude_unset=True)
    return update_admin_user_progress(
        user_id=user_id,
        admin_id=int(admin_user["id"]),
        payload=payload,
    )


@router.post("/users/{user_id}/refresh-stripe", response_model=AdminUserRefreshStripeResponse)
def admin_user_refresh_stripe(
    user_id: int,
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="user_refresh_write",
        limit=20,
        window_seconds=60,
    )
    return refresh_user_from_stripe(user_id=user_id, requested_by_admin_id=int(admin_user["id"]))


@router.post("/impersonate", response_model=AdminImpersonateResponse)
def admin_impersonate_start(
    req: AdminImpersonateRequest,
    request: Request,
    admin_user: dict = Depends(require_admin_user),
):
    _enforce_admin_rate_limit(
        request,
        admin_user,
        bucket="impersonate_start_write",
        limit=20,
        window_seconds=60,
    )
    if hasattr(req, "model_dump"):
        payload = req.model_dump(exclude_unset=True)
    else:  # pragma: no cover - pydantic v1 fallback
        payload = req.dict(exclude_unset=True)
    return start_admin_impersonation(
        admin_user=admin_user,
        payload=payload,
        requested_ip=_request_ip(request),
        requested_user_agent=_request_user_agent(request),
    )


@router.post("/impersonate/stop", response_model=AdminStopImpersonationResponse)
def admin_impersonate_stop(
    request: Request,
    auth_user: dict = Depends(require_authenticated_user),
):
    token_hash = str(auth_user.get("auth_token_hash") or "").strip()
    if not token_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return stop_admin_impersonation(
        auth_user=auth_user,
        impersonation_token_hash=token_hash,
        requested_ip=_request_ip(request),
        requested_user_agent=_request_user_agent(request),
    )
