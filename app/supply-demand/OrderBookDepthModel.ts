import type { OrderBookLevel } from "@/app/types/stock";

export const ORDER_BOOK_VISIBLE_LEVELS = 10;
export const STACKED_ORDER_BOOK_VISIBLE_LEVELS = 6;

export type OrderBookSideType = "bid" | "ask";
export type FlashingOrderBookLevel = { price: number; side: OrderBookSideType; nonce: number } | null;
export type CumulativeOrderBookLevel = OrderBookLevel & { cumulativeQuantity: number };

export type OrderBookDepthModel = {
  fixedAsks: (CumulativeOrderBookLevel | null)[];
  fixedBids: (CumulativeOrderBookLevel | null)[];
  stackedAsks: (CumulativeOrderBookLevel | null)[];
  stackedBids: (CumulativeOrderBookLevel | null)[];
  maxAskQuantity: number;
  maxBidQuantity: number;
  maxQuantity: number;
  totalAskQuantity: number;
  totalBidQuantity: number;
  imbalance: number;
};

export function buildOrderBookDepthModel(orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] } | null): OrderBookDepthModel {
  const asks = sortAskLevels(orderBook?.asks ?? []);
  const bids = sortBidLevels(orderBook?.bids ?? []);
  const fixedAsks = addCumulativeQuantity(toFixedOrderBookLevels(asks));
  const fixedBids = addCumulativeQuantity(toFixedOrderBookLevels(bids));
  const stackedAsks = [...fixedAsks.slice(0, STACKED_ORDER_BOOK_VISIBLE_LEVELS)].reverse();
  const stackedBids = fixedBids.slice(0, STACKED_ORDER_BOOK_VISIBLE_LEVELS);
  const totalAskQuantity = sumQuantity(asks);
  const totalBidQuantity = sumQuantity(bids);
  return {
    fixedAsks,
    fixedBids,
    stackedAsks,
    stackedBids,
    maxAskQuantity: maxQuantity(asks.slice(0, STACKED_ORDER_BOOK_VISIBLE_LEVELS)),
    maxBidQuantity: maxQuantity(bids.slice(0, STACKED_ORDER_BOOK_VISIBLE_LEVELS)),
    maxQuantity: Math.max(1, ...asks.map((level) => level.quantity), ...bids.map((level) => level.quantity)),
    totalAskQuantity,
    totalBidQuantity,
    imbalance: totalAskQuantity <= 0 ? 0 : totalBidQuantity / totalAskQuantity,
  };
}

function maxQuantity(levels: OrderBookLevel[]) {
  return Math.max(1, ...levels.map((level) => level.quantity));
}

export function resolveQuantityRate(level: Pick<OrderBookLevel, "quantity"> | null, maxQuantity: number) {
  if (!level) {
    return 0;
  }
  return Math.max(8, Math.min(100, Math.round(level.quantity / Math.max(1, maxQuantity) * 100)));
}

function sortAskLevels(levels: OrderBookLevel[]) {
  return [...levels].sort((a, b) => a.price - b.price);
}

function sortBidLevels(levels: OrderBookLevel[]) {
  return [...levels].sort((a, b) => b.price - a.price);
}

function toFixedOrderBookLevels(levels: OrderBookLevel[]) {
  return Array.from({ length: ORDER_BOOK_VISIBLE_LEVELS }, (_, index) => levels[index] ?? null);
}

function addCumulativeQuantity(levels: (OrderBookLevel | null)[]) {
  let cumulativeQuantity = 0;
  return levels.map((level) => {
    if (!level) {
      return null;
    }
    cumulativeQuantity += level.quantity;
    return {
      ...level,
      cumulativeQuantity,
    };
  });
}

function sumQuantity(levels: OrderBookLevel[]) {
  return levels.reduce((total, level) => total + level.quantity, 0);
}
