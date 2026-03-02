BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS purchase_email_events (
    stripe_event_id TEXT PRIMARY KEY,
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    purchase_id INTEGER,
    user_id INTEGER,
    email TEXT,
    event_type TEXT NOT NULL,
    processed_at INTEGER,
    email_sent_at INTEGER,
    email_provider_message_id TEXT,
    email_error TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_email_events_session_id
ON purchase_email_events(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_purchase_email_events_purchase_id
ON purchase_email_events(purchase_id);

CREATE INDEX IF NOT EXISTS idx_purchase_email_events_processed_at
ON purchase_email_events(processed_at);

COMMIT;
