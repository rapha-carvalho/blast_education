import time
import uuid
from unittest.mock import patch

import pytest

from app.services.auth_service import hash_password
from app.services.billing_service import process_stripe_event
from app.services.email_service import build_purchase_confirmation_email_content
from app.services.user_db import (
    create_purchase,
    create_user,
    get_access_grant,
    get_purchase_by_id,
    get_purchase_email_event_by_stripe_event_id,
    init_user_db,
)


def _event_checkout_completed(
    *,
    event_id: str,
    session_id: str,
    payment_intent_id: str,
    purchase_id: int,
    course_id: str = "sql-basics",
) -> dict:
    return {
        "id": event_id,
        "type": "checkout.session.completed",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": session_id,
                "payment_status": "paid",
                "payment_intent": payment_intent_id,
                "amount_total": 9900,
                "currency": "brl",
                "metadata": {
                    "purchase_id": str(purchase_id),
                    "course_id": course_id,
                },
            }
        },
    }


def _event_payment_intent_succeeded(
    *,
    event_id: str,
    payment_intent_id: str,
    purchase_id: int,
    course_id: str = "sql-basics",
) -> dict:
    return {
        "id": event_id,
        "type": "payment_intent.succeeded",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": payment_intent_id,
                "amount_received": 9900,
                "currency": "brl",
                "metadata": {
                    "purchase_id": str(purchase_id),
                    "course_id": course_id,
                },
            }
        },
    }


def _create_user_with_pending_purchase(*, course_id: str = "sql-basics") -> tuple[dict, dict]:
    email = f"billing_email_{uuid.uuid4().hex}@test.local"
    user = create_user(
        email=email,
        password_hash=hash_password("TestPass123!"),
    )
    purchase = create_purchase(
        user_id=int(user["id"]),
        course_id=course_id,
        status="pending",
    )
    return user, purchase


@pytest.fixture(scope="module", autouse=True)
def _bootstrap_db():
    init_user_db()


@patch("app.services.billing_service.send_purchase_confirmation_email")
def test_checkout_completed_sends_email_once_and_replay_is_idempotent(mock_send):
    mock_send.return_value = {"sent": True, "provider_message_id": "re_msg_1", "error": None}
    user, purchase = _create_user_with_pending_purchase()
    purchase_id = int(purchase["id"])
    user_id = int(user["id"])

    event_id = f"evt_{uuid.uuid4().hex}"
    session_id = f"cs_{uuid.uuid4().hex}"
    payment_intent_id = f"pi_{uuid.uuid4().hex}"
    event = _event_checkout_completed(
        event_id=event_id,
        session_id=session_id,
        payment_intent_id=payment_intent_id,
        purchase_id=purchase_id,
    )

    process_stripe_event(event)
    assert mock_send.call_count == 1

    paid_purchase = get_purchase_by_id(purchase_id)
    assert paid_purchase is not None
    assert paid_purchase["status"] == "paid"
    assert get_access_grant(user_id, "sql-basics") is not None

    event_row = get_purchase_email_event_by_stripe_event_id(event_id)
    assert event_row is not None
    assert event_row["processed_at"] is not None
    assert event_row["email_sent_at"] is not None
    assert event_row["email_provider_message_id"] == "re_msg_1"

    process_stripe_event(event)
    assert mock_send.call_count == 1


