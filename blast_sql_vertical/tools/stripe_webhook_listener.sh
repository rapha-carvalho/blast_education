#!/bin/sh
set -eu
set -o pipefail

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "[stripe-listener] STRIPE_SECRET_KEY is empty; listener will not start."
  exit 0
fi

FORWARD_TO="${STRIPE_WEBHOOK_FORWARD_TO:-http://backend:8000/billing/stripe-webhook}"
EVENTS="${STRIPE_WEBHOOK_FORWARD_EVENTS:-checkout.session.completed,payment_intent.succeeded,charge.refunded}"
SECRET_FILE="${STRIPE_WEBHOOK_SECRET_FILE:-/shared/stripe_webhook_secret.txt}"

mkdir -p "$(dirname "$SECRET_FILE")"

echo "[stripe-listener] forwarding events to $FORWARD_TO"
echo "[stripe-listener] events: $EVENTS"

stripe listen \
  --api-key "$STRIPE_SECRET_KEY" \
  --events "$EVENTS" \
  --forward-to "$FORWARD_TO" 2>&1 | while IFS= read -r line; do
    echo "$line"
    secret="$(echo "$line" | sed -n 's/.*\(whsec_[A-Za-z0-9_]*\).*/\1/p')"
    if [ -n "$secret" ]; then
      printf '%s\n' "$secret" > "$SECRET_FILE"
      chmod 600 "$SECRET_FILE" || true
      echo "[stripe-listener] webhook secret updated at $SECRET_FILE"
    fi
  done
