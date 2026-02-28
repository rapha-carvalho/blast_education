import time
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.billing_service import process_stripe_event
from app.services.user_db import (
    create_purchase,
    create_user,
    expire_admin_impersonation_sessions,
    get_user_by_id,
    init_user_db,
    mark_purchase_paid,
    set_user_role_by_email,
    update_user_access_state,
    update_user_stripe_customer_id,
)
from app.services.auth_service import hash_password


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def client():
    init_user_db()
    return TestClient(app)


def _register_and_login(client: TestClient, *, email: str, password: str) -> dict:
    reg = client.post("/auth/register", json={"email": email, "password": password})
    assert reg.status_code in (200, 201)
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return login.json()


def _create_admin_token(client: TestClient) -> tuple[str, int]:
    email = f"admin_{uuid.uuid4().hex}@test.local"
    password = "TestPass123!"
    auth_payload = _register_and_login(client, email=email, password=password)
    assert set_user_role_by_email(email, "admin") is True
    me = client.get("/auth/me", headers=_auth_headers(auth_payload["access_token"]))
    assert me.status_code == 200
    user_id = int(me.json()["user"]["id"])
    return auth_payload["access_token"], user_id


def test_admin_access_control(client: TestClient):
    res_unauth = client.get("/admin/stats")
    assert res_unauth.status_code == 401

    non_admin = _register_and_login(
        client,
        email=f"student_{uuid.uuid4().hex}@test.local",
        password="TestPass123!",
    )
    res_forbidden = client.get("/admin/stats", headers=_auth_headers(non_admin["access_token"]))
    assert res_forbidden.status_code == 403

    admin_token, _ = _create_admin_token(client)
    res_admin = client.get("/admin/stats", headers=_auth_headers(admin_token))
    assert res_admin.status_code == 200
    payload = res_admin.json()
    assert "total_users" in payload
    assert "status_counts" in payload


def test_webhook_refund_updates_status_when_stripe_managed():
    email = f"refund_user_{uuid.uuid4().hex}@test.local"
    user = create_user(
        email=email,
        password_hash=hash_password("TestPass123!"),
        access_status="active",
        expires_at=int(time.time()) + 20 * 86_400,
        access_managed_by="stripe",
    )
    user_id = int(user["id"])
    purchase = create_purchase(user_id=user_id, course_id="sql-basics", status="pending")
    purchase_id = int(purchase["id"])
    payment_intent_id = f"pi_{uuid.uuid4().hex}"
    mark_purchase_paid(
        purchase_id=purchase_id,
        stripe_checkout_session_id=f"cs_{uuid.uuid4().hex}",
        stripe_payment_intent_id=payment_intent_id,
        amount=1000,
        currency="brl",
        paid_at=int(time.time()) - 300,
    )

    process_stripe_event(
        {
            "id": f"evt_{uuid.uuid4().hex}",
            "type": "charge.refunded",
            "created": int(time.time()),
            "data": {"object": {"payment_intent": payment_intent_id, "refunds": {"data": []}}},
        }
    )

    refreshed = get_user_by_id(user_id)
    assert refreshed is not None
    assert refreshed["access_status"] == "refunded"


def test_webhook_does_not_override_manual_admin_access():
    email = f"manual_override_{uuid.uuid4().hex}@test.local"
    user = create_user(
        email=email,
        password_hash=hash_password("TestPass123!"),
        access_status="manual_grant",
        expires_at=int(time.time()) + 20 * 86_400,
        access_managed_by="admin",
    )
    user_id = int(user["id"])
    purchase = create_purchase(user_id=user_id, course_id="sql-basics", status="pending")
    purchase_id = int(purchase["id"])
    payment_intent_id = f"pi_{uuid.uuid4().hex}"
    mark_purchase_paid(
        purchase_id=purchase_id,
        stripe_checkout_session_id=f"cs_{uuid.uuid4().hex}",
        stripe_payment_intent_id=payment_intent_id,
        amount=1000,
        currency="brl",
        paid_at=int(time.time()) - 300,
    )

    process_stripe_event(
        {
            "id": f"evt_{uuid.uuid4().hex}",
            "type": "charge.refunded",
            "created": int(time.time()),
            "data": {"object": {"payment_intent": payment_intent_id, "refunds": {"data": []}}},
        }
    )

    refreshed = get_user_by_id(user_id)
    assert refreshed is not None
    assert refreshed["access_status"] == "manual_grant"
    assert refreshed["access_managed_by"] == "admin"


