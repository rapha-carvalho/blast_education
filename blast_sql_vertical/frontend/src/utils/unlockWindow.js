export function getDaysSincePurchase(purchaseAt) {
  const timestamp = Number(purchaseAt);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 0;
  return Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 86400));
}

export function getDaysUntilUnlock(purchaseAt, unlockAfterDays) {
  const requiredDays = Number.isFinite(unlockAfterDays) ? unlockAfterDays : 0;
  if (purchaseAt == null) return requiredDays;
  return Math.max(0, requiredDays - getDaysSincePurchase(purchaseAt));
}

export function formatDaysUntilUnlock(daysUntilUnlock) {
  const safeDays = Math.max(1, Number.isFinite(daysUntilUnlock) ? Math.ceil(daysUntilUnlock) : 1);
  return `${safeDays} ${safeDays === 1 ? "dia" : "dias"}`;
}
