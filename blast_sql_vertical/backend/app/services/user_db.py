import json
import sqlite3
import time
import uuid
from contextlib import contextmanager
from typing import Any, Iterator

from app.config import BILLING_COURSE_ID, USER_DB_PATH

ACCESS_STATUS_VALUES = (
    "active",
    "expired",
    "refunded",
    "canceled",
    "blocked",
    "manual_grant",
)
ACCESS_MANAGED_BY_VALUES = ("stripe", "admin")
IMPERSONATION_STOP_REASON_VALUES = ("manual_stop", "ttl_expired", "replaced", "invalidated")
_UNSET = object()


def _row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}


def _column_exists(conn: sqlite3.Connection, table_name: str, column_name: str) -> bool:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    for row in rows:
        row_dict = _row_to_dict(row) or {}
        if row_dict.get("name") == column_name:
            return True
    return False


def _decode_json_object(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _encode_json_object(payload: dict[str, Any] | None) -> str:
    return json.dumps(payload or {}, ensure_ascii=False)


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    USER_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(USER_DB_PATH, timeout=20, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
    finally:
        conn.close()


def _bootstrap_access_fields(conn: sqlite3.Connection) -> None:
    now = int(time.time())
    rows = conn.execute(
        """
        SELECT id, access_status, expires_at, access_updated_at
        FROM users
        """
    ).fetchall()

    for row in rows:
        row_dict = _row_to_dict(row) or {}
        user_id = int(row_dict.get("id") or 0)
        if user_id <= 0:
            continue
        if row_dict.get("access_updated_at") is not None:
            continue

        grant_row = conn.execute(
            """
            SELECT expires_at
            FROM access_grants
            WHERE user_id = ? AND course_id = ?
            LIMIT 1
            """,
            (user_id, BILLING_COURSE_ID),
        ).fetchone()
        latest_purchase = conn.execute(
            """
            SELECT status
            FROM purchases
            WHERE user_id = ? AND course_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id, BILLING_COURSE_ID),
        ).fetchone()

        grant_expires = int(grant_row["expires_at"]) if grant_row and grant_row["expires_at"] is not None else None
        purchase_status = str(latest_purchase["status"]) if latest_purchase and latest_purchase["status"] else ""

        resolved_status = "expired"
        resolved_expires = grant_expires
        if purchase_status == "refunded":
            resolved_status = "refunded"
        elif purchase_status in {"canceled", "cancelled"}:
            resolved_status = "canceled"
        elif grant_expires is None and purchase_status == "paid":
            resolved_status = "active"
        elif grant_expires is not None and grant_expires > now:
            resolved_status = "active"

        if resolved_status in {"active", "manual_grant"} and resolved_expires is not None and resolved_expires <= now:
            resolved_status = "expired"

        conn.execute(
            """
            UPDATE users
            SET access_status = ?,
                expires_at = ?,
                access_managed_by = 'stripe',
                access_updated_at = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (resolved_status, resolved_expires, now, now, user_id),
        )


def init_user_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                password_hash TEXT NOT NULL,
                stripe_customer_id TEXT UNIQUE,
                cpf_encrypted TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                is_active INTEGER NOT NULL DEFAULT 1,
                last_login_at INTEGER,
                access_status TEXT NOT NULL DEFAULT 'expired',
                expires_at INTEGER,
                access_managed_by TEXT NOT NULL DEFAULT 'stripe',
                access_updated_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                last_seen_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_hash ON user_sessions(token_hash)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                lesson_id TEXT NOT NULL,
                progress_json TEXT NOT NULL,
                is_completed INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                UNIQUE(user_id, lesson_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_completed ON lesson_progress(user_id, is_completed)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id TEXT NOT NULL,
                status TEXT NOT NULL,
                stripe_checkout_session_id TEXT,
                stripe_payment_intent_id TEXT,
                amount INTEGER,
                currency TEXT,
                created_at INTEGER NOT NULL,
                paid_at INTEGER,
                refunded_at INTEGER,
                metadata TEXT NOT NULL DEFAULT '{}',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS access_grants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id TEXT NOT NULL,
                starts_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                UNIQUE(user_id, course_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_checkout_session_id ON purchases(stripe_checkout_session_id)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_payment_intent_id ON purchases(stripe_payment_intent_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases(user_id, status)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_access_grants_user_course ON access_grants(user_id, course_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_access_grants_expires_at ON access_grants(expires_at)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS checkout_signup_intents (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                course_id TEXT NOT NULL,
                status TEXT NOT NULL,
                stripe_checkout_session_id TEXT,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_checkout_signup_intents_email ON checkout_signup_intents(email)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_checkout_signup_intents_status_expires ON checkout_signup_intents(status, expires_at)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_signup_intents_session_id ON checkout_signup_intents(stripe_checkout_session_id)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                target_user_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                before_json TEXT NOT NULL DEFAULT '{}',
                after_json TEXT NOT NULL DEFAULT '{}',
                created_at INTEGER NOT NULL,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created ON admin_audit_logs(target_user_id, created_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created ON admin_audit_logs(admin_id, created_at)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_user_id INTEGER NOT NULL,
                target_user_id INTEGER NOT NULL,
                admin_token_hash TEXT NOT NULL,
                impersonation_token_hash TEXT UNIQUE NOT NULL,
                started_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                stopped_at INTEGER,
                started_ip TEXT,
                started_user_agent TEXT,
                stopped_ip TEXT,
                stopped_user_agent TEXT,
                stop_reason TEXT,
                FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_token ON admin_impersonation_sessions(impersonation_token_hash)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_admin_active ON admin_impersonation_sessions(admin_user_id, stopped_at, expires_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_target_active ON admin_impersonation_sessions(target_user_id, stopped_at, expires_at)"
        )
        if not _column_exists(conn, "users", "stripe_customer_id"):
            conn.execute("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT")
        if not _column_exists(conn, "users", "cpf_encrypted"):
            conn.execute("ALTER TABLE users ADD COLUMN cpf_encrypted TEXT")
        if not _column_exists(conn, "users", "role"):
            conn.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'")
        if not _column_exists(conn, "users", "last_login_at"):
            conn.execute("ALTER TABLE users ADD COLUMN last_login_at INTEGER")
        if not _column_exists(conn, "users", "access_status"):
            conn.execute("ALTER TABLE users ADD COLUMN access_status TEXT NOT NULL DEFAULT 'expired'")
        if not _column_exists(conn, "users", "expires_at"):
            conn.execute("ALTER TABLE users ADD COLUMN expires_at INTEGER")
        if not _column_exists(conn, "users", "access_managed_by"):
            conn.execute("ALTER TABLE users ADD COLUMN access_managed_by TEXT NOT NULL DEFAULT 'stripe'")
        if not _column_exists(conn, "users", "access_updated_at"):
            conn.execute("ALTER TABLE users ADD COLUMN access_updated_at INTEGER")
        if not _column_exists(conn, "purchases", "stripe_refund_id"):
            conn.execute("ALTER TABLE purchases ADD COLUMN stripe_refund_id TEXT")
        if not _column_exists(conn, "purchases", "refund_reason"):
            conn.execute("ALTER TABLE purchases ADD COLUMN refund_reason TEXT")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                expires_at INTEGER NOT NULL,
                used_at INTEGER,
                created_at INTEGER NOT NULL,
                requested_ip TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id)"
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_access_status ON users(access_status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_expires_at ON users(expires_at)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at)")
        conn.execute(
            """
            UPDATE users
            SET role = CASE
                WHEN role IS NULL OR TRIM(role) = '' THEN 'student'
                ELSE role
            END
            """
        )
        conn.execute(
            """
            UPDATE users
            SET access_status = CASE
                WHEN access_status IN ('active', 'expired', 'refunded', 'canceled', 'blocked', 'manual_grant')
                    THEN access_status
                ELSE 'expired'
            END
            """
        )
        conn.execute(
            """
            UPDATE users
            SET access_managed_by = CASE
                WHEN access_managed_by IN ('stripe', 'admin') THEN access_managed_by
                ELSE 'stripe'
            END
            """
        )
        _bootstrap_access_fields(conn)
        conn.commit()


def count_users() -> int:
    with _connect() as conn:
        row = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()
        return int(row["n"] if row else 0)


def create_user(
    email: str,
    password_hash: str,
    full_name: str | None = None,
    cpf_encrypted: str | None = None,
    role: str = "student",
    access_status: str = "expired",
    expires_at: int | None = None,
    access_managed_by: str = "stripe",
) -> dict:
    now = int(time.time())
    clean_role = (role or "student").strip() or "student"
    clean_access_status = (access_status or "expired").strip()
    if clean_access_status not in ACCESS_STATUS_VALUES:
        clean_access_status = "expired"
    clean_access_managed_by = (access_managed_by or "stripe").strip()
    if clean_access_managed_by not in ACCESS_MANAGED_BY_VALUES:
        clean_access_managed_by = "stripe"
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (
                email,
                full_name,
                password_hash,
                cpf_encrypted,
                role,
                access_status,
                expires_at,
                access_managed_by,
                access_updated_at,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                email,
                full_name,
                password_hash,
                cpf_encrypted,
                clean_role,
                clean_access_status,
                expires_at,
                clean_access_managed_by,
                now,
                now,
                now,
            ),
        )
        row = conn.execute(
            """
            SELECT id, email, full_name, password_hash, stripe_customer_id, cpf_encrypted, role, is_active,
                   last_login_at, access_status, expires_at, access_managed_by, access_updated_at, created_at, updated_at
            FROM users
            WHERE id = ?
            """,
            (cur.lastrowid,),
        ).fetchone()
        conn.commit()
        return _row_to_dict(row) or {}


def get_user_by_email(email: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, email, full_name, password_hash, stripe_customer_id, cpf_encrypted, role, is_active,
                   last_login_at, access_status, expires_at, access_managed_by, access_updated_at, created_at, updated_at
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()
        return _row_to_dict(row)


def get_user_by_id(user_id: int) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, email, full_name, password_hash, stripe_customer_id, cpf_encrypted, role, is_active,
                   last_login_at, access_status, expires_at, access_managed_by, access_updated_at, created_at, updated_at
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()
        return _row_to_dict(row)


def get_user_by_stripe_customer_id(stripe_customer_id: str) -> dict | None:
    customer_id = (stripe_customer_id or "").strip()
    if not customer_id:
        return None
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, email, full_name, password_hash, stripe_customer_id, cpf_encrypted, role, is_active,
                   last_login_at, access_status, expires_at, access_managed_by, access_updated_at, created_at, updated_at
            FROM users
            WHERE stripe_customer_id = ?
            LIMIT 1
            """,
            (customer_id,),
        ).fetchone()
        return _row_to_dict(row)


def create_session(user_id: int, token_hash: str, expires_at: int) -> None:
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO user_sessions (user_id, token_hash, created_at, expires_at, last_seen_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, token_hash, now, expires_at, now),
        )
        conn.commit()


def get_session_with_user(token_hash: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT
                s.id AS session_id,
                s.user_id AS session_user_id,
                s.expires_at AS session_expires_at,
                s.last_seen_at,
                u.id AS user_id,
                u.email,
                u.full_name,
                u.password_hash,
                u.stripe_customer_id,
                u.cpf_encrypted,
                u.role,
                u.is_active,
                u.last_login_at,
                u.access_status,
                u.expires_at AS user_expires_at,
                u.access_managed_by,
                u.access_updated_at
            FROM user_sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ?
            LIMIT 1
            """,
            (token_hash,),
        ).fetchone()
        return _row_to_dict(row)


def touch_session(token_hash: str) -> None:
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            "UPDATE user_sessions SET last_seen_at = ? WHERE token_hash = ?",
            (now, token_hash),
        )
        conn.commit()


def delete_session(token_hash: str) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM user_sessions WHERE token_hash = ?", (token_hash,))
        conn.commit()


def expire_admin_impersonation_sessions(now_ts: int | None = None) -> int:
    now = now_ts or int(time.time())
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT impersonation_token_hash
            FROM admin_impersonation_sessions
            WHERE stopped_at IS NULL AND expires_at <= ?
            """,
            (now,),
        ).fetchall()
        token_hashes = [str(row["impersonation_token_hash"]) for row in rows if row and row["impersonation_token_hash"]]
        if token_hashes:
            placeholders = ",".join(["?"] * len(token_hashes))
            conn.execute(
                f"""
                UPDATE admin_impersonation_sessions
                SET stopped_at = ?, stop_reason = ?
                WHERE impersonation_token_hash IN ({placeholders})
                """,
                [now, "ttl_expired", *token_hashes],
            )
            conn.execute(
                f"DELETE FROM user_sessions WHERE token_hash IN ({placeholders})",
                token_hashes,
            )
        changed = conn.total_changes
        conn.commit()
        return int(changed)


def create_admin_impersonation_session(
    *,
    admin_user_id: int,
    target_user_id: int,
    admin_token_hash: str,
    impersonation_token_hash: str,
    expires_at: int,
    started_ip: str | None = None,
    started_user_agent: str | None = None,
) -> dict:
    now = int(time.time())
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO admin_impersonation_sessions (
                admin_user_id,
                target_user_id,
                admin_token_hash,
                impersonation_token_hash,
                started_at,
                expires_at,
                started_ip,
                started_user_agent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                admin_user_id,
                target_user_id,
                (admin_token_hash or "").strip(),
                (impersonation_token_hash or "").strip(),
                now,
                int(expires_at),
                (started_ip or "").strip() or None,
                (started_user_agent or "").strip() or None,
            ),
        )
        row = conn.execute(
            """
            SELECT id, admin_user_id, target_user_id, admin_token_hash, impersonation_token_hash, started_at, expires_at,
                   stopped_at, started_ip, started_user_agent, stopped_ip, stopped_user_agent, stop_reason
            FROM admin_impersonation_sessions
            WHERE id = ?
            LIMIT 1
            """,
            (cur.lastrowid,),
        ).fetchone()
        conn.commit()
        return _row_to_dict(row) or {}


def get_active_impersonation_by_token_hash(
    impersonation_token_hash: str,
    *,
    now_ts: int | None = None,
) -> dict | None:
    token_hash = (impersonation_token_hash or "").strip()
    if not token_hash:
        return None
    now = now_ts or int(time.time())
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT
                s.id,
                s.admin_user_id,
                s.target_user_id,
                s.admin_token_hash,
                s.impersonation_token_hash,
                s.started_at,
                s.expires_at,
                s.stopped_at,
                s.started_ip,
                s.started_user_agent,
                s.stopped_ip,
                s.stopped_user_agent,
                s.stop_reason,
                admin_u.email AS admin_email,
                admin_u.full_name AS admin_full_name,
                target_u.email AS target_email,
                target_u.full_name AS target_full_name,
                target_u.role AS target_role
            FROM admin_impersonation_sessions s
            JOIN users admin_u ON admin_u.id = s.admin_user_id
            JOIN users target_u ON target_u.id = s.target_user_id
            WHERE s.impersonation_token_hash = ?
              AND s.stopped_at IS NULL
              AND s.expires_at > ?
            LIMIT 1
            """,
            (token_hash, now),
        ).fetchone()
        return _row_to_dict(row)


def stop_admin_impersonation_by_token_hash(
    impersonation_token_hash: str,
    *,
    stop_reason: str = "manual_stop",
    stopped_ip: str | None = None,
    stopped_user_agent: str | None = None,
    stopped_at: int | None = None,
) -> dict | None:
    token_hash = (impersonation_token_hash or "").strip()
    if not token_hash:
        return None
    reason = (stop_reason or "manual_stop").strip()
    if reason not in IMPERSONATION_STOP_REASON_VALUES:
        reason = "manual_stop"
    now = stopped_at or int(time.time())

    with _connect() as conn:
        conn.execute(
            """
            UPDATE admin_impersonation_sessions
            SET stopped_at = ?, stopped_ip = ?, stopped_user_agent = ?, stop_reason = ?
            WHERE impersonation_token_hash = ? AND stopped_at IS NULL
            """,
            (
                now,
                (stopped_ip or "").strip() or None,
                (stopped_user_agent or "").strip() or None,
                reason,
                token_hash,
            ),
        )
        changed = conn.total_changes > 0
        row = conn.execute(
            """
            SELECT
                s.id,
                s.admin_user_id,
                s.target_user_id,
                s.admin_token_hash,
                s.impersonation_token_hash,
                s.started_at,
                s.expires_at,
                s.stopped_at,
                s.started_ip,
                s.started_user_agent,
                s.stopped_ip,
                s.stopped_user_agent,
                s.stop_reason,
                admin_u.email AS admin_email,
                target_u.email AS target_email
            FROM admin_impersonation_sessions s
            JOIN users admin_u ON admin_u.id = s.admin_user_id
            JOIN users target_u ON target_u.id = s.target_user_id
            WHERE s.impersonation_token_hash = ?
            LIMIT 1
            """,
            (token_hash,),
        ).fetchone()
        if changed:
            conn.execute("DELETE FROM user_sessions WHERE token_hash = ?", (token_hash,))
        conn.commit()
        data = _row_to_dict(row)
        if isinstance(data, dict):
            data["updated"] = bool(changed)
        return data


def update_user_password(user_id: int, password_hash: str) -> None:
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (password_hash, now, user_id),
        )
        conn.commit()


def update_user_full_name(user_id: int, full_name: str | None) -> None:
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            "UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?",
            (full_name, now, user_id),
        )
        conn.commit()


def create_password_reset_token(
    user_id: int,
    token_hash: str,
    expires_at: int,
    requested_ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at, requested_ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, token_hash, expires_at, now, requested_ip or None, user_agent or None),
        )
        conn.commit()


def get_password_reset_token_by_hash(token_hash: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, token_hash, expires_at, used_at, created_at, requested_ip, user_agent
            FROM password_reset_tokens
            WHERE token_hash = ?
            LIMIT 1
            """,
            (token_hash,),
        ).fetchone()
        return _row_to_dict(row)


def mark_password_reset_token_used(token_id: int, used_at: int | None = None) -> None:
    now = used_at or int(time.time())
    with _connect() as conn:
        conn.execute(
            "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
            (now, token_id),
        )
        conn.commit()


def invalidate_user_reset_tokens(user_id: int) -> None:
    with _connect() as conn:
        conn.execute(
            "DELETE FROM password_reset_tokens WHERE user_id = ? AND (used_at IS NULL OR used_at = 0)",
            (user_id,),
        )
        conn.commit()


def count_recent_reset_requests(user_id: int, within_seconds: int = 3600) -> int:
    cutoff = int(time.time()) - within_seconds
    with _connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM password_reset_tokens WHERE user_id = ? AND created_at >= ?",
            (user_id, cutoff),
        ).fetchone()
        return int(row["n"] if row else 0)


def delete_expired_sessions(now_ts: int | None = None) -> None:
    now = now_ts or int(time.time())
    with _connect() as conn:
        conn.execute("DELETE FROM user_sessions WHERE expires_at <= ?", (now,))
        conn.commit()


def update_user_last_login(user_id: int, last_login_at: int | None = None) -> None:
    ts = int(last_login_at or time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET last_login_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (ts, ts, user_id),
        )
        conn.commit()


def set_user_role(user_id: int, role: str) -> None:
    clean_role = (role or "").strip() or "student"
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET role = ?, updated_at = ?
            WHERE id = ?
            """,
            (clean_role, now, user_id),
        )
        conn.commit()


def set_user_role_by_email(email: str, role: str) -> bool:
    clean_email = (email or "").strip().lower()
    if not clean_email:
        return False
    clean_role = (role or "").strip() or "student"
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET role = ?, updated_at = ?
            WHERE email = ?
            """,
            (clean_role, now, clean_email),
        )
        changed = conn.total_changes > 0
        conn.commit()
        return changed


def update_user_access_state(
    user_id: int,
    *,
    access_status: str | None = None,
    expires_at: int | None | object = _UNSET,
    access_managed_by: str | None = None,
    access_updated_at: int | None = None,
) -> dict | None:
    now = int(access_updated_at or time.time())
    updates: list[str] = []
    params: list[Any] = []

    if access_status is not None:
        clean_status = (access_status or "").strip()
        if clean_status not in ACCESS_STATUS_VALUES:
            raise ValueError("Invalid access status")
        updates.append("access_status = ?")
        params.append(clean_status)

    if expires_at is not _UNSET:
        updates.append("expires_at = ?")
        params.append(expires_at if expires_at is None else int(expires_at))

    if access_managed_by is not None:
        clean_managed_by = (access_managed_by or "").strip()
        if clean_managed_by not in ACCESS_MANAGED_BY_VALUES:
            raise ValueError("Invalid access managed by")
        updates.append("access_managed_by = ?")
        params.append(clean_managed_by)

    updates.append("access_updated_at = ?")
    params.append(now)
    updates.append("updated_at = ?")
    params.append(now)
    params.append(user_id)

    with _connect() as conn:
        conn.execute(
            f"""
            UPDATE users
            SET {", ".join(updates)}
            WHERE id = ?
            """,
            params,
        )
        row = conn.execute(
            """
            SELECT id, email, full_name, password_hash, stripe_customer_id, cpf_encrypted, role, is_active,
                   last_login_at, access_status, expires_at, access_managed_by, access_updated_at, created_at, updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        conn.commit()
        return _row_to_dict(row)


def create_admin_audit_log(
    admin_id: int,
    target_user_id: int,
    action_type: str,
    reason: str,
    before: dict[str, Any] | None,
    after: dict[str, Any] | None,
) -> dict:
    now = int(time.time())
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO admin_audit_logs (
                admin_id, target_user_id, action_type, reason, before_json, after_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                admin_id,
                target_user_id,
                (action_type or "").strip() or "unknown",
                (reason or "").strip(),
                _encode_json_object(before),
                _encode_json_object(after),
                now,
            ),
        )
        row = conn.execute(
            """
            SELECT id, admin_id, target_user_id, action_type, reason, before_json, after_json, created_at
            FROM admin_audit_logs
            WHERE id = ?
            LIMIT 1
            """,
            (cur.lastrowid,),
        ).fetchone()
        conn.commit()
        data = _row_to_dict(row) or {}
        data["before"] = _decode_json_object(data.get("before_json"))
        data["after"] = _decode_json_object(data.get("after_json"))
        return data