def test_subscription_cancel_and_dispute_mapping():
    sub_user = create_user(
        email=f"sub_cancel_{uuid.uuid4().hex}@test.local",
        password_hash=hash_password("TestPass123!"),
        access_status="active",
        expires_at=int(time.time()) + 25 * 86_400,
        access_managed_by="stripe",
    )
    sub_user_id = int(sub_user["id"])
    customer_id = f"cus_{uuid.uuid4().hex}"
    update_user_stripe_customer_id(sub_user_id, customer_id)

    process_stripe_event(
        {
            "id": f"evt_{uuid.uuid4().hex}",
            "type": "customer.subscription.deleted",
            "created": int(time.time()),
            "data": {"object": {"customer": customer_id}},
        }
    )

    canceled_user = get_user_by_id(sub_user_id)
    assert canceled_user is not None
    assert canceled_user["access_status"] == "canceled"

    dispute_user = create_user(
        email=f"dispute_user_{uuid.uuid4().hex}@test.local",
        password_hash=hash_password("TestPass123!"),
        access_status="active",
        expires_at=int(time.time()) + 25 * 86_400,
        access_managed_by="stripe",
    )
    dispute_user_id = int(dispute_user["id"])
    purchase = create_purchase(user_id=dispute_user_id, course_id="sql-basics", status="pending")
    payment_intent_id = f"pi_{uuid.uuid4().hex}"
    mark_purchase_paid(
        purchase_id=int(purchase["id"]),
        stripe_checkout_session_id=f"cs_{uuid.uuid4().hex}",
        stripe_payment_intent_id=payment_intent_id,
        amount=1200,
        currency="brl",
        paid_at=int(time.time()) - 300,
    )

    process_stripe_event(
        {
            "id": f"evt_{uuid.uuid4().hex}",
            "type": "charge.dispute.created",
            "created": int(time.time()),
            "data": {"object": {"payment_intent": payment_intent_id}},
        }
    )

    blocked_user = get_user_by_id(dispute_user_id)
    assert blocked_user is not None
    assert blocked_user["access_status"] == "blocked"


def test_admin_patch_requires_reason_and_writes_audit(client: TestClient):
    admin_token, _ = _create_admin_token(client)
    email = f"target_{uuid.uuid4().hex}@test.local"
    password = "TestPass123!"
    auth_payload = _register_and_login(client, email=email, password=password)
    user_id = int(auth_payload["user"]["id"])

    update_user_access_state(
        user_id,
        access_status="active",
        expires_at=int(time.time()) + 5 * 86_400,
        access_managed_by="stripe",
    )

    bad_res = client.patch(
        f"/admin/users/{user_id}",
        headers=_auth_headers(admin_token),
        json={"status": "blocked"},
    )
    assert bad_res.status_code in (400, 422)

    res_status = client.patch(
        f"/admin/users/{user_id}",
        headers=_auth_headers(admin_token),
        json={"status": "blocked", "reason": "analise manual"},
    )
    assert res_status.status_code == 200
    assert res_status.json()["access"]["status"] == "blocked"

    before_exp = get_user_by_id(user_id)["expires_at"]
    res_extend = client.patch(
        f"/admin/users/{user_id}",
        headers=_auth_headers(admin_token),
        json={"extend_days": 10, "reason": "renovacao comercial"},
    )
    assert res_extend.status_code == 200
    expected_exp = int(before_exp) + 10 * 86_400
    assert int(res_extend.json()["access"]["expires_at"]) == expected_exp
    assert len(res_extend.json().get("audit_logs", [])) >= 1


def test_admin_create_user_duplicate_and_login(client: TestClient):
    admin_token, _ = _create_admin_token(client)
    student = _register_and_login(
        client,
        email=f"manual_create_student_{uuid.uuid4().hex}@test.local",
        password="TestPass123!",
    )
    email = f"manual_create_{uuid.uuid4().hex}@test.local"
    temp_password = "TempPass123!"

    forbidden_create = client.post(
        "/admin/users",
        headers=_auth_headers(student["access_token"]),
        json={"email": email, "temporary_password": temp_password},
    )
    assert forbidden_create.status_code == 403

    create_res = client.post(
        "/admin/users",
        headers=_auth_headers(admin_token),
        json={
            "email": email,
            "full_name": "Manual User",
            "temporary_password": temp_password,
            "access_status": "active",
            "expires_in_days": 30,
            "overall_percent": 40,
            "reason": "onboarding",
        },
    )
    assert create_res.status_code == 201
    payload = create_res.json()
    created_id = int(payload["profile"]["id"])
    assert payload["profile"]["email"] == email
    assert payload["access"]["status"] == "manual_grant"
    assert payload["access"]["access_managed_by"] == "admin"
    assert payload["payment"]["latest_purchase_status"] is None
    action_types = {entry["action_type"] for entry in payload.get("audit_logs", [])}
    assert "user_created" in action_types
    assert "entitlement_created" in action_types
    assert "progress_updated" in action_types

    login_res = client.post("/auth/login", json={"email": email, "password": temp_password})
    assert login_res.status_code == 200

    dup_res = client.post(
        "/admin/users",
        headers=_auth_headers(admin_token),
        json={
            "email": email,
            "temporary_password": "AnotherPass123!",
        },
    )
    assert dup_res.status_code == 409
    detail = dup_res.json().get("detail", {})
    assert int(detail.get("existing_user_id")) == created_id


