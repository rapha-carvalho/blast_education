BEGIN;

CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_token_hash TEXT NOT NULL,
    impersonation_token_hash TEXT UNIQUE NOT NULL,
    started_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    stopped_at BIGINT,
    started_ip TEXT,
    started_user_agent TEXT,
    stopped_ip TEXT,
    stopped_user_agent TEXT,
    stop_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_token
ON admin_impersonation_sessions(impersonation_token_hash);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_admin_active
ON admin_impersonation_sessions(admin_user_id, stopped_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_target_active
ON admin_impersonation_sessions(target_user_id, stopped_at, expires_at);

COMMIT;
