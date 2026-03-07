from fastapi import APIRouter, Query

from app.models import (
    CheckoutStartEmbeddedResponse,
    CheckoutStartInstallmentRequest,
    CheckoutStartRequest,
    CheckoutStartResponse,
)
from app.services.billing_service import (
    start_installment_embedded_checkout,
    start_public_checkout,
    start_public_embedded_checkout,
    validate_promo_code,
)

router = APIRouter()


@router.get("/validate-promo")
def checkout_validate_promo(code: str = Query(..., min_length=1, max_length=100)):
    return validate_promo_code(code=code)


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
        promo_code_id=payload.promo_code_id,
    )


@router.post("/start-embedded-installment", response_model=CheckoutStartEmbeddedResponse)
def checkout_start_embedded_installment(payload: CheckoutStartInstallmentRequest):
    return start_installment_embedded_checkout(
        email=payload.email,
        password=payload.password,
        course_id=payload.course_id,
        installment_count=payload.installment_count,
        promo_code_id=payload.promo_code_id,
    )