def test_admin_progress_endpoint_rules(client: TestClient):
    admin_token, _ = _create_admin_token(client)
    auth_payload = _register_and_login(
        client,
        email=f"progress_target_{uuid.uuid4().hex}@test.local",
        password="TestPass123!",
    )
    user_id = int(auth_payload["user"]["id"])

    missing_reason = client.patch(
        f"/admin/users/{user_id}/progress",
        headers=_auth_headers(admin_token),
        json={"overall_percent": 30},
    )
    assert missing_reason.status_code in (400, 422)

    both_payloads = client.patch(
        f"/admin/users/{user_id}/progress",
        headers=_auth_headers(admin_token),
        json={
            "overall_percent": 20,
            "completed_lesson_ids": ["lesson_m1_1"],
            "reason": "invalid payload",
        },
    )
    assert both_payloads.status_code == 400

    initial_detail = client.get(f"/admin/users/{user_id}", headers=_auth_headers(admin_token))
    assert initial_detail.status_code == 200
    lessons = []
    for mod in initial_detail.json().get("progress", {}).get("modules", []):
        for lesson in mod.get("lessons", []):
            if lesson.get("lesson_id"):
                lessons.append(lesson["lesson_id"])
    assert len(lessons) >= 2

    lesson_update = client.patch(
        f"/admin/users/{user_id}/progress",
        headers=_auth_headers(admin_token),
        json={
            "completed_lesson_ids": lessons[:2],
            "reason": "set exact lessons",
        },
    )
    assert lesson_update.status_code == 200
    payload = lesson_update.json()
    assert payload["progress"]["completed_lessons"] == 2
    assert payload["progress"]["completion_pct"] > 0

    overall_update = client.patch(
        f"/admin/users/{user_id}/progress",
        headers=_auth_headers(admin_token),
        json={
            "overall_percent": 0,
            "reason": "reset progress",
        },
    )
    assert overall_update.status_code == 200
    after = overall_update.json()
    assert after["progress"]["completed_lessons"] == 0
    action_types = {entry["action_type"] for entry in after.get("audit_logs", [])}
    assert "progress_updated" in action_types


def test_admin_impersonation_permissions_and_ttl(client: TestClient):
    admin_token, admin_user_id = _create_admin_token(client)
    another_admin_token, _ = _create_admin_token(client)
    another_admin_me = client.get("/auth/me", headers=_auth_headers(another_admin_token))
    assert another_admin_me.status_code == 200
    another_admin_id = int(another_admin_me.json()["user"]["id"])

    student_auth = _register_and_login(
        client,
        email=f"imp_target_{uuid.uuid4().hex}@test.local",
        password="TestPass123!",
    )
    target_user_id = int(student_auth["user"]["id"])

    forbidden_start = client.post(
        "/admin/impersonate",
        headers=_auth_headers(student_auth["access_token"]),
        json={"user_id": target_user_id},
    )
    assert forbidden_start.status_code == 403

    admin_target_forbidden = client.post(
        "/admin/impersonate",
        headers=_auth_headers(admin_token),
        json={"user_id": another_admin_id},
    )
    assert admin_target_forbidden.status_code == 400

    start_res = client.post(
        "/admin/impersonate",
        headers=_auth_headers(admin_token),
        json={"user_id": target_user_id, "reason": "support debug"},
    )
    assert start_res.status_code == 200
    start_payload = start_res.json()
    imp_token = start_payload["impersonation_access_token"]
    assert int(start_payload["impersonated_user"]["impersonation_admin_id"]) == admin_user_id

    me_imp = client.get("/auth/me", headers=_auth_headers(imp_token))
    assert me_imp.status_code == 200
    user_payload = me_imp.json()["user"]
    assert user_payload["is_impersonating"] is True
    assert int(user_payload["impersonation_admin_id"]) == admin_user_id

    admin_stats_imp = client.get("/admin/stats", headers=_auth_headers(imp_token))
    assert admin_stats_imp.status_code == 403

    stop_res = client.post("/admin/impersonate/stop", headers=_auth_headers(imp_token))
    assert stop_res.status_code == 200
    admin_token_new = stop_res.json()["admin_access_token"]

    old_token_me = client.get("/auth/me", headers=_auth_headers(imp_token))
    assert old_token_me.status_code == 401

    stats_after_stop = client.get("/admin/stats", headers=_auth_headers(admin_token_new))
    assert stats_after_stop.status_code == 200

    start_res_2 = client.post(
        "/admin/impersonate",
        headers=_auth_headers(admin_token_new),
        json={"user_id": target_user_id, "reason": "ttl test"},
    )
    assert start_res_2.status_code == 200
    imp_token_2 = start_res_2.json()["impersonation_access_token"]
    expires_at = int(start_res_2.json()["expires_at"])

    expired_count = expire_admin_impersonation_sessions(now_ts=expires_at + 1)
    assert expired_count >= 1

    me_after_expire = client.get("/auth/me", headers=_auth_headers(imp_token_2))
    assert me_after_expire.status_code == 401
