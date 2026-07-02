import type { Execution, MarketType } from "@/app/types/stock";

export const stockKeys = {
  all: ["stock"] as const,
  market: () => [...stockKeys.all, "market"] as const,
  simulationClock: () => [...stockKeys.market(), "simulation-clock"] as const,
  instruments: () => [...stockKeys.market(), "instruments"] as const,
  orderBookInstruments: () => [...stockKeys.market(), "order-book-instruments"] as const,
  prices: () => [...stockKeys.market(), "prices"] as const,
  priceTicks: (symbol: string) => [...stockKeys.prices(), "ticks", symbol] as const,
  orderBook: (symbol: string) => [...stockKeys.market(), "order-book", symbol] as const,
  orderBookTradeSummary: (symbol: string) => [...stockKeys.orderBook(symbol), "trade-summary"] as const,
  orderBookRecentExecutions: (symbol: string) => [...stockKeys.orderBook(symbol), "executions", "recent"] as const,
  orderBookCandles: (symbol: string, interval: string) => [...stockKeys.orderBook(symbol), "candles", interval] as const,
  rankings: () => [...stockKeys.market(), "rankings"] as const,
  orderBookMarketStatusRoot: () => [...stockKeys.market(), "order-book-market"] as const,
  orderBookMarketStatus: (options?: { includeConfigs?: boolean; includeTodayExecution?: boolean }) => [...stockKeys.market(), "order-book-market", options?.includeConfigs ?? true, options?.includeTodayExecution ?? true] as const,
  adminFundFlowSummary: () => [...stockKeys.market(), "admin", "fund-flow-summary"] as const,
  adminFlowOverviewRoot: () => [...stockKeys.market(), "admin", "flow-overview"] as const,
  adminFlowOverview: (options?: { symbolFlowLimit?: number; includeFundFlow?: boolean; includeSymbolFlows?: boolean }) => [
    ...stockKeys.adminFlowOverviewRoot(),
    options?.symbolFlowLimit ?? 0,
    options?.includeFundFlow ?? true,
    options?.includeSymbolFlows ?? true,
  ] as const,
  adminSymbolFlowsRoot: () => [...stockKeys.market(), "admin", "symbol-flows"] as const,
  adminSymbolFlows: (options?: { limit?: number }) => [
    ...stockKeys.adminSymbolFlowsRoot(),
    options?.limit ?? 0,
  ] as const,
  adminCashFlowsRoot: () => [...stockKeys.market(), "admin", "cash-flows"] as const,
  adminCashFlows: (options?: { page?: number; size?: number }) => [
    ...stockKeys.adminCashFlowsRoot(),
    options?.page ?? 0,
    options?.size ?? 20,
  ] as const,
  adminUserFundFlow: (userKey: string) => [...stockKeys.market(), "admin", "user-fund-flow", userKey] as const,
  batchJobRuntimeControls: () => [...stockKeys.market(), "batch-jobs", "runtime-controls"] as const,
  autoMarketStatus: () => [...stockKeys.market(), "auto-market"] as const,
  autoMarketStatusDetailsRoot: () => [...stockKeys.autoMarketStatus(), "details"] as const,
  autoMarketStatusDetails: (options?: {
    includeConfigs?: boolean;
    includeParticipants?: boolean;
    includeParticipantSymbolConfigs?: boolean;
    includeParticipantProfileConfigs?: boolean;
    includeListingAutoAccounts?: boolean;
    includeRuntimeMetrics?: boolean;
    includeSalaryEligibility?: boolean;
    participantSymbolConfigUserKey?: string;
  }) => [
    ...stockKeys.autoMarketStatusDetailsRoot(),
    options?.includeConfigs ?? true,
    options?.includeParticipants ?? false,
    options?.includeParticipantSymbolConfigs ?? false,
    options?.includeParticipantProfileConfigs ?? false,
    options?.includeListingAutoAccounts ?? false,
    options?.includeRuntimeMetrics ?? true,
    options?.includeSalaryEligibility ?? false,
    options?.participantSymbolConfigUserKey ?? "",
  ] as const,
  autoMarketSummaryStatusRoot: () => [...stockKeys.autoMarketStatus(), "summary"] as const,
  autoMarketSummaryStatus: (options?: { includeRuntimeMetrics?: boolean; includeSalaryEligibility?: boolean }) => [
    ...stockKeys.autoMarketSummaryStatusRoot(),
    options?.includeRuntimeMetrics ?? true,
    options?.includeSalaryEligibility ?? false,
  ] as const,
  autoParticipantOverviewsRoot: () => [...stockKeys.autoMarketStatus(), "participants", "overviews"] as const,
  autoParticipantOverviews: (options?: { includeHoldings?: boolean; userKeys?: string[] }) => [
    ...stockKeys.autoParticipantOverviewsRoot(),
    options?.includeHoldings ?? true,
    [...(options?.userKeys ?? [])].sort(),
  ] as const,
  autoParticipants: () => [...stockKeys.autoMarketStatus(), "participants", "list"] as const,
  autoParticipantProfileOverviews: () => [...stockKeys.autoMarketStatus(), "participants", "profile-overviews"] as const,
  corporateActions: (symbol: string) => [...stockKeys.orderBookInstruments(), symbol, "corporate-actions"] as const,
  instrumentReports: (symbol: string) => [...stockKeys.orderBookInstruments(), symbol, "reports"] as const,
  account: () => [...stockKeys.all, "account"] as const,
  accountStatus: () => [...stockKeys.account(), "status"] as const,
  profile: () => [...stockKeys.account(), "profile"] as const,
  portfolio: () => [...stockKeys.account(), "portfolio"] as const,
  portfolioSnapshots: () => [...stockKeys.portfolio(), "snapshots"] as const,
  profitSummary: () => [...stockKeys.portfolio(), "profit-summary"] as const,
  holdings: () => [...stockKeys.account(), "holdings"] as const,
  corporateActionEntitlements: () => [...stockKeys.account(), "corporate-action-entitlements"] as const,
  ordersRoot: () => [...stockKeys.account(), "orders"] as const,
  ordersByMarketType: (marketType: MarketType) => [...stockKeys.ordersRoot(), marketType] as const,
  orders: (options?: { marketType?: MarketType; symbol?: string; limit?: number }) => [
    ...stockKeys.ordersRoot(),
    options?.marketType ?? "ALL",
    options?.symbol ?? "ALL",
    options?.limit ?? 50,
  ] as const,
  executionsRoot: () => [...stockKeys.account(), "executions"] as const,
  executionsBySource: (source: Execution["source"]) => [...stockKeys.executionsRoot(), source] as const,
  executions: (options?: { source?: Execution["source"]; symbol?: string; limit?: number }) => [
    ...stockKeys.executionsRoot(),
    options?.source ?? "ALL",
    options?.symbol ?? "ALL",
    options?.limit ?? 50,
  ] as const,
};