def list_recent_sessions_for_user(user_id: int, limit: int = 10) -> list[dict]:
    safe_limit = max(1, min(50, int(limit)))
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, user_id, created_at, expires_at, last_seen_at
            FROM user_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, safe_limit),
        ).fetchall()
        return [_row_to_dict(row) or {} for row in rows]


def _decode_progress(progress_json: str | None) -> dict:
    if not progress_json:
        return {}
    try:
        parsed = json.loads(progress_json)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def get_lesson_progress(user_id: int, lesson_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT user_id, lesson_id, progress_json, is_completed, created_at, updated_at
            FROM lesson_progress
            WHERE user_id = ? AND lesson_id = ?
            LIMIT 1
            """,
            (user_id, lesson_id),
        ).fetchone()
        if not row:
            return None
        data = _row_to_dict(row) or {}
        data["progress"] = _decode_progress(data.get("progress_json"))
        return data


def upsert_lesson_progress(user_id: int, lesson_id: str, progress: dict, is_completed: bool) -> dict:
    now = int(time.time())
    progress_obj = progress if isinstance(progress, dict) else {}
    progress_json = json.dumps(progress_obj, ensure_ascii=False)

    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO lesson_progress (user_id, lesson_id, progress_json, is_completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, lesson_id)
            DO UPDATE SET
                progress_json = excluded.progress_json,
                is_completed = excluded.is_completed,
                updated_at = excluded.updated_at
            """,
            (user_id, lesson_id, progress_json, 1 if is_completed else 0, now, now),
        )
        row = conn.execute(
            """
            SELECT user_id, lesson_id, progress_json, is_completed, created_at, updated_at
            FROM lesson_progress
            WHERE user_id = ? AND lesson_id = ?
            LIMIT 1
            """,
            (user_id, lesson_id),
        ).fetchone()
        conn.commit()

    data = _row_to_dict(row) or {}
    data["progress"] = _decode_progress(data.get("progress_json"))
    return data


