import type { PriceStreamEvent } from "@/app/types/stock";

export function parsePriceStreamEvent(rawData: string): PriceStreamEvent | null {
  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const currentPrice = toFiniteNumber(record.currentPrice);
    if (
      typeof record.symbol !== "string" ||
      !record.symbol.trim() ||
      currentPrice === null ||
      currentPrice <= 0 ||
      typeof record.priceTime !== "string" ||
      !record.priceTime.trim()
    ) {
      return null;
    }
    return {
      symbol: record.symbol.trim().toUpperCase(),
      currentPrice,
      priceTime: record.priceTime,
      provider: typeof record.provider === "string" && record.provider.trim() ? record.provider : "redis-pubsub",
    };
  } catch {
    return null;
  }
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
