import type { OrderBookInstrument } from "@/app/types/stock";
import { isPositiveFiniteNumber, parsePositiveNumberInput } from "@/app/lib/numberParsing";

type PricedInstrument = Pick<OrderBookInstrument, "currentPrice" | "priceLimitBase" | "priceLimitRate" | "tickSize">;
type LimitInstrument = Pick<OrderBookInstrument, "priceLimitBase" | "priceLimitRate" | "tickSize">;

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
  const tickSize = resolvePositivePriceUnit(instrument.tickSize);
  return clampLimitPriceToInstrument(alignPriceToNearestTick(price, tickSize), instrument, tickSize);
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
  const tickSize = resolvePositivePriceUnit(instrument.tickSize);
  const parsedCurrent = parseOrderPriceInput(currentValue);
  const fallbackPrice = resolvePositivePrice(instrument.currentPrice) ?? resolvePositivePrice(instrument.priceLimitBase) ?? tickSize;
  const basePrice = parsedCurrent ?? fallbackPrice;
  const nextRawPrice = parsedCurrent === null
    ? alignPriceToTick(basePrice, tickSize, direction)
    : isAlignedToTick(basePrice, tickSize)
      ? basePrice + direction * tickSize
      : alignPriceToTick(basePrice, tickSize, direction);
  return clampLimitPriceToInstrument(nextRawPrice, instrument, tickSize);
}

export function matchesTickSize(price: number, tickSize: number) {
  return isAlignedToTick(price, resolvePositivePriceUnit(tickSize));
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

function isAlignedToTick(price: number, tickSize: number) {
  return Math.abs(price / tickSize - Math.round(price / tickSize)) < 0.000001;
}

function alignPriceToTick(price: number, tickSize: number, direction: -1 | 1) {
  const quotient = price / tickSize;
  const tickCount = direction > 0 ? Math.ceil(quotient - 0.000001) : Math.floor(quotient + 0.000001);
  return Math.max(tickSize, tickCount * tickSize);
}

function alignPriceToNearestTick(price: number, tickSize: number) {
  return Math.max(tickSize, Math.round(price / tickSize) * tickSize);
}

function clampLimitPriceToInstrument(
  price: number,
  instrument: Pick<OrderBookInstrument, "priceLimitBase" | "priceLimitRate">,
  tickSize: number,
) {
  const lowerRaw = instrument.priceLimitBase * (100 - instrument.priceLimitRate) / 100;
  const upperRaw = instrument.priceLimitBase * (100 + instrument.priceLimitRate) / 100;
  const lowerLimit = resolvePositivePrice(lowerRaw) ? alignPriceToTick(lowerRaw, tickSize, 1) : tickSize;
  const upperLimit = resolvePositivePrice(upperRaw) ? alignPriceToTick(upperRaw, tickSize, -1) : Number.POSITIVE_INFINITY;
  if (lowerLimit > upperLimit) {
    return Math.max(tickSize, price);
  }
  return Math.min(Math.max(price, lowerLimit), upperLimit);
}
