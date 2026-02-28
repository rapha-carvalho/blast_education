BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_status TEXT NOT NULL DEFAULT 'expired';
ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_managed_by TEXT NOT NULL DEFAULT 'stripe';
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_updated_at BIGINT;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_access_status ON users(access_status);
CREATE INDEX IF NOT EXISTS idx_users_expires_at ON users(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    before_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created
ON admin_audit_logs(target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created
ON admin_audit_logs(admin_id, created_at DESC);

UPDATE users
SET role = CASE
    WHEN role IS NULL OR BTRIM(role) = '' THEN 'student'
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

COMMIT;