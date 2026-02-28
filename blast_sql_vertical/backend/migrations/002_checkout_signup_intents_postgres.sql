BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS cpf_encrypted TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'checkout_signup_intent_status'
          AND n.nspname = current_schema()
    ) THEN
        CREATE TYPE checkout_signup_intent_status AS ENUM (
            'created',
            'session_created',
            'completed',
            'expired'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS checkout_signup_intents (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status checkout_signup_intent_status NOT NULL DEFAULT 'created',
    stripe_checkout_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkout_signup_intents_email
ON checkout_signup_intents(email);

CREATE INDEX IF NOT EXISTS idx_checkout_signup_intents_status_expires
ON checkout_signup_intents(status, expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_signup_intents_session_id
ON checkout_signup_intents(stripe_checkout_session_id);

COMMIT;
