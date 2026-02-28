from fastapi import APIRouter, Header, HTTPException, Request

from app.models import (
    AuthLoginRequest,
    AuthMeResponse,
    AuthRegisterRequest,
    AuthResponse,
    AuthUser,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    MessageResponse,
    ResetPasswordRequest,
    ResetPasswordValidateResponse,
)
from app.services.auth_service import (
    forgot_password_request,
    get_user_from_authorization,
    login_user,
    register_user,
    reset_password_with_token,
    validate_reset_token,
)
from app.services.user_db import delete_session

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(req: AuthRegisterRequest):
    user, token = register_user(
        email=req.email,
        password=req.password,
        full_name=req.full_name,
    )
    return AuthResponse(access_token=token, user=AuthUser(**user))


@router.post("/login", response_model=AuthResponse)
def login(req: AuthLoginRequest):
    user, token = login_user(email=req.email, password=req.password)
    return AuthResponse(access_token=token, user=AuthUser(**user))


@router.get("/me", response_model=AuthMeResponse)
def me(authorization: str | None = Header(default=None)):
    user, _ = get_user_from_authorization(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return AuthMeResponse(user=AuthUser(**user))


@router.post("/logout", response_model=MessageResponse)
def logout(authorization: str | None = Header(default=None)):
    user, token_hash = get_user_from_authorization(authorization)
    if not user or not token_hash:
        raise HTTPException(status_code=401, detail="Not authenticated")
    delete_session(token_hash)
    return MessageResponse(message="Logged out")


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(req: ForgotPasswordRequest, request: Request):
    """Request password reset. Always returns generic success (no account enumeration)."""
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    forgot_password_request(req.email, requested_ip=client_ip, user_agent=user_agent)
    return ForgotPasswordResponse()


@router.get("/reset-password/validate", response_model=ResetPasswordValidateResponse)
def reset_password_validate(token: str | None = None):
    """Check if reset token is valid."""
    valid = bool(token and validate_reset_token(token))
    return ResetPasswordValidateResponse(valid=valid)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest):
    """Reset password using token from email."""
    reset_password_with_token(req.token, req.new_password)
    return MessageResponse(message="Password reset successfully. You can now log in.")

