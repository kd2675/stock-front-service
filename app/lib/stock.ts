import { API_BASE, deleteJson, getJson, postJson, type ApiResult } from "@/app/lib/api";
import { clearAccessToken, notifyAuthExpired, refreshAccessToken } from "@/app/lib/auth";
import type { Execution, Holding, Instrument, Order, OrderBook, OrderSide, OrderType, Portfolio, PortfolioSnapshot, Price, PriceTick, Ranking, StockUserProfile } from "@/app/types/stock";

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function withAuthRefresh<T>(
  token: string,
  request: (token: string) => Promise<ApiResult<T>>,
): Promise<ApiResult<T>> {
  const result = await request(token);
  if (result.status !== 401) {
    return result;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    clearAccessToken();
    notifyAuthExpired("refresh_failed");
    return result;
  }

  return request(refreshedToken);
}

export function getInstruments() {
  return getJson<Instrument[]>("/api/stock/v1/markets/instruments");
}

export function getPrices() {
  return getJson<Price[]>("/api/stock/v1/markets/prices");
}

export function getPriceStreamUrl() {
  return `${API_BASE}/api/stock/v1/markets/prices/stream`;
}

export function getPriceTicks(symbol: string) {
  return getJson<PriceTick[]>(`/api/stock/v1/markets/prices/${encodeURIComponent(symbol)}/ticks`);
}

export function getOrderBook(symbol: string) {
  return getJson<OrderBook>(`/api/stock/v1/markets/order-books/${encodeURIComponent(symbol)}`);
}

export function getRankings() {
  return getJson<Ranking[]>("/api/stock/v1/markets/rankings");
}

export function getPortfolio(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<Portfolio>("/api/stock/v1/portfolio/me", authHeaders(nextToken)));
}

export function getPortfolioSnapshots(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<PortfolioSnapshot[]>("/api/stock/v1/portfolio/me/snapshots", authHeaders(nextToken)));
}

export function getStockUserProfile(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<StockUserProfile>("/api/stock/v1/users/me", authHeaders(nextToken)));
}

export function getOrders(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<Order[]>("/api/stock/v1/orders", authHeaders(nextToken)));
}

export function getExecutions(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<Execution[]>("/api/stock/v1/executions", authHeaders(nextToken)));
}

export function getHoldings(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<Holding[]>("/api/stock/v1/holdings", authHeaders(nextToken)));
}

export function placeOrder(
  token: string,
  payload: {
    symbol: string;
    side: OrderSide;
    orderType: OrderType;
    limitPrice?: number;
    quantity: number;
    clientOrderId?: string;
  },
) {
  return withAuthRefresh(token, (nextToken) => postJson<Order>("/api/stock/v1/orders", payload, authHeaders(nextToken)));
}

export function cancelOrder(token: string, orderId: number) {
  return withAuthRefresh(token, (nextToken) => deleteJson<Order>(`/api/stock/v1/orders/${orderId}`, authHeaders(nextToken)));
}
