BEGIN TRANSACTION;

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
);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_token
ON admin_impersonation_sessions(impersonation_token_hash);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_admin_active
ON admin_impersonation_sessions(admin_user_id, stopped_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_target_active
ON admin_impersonation_sessions(target_user_id, stopped_at, expires_at);

COMMIT;
