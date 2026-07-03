import type { OrderBookInstrument } from "@/app/types/stock";
import { isPositiveFiniteNumber, parsePositiveNumberInput } from "@/app/lib/numberParsing";

type PricedInstrument = Pick<OrderBookInstrument, "currentPrice" | "priceLimitBase" | "priceLimitRate" | "tickSize" | "market">;
type LimitInstrument = Pick<OrderBookInstrument, "priceLimitBase" | "priceLimitRate" | "tickSize" | "market">;

export function formatOrderInputPrice(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export function resolveDefaultLimitPrice(instrument: PricedInstrument) {
  const fallbackPrice = resolvePositivePrice(instrument.currentPrice) ?? resolvePositivePrice(instrument.priceLimitBase) ?? resolvePositivePriceUnit(instrument.tickSize);
  return resolveLimitPriceForInstrument(fallbackPrice, instrument);
}

export function resolveLimitPriceForInstrument(price: number, instrument: LimitInstrument) {
  return clampLimitPriceToInstrument(alignPriceToNearestTick(price, instrument.market), instrument);
}

export function resolveSteppedLimitPrice({
  currentValue,
  direction,
  instrument,
}: {
  currentValue: string;
  direction: -1 | 1;
  instrument: PricedInstrument;
}) {
  const parsedCurrent = parseOrderPriceInput(currentValue);
  const fallbackPrice = resolvePositivePrice(instrument.currentPrice) ?? resolvePositivePrice(instrument.priceLimitBase) ?? resolvePositivePriceUnit(instrument.tickSize);
  const basePrice = parsedCurrent ?? fallbackPrice;
  const nextRawPrice = parsedCurrent === null
    ? alignPriceToTick(basePrice, instrument.market, direction)
    : isAlignedToTick(basePrice, instrument.market)
      ? moveByTicks(basePrice, instrument.market, direction)
      : alignPriceToTick(basePrice, instrument.market, direction);
  return clampLimitPriceToInstrument(nextRawPrice, instrument);
}

export function matchesTickSize(price: number, tickSize: number, market?: string | null) {
  if (market && market.trim().length > 0) {
    return isAlignedToTick(price, market);
  }
  return isAlignedToTick(price, undefined, resolvePositivePriceUnit(tickSize));
}

export function resolveTickSizeForPrice(price: number, market?: string | null) {
  return getKoreanStockTickSize(price, market);
}

export function isWithinPriceLimit(price: number, basePrice: number, limitRate: number) {
  const lowerLimit = (basePrice * (100 - limitRate)) / 100;
  const upperLimit = (basePrice * (100 + limitRate)) / 100;
  return price >= lowerLimit && price <= upperLimit;
}

function parseOrderPriceInput(value: string) {
  return parsePositiveNumberInput(value);
}

function resolvePositivePrice(value: number) {
  return isPositiveFiniteNumber(value) ? value : null;
}

function resolvePositivePriceUnit(value: number) {
  return isPositiveFiniteNumber(value) ? value : 1;
}

function isAlignedToTick(price: number, market?: string | null, fallbackTickSize?: number) {
  const tickSize = fallbackTickSize ?? getKoreanStockTickSize(price, market);
  return Math.abs(price / tickSize - Math.round(price / tickSize)) < 0.000001;
}

function alignPriceToTick(price: number, market: string | undefined, direction: -1 | 1) {
  const tickSize = getKoreanStockTickSize(price, market);
  const quotient = price / tickSize;
  const tickCount = direction > 0 ? Math.ceil(quotient - 0.000001) : Math.floor(quotient + 0.000001);
  return Math.max(tickSize, tickCount * tickSize);
}

function alignPriceToNearestTick(price: number, market: string | undefined) {
  const tickSize = getKoreanStockTickSize(price, market);
  return Math.max(tickSize, Math.round(price / tickSize) * tickSize);
}

function moveByTicks(price: number, market: string | undefined, direction: -1 | 1) {
  const nextRawPrice = Math.max(1, price + direction);
  return direction > 0
    ? alignPriceToTick(nextRawPrice, market, 1)
    : alignPriceToTick(nextRawPrice, market, -1);
}

function clampLimitPriceToInstrument(
  price: number,
  instrument: Pick<OrderBookInstrument, "priceLimitBase" | "priceLimitRate" | "market">,
) {
  const lowerRaw = instrument.priceLimitBase * (100 - instrument.priceLimitRate) / 100;
  const upperRaw = instrument.priceLimitBase * (100 + instrument.priceLimitRate) / 100;
  const lowerLimit = resolvePositivePrice(lowerRaw) ? alignPriceToTick(lowerRaw, instrument.market, 1) : getKoreanStockTickSize(1, instrument.market);
  const upperLimit = resolvePositivePrice(upperRaw) ? alignPriceToTick(upperRaw, instrument.market, -1) : Number.POSITIVE_INFINITY;
  if (lowerLimit > upperLimit) {
    return Math.max(getKoreanStockTickSize(price, instrument.market), price);
  }
  return Math.min(Math.max(price, lowerLimit), upperLimit);
}

function getKoreanStockTickSize(price: number, market?: string | null) {
  const normalizedMarket = market?.trim().toUpperCase();
  if (normalizedMarket === "ETF" || normalizedMarket === "ETN" || normalizedMarket === "ELW") {
    return 5;
  }
  const normalizedPrice = isPositiveFiniteNumber(price) ? price : 1;
  if (normalizedPrice < 2_000) {
    return 1;
  }
  if (normalizedPrice < 5_000) {
    return 5;
  }
  if (normalizedPrice < 20_000) {
    return 10;
  }
  if (normalizedPrice < 50_000) {
    return 50;
  }
  if (normalizedPrice < 200_000) {
    return 100;
  }
  if (normalizedPrice < 500_000) {
    return 500;
  }
  return 1_000;
}
