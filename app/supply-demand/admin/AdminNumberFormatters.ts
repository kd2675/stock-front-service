import {
  formatMonthDayTime,
  formatNumber as formatStockNumber,
  formatRoundedPrice,
  formatWon as formatStockWon,
} from "@/app/lib/stockFormatters";

export function formatWon(value: number | null | undefined) {
  return formatStockWon(normalizeFiniteNumber(value));
}

export function formatCompactWon(value: number | null | undefined) {
  const normalizedValue = normalizeFiniteNumber(value);
  const absoluteValue = Math.abs(normalizedValue);
  if (absoluteValue >= 1_000_000_000_000) {
    return `${formatStockNumber(normalizedValue / 1_000_000_000_000)}조원`;
  }
  if (absoluteValue >= 100_000_000) {
    return `${formatStockNumber(normalizedValue / 100_000_000)}억원`;
  }
  return formatStockWon(normalizedValue);
}

export function formatNumber(value: number | null | undefined) {
  return formatStockNumber(normalizeFiniteNumber(value));
}

export function formatInteger(value: number | null | undefined) {
  return formatRoundedPrice(normalizeFiniteNumber(value));
}

export function formatCount(value: number | null | undefined, unit: string) {
  return `${formatInteger(value)}${unit}`;
}

export function formatSignedPercent(value: number | null | undefined) {
  const normalizedValue = normalizeFiniteNumber(value);
  const sign = normalizedValue > 0 ? "+" : "";
  return `${sign}${formatStockNumber(normalizedValue)}%`;
}

export function formatDateTime(value: string | null | undefined) {
  return formatMonthDayTime(value);
}

function normalizeFiniteNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}
