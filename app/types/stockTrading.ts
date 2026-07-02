import type { MarketType, OrderSide } from "@/app/types/stockMarket";

export type OrderType = "LIMIT" | "MARKET";
export type OrderStatus = "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";

export type Order = {
  id: number;
  accountId: number;
  clientOrderId: string;
  symbol: string;
  marketType: MarketType;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  limitPrice?: number | null;
  quantity: number;
  filledQuantity: number;
  averageFillPrice?: number | null;
  reservedCash: number;
  createdAt: string;
};

export type Execution = {
  id: number;
  accountId: number;
  orderId: number;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  grossAmount: number;
  feeAmount: number;
  taxAmount: number;
  netAmount: number;
  realizedProfit?: number | null;
  source: "VIRTUAL_MARKET_PRICE" | "INTERNAL_ORDER_BOOK";
  executedAt: string;
};

export type Ranking = {
  rank: number;
  accountId: number;
  userKey: string;
  displayName: string;
  totalAsset: number;
  returnRate: number;
  snapshotDate: string;
};
