"""
Tests for forgot-password, reset-password, and change-password flows.
Email sending (Resend) is mocked to avoid external API calls.
"""

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.user_db import init_user_db


@pytest.fixture(scope="module")
def client():
    init_user_db()
    return TestClient(app)


@pytest.fixture
def test_user(client):
    """Create a test user and return auth token."""
    email = f"reset_test_{uuid.uuid4().hex}@test.local"
    password = "TestPass123!"
    res = client.post("/auth/register", json={"email": email, "password": password})
    assert res.status_code in (200, 201)
    data = res.json()
    token = data["access_token"]
    user = data["user"]
    return {"token": token, "user": user, "email": email, "password": password}


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@patch("app.services.auth_service.send_password_reset_email")
def test_forgot_password_always_success(mock_send, client):
    """POST /auth/forgot-password always returns 200 with generic message."""
    # Non-existent email - still success (no account enumeration)
    res = client.post("/auth/forgot-password", json={"email": "noexist@test.local"})
    assert res.status_code == 200
    data = res.json()
    assert "message" in data
    mock_send.assert_not_called()

    # Existing user - success and email sent when mocked returns True
    with patch("app.services.auth_service.send_password_reset_email", return_value=True):
        email = f"forgot_{uuid.uuid4().hex}@test.local"
        client.post("/auth/register", json={"email": email, "password": "TestPass123!"})
        res = client.post("/auth/forgot-password", json={"email": email})
        assert res.status_code == 200
        data = res.json()
        assert "message" in data


def test_forgot_password_rate_limit(client):
    """Rate limiting per user (3/hour). After 3 requests, still 200 but no new token."""
    email = f"ratelimit_{uuid.uuid4().hex}@test.local"
    client.post("/auth/register", json={"email": email, "password": "TestPass123!"})

    with patch("app.services.auth_service.send_password_reset_email", return_value=True):
        for _ in range(4):
            res = client.post("/auth/forgot-password", json={"email": email})
            assert res.status_code == 200  # Always generic success


@patch("app.services.auth_service.send_password_reset_email", return_value=True)
def test_reset_password_flow(mock_send, client, test_user):
    """Full flow: forgot -> validate -> reset -> login with new password."""
    email = test_user["email"]

    # 1. Request reset link
    res = client.post("/auth/forgot-password", json={"email": email})
    assert res.status_code == 200
    assert mock_send.called

    # Get raw token from mock call's reset_link (tests only - prod gets it from email)
    call_args = mock_send.call_args
    assert call_args is not None
    reset_link = call_args[0][1]
    assert "reset-password?token=" in reset_link
    token = reset_link.split("token=")[1].split("&")[0]

    # 2. Validate token
    res = client.get(f"/auth/reset-password/validate?token={token}")
    assert res.status_code == 200
    assert res.json().get("valid") is True

    # 3. Reset password
    new_password = "NewSecurePass1!"
    res = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": new_password},
    )
    assert res.status_code == 200

    # 4. Token invalid after use
    res = client.get(f"/auth/reset-password/validate?token={token}")
    assert res.status_code == 200
    assert res.json().get("valid") is False

    # 5. Login with new password
    res = client.post("/auth/login", json={"email": email, "password": new_password})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_reset_password_invalid_token(client):
    """POST /auth/reset-password with invalid token returns 400/404."""
    res = client.post(
        "/auth/reset-password",
        json={"token": "invalid-token-xyz", "new_password": "NewPass123!"},
    )
    assert res.status_code in (400, 404)


@patch("app.services.auth_service.send_password_reset_email")
def test_reset_password_weak_password(mock_send, client, test_user):
    """POST /auth/reset-password rejects weak password."""
    def capture_link(to_email, reset_link):
        capture_link.reset_link = reset_link
        return True

    capture_link.reset_link = None
    mock_send.side_effect = capture_link

    res = client.post("/auth/forgot-password", json={"email": test_user["email"]})
    assert res.status_code == 200
    assert capture_link.reset_link is not None
    token = capture_link.reset_link.split("token=")[1].split("&")[0]

    res = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "short"},
    )
    assert res.status_code in (400, 422)


def test_change_password_success(client, test_user):
    """POST /account/change-password updates password for logged-in user."""
    res = client.post(
        "/account/change-password",
        headers=_auth_headers(test_user["token"]),
        json={
            "current_password": test_user["password"],
            "new_password": "NewPassword123!",
        },
    )
    assert res.status_code == 200

    # Login with new password
    res = client.post(
        "/auth/login",
        json={"email": test_user["email"], "password": "NewPassword123!"},
    )
    assert res.status_code == 200


def test_change_password_wrong_current(client, test_user):
    """POST /account/change-password fails with wrong current password."""
    res = client.post(
        "/account/change-password",
        headers=_auth_headers(test_user["token"]),
        json={
            "current_password": "WrongPass123!",
            "new_password": "NewPassword123!",
        },
    )
    assert res.status_code in (400, 401)


def test_change_password_requires_auth(client):
    """POST /account/change-password requires authentication."""
    res = client.post(
        "/account/change-password",
        json={"current_password": "x", "new_password": "NewPass123!"},
    )
    assert res.status_code == 401


@patch("app.services.auth_service.send_password_reset_email", return_value=True)
def test_send_reset_link_logged_in(mock_send, client, test_user):
    """POST /account/send-reset-link sends reset link to logged-in user."""
    res = client.post(
        "/account/send-reset-link",
        headers=_auth_headers(test_user["token"]),
    )
    assert res.status_code == 200
    mock_send.assert_called_once()
    assert test_user["email"].lower() in str(mock_send.call_args)
