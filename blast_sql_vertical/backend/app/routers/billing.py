from fastapi import APIRouter, Depends, Header, Request

from app.models import (
    BillingAccessStatusResponse,
    CheckoutSessionResponse,
    EmbeddedCheckoutSessionRequest,
    EmbeddedCheckoutSessionResponse,
)
from app.services.auth_service import require_authenticated_user
from app.services.billing_service import (
    construct_stripe_event,
    create_checkout_session_for_user,
    create_embedded_checkout_session_for_user,
    get_user_access_status,
    process_stripe_event,
)

router = APIRouter()


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(user: dict = Depends(require_authenticated_user)):
    return create_checkout_session_for_user(user)


@router.post("/embedded-checkout-session", response_model=EmbeddedCheckoutSessionResponse)
def create_embedded_checkout_session(
    req: EmbeddedCheckoutSessionRequest | None = None,
    user: dict = Depends(require_authenticated_user),
):
    return create_embedded_checkout_session_for_user(
        user,
        course_id=(req.course_id if req else None),
    )


@router.get("/access-status", response_model=BillingAccessStatusResponse)
def access_status(user: dict = Depends(require_authenticated_user)):
    return get_user_access_status(int(user["id"]))


@router.post("/stripe-webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
):
    payload = await request.body()
    event = construct_stripe_event(payload, signature=stripe_signature)
    process_stripe_event(event)
    return {"received": True}
