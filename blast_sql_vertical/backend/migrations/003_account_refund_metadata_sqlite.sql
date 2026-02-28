-- Add refund metadata to purchases for account/refund flow.
-- stripe_refund_id: Stripe refund object id (idempotency, audit)
-- refund_reason: user-provided reason (optional)
-- Run once. init_user_db also ensures columns exist via _column_exists checks.

BEGIN TRANSACTION;

ALTER TABLE purchases ADD COLUMN stripe_refund_id TEXT;
ALTER TABLE purchases ADD COLUMN refund_reason TEXT;

COMMIT;
