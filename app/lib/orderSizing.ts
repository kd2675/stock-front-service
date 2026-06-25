import type { OrderSide, OrderType } from "@/app/types/stock";

export const ASSET_PERCENT_OPTIONS = [10, 25, 50, 100] as const;

export function resolveOrderSizingPrice({
  currentPrice,
  limitPrice,
  orderType,
}: {
  currentPrice?: number | null;
  limitPrice: string;
  orderType: OrderType;
}): { price: number; normalizedLimitPrice?: string } | null {
  if (orderType === "LIMIT") {
    const parsedLimitPrice = parseStrictPositiveNumber(limitPrice);
    if (parsedLimitPrice !== null) {
      return { price: parsedLimitPrice };
    }
  }

  if (currentPrice !== undefined && currentPrice !== null && Number.isFinite(currentPrice) && currentPrice > 0) {
    return {
      price: currentPrice,
      normalizedLimitPrice: orderType === "LIMIT" ? String(Math.round(currentPrice)) : undefined,
    };
  }

  return null;
}

export function calculateAssetPercentQuantity({
  availableCash,
  availableSellQuantity,
  percent,
  price,
  side,
  totalAsset,
}: {
  availableCash?: number | null;
  availableSellQuantity?: number | null;
  percent: number;
  price: number;
  side: OrderSide;
  totalAsset?: number | null;
}): number | null {
  if (!Number.isFinite(percent) || percent <= 0) {
    return null;
  }

  if (side === "BUY") {
    if (!Number.isFinite(price) || price <= 0 || totalAsset === undefined || totalAsset === null || !Number.isFinite(totalAsset) || totalAsset <= 0) {
      return null;
    }
    if (availableCash === undefined || availableCash === null || !Number.isFinite(availableCash) || availableCash <= 0) {
      return 0;
    }
    const targetAmount = totalAsset * (percent / 100);
    return Math.floor(Math.min(targetAmount, availableCash) / price);
  }

  if (availableSellQuantity === undefined || availableSellQuantity === null || !Number.isFinite(availableSellQuantity) || availableSellQuantity <= 0) {
    return 0;
  }
  return Math.min(availableSellQuantity, Math.floor(availableSellQuantity * (percent / 100)));
}

function parseStrictPositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
