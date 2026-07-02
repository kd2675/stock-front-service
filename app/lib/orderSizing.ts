import type { OrderSide, OrderType } from "@/app/types/stock";
import { isPositiveFiniteNumber, parsePositiveIntegerInput, parsePositiveNumberInput } from "@/app/lib/numberParsing";

export const ASSET_PERCENT_OPTIONS = [10, 25, 50, 100] as const;

export type AssetPercentQuantityFailureReason = "missingSelection" | "missingPrice" | "missingAsset";

export type AssetPercentQuantityResult =
  | {
      ok: true;
      normalizedLimitPrice?: string;
      quantity: number;
    }
  | {
      ok: false;
      reason: AssetPercentQuantityFailureReason;
    };

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
    const parsedLimitPrice = parsePositiveNumberInput(limitPrice);
    if (parsedLimitPrice !== null) {
      return { price: parsedLimitPrice };
    }
  }

  if (isPositiveFiniteNumber(currentPrice)) {
    return {
      price: currentPrice,
      normalizedLimitPrice: orderType === "LIMIT" ? String(Math.round(currentPrice)) : undefined,
    };
  }

  return null;
}

export function resolveAssetPercentQuantity({
  availableCash,
  availableSellQuantity,
  currentPrice,
  hasSelection,
  limitPrice,
  orderType,
  percent,
  side,
  totalAsset,
}: {
  availableCash?: number | null;
  availableSellQuantity?: number | null;
  currentPrice?: number | null;
  hasSelection: boolean;
  limitPrice: string;
  orderType: OrderType;
  percent: number;
  side: OrderSide;
  totalAsset?: number | null;
}): AssetPercentQuantityResult {
  if (!hasSelection) {
    return { ok: false, reason: "missingSelection" };
  }

  const resolvedPrice = resolveOrderSizingPrice({
    currentPrice,
    limitPrice,
    orderType,
  });
  if (!resolvedPrice) {
    return { ok: false, reason: "missingPrice" };
  }

  const quantity = calculateAssetPercentQuantity({
    availableCash,
    availableSellQuantity,
    percent,
    price: resolvedPrice.price,
    side,
    totalAsset,
  });
  if (quantity === null) {
    return { ok: false, reason: "missingAsset" };
  }

  return {
    ok: true,
    normalizedLimitPrice: resolvedPrice.normalizedLimitPrice,
    quantity,
  };
}

export function getAssetPercentQuantityErrorMessage(reason: AssetPercentQuantityFailureReason) {
  if (reason === "missingSelection") {
    return "종목을 선택해 주세요.";
  }
  if (reason === "missingPrice") {
    return "현재가 또는 주문가를 확인해 주세요.";
  }
  return "자산 정보를 불러온 뒤 다시 선택해 주세요.";
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
  if (!isPositiveFiniteNumber(percent)) {
    return null;
  }

  if (side === "BUY") {
    if (!isPositiveFiniteNumber(price) || !isPositiveFiniteNumber(totalAsset)) {
      return null;
    }
    if (!isPositiveFiniteNumber(availableCash)) {
      return 0;
    }
    const targetAmount = totalAsset * (percent / 100);
    return Math.floor(Math.min(targetAmount, availableCash) / price);
  }

  if (!isPositiveFiniteNumber(availableSellQuantity)) {
    return 0;
  }
  return Math.min(availableSellQuantity, Math.floor(availableSellQuantity * (percent / 100)));
}

export function calculateEstimatedOrderAmount({
  currentPrice,
  limitPrice,
  orderType,
  quantity,
}: {
  currentPrice?: number | null;
  limitPrice: string;
  orderType: OrderType;
  quantity: string;
}): number | null {
  const parsedQuantity = parsePositiveIntegerInput(quantity);
  const parsedPrice = orderType === "LIMIT" ? parsePositiveNumberInput(limitPrice) : currentPrice;
  if (parsedQuantity === null || !isPositiveFiniteNumber(parsedPrice)) {
    return null;
  }
  return parsedQuantity * parsedPrice;
}