@patch("app.services.billing_service.send_purchase_confirmation_email")
def test_payment_intent_after_checkout_does_not_send_duplicate_email(mock_send):
    mock_send.return_value = {"sent": True, "provider_message_id": "re_msg_2", "error": None}
    _, purchase = _create_user_with_pending_purchase()
    purchase_id = int(purchase["id"])

    checkout_event_id = f"evt_{uuid.uuid4().hex}"
    session_id = f"cs_{uuid.uuid4().hex}"
    payment_intent_id = f"pi_{uuid.uuid4().hex}"
    checkout_event = _event_checkout_completed(
        event_id=checkout_event_id,
        session_id=session_id,
        payment_intent_id=payment_intent_id,
        purchase_id=purchase_id,
    )
    process_stripe_event(checkout_event)
    assert mock_send.call_count == 1

    pi_event_id = f"evt_{uuid.uuid4().hex}"
    pi_event = _event_payment_intent_succeeded(
        event_id=pi_event_id,
        payment_intent_id=payment_intent_id,
        purchase_id=purchase_id,
    )
    process_stripe_event(pi_event)
    assert mock_send.call_count == 1

    pi_event_row = get_purchase_email_event_by_stripe_event_id(pi_event_id)
    assert pi_event_row is not None
    assert pi_event_row["processed_at"] is not None
    assert pi_event_row["email_sent_at"] is None


@patch("app.services.billing_service.send_purchase_confirmation_email")
def test_email_failure_is_fail_open_and_audited(mock_send):
    mock_send.return_value = {"sent": False, "provider_message_id": None, "error": "provider unavailable"}
    user, purchase = _create_user_with_pending_purchase()
    purchase_id = int(purchase["id"])
    user_id = int(user["id"])

    event_id = f"evt_{uuid.uuid4().hex}"
    event = _event_checkout_completed(
        event_id=event_id,
        session_id=f"cs_{uuid.uuid4().hex}",
        payment_intent_id=f"pi_{uuid.uuid4().hex}",
        purchase_id=purchase_id,
    )
    process_stripe_event(event)
    assert mock_send.call_count == 1

    paid_purchase = get_purchase_by_id(purchase_id)
    assert paid_purchase is not None
    assert paid_purchase["status"] == "paid"
    assert get_access_grant(user_id, "sql-basics") is not None

    event_row = get_purchase_email_event_by_stripe_event_id(event_id)
    assert event_row is not None
    assert event_row["processed_at"] is not None
    assert event_row["email_sent_at"] is None
    assert "provider unavailable" in str(event_row["email_error"] or "")


@patch("app.services.billing_service.send_purchase_confirmation_email")
def test_unsupported_course_purchase_is_ignored_for_confirmation_email(mock_send):
    _, purchase = _create_user_with_pending_purchase(course_id="other-course")
    purchase_id = int(purchase["id"])

    event_id = f"evt_{uuid.uuid4().hex}"
    event = _event_checkout_completed(
        event_id=event_id,
        session_id=f"cs_{uuid.uuid4().hex}",
        payment_intent_id=f"pi_{uuid.uuid4().hex}",
        purchase_id=purchase_id,
        course_id="other-course",
    )
    process_stripe_event(event)

    purchase_after = get_purchase_by_id(purchase_id)
    assert purchase_after is not None
    assert purchase_after["status"] == "pending"
    assert mock_send.call_count == 0

    event_row = get_purchase_email_event_by_stripe_event_id(event_id)
    assert event_row is not None
    assert event_row["processed_at"] is not None
    assert event_row["email_sent_at"] is None


def test_purchase_confirmation_email_template_content_ptbr():
    login_url = "https://education.blastgroup.org/login"
    email = "aluno@test.local"

    checkout_content = build_purchase_confirmation_email_content(
        full_name="Maria Silva",
        login_email=email,
        login_url=login_url,
        password_created_at_checkout=True,
    )
    assert checkout_content["subject"] == "Acesso liberado — Curso SQL (Blast)"
    assert "Pagamento confirmado. Seu acesso ao curso SQL está liberado." in checkout_content["html"]
    assert "senha que você criou no checkout" in checkout_content["html"]
    assert "Se tiver qualquer problema, responda este e-mail." in checkout_content["html"]
    assert login_url in checkout_content["html"]

    existing_account_content = build_purchase_confirmation_email_content(
        full_name=None,
        login_email=email,
        login_url=login_url,
        password_created_at_checkout=False,
    )
    assert "Faça login com o e-mail usado na compra e a senha da sua conta." in existing_account_content["html"]
