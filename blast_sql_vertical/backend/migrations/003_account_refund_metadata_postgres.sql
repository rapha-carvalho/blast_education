-- Add refund metadata to purchases for account/refund flow.
-- stripe_refund_id: Stripe refund object id (idempotency, audit)
-- refund_reason: user-provided reason (optional)

BEGIN;

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

COMMIT;