def list_progress_for_lessons(user_id: int, lesson_ids: list[str]) -> dict[str, dict]:
    if not lesson_ids:
        return {}

    unique_ids = [lesson_id for lesson_id in dict.fromkeys(lesson_ids) if lesson_id]
    if not unique_ids:
        return {}

    placeholders = ",".join(["?"] * len(unique_ids))
    params = [user_id, *unique_ids]

    with _connect() as conn:
        rows = conn.execute(
            f"""
            SELECT user_id, lesson_id, progress_json, is_completed, created_at, updated_at
            FROM lesson_progress
            WHERE user_id = ? AND lesson_id IN ({placeholders})
            """,
            params,
        ).fetchall()

    result = {}
    for row in rows:
        data = _row_to_dict(row) or {}
        lesson_id = data.get("lesson_id")
        if not lesson_id:
            continue
        data["progress"] = _decode_progress(data.get("progress_json"))
        result[str(lesson_id)] = data
    return result


def _decode_checkout_signup_intent_row(row: sqlite3.Row | None) -> dict | None:
    return _row_to_dict(row)


def create_checkout_signup_intent(
    email: str,
    password_hash: str,
    course_id: str,
    expires_at: int,
    status: str = "created",
) -> dict:
    now = int(time.time())
    intent_id = str(uuid.uuid4())
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO checkout_signup_intents (
                id, email, password_hash, course_id, status, created_at, expires_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (intent_id, email, password_hash, course_id, status, now, expires_at),
        )
        row = conn.execute(
            """
            SELECT id, email, password_hash, course_id, status, stripe_checkout_session_id, created_at, expires_at
            FROM checkout_signup_intents
            WHERE id = ?
            LIMIT 1
            """,
            (intent_id,),
        ).fetchone()
        conn.commit()
        return _decode_checkout_signup_intent_row(row) or {}


