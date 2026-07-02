import {
  authenticatedDeleteJson,
  authenticatedGetJson,
  authenticatedPatchJson,
  authenticatedPostJson,
  toQuery,
} from "@/app/lib/stock-api/core";
import type { Execution, Holding, MarketType, Order, OrderSide, OrderType } from "@/app/types/stock";

export type StockOrderPlacePayload = {
  symbol: string;
  marketType?: MarketType;
  side: OrderSide;
  orderType: OrderType;
  limitPrice?: number;
  quantity: number;
  clientOrderId?: string;
};

export type StockOrderAmendPayload = {
  quantity?: number;
  limitPrice?: number;
};

export type StockOrderPartialCancelPayload = {
  quantity: number;
};

export function getOrders(token: string, options?: { marketType?: MarketType; symbol?: string; limit?: number }) {
  const query = toQuery({
    marketType: options?.marketType,
    symbol: options?.symbol,
    limit: options?.limit,
  });
  return authenticatedGetJson<Order[]>(token, `/api/stock/v1/orders${query}`);
}

export function getExecutions(token: string, options?: { source?: Execution["source"]; symbol?: string; limit?: number }) {
  const query = toQuery({
    source: options?.source,
    symbol: options?.symbol,
    limit: options?.limit,
  });
  return authenticatedGetJson<Execution[]>(token, `/api/stock/v1/executions${query}`);
}

export function getHoldings(token: string) {
  return authenticatedGetJson<Holding[]>(token, "/api/stock/v1/holdings");
}

export function placeOrder(
  token: string,
  payload: StockOrderPlacePayload,
) {
  return authenticatedPostJson<Order>(token, "/api/stock/v1/orders", payload);
}

export function cancelOrder(token: string, orderId: number) {
  return authenticatedDeleteJson<Order>(token, `/api/stock/v1/orders/${orderId}`);
}

export function amendOrder(
  token: string,
  orderId: number,
  payload: StockOrderAmendPayload,
) {
  return authenticatedPatchJson<Order>(token, `/api/stock/v1/orders/${orderId}`, payload);
}

export function cancelOrderPartially(token: string, orderId: number, quantity: number) {
  const payload: StockOrderPartialCancelPayload = { quantity };
  return authenticatedPostJson<Order>(token, `/api/stock/v1/orders/${orderId}/cancel`, payload);
}
