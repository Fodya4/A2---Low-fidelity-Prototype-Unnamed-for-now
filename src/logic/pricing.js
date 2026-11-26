// A fake price built from real performance: "better" subjects are worth more.
// Ranges from $39.99 (did nothing right) to $164.99 (perfect, fast run).
export function priceFor(profile) {
  const base = 39;
  const compliance = profile.compliance * 80; // up to +$80
  const rounds = profile.roundsPassed * 6; // up to +$30
  const fast =
    profile.avgResponseMs !== null && profile.avgResponseMs < 2000 ? 15 : 0;
  return Math.round(base + compliance + rounds + fast) + 0.99;
}

export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}
