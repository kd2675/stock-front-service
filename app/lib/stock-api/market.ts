import { STOCK_API_BASE, getJson } from "@/app/lib/api";
import {
  authenticatedDeleteJson,
  authenticatedGetJson,
  authenticatedPatchJson,
  authenticatedPostJson,
  toQuery,
} from "@/app/lib/stock-api/core";
import type { AutoMarketStatus, CorporateAction, CorporateActionEntitlement, CorporateActionType, Instrument, InstrumentReport, ListingAutoPosition, MarketSessionStatus, MarketType, OrderBook, OrderBookCandle, OrderBookCandleInterval, OrderBookInstrument, OrderBookMarketStatus, OrderBookRecentExecution, OrderBookTradeSummary, Price, PriceTick, Ranking, SimulationClock, SimulationClockJumpAction, SymbolMarketConfig } from "@/app/types/stock";

export type StockOrderBookInstrumentCreatePayload = {
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
};

export type StockCorporateActionPayload = {
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
};

export type StockInstrumentReportPayload = {
  title: string;
  summary: string;
  score: number;
  riseReason?: string | null;
  fallReason?: string | null;
};

export type StockMarketStatusPayload = {
  enabled?: boolean;
  marketStatus?: MarketSessionStatus;
};

export type StockSimulationClockJumpPayload = {
  action: SimulationClockJumpAction;
};

export function getInstruments() {
  return getJson<Instrument[]>("/api/stock/v1/markets/instruments");
}

export function getOrderBookInstruments() {
  return getJson<OrderBookInstrument[]>("/api/stock/v1/markets/order-book-instruments");
}

export function createOrderBookInstrument(
  token: string,
  payload: StockOrderBookInstrumentCreatePayload,
) {
  return authenticatedPostJson<OrderBookInstrument>(token, "/api/stock/v1/markets/order-book-instruments", payload);
}

export function applyCorporateAction(
  token: string,
  symbol: string,
  payload: StockCorporateActionPayload,
) {
  return authenticatedPostJson<OrderBookInstrument>(
    token,
    `/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/corporate-actions`,
    payload,
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
  payload: StockInstrumentReportPayload,
) {
  return authenticatedPostJson<InstrumentReport>(
    token,
    `/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`,
    payload,
  );
}

export function updateInstrumentReport(
  token: string,
  symbol: string,
  payload: StockInstrumentReportPayload,
) {
  return authenticatedPatchJson<InstrumentReport>(
    token,
    `/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`,
    payload,
  );
}

export function deleteInstrumentReport(token: string, symbol: string) {
  return authenticatedDeleteJson<InstrumentReport>(
    token,
    `/api/stock/v1/markets/order-book-instruments/${encodeURIComponent(symbol)}/reports`,
  );
}

export function getCorporateActionEntitlements(token: string) {
  return authenticatedGetJson<CorporateActionEntitlement[]>(token, "/api/stock/v1/markets/corporate-action-entitlements/me");
}

export function updateMarketStatus(
  token: string,
  marketType: MarketType,
  symbol: string,
  payload: StockMarketStatusPayload,
) {
  return authenticatedPatchJson<SymbolMarketConfig>(
    token,
    `/api/stock/v1/markets/${marketType}/symbols/${encodeURIComponent(symbol)}/status`,
    payload,
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

export function getOrderBookTradeSummary(symbol: string) {
  return getJson<OrderBookTradeSummary>(`/api/stock/v1/markets/order-books/${encodeURIComponent(symbol)}/trade-summary`);
}

export function getRecentOrderBookExecutions(symbol: string) {
  return getJson<OrderBookRecentExecution[]>(`/api/stock/v1/markets/order-books/${encodeURIComponent(symbol)}/executions/recent`);
}

export function getOrderBookCandles(symbol: string, interval: OrderBookCandleInterval) {
  return getJson<OrderBookCandle[]>(`/api/stock/v1/markets/order-books/${encodeURIComponent(symbol)}/candles/${encodeURIComponent(interval)}`);
}

export function getRankings() {
  return getJson<Ranking[]>("/api/stock/v1/markets/rankings");
}

export function getSimulationClock() {
  return getJson<SimulationClock>("/api/stock/v1/markets/simulation-clock");
}

export function jumpSimulationClock(
  token: string,
  payload: StockSimulationClockJumpPayload,
) {
  return authenticatedPatchJson<SimulationClock>(token, "/api/stock/v1/markets/simulation-clock", payload);
}

export function getOrderBookMarketStatus(options?: { includeConfigs?: boolean; includeTodayExecution?: boolean }) {
  const query = toQuery({
    includeConfigs: options?.includeConfigs,
    includeTodayExecution: options?.includeTodayExecution,
  });
  return getJson<OrderBookMarketStatus>(`/api/stock/v1/markets/order-book-market${query}`);
}

export function getAutoMarketStatus(options?: {
  includeConfigs?: boolean;
  includeParticipants?: boolean;
  includeParticipantSymbolConfigs?: boolean;
  includeParticipantProfileConfigs?: boolean;
  includeListingAutoAccounts?: boolean;
  includeRuntimeMetrics?: boolean;
  includeSalaryEligibility?: boolean;
  participantSymbolConfigUserKey?: string;
}) {
  const query = toQuery({
    includeConfigs: options?.includeConfigs,
    includeParticipants: options?.includeParticipants,
    includeParticipantSymbolConfigs: options?.includeParticipantSymbolConfigs,
    includeParticipantProfileConfigs: options?.includeParticipantProfileConfigs,
    includeListingAutoAccounts: options?.includeListingAutoAccounts,
    includeRuntimeMetrics: options?.includeRuntimeMetrics,
    includeSalaryEligibility: options?.includeSalaryEligibility,
    participantSymbolConfigUserKey: options?.participantSymbolConfigUserKey,
  });
  return getJson<AutoMarketStatus>(`/api/stock/v1/markets/auto-market${query}`);
}
