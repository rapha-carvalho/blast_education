from fastapi import APIRouter

from app.models import CheckoutStartEmbeddedResponse, CheckoutStartRequest, CheckoutStartResponse
from app.services.billing_service import start_public_checkout, start_public_embedded_checkout

router = APIRouter()


@router.post("/start", response_model=CheckoutStartResponse)
def checkout_start(payload: CheckoutStartRequest):
    return start_public_checkout(
        email=payload.email,
        password=payload.password,
        course_id=payload.course_id,
    )


@router.post("/start-embedded", response_model=CheckoutStartEmbeddedResponse)
def checkout_start_embedded(payload: CheckoutStartRequest):
    return start_public_embedded_checkout(
        email=payload.email,
        password=payload.password,
        course_id=payload.course_id,
    )
