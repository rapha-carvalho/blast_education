"""
Tests for certificate PDF endpoint.
"""

import time
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.content_loader import load_courses
from app.services.user_db import (
    create_purchase,
    get_user_by_email,
    init_user_db,
    mark_purchase_paid,
    update_user_access_state,
    upsert_access_grant,
    upsert_lesson_progress,
)


def _lesson_ids_from_course(course: dict) -> list[str]:
    ids = []
    for module in course.get("modules", []) or []:
        for lesson in module.get("lessons", []) or []:
            if isinstance(lesson, str):
                ids.append(lesson)
            elif isinstance(lesson, dict) and isinstance(lesson.get("id"), str):
                ids.append(lesson["id"])
    return ids


@pytest.fixture(scope="module")
def client():
    init_user_db()
    return TestClient(app)


@pytest.fixture
def test_user(client):
    """Create a test user and return auth token."""
    email = f"cert_test_{uuid.uuid4().hex}@test.local"
    password = "TestPass123!"
    res = client.post("/auth/register", json={"email": email, "password": password})
    assert res.status_code in (200, 201)
    data = res.json()
    token = data["access_token"]
    user = data["user"]
    return {"token": token, "user": user, "email": email, "password": password}


@pytest.fixture
def test_user_with_full_name(client):
    """Create a test user with full_name and return auth token."""
    email = f"cert_full_{uuid.uuid4().hex}@test.local"
    password = "TestPass123!"
    res = client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": "João Silva Santos"},
    )
    assert res.status_code in (200, 201)
    data = res.json()
    token = data["access_token"]
    user = data["user"]
    return {"token": token, "user": user, "email": email, "password": password}


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_certificate_pdf_requires_auth(client):
    """GET /account/certificate/pdf requires authentication."""
    res = client.get("/account/certificate/pdf")
    assert res.status_code == 401


@patch("app.services.account_service.render_pdf_from_html", new_callable=AsyncMock)
def test_certificate_pdf_full_name_required(mock_render, client, test_user):
    """GET /account/certificate/pdf returns 400 FULL_NAME_REQUIRED when full_name is missing."""
    res = client.get("/account/certificate/pdf", headers=_auth_headers(test_user["token"]))
    assert res.status_code == 400
    data = res.json()
    assert data.get("detail", {}).get("code") == "FULL_NAME_REQUIRED"
    mock_render.assert_not_called()


@patch("app.services.account_service.render_pdf_from_html", new_callable=AsyncMock)
def test_certificate_pdf_no_access(mock_render, client, test_user_with_full_name):
    """GET /account/certificate/pdf returns 403 when user has no active course access."""
    mock_render.return_value = b"%PDF-1.4 fake"
    res = client.get(
        "/account/certificate/pdf",
        headers=_auth_headers(test_user_with_full_name["token"]),
    )
    assert res.status_code == 403
    mock_render.assert_not_called()


@patch("app.services.account_service.render_pdf_from_html", new_callable=AsyncMock)
def test_certificate_pdf_not_completed(mock_render, client, test_user_with_full_name):
    """GET /account/certificate/pdf returns 403 when course not completed."""
    user_row = get_user_by_email(test_user_with_full_name["email"])
    assert user_row is not None
    user_id = int(user_row["id"])
    course_id = "sql-basics"
    paid_at = int(time.time()) - 3600
    pi_id = f"pi_cert_notdone_{uuid.uuid4().hex}"
    purchase = create_purchase(user_id=user_id, course_id=course_id, status="pending")
    mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=None,
        stripe_payment_intent_id=pi_id,
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
    mock_render.return_value = b"%PDF-1.4 fake"
    res = client.get(
        "/account/certificate/pdf",
        headers=_auth_headers(test_user_with_full_name["token"]),
    )
    assert res.status_code == 403
    mock_render.assert_not_called()


@patch("app.services.account_service.render_pdf_from_html", new_callable=AsyncMock)
def test_certificate_pdf_success(mock_render, client, test_user_with_full_name):
    """GET /account/certificate/pdf returns PDF when full_name, access, and completion are valid."""
    user_row = get_user_by_email(test_user_with_full_name["email"])
    assert user_row is not None
    user_id = int(user_row["id"])
    course_id = "sql-basics"
    paid_at = int(time.time()) - 3600
    pi_id = f"pi_cert_ok_{uuid.uuid4().hex}"
    purchase = create_purchase(user_id=user_id, course_id=course_id, status="pending")
    mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=None,
        stripe_payment_intent_id=pi_id,
        amount=9900,
        currency="brl",
        paid_at=paid_at,
    )
    expires_at = paid_at + 180 * 86400
    upsert_access_grant(
        user_id=user_id,
        course_id=course_id,
        starts_at=paid_at,
        expires_at=expires_at,
    )
    update_user_access_state(
        user_id=user_id,
        access_status="active",
        expires_at=expires_at,
    )
    courses = load_courses().get("courses", [])
    course = next((c for c in courses if c.get("id") == course_id), None)
    assert course is not None
    lesson_ids = _lesson_ids_from_course(course)
    for lesson_id in lesson_ids:
        upsert_lesson_progress(
            user_id=user_id,
            lesson_id=lesson_id,
            progress={"lessonCompleted": True, "updatedAt": paid_at * 1000},
            is_completed=True,
        )
    mock_render.return_value = b"%PDF-1.4 fake"
    res = client.get(
        "/account/certificate/pdf",
        headers=_auth_headers(test_user_with_full_name["token"]),
    )
    assert res.status_code == 200
    assert res.headers.get("content-type") == "application/pdf"
    assert "Certificado_SQL_Blast.pdf" in res.headers.get("content-disposition", "")
    assert res.content == b"%PDF-1.4 fake"
    mock_render.assert_called_once()
