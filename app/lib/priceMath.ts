export function calculateChangeRate(currentPrice: number, basePrice: number) {
  if (!Number.isFinite(currentPrice) || !Number.isFinite(basePrice) || basePrice <= 0) {
    return 0;
  }
  return ((currentPrice - basePrice) / basePrice) * 100;
}