def get_checkout_signup_intent_by_id(intent_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, email, password_hash, course_id, status, stripe_checkout_session_id, created_at, expires_at
            FROM checkout_signup_intents
            WHERE id = ?
            LIMIT 1
            """,
            (intent_id,),
        ).fetchone()
        return _decode_checkout_signup_intent_row(row)


def get_checkout_signup_intent_by_session_id(session_id: str) -> dict | None:
    if not session_id:
        return None
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, email, password_hash, course_id, status, stripe_checkout_session_id, created_at, expires_at
            FROM checkout_signup_intents
            WHERE stripe_checkout_session_id = ?
            LIMIT 1
            """,
            (session_id,),
        ).fetchone()
        return _decode_checkout_signup_intent_row(row)


def mark_checkout_signup_intent_session_created(
    intent_id: str,
    stripe_checkout_session_id: str,
) -> dict | None:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE checkout_signup_intents
            SET status = 'session_created',
                stripe_checkout_session_id = ?
            WHERE id = ? AND status != 'completed'
            """,
            (stripe_checkout_session_id, intent_id),
        )
        row = conn.execute(
            """
            SELECT id, email, password_hash, course_id, status, stripe_checkout_session_id, created_at, expires_at
            FROM checkout_signup_intents
            WHERE id = ?
            LIMIT 1
            """,
            (intent_id,),
        ).fetchone()
        conn.commit()
        return _decode_checkout_signup_intent_row(row)


def mark_checkout_signup_intent_completed(intent_id: str) -> tuple[dict | None, bool]:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE checkout_signup_intents
            SET status = 'completed'
            WHERE id = ? AND status != 'completed'
            """,
            (intent_id,),
        )
        updated = conn.total_changes > 0
        row = conn.execute(
            """
            SELECT id, email, password_hash, course_id, status, stripe_checkout_session_id, created_at, expires_at
            FROM checkout_signup_intents
            WHERE id = ?
            LIMIT 1
            """,
            (intent_id,),
        ).fetchone()
        conn.commit()
        return _decode_checkout_signup_intent_row(row), updated


