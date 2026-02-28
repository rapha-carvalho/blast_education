BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users(stripe_customer_id);

CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    status TEXT NOT NULL,
    stripe_checkout_session_id TEXT,
    stripe_payment_intent_id TEXT,
    amount BIGINT,
    currency TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_checkout_session_id
ON purchases(stripe_checkout_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_payment_intent_id
ON purchases(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_purchases_user_status
ON purchases(user_id, status);

CREATE INDEX IF NOT EXISTS idx_purchases_created_at
ON purchases(created_at DESC);

CREATE TABLE IF NOT EXISTS access_grants (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_access_grants_user_course
ON access_grants(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_access_grants_expires_at
ON access_grants(expires_at);

COMMIT;
