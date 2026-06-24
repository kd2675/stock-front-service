import { STOCK_API_BASE, deleteJson, getJson, patchJson, postJson, type ApiResult } from "@/app/lib/api";
import { clearAccessToken, getUserFromToken, notifyAuthExpired, refreshAccessToken } from "@/app/lib/auth";
import type { Account, AccountStatus, AutoMarketStatus, AutoParticipantCashAdjustment, AutoParticipantOverview, AutoParticipantProfileType, CorporateAction, CorporateActionEntitlement, CorporateActionType, Execution, Holding, Instrument, InstrumentReport, ListingAutoPosition, MarketSessionStatus, MarketType, Order, OrderBook, OrderBookInstrument, OrderBookMarketStatus, OrderSide, OrderType, Portfolio, PortfolioSnapshot, Price, PriceTick, ProfitSummary, Ranking, StockUserProfile, SymbolMarketConfig, VirtualMarketStatus } from "@/app/types/stock";

function authHeaders(token: string): Record<string, string> {
  const user = getUserFromToken(token);
  return {
    Authorization: `Bearer ${token}`,
    ...(user?.userKey ? { "X-User-Key": user.userKey } : {}),
    ...(user?.role ? { "X-User-Role": user.role } : {}),
  };
}

function toQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
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

export function getOrderBookInstruments() {
  return getJson<OrderBookInstrument[]>("/api/stock/v1/markets/order-book-instruments");
}

export function createOrderBookInstrument(
  token: string,
  payload: {
    symbol: string;
    name: string;
    market?: string;
    initialPrice: number;
    issuedShares: number;
    tickSize?: number;
    priceLimitRate?: number;
    listingAutoAccount?: {
      displayName?: string;
      enabled?: boolean;
      positionSide?: ListingAutoPosition;
      maxOrderQuantity?: number;
      orderTtlSeconds?: number;
      priceOffsetTicks?: number;
    };
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    postJson<OrderBookInstrument>("/api/stock/v1/markets/order-book-instruments", payload, authHeaders(nextToken)),
  );
}

export function applyCorporateAction(
  token: string,
  symbol: string,
  payload: {
    actionType: CorporateActionType;
    shareQuantity?: number;
    issuePrice?: number;
    splitFrom?: number;
    splitTo?: number;
    exRightsDate?: string;
    paymentDate?: string;
    listingDate?: string;
    delistingDate?: string;
    dividendAmount?: number;
    description?: string;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    postJson<OrderBookInstrument>(`/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/corporate-actions`, payload, authHeaders(nextToken)),
  );
}

export function getCorporateActions(symbol: string) {
  return getJson<CorporateAction[]>(`/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/corporate-actions`);
}

export function getInstrumentReports(symbol: string) {
  return getJson<InstrumentReport[]>(`/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`);
}

export function publishInstrumentReport(
  token: string,
  symbol: string,
  payload: {
    title: string;
    summary: string;
    score: number;
    riseReason?: string | null;
    fallReason?: string | null;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    postJson<InstrumentReport>(`/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`, payload, authHeaders(nextToken)),
  );
}

export function updateInstrumentReport(
  token: string,
  symbol: string,
  payload: {
    title: string;
    summary: string;
    score: number;
    riseReason?: string | null;
    fallReason?: string | null;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    patchJson<InstrumentReport>(`/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`, payload, authHeaders(nextToken)),
  );
}

export function deleteInstrumentReport(token: string, symbol: string) {
  return withAuthRefresh(token, (nextToken) =>
    deleteJson<InstrumentReport>(`/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`, authHeaders(nextToken)),
  );
}

export function getCorporateActionEntitlements(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<CorporateActionEntitlement[]>("/api/stock/v1/markets/corporate-action-entitlements/me", authHeaders(nextToken)));
}

export function updateMarketStatus(
  token: string,
  marketType: MarketType,
  symbol: string,
  payload: {
    enabled?: boolean;
    marketStatus?: MarketSessionStatus;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    patchJson<SymbolMarketConfig>(`/api/stock/v1/markets/${marketType}/symbols/${encodeURIComponent(symbol)}/status`, payload, authHeaders(nextToken)),
  );
}

export function getPrices() {
  return getJson<Price[]>("/api/stock/v1/markets/prices");
}

