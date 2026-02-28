"""
Account routes: account info, refund/cancellation, security, profile, certificate.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response

from app.models import AccountResponse, ChangePasswordRequest, MessageResponse, RefundRequest, UpdateProfileRequest
from app.services.account_service import (
    generate_certificate_pdf_bytes,
    get_account_info,
    request_refund,
    update_profile_full_name,
)
from app.services.auth_service import change_password, forgot_password_request, require_authenticated_user

router = APIRouter()


@router.get("", response_model=AccountResponse)
def account_get(user: dict = Depends(require_authenticated_user)):
    """Return account info: user, access, refund eligibility."""
    return get_account_info(int(user["id"]))


@router.post("/refund", response_model=AccountResponse)
def account_refund(
    req: RefundRequest | None = None,
    user: dict = Depends(require_authenticated_user),
):
    """Request a refund for the user's latest eligible purchase."""
    reason = (req.reason if req else None) or None
    return request_refund(int(user["id"]), reason=reason)


@router.post("/change-password", response_model=MessageResponse)
def account_change_password(req: ChangePasswordRequest, user: dict = Depends(require_authenticated_user)):
    """Change password for logged-in user."""
    change_password(int(user["id"]), req.current_password, req.new_password)
    return MessageResponse(message="Password changed successfully.")


@router.post("/send-reset-link", response_model=MessageResponse)
def account_send_reset_link(request: Request, user: dict = Depends(require_authenticated_user)):
    """Send password reset link to logged-in user's email."""
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="User email not found")
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else None
    user_agent = request.headers.get("user-agent")
    forgot_password_request(email, requested_ip=client_ip, user_agent=user_agent)
    return MessageResponse(message="If an account exists for this email, we sent a reset link.")


@router.patch("/profile", response_model=AccountResponse)
def account_patch_profile(req: UpdateProfileRequest, user: dict = Depends(require_authenticated_user)):
    """Update profile (full_name)."""
    return update_profile_full_name(int(user["id"]), req.full_name)


@router.get("/certificate/pdf")
async def account_certificate_pdf(user: dict = Depends(require_authenticated_user)):
    """Generate and download certificate PDF. Requires full_name and completed course."""
    pdf_bytes = await generate_certificate_pdf_bytes(int(user["id"]))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="Certificado_SQL_Blast.pdf"'},
    )