def expire_old_checkout_signup_intents(now_ts: int | None = None) -> int:
    now = now_ts or int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE checkout_signup_intents
            SET status = 'expired'
            WHERE status IN ('created', 'session_created')
              AND expires_at <= ?
            """,
            (now,),
        )
        updated = conn.total_changes
        conn.commit()
        return updated


def _decode_purchase_row(row: sqlite3.Row | None) -> dict | None:
    data = _row_to_dict(row)
    if not data:
        return None
    data["metadata"] = _decode_json_object(data.get("metadata"))
    return data


def update_user_stripe_customer_id(user_id: int, stripe_customer_id: str) -> None:
    customer_id = (stripe_customer_id or "").strip()
    if not customer_id:
        return
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET stripe_customer_id = ?, updated_at = ?
            WHERE id = ?
            """,
            (customer_id, now, user_id),
        )
        conn.commit()


def update_user_cpf_if_empty(user_id: int, cpf_encrypted: str) -> None:
    cpf = (cpf_encrypted or "").strip()
    if not cpf:
        return
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE users
            SET cpf_encrypted = ?, updated_at = ?
            WHERE id = ? AND (cpf_encrypted IS NULL OR cpf_encrypted = '')
            """,
            (cpf, now, user_id),
        )
        conn.commit()


def create_purchase(
    user_id: int,
    course_id: str,
    status: str = "pending",
    metadata: dict[str, Any] | None = None,
) -> dict:
    now = int(time.time())
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO purchases (user_id, course_id, status, created_at, metadata)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, course_id, status, now, _encode_json_object(metadata)),
        )
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (cur.lastrowid,),
        ).fetchone()
        conn.commit()
        return _decode_purchase_row(row) or {}


def get_purchase_by_id(purchase_id: int) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        return _decode_purchase_row(row)


def get_purchase_by_checkout_session_id(session_id: str) -> dict | None:
    if not session_id:
        return None
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata
            FROM purchases
            WHERE stripe_checkout_session_id = ?
            LIMIT 1
            """,
            (session_id,),
        ).fetchone()
        return _decode_purchase_row(row)


