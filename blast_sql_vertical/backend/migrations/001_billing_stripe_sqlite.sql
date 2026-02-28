BEGIN TRANSACTION;

ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_checkout_session_id ON purchases(stripe_checkout_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_payment_intent_id ON purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);

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
);

CREATE INDEX IF NOT EXISTS idx_access_grants_user_course ON access_grants(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_expires_at ON access_grants(expires_at);

COMMIT;
