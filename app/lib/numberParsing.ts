export function parseIntegerInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePositiveIntegerInput(value: string): number | null {
  const parsed = parseIntegerInput(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function parsePositiveNumberInput(value: string): number | null {
  const parsed = parseNumberInput(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function isPositiveFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