def get_purchase_by_payment_intent_id(payment_intent_id: str) -> dict | None:
    if not payment_intent_id:
        return None
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata,
                   stripe_refund_id, refund_reason
            FROM purchases
            WHERE stripe_payment_intent_id = ?
            LIMIT 1
            """,
            (payment_intent_id,),
        ).fetchone()
        return _decode_purchase_row(row)


def get_latest_purchase_for_user(user_id: int, course_id: str) -> dict | None:
    """Return the latest paid or refunded purchase for the user and course (for account display)."""
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata,
                   stripe_refund_id, refund_reason
            FROM purchases
            WHERE user_id = ? AND course_id = ? AND status IN ('paid', 'refunded')
            ORDER BY COALESCE(paid_at, created_at) DESC
            LIMIT 1
            """,
            (user_id, course_id),
        ).fetchone()
        return _decode_purchase_row(row)


def get_latest_purchase_for_user_any_status(user_id: int, course_id: str | None = None) -> dict | None:
    with _connect() as conn:
        if course_id:
            row = conn.execute(
                """
                SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                       amount, currency, created_at, paid_at, refunded_at, metadata,
                       stripe_refund_id, refund_reason
                FROM purchases
                WHERE user_id = ? AND course_id = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (user_id, course_id),
            ).fetchone()
        else:
            row = conn.execute(
                """
                SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                       amount, currency, created_at, paid_at, refunded_at, metadata,
                       stripe_refund_id, refund_reason
                FROM purchases
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (user_id,),
            ).fetchone()
        return _decode_purchase_row(row)


