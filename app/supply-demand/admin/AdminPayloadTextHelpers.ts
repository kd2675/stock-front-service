export function optionalText(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function normalizeOrderBookSymbol(value: string) {
  return value.trim().toUpperCase();
}