export function getPriceStreamUrl() {
  return `${STOCK_API_BASE}/api/stock/v1/markets/prices/stream`;
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

export function getVirtualMarketStatus() {
  return getJson<VirtualMarketStatus>("/api/stock/v1/markets/virtual-market");
}

export function getOrderBookMarketStatus() {
  return getJson<OrderBookMarketStatus>("/api/stock/v1/markets/order-book-market");
}

export function getAutoMarketStatus() {
  return getJson<AutoMarketStatus>("/api/stock/v1/markets/auto-market");
}

export function getAutoParticipantOverviews(token: string) {
  return withAuthRefresh(token, (nextToken) =>
    getJson<AutoParticipantOverview[]>("/api/stock/v1/markets/auto-market/participants/overviews", authHeaders(nextToken)),
  );
}

export function updateListingAutoAccountConfig(
  token: string,
  symbol: string,
  payload: {
    displayName?: string;
    enabled?: boolean;
    positionSide?: ListingAutoPosition;
    maxOrderQuantity?: number;
    orderTtlSeconds?: number;
    priceOffsetTicks?: number;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    patchJson<AutoMarketStatus["listingAutoAccounts"][number]>(`/api/stock/v1/markets/auto-market/listing-accounts/${encodeURIComponent(symbol)}`, payload, authHeaders(nextToken)),
  );
}

export function updateAutoMarketConfig(
  token: string,
  symbol: string,
  payload: {
    enabled?: boolean;
    intensity?: number;
    maxOrderQuantity?: number;
    orderTtlSeconds?: number;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    patchJson<AutoMarketStatus["configs"][number]>(`/api/stock/v1/markets/auto-market/configs/${encodeURIComponent(symbol)}`, payload, authHeaders(nextToken)),
  );
}

export function upsertAutoParticipant(
  token: string,
  userKey: string,
  payload: {
    displayName: string;
    enabled?: boolean;
    profileType?: AutoParticipantProfileType;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    patchJson<AutoMarketStatus["participants"][number]>(`/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}`, payload, authHeaders(nextToken)),
  );
}

export function withdrawAutoParticipant(token: string, userKey: string) {
  return withAuthRefresh(token, (nextToken) =>
    deleteJson<AutoMarketStatus["participants"][number]>(`/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}`, authHeaders(nextToken)),
  );
}

export function adjustAutoParticipantCash(
  token: string,
  userKey: string,
  payload: {
    adjustmentType: "DEPOSIT" | "WITHDRAW";
    amount: number;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    postJson<AutoParticipantCashAdjustment>(`/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}/cash-adjustments`, payload, authHeaders(nextToken)),
  );
}

export function updateAutoParticipantSymbolConfig(
  token: string,
  userKey: string,
  symbol: string,
  payload: {
    enabled?: boolean;
    intensity?: number;
  },
) {
  return withAuthRefresh(token, (nextToken) =>
    patchJson<AutoMarketStatus["participantSymbolConfigs"][number]>(
      `/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}/symbols/${encodeURIComponent(symbol)}`,
      payload,
      authHeaders(nextToken),
    ),
  );
}

export function getPortfolio(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<Portfolio>("/api/stock/v1/portfolio/me", authHeaders(nextToken)));
}

export function getPortfolioSnapshots(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<PortfolioSnapshot[]>("/api/stock/v1/portfolio/me/snapshots", authHeaders(nextToken)));
}

export function getProfitSummary(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<ProfitSummary>("/api/stock/v1/portfolio/me/profit-summary", authHeaders(nextToken)));
}

export function getAccountStatus(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<AccountStatus>("/api/stock/v1/accounts/me/status", authHeaders(nextToken)));
}

export function openStockAccount(token: string) {
  return withAuthRefresh(token, (nextToken) => postJson<Account>("/api/stock/v1/accounts/me", {}, authHeaders(nextToken)));
}

export function detachStockAccount(token: string) {
  return withAuthRefresh(token, (nextToken) => deleteJson<Account>("/api/stock/v1/accounts/me", authHeaders(nextToken)));
}

export function reconnectStockAccount(token: string, payload: { accountCode: string; recoveryCode: string }) {
  return withAuthRefresh(token, (nextToken) => postJson<Account>("/api/stock/v1/accounts/reconnect", payload, authHeaders(nextToken)));
}

export function getStockUserProfile(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<StockUserProfile>("/api/stock/v1/users/me", authHeaders(nextToken)));
}

export function getOrders(token: string, options?: { marketType?: MarketType }) {
  const query = toQuery({ marketType: options?.marketType });
  return withAuthRefresh(token, (nextToken) => getJson<Order[]>(`/api/stock/v1/orders${query}`, authHeaders(nextToken)));
}

export function getExecutions(token: string, options?: { source?: Execution["source"] }) {
  const query = toQuery({ source: options?.source });
  return withAuthRefresh(token, (nextToken) => getJson<Execution[]>(`/api/stock/v1/executions${query}`, authHeaders(nextToken)));
}

export function getHoldings(token: string) {
  return withAuthRefresh(token, (nextToken) => getJson<Holding[]>("/api/stock/v1/holdings", authHeaders(nextToken)));
}

export function placeOrder(
  token: string,
  payload: {
    symbol: string;
    marketType?: MarketType;
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

export function amendOrder(
  token: string,
  orderId: number,
  payload: {
    quantity?: number;
    limitPrice?: number;
  },
) {
  return withAuthRefresh(token, (nextToken) => patchJson<Order>(`/api/stock/v1/orders/${orderId}`, payload, authHeaders(nextToken)));
}

export function cancelOrderPartially(token: string, orderId: number, quantity: number) {
  return withAuthRefresh(token, (nextToken) => postJson<Order>(`/api/stock/v1/orders/${orderId}/cancel`, { quantity }, authHeaders(nextToken)));
}