def list_purchases_for_user(user_id: int, limit: int = 20) -> list[dict]:
    safe_limit = max(1, min(100, int(limit)))
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata,
                   stripe_refund_id, refund_reason
            FROM purchases
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, safe_limit),
        ).fetchall()
        return [_decode_purchase_row(row) or {} for row in rows]


def update_purchase_status(
    purchase_id: int,
    status: str,
    metadata: dict[str, Any] | None = None,
) -> dict | None:
    with _connect() as conn:
        current = conn.execute(
            """
            SELECT id, metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        if not current:
            return None
        current_meta = _decode_json_object((current["metadata"] if current else None))
        merged_meta = {**current_meta, **(metadata or {})}
        conn.execute(
            """
            UPDATE purchases
            SET status = ?, metadata = ?
            WHERE id = ?
            """,
            (status, _encode_json_object(merged_meta), purchase_id),
        )
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        conn.commit()
        return _decode_purchase_row(row)


def attach_checkout_session_to_purchase(
    purchase_id: int,
    stripe_checkout_session_id: str,
    metadata: dict[str, Any] | None = None,
) -> dict | None:
    with _connect() as conn:
        current = conn.execute(
            """
            SELECT metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        if not current:
            return None
        current_meta = _decode_json_object((current["metadata"] if current else None))
        merged_meta = {**current_meta, **(metadata or {})}
        conn.execute(
            """
            UPDATE purchases
            SET stripe_checkout_session_id = ?, metadata = ?
            WHERE id = ?
            """,
            (stripe_checkout_session_id, _encode_json_object(merged_meta), purchase_id),
        )
        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        conn.commit()
        return _decode_purchase_row(row)


def mark_purchase_paid(
    purchase_id: int,
    stripe_checkout_session_id: str | None,
    stripe_payment_intent_id: str | None,
    amount: int | None,
    currency: str | None,
    paid_at: int,
    metadata: dict[str, Any] | None = None,
) -> tuple[dict | None, bool]:
    with _connect() as conn:
        current = conn.execute(
            """
            SELECT status, metadata, stripe_checkout_session_id, stripe_payment_intent_id
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        if not current:
            return None, False

        current_meta = _decode_json_object((current["metadata"] if current else None))
        merged_meta = {**current_meta, **(metadata or {})}
        conn.execute(
            """
            UPDATE purchases
            SET
                status = 'paid',
                stripe_checkout_session_id = COALESCE(?, stripe_checkout_session_id),
                stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
                amount = COALESCE(?, amount),
                currency = COALESCE(?, currency),
                paid_at = COALESCE(paid_at, ?),
                metadata = ?,
                refunded_at = NULL
            WHERE id = ? AND status != 'paid'
            """,
            (
                stripe_checkout_session_id,
                stripe_payment_intent_id,
                amount,
                currency,
                paid_at,
                _encode_json_object(merged_meta),
                purchase_id,
            ),
        )
        updated = conn.total_changes > 0

        if not updated:
            # Keep metadata merged even if this is a duplicate event.
            conn.execute(
                "UPDATE purchases SET metadata = ? WHERE id = ?",
                (_encode_json_object(merged_meta), purchase_id),
            )

        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        conn.commit()
        return _decode_purchase_row(row), updated


def upsert_access_grant(
    user_id: int,
    course_id: str,
    starts_at: int,
    expires_at: int,
) -> dict:
    now = int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO access_grants (user_id, course_id, starts_at, expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, course_id)
            DO UPDATE SET
                starts_at = excluded.starts_at,
                expires_at = excluded.expires_at,
                updated_at = excluded.updated_at
            """,
            (user_id, course_id, starts_at, expires_at, now, now),
        )
        row = conn.execute(
            """
            SELECT id, user_id, course_id, starts_at, expires_at, created_at, updated_at
            FROM access_grants
            WHERE user_id = ? AND course_id = ?
            LIMIT 1
            """,
            (user_id, course_id),
        ).fetchone()
        conn.commit()
        return _row_to_dict(row) or {}


def get_active_access_grant(user_id: int, course_id: str, now_ts: int | None = None) -> dict | None:
    now = now_ts or int(time.time())
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, course_id, starts_at, expires_at, created_at, updated_at
            FROM access_grants
            WHERE user_id = ? AND course_id = ? AND starts_at <= ? AND expires_at > ?
            LIMIT 1
            """,
            (user_id, course_id, now, now),
        ).fetchone()
        return _row_to_dict(row)


def get_access_grant(user_id: int, course_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, course_id, starts_at, expires_at, created_at, updated_at
            FROM access_grants
            WHERE user_id = ? AND course_id = ?
            LIMIT 1
            """,
            (user_id, course_id),
        ).fetchone()
        return _row_to_dict(row)


