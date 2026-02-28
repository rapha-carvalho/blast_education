"""
Tests for account endpoints and refund eligibility logic.
"""

import time
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.user_db import (
    create_purchase,
    create_user,
    get_user_by_email,
    init_user_db,
    mark_purchase_paid,
    mark_purchase_refunded_by_payment_intent,
    upsert_access_grant,
)


@pytest.fixture(scope="module")
def client():
    init_user_db()
    return TestClient(app)


@pytest.fixture
def test_user(client):
    """Create a test user and return auth token."""
    email = f"account_test_{uuid.uuid4().hex}@test.local"
    password = "TestPass123!"
    res = client.post("/auth/register", json={"email": email, "password": password})
    assert res.status_code in (200, 201)
    data = res.json()
    token = data["access_token"]
    user = data["user"]
    return {"token": token, "user": user, "email": email, "password": password}


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_account_get_requires_auth(client):
    """GET /account requires authentication."""
    res = client.get("/account")
    assert res.status_code == 401


def test_account_get_success(client, test_user):
    """GET /account returns account info for authenticated user."""
    res = client.get("/account", headers=_auth_headers(test_user["token"]))
    assert res.status_code == 200
    data = res.json()
    assert "user" in data
    assert data["user"]["email"] == test_user["email"]
    assert "eligible_for_refund" in data
    assert "refund_window_days" in data
    assert data["refund_window_days"] > 0


def test_account_refund_requires_auth(client):
    """POST /account/refund requires authentication."""
    res = client.post("/account/refund", json={})
    assert res.status_code == 401


def test_account_refund_no_purchase(client, test_user):
    """POST /account/refund returns 404 or 503 when user has no purchase or Stripe not configured."""
    res = client.post(
        "/account/refund",
        headers=_auth_headers(test_user["token"]),
        json={"reason": "test"},
    )
    # 404 = no purchase; 503 = Stripe not configured
    assert res.status_code in (404, 503)


def test_eligible_for_refund_logic(client, test_user):
    """
    eligible_for_refund is True only when:
    - status is paid
    - within refund window
    - has stripe_payment_intent_id
    - no stripe_refund_id
    """
    user_row = get_user_by_email(test_user["email"])
    assert user_row is not None
    user_id = int(user_row["id"])
    course_id = "sql-basics"

    # Create a paid purchase within refund window
    purchase = create_purchase(user_id=user_id, course_id=course_id, status="pending")
    paid_at = int(time.time()) - 3600  # 1 hour ago
    mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=None,
        stripe_payment_intent_id="pi_test_123",
        amount=9900,
        currency="brl",
        paid_at=paid_at,
    )
    upsert_access_grant(
        user_id=user_id,
        course_id=course_id,
        starts_at=paid_at,
        expires_at=paid_at + 180 * 86400,
    )

    res = client.get("/account", headers=_auth_headers(test_user["token"]))
    assert res.status_code == 200
    data = res.json()
    assert data.get("eligible_for_refund") is True
    assert data.get("access") is not None
    assert data["access"]["status"] == "active"


def test_eligible_for_refund_false_after_refund(client, test_user):
    """eligible_for_refund is False after purchase is refunded."""
    user_row = get_user_by_email(test_user["email"])
    assert user_row is not None
    user_id = int(user_row["id"])
    course_id = "sql-basics"

    purchase = create_purchase(user_id=user_id, course_id=course_id, status="pending")
    paid_at = int(time.time()) - 3600
    mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=None,
        stripe_payment_intent_id="pi_test_refunded",
        amount=9900,
        currency="brl",
        paid_at=paid_at,
    )
    upsert_access_grant(
        user_id=user_id,
        course_id=course_id,
        starts_at=paid_at,
        expires_at=paid_at + 180 * 86400,
    )

    mark_purchase_refunded_by_payment_intent(
        stripe_payment_intent_id="pi_test_refunded",
        refunded_at=int(time.time()),
    )

    res = client.get("/account", headers=_auth_headers(test_user["token"]))
    assert res.status_code == 200
    data = res.json()
    assert data.get("eligible_for_refund") is False
    assert data.get("access") is not None
    assert data["access"]["status"] == "refunded"


def test_patch_profile_requires_auth(client):
    """PATCH /account/profile requires authentication."""
    res = client.patch("/account/profile", json={"full_name": "Maria Silva Santos"})
    assert res.status_code == 401


def test_patch_profile_validation_required(client, test_user):
    """PATCH /account/profile rejects empty full_name."""
    res = client.patch(
        "/account/profile",
        headers=_auth_headers(test_user["token"]),
        json={"full_name": ""},
    )
    assert res.status_code == 422


def test_patch_profile_validation_single_word(client, test_user):
    """PATCH /account/profile requires at least 2 words."""
    res = client.patch(
        "/account/profile",
        headers=_auth_headers(test_user["token"]),
        json={"full_name": "Maria"},
    )
    assert res.status_code == 400
    data = res.json()
    assert "sobrenome" in data.get("detail", "").lower()


def test_patch_profile_success(client, test_user):
    """PATCH /account/profile updates full_name and returns account info."""
    full_name = "Maria Silva Santos"
    res = client.patch(
        "/account/profile",
        headers=_auth_headers(test_user["token"]),
        json={"full_name": full_name},
    )
    assert res.status_code == 200
    data = res.json()
    assert data.get("user", {}).get("full_name") == full_name

    res = client.get("/account", headers=_auth_headers(test_user["token"]))
    assert res.status_code == 200
    assert res.json().get("user", {}).get("full_name") == full_name
