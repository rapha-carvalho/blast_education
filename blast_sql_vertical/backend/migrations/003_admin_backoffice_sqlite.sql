BEGIN TRANSACTION;

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE users ADD COLUMN last_login_at INTEGER;
ALTER TABLE users ADD COLUMN access_status TEXT NOT NULL DEFAULT 'expired';
ALTER TABLE users ADD COLUMN expires_at INTEGER;
ALTER TABLE users ADD COLUMN access_managed_by TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE users ADD COLUMN access_updated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_access_status ON users(access_status);
CREATE INDEX IF NOT EXISTS idx_users_expires_at ON users(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

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
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created
ON admin_audit_logs(target_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created
ON admin_audit_logs(admin_id, created_at);

UPDATE users
SET role = CASE
    WHEN role IS NULL OR TRIM(role) = '' THEN 'student'
    ELSE role
END;

UPDATE users
SET access_status = CASE
    WHEN access_status IN ('active', 'expired', 'refunded', 'canceled', 'blocked', 'manual_grant')
        THEN access_status
    ELSE 'expired'
END;

UPDATE users
SET access_managed_by = CASE
    WHEN access_managed_by IN ('stripe', 'admin') THEN access_managed_by
    ELSE 'stripe'
END;

UPDATE users
SET access_status = 'active',
    expires_at = (
        SELECT ag.expires_at
        FROM access_grants ag
        WHERE ag.user_id = users.id
        ORDER BY ag.updated_at DESC
        LIMIT 1
    ),
    access_managed_by = 'stripe',
    access_updated_at = CAST(strftime('%s', 'now') AS INTEGER),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER)
WHERE access_updated_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM access_grants ag
      WHERE ag.user_id = users.id
        AND ag.expires_at > CAST(strftime('%s', 'now') AS INTEGER)
  );

UPDATE users
SET access_status = 'refunded',
    access_managed_by = 'stripe',
    access_updated_at = CAST(strftime('%s', 'now') AS INTEGER),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER)
WHERE access_updated_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM purchases p
      WHERE p.user_id = users.id
        AND p.status = 'refunded'
  );

UPDATE users
SET access_status = 'expired',
    access_managed_by = 'stripe',
    access_updated_at = CAST(strftime('%s', 'now') AS INTEGER),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER)
WHERE access_updated_at IS NULL;

COMMIT;