def revoke_access_grant(user_id: int, course_id: str, revoked_at: int | None = None) -> None:
    now = revoked_at or int(time.time())
    with _connect() as conn:
        conn.execute(
            """
            UPDATE access_grants
            SET expires_at = CASE WHEN expires_at > ? THEN ? ELSE expires_at END,
                updated_at = ?
            WHERE user_id = ? AND course_id = ?
            """,
            (now, now, now, user_id, course_id),
        )
        conn.commit()


def mark_purchase_refunded_by_payment_intent(
    stripe_payment_intent_id: str,
    refunded_at: int | None = None,
    metadata: dict[str, Any] | None = None,
    stripe_refund_id: str | None = None,
    refund_reason: str | None = None,
) -> tuple[dict | None, bool]:
    payment_intent_id = (stripe_payment_intent_id or "").strip()
    if not payment_intent_id:
        return None, False

    now = refunded_at or int(time.time())
    with _connect() as conn:
        current = conn.execute(
            """
            SELECT id, user_id, course_id, metadata
            FROM purchases
            WHERE stripe_payment_intent_id = ?
            LIMIT 1
            """,
            (payment_intent_id,),
        ).fetchone()
        if not current:
            return None, False

        purchase_id = int(current["id"])
        user_id = int(current["user_id"])
        course_id = str(current["course_id"])
        current_meta = _decode_json_object((current["metadata"] if current else None))
        merged_meta = {**current_meta, **(metadata or {})}

        conn.execute(
            """
            UPDATE purchases
            SET status = 'refunded',
                refunded_at = COALESCE(refunded_at, ?),
                metadata = ?,
                stripe_refund_id = COALESCE(?, stripe_refund_id),
                refund_reason = COALESCE(?, refund_reason)
            WHERE id = ? AND status != 'refunded'
            """,
            (
                now,
                _encode_json_object(merged_meta),
                (stripe_refund_id or "").strip() or None,
                (refund_reason or "").strip() or None,
                purchase_id,
            ),
        )
        updated = conn.total_changes > 0

        if updated:
            conn.execute(
                """
                UPDATE access_grants
                SET expires_at = CASE WHEN expires_at > ? THEN ? ELSE expires_at END,
                    updated_at = ?
                WHERE user_id = ? AND course_id = ?
                """,
                (now, now, now, user_id, course_id),
            )

        row = conn.execute(
            """
            SELECT id, user_id, course_id, status, stripe_checkout_session_id, stripe_payment_intent_id,
                   amount, currency, created_at, paid_at, refunded_at, metadata,
                   stripe_refund_id, refund_reason
            FROM purchases
            WHERE id = ?
            LIMIT 1
            """,
            (purchase_id,),
        ).fetchone()
        conn.commit()
        return _decode_purchase_row(row), updated
