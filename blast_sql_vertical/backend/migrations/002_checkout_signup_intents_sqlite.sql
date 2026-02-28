BEGIN TRANSACTION;

ALTER TABLE users ADD COLUMN cpf_encrypted TEXT;

CREATE TABLE IF NOT EXISTS checkout_signup_intents (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'session_created', 'completed', 'expired')),
    stripe_checkout_session_id TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkout_signup_intents_email
ON checkout_signup_intents(email);

CREATE INDEX IF NOT EXISTS idx_checkout_signup_intents_status_expires
ON checkout_signup_intents(status, expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_signup_intents_session_id
ON checkout_signup_intents(stripe_checkout_session_id);

COMMIT;
