import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  getAccountStatus,
  getAdminCashFlows,
  getAdminFlowOverview,
  getAdminFundFlowSummary,
  getAdminSymbolFlows,
  getAdminUserFundFlow,
  getAutoParticipantOverviews,
  getAutoParticipantProfileOverviews,
  getAutoMarketStatus,
  getBatchJobRuntimeControls,
  getCorporateActionEntitlements,
  getCorporateActions,
  getExecutions,
  getHoldings,
  getInstrumentReports,
  getInstruments,
  getOrderBook,
  getOrderBookCandles,
  getOrderBookInstruments,
  getOrderBookMarketStatus,
  getOrderBookTradeSummary,
  getOrders,
  getPortfolio,
  getPortfolioSnapshots,
  getPrices,
  getPriceTicks,
  getRecentOrderBookExecutions,
  getProfitSummary,
  getRankings,
  getStockUserProfile,
  getVirtualMarketStatus,
} from "@/app/lib/stock";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { unwrapStockResult } from "@/app/lib/react-query/stockResult";
import type { Execution, MarketType, OrderBookCandleInterval } from "@/app/types/stock";

const FAST_MARKET_REFETCH_MS = 2_000;
const USER_ACTIVITY_REFETCH_MS = 5_000;
const ADMIN_SNAPSHOT_STALE_MS = 30_000;
const ADMIN_LEDGER_STALE_MS = 60_000;

function isEnabledWithToken(token: string | null, enabled = true) {
  return Boolean(token) && enabled;
}

export function instrumentsQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.instruments(),
    queryFn: async () => unwrapStockResult(await getInstruments(), "종목을 조회하지 못했습니다."),
  });
}

export function orderBookInstrumentsQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.orderBookInstruments(),
    queryFn: async () => unwrapStockResult(await getOrderBookInstruments(), "주문장 종목을 조회하지 못했습니다."),
  });
}

export function pricesQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.prices(),
    queryFn: async () => unwrapStockResult(await getPrices(), "시세를 조회하지 못했습니다."),
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function priceTicksQueryOptions(symbol: string) {
  return queryOptions({
    queryKey: stockKeys.priceTicks(symbol),
    queryFn: async () => unwrapStockResult(await getPriceTicks(symbol), "시세 이력을 조회하지 못했습니다."),
    enabled: Boolean(symbol),
  });
}

export function orderBookQueryOptions(symbol: string) {
  return queryOptions({
    queryKey: stockKeys.orderBook(symbol),
    queryFn: async () => unwrapStockResult(await getOrderBook(symbol), "호가를 조회하지 못했습니다."),
    enabled: Boolean(symbol),
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function orderBookTradeSummaryQueryOptions(symbol: string) {
  return queryOptions({
    queryKey: stockKeys.orderBookTradeSummary(symbol),
    queryFn: async () => unwrapStockResult(await getOrderBookTradeSummary(symbol), "거래 요약을 조회하지 못했습니다."),
    enabled: Boolean(symbol),
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function orderBookRecentExecutionsQueryOptions(symbol: string) {
  return queryOptions({
    queryKey: stockKeys.orderBookRecentExecutions(symbol),
    queryFn: async () => unwrapStockResult(await getRecentOrderBookExecutions(symbol), "최근 체결을 조회하지 못했습니다."),
    enabled: Boolean(symbol),
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function orderBookCandlesQueryOptions(symbol: string, interval: OrderBookCandleInterval) {
  return queryOptions({
    queryKey: stockKeys.orderBookCandles(symbol, interval),
    queryFn: async () => unwrapStockResult(await getOrderBookCandles(symbol, interval), "차트 데이터를 조회하지 못했습니다."),
    enabled: Boolean(symbol),
    refetchInterval: interval === "1M" || interval === "5M" ? FAST_MARKET_REFETCH_MS : USER_ACTIVITY_REFETCH_MS,
  });
}

export function rankingsQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.rankings(),
    queryFn: async () => unwrapStockResult(await getRankings(), "랭킹을 조회하지 못했습니다."),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function virtualMarketStatusQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.virtualMarketStatus(),
    queryFn: async () => unwrapStockResult(await getVirtualMarketStatus(), "자동 체결장 상태를 조회하지 못했습니다."),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function orderBookMarketStatusQueryOptions(options: {
  includeConfigs?: boolean;
  includeTodayExecution?: boolean;
  refetchIntervalMs?: number | false;
} = {}) {
  const includeConfigs = options.includeConfigs ?? true;
  const includeTodayExecution = options.includeTodayExecution ?? true;
  return queryOptions({
    queryKey: stockKeys.orderBookMarketStatus({ includeConfigs, includeTodayExecution }),
    queryFn: async () => unwrapStockResult(await getOrderBookMarketStatus({ includeConfigs, includeTodayExecution }), "주문장 상태를 조회하지 못했습니다."),
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
  });
}

export function autoMarketStatusQueryOptions(options: {
  enabled?: boolean;
  includeConfigs?: boolean;
  includeParticipants?: boolean;
  includeParticipantSymbolConfigs?: boolean;
  includeParticipantProfileConfigs?: boolean;
  includeListingAutoAccounts?: boolean;
  includeRuntimeMetrics?: boolean;
  includeSalaryEligibility?: boolean;
  participantSymbolConfigUserKey?: string;
  refetchIntervalMs?: number | false;
} = {}) {
  const includeConfigs = options.includeConfigs ?? true;
  const includeParticipants = options.includeParticipants ?? false;
  const includeParticipantSymbolConfigs = options.includeParticipantSymbolConfigs ?? false;
  const includeParticipantProfileConfigs = options.includeParticipantProfileConfigs ?? false;
  const includeListingAutoAccounts = options.includeListingAutoAccounts ?? false;
  const includeRuntimeMetrics = options.includeRuntimeMetrics ?? true;
  const includeSalaryEligibility = options.includeSalaryEligibility ?? false;
  const participantSymbolConfigUserKey = options.participantSymbolConfigUserKey?.trim() || undefined;
  return queryOptions({
    queryKey: stockKeys.autoMarketStatusDetails({
      includeConfigs,
      includeParticipants,
      includeParticipantSymbolConfigs,
      includeParticipantProfileConfigs,
      includeListingAutoAccounts,
      includeRuntimeMetrics,
      includeSalaryEligibility,
      participantSymbolConfigUserKey,
    }),
    queryFn: async () => unwrapStockResult(await getAutoMarketStatus({
      includeConfigs,
      includeParticipants,
      includeParticipantSymbolConfigs,
      includeParticipantProfileConfigs,
      includeListingAutoAccounts,
      includeRuntimeMetrics,
      includeSalaryEligibility,
      participantSymbolConfigUserKey,
    }), "자동장 상태를 조회하지 못했습니다."),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
  });
}

export function autoMarketSummaryStatusQueryOptions(options: {
  enabled?: boolean;
  includeRuntimeMetrics?: boolean;
  includeSalaryEligibility?: boolean;
  refetchIntervalMs?: number | false;
} = {}) {
  const includeRuntimeMetrics = options.includeRuntimeMetrics ?? true;
  const includeSalaryEligibility = options.includeSalaryEligibility ?? false;
  return queryOptions({
    queryKey: stockKeys.autoMarketSummaryStatus({ includeRuntimeMetrics, includeSalaryEligibility }),
    queryFn: async () => unwrapStockResult(await getAutoMarketStatus({
      includeConfigs: false,
      includeParticipants: false,
      includeParticipantSymbolConfigs: false,
      includeParticipantProfileConfigs: false,
      includeListingAutoAccounts: false,
      includeRuntimeMetrics,
      includeSalaryEligibility,
    }), "자동장 요약을 조회하지 못했습니다."),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
  });
}

export function adminFundFlowSummaryQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
  } = {},
) {
  return queryOptions({
    queryKey: stockKeys.adminFundFlowSummary(),
    queryFn: async () => unwrapStockResult(await getAdminFundFlowSummary(token ?? ""), "전체 자금 흐름을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    retry: 1,
    staleTime: ADMIN_SNAPSHOT_STALE_MS,
  });
}

export function adminFlowOverviewQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    includeFundFlow?: boolean;
    includeSymbolFlows?: boolean;
    symbolFlowLimit?: number;
  } = {},
) {
  const includeFundFlow = options.includeFundFlow ?? true;
  const includeSymbolFlows = options.includeSymbolFlows ?? true;
  const symbolFlowLimit = options.symbolFlowLimit;
  return queryOptions({
    queryKey: stockKeys.adminFlowOverview({ includeFundFlow, includeSymbolFlows, symbolFlowLimit }),
    queryFn: async () => unwrapStockResult(await getAdminFlowOverview(token ?? "", {
      includeFundFlow,
      includeSymbolFlows,
      symbolFlowLimit,
    }), "전체 흐름을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    retry: 1,
    staleTime: ADMIN_SNAPSHOT_STALE_MS,
  });
}

export function adminSymbolFlowsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    limit?: number;
  } = {},
) {
  const limit = options.limit;
  return queryOptions({
    queryKey: stockKeys.adminSymbolFlows({ limit }),
    queryFn: async () => unwrapStockResult(await getAdminSymbolFlows(token ?? "", { limit }), "종목별 흐름을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    retry: 1,
    staleTime: ADMIN_SNAPSHOT_STALE_MS,
  });
}

export function adminCashFlowsQueryOptions(
  token: string | null,
  page: number,
  size: number,
  options: {
    enabled?: boolean;
  } = {},
) {
  return queryOptions({
    queryKey: stockKeys.adminCashFlows({ page, size }),
    queryFn: async () => unwrapStockResult(await getAdminCashFlows(token ?? "", page, size), "전체 현금 원장을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    placeholderData: keepPreviousData,
    retry: 1,
    staleTime: ADMIN_LEDGER_STALE_MS,
  });
}

export function adminUserFundFlowQueryOptions(
  token: string | null,
  userKey: string,
  options: {
    enabled?: boolean;
  } = {},
) {
  const normalizedUserKey = userKey.trim();
  return queryOptions({
    queryKey: stockKeys.adminUserFundFlow(normalizedUserKey),
    queryFn: async () => unwrapStockResult(await getAdminUserFundFlow(token ?? "", normalizedUserKey), "유저 자금 흐름을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled) && Boolean(normalizedUserKey),
    retry: 1,
    staleTime: ADMIN_LEDGER_STALE_MS,
  });
}

export function batchJobRuntimeControlsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
  } = {},
) {
  return queryOptions({
    queryKey: stockKeys.batchJobRuntimeControls(),
    queryFn: async () => unwrapStockResult(await getBatchJobRuntimeControls(token ?? ""), "배치 자동 실행 상태를 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    retry: false,
    staleTime: ADMIN_SNAPSHOT_STALE_MS,
  });
}

export function autoParticipantOverviewsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    includeHoldings?: boolean;
    refetchIntervalMs?: number | false;
    userKeys?: string[];
  } = {},
) {
  const includeHoldings = options.includeHoldings ?? true;
  const normalizedUserKeys = options.userKeys == null ? [] : [...new Set(options.userKeys.map((userKey) => userKey.trim()).filter(Boolean))].sort();
  return queryOptions({
    queryKey: stockKeys.autoParticipantOverviews({ includeHoldings, userKeys: normalizedUserKeys }),
    queryFn: async () => unwrapStockResult(await getAutoParticipantOverviews(token ?? "", { includeHoldings, userKeys: normalizedUserKeys }), "자동 참여자 현황을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    refetchInterval: options.refetchIntervalMs ?? USER_ACTIVITY_REFETCH_MS,
  });
}

export function autoParticipantProfileOverviewsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    refetchIntervalMs?: number | false;
  } = {},
) {
  return queryOptions({
    queryKey: stockKeys.autoParticipantProfileOverviews(),
    queryFn: async () => unwrapStockResult(await getAutoParticipantProfileOverviews(token ?? ""), "프로필별 자동 참여자 현황을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options.enabled),
    refetchInterval: options.refetchIntervalMs ?? USER_ACTIVITY_REFETCH_MS,
  });
}

export function corporateActionsQueryOptions(symbol: string) {
  return queryOptions({
    queryKey: stockKeys.corporateActions(symbol),
    queryFn: async () => unwrapStockResult(await getCorporateActions(symbol), "주식 이벤트를 조회하지 못했습니다."),
    enabled: Boolean(symbol),
  });
}

export function instrumentReportsQueryOptions(symbol: string) {
  return queryOptions({
    queryKey: stockKeys.instrumentReports(symbol),
    queryFn: async () => unwrapStockResult(await getInstrumentReports(symbol), "종목 보고서를 조회하지 못했습니다."),
    enabled: Boolean(symbol),
  });
}

export function profileQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: stockKeys.profile(),
    queryFn: async () => unwrapStockResult(await getStockUserProfile(token ?? ""), "사용자 정보를 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token),
  });
}

export function accountStatusQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: stockKeys.accountStatus(),
    queryFn: async () => unwrapStockResult(await getAccountStatus(token ?? ""), "계좌 상태를 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token),
  });
}

export function portfolioQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.portfolio(),
    queryFn: async () => unwrapStockResult(await getPortfolio(token ?? ""), "포트폴리오를 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, enabled),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function portfolioSnapshotsQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.portfolioSnapshots(),
    queryFn: async () => unwrapStockResult(await getPortfolioSnapshots(token ?? ""), "자산 이력을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, enabled),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function profitSummaryQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.profitSummary(),
    queryFn: async () => unwrapStockResult(await getProfitSummary(token ?? ""), "손익 요약을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, enabled),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function holdingsQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.holdings(),
    queryFn: async () => unwrapStockResult(await getHoldings(token ?? ""), "보유 종목을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, enabled),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function corporateActionEntitlementsQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.corporateActionEntitlements(),
    queryFn: async () => unwrapStockResult(await getCorporateActionEntitlements(token ?? ""), "권리 내역을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, enabled),
  });
}

export function ordersQueryOptions(token: string | null, options?: { marketType?: MarketType; enabled?: boolean }) {
  return queryOptions({
    queryKey: stockKeys.orders({ marketType: options?.marketType }),
    queryFn: async () => unwrapStockResult(await getOrders(token ?? "", { marketType: options?.marketType }), "주문 내역을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options?.enabled),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function executionsQueryOptions(token: string | null, options?: { source?: Execution["source"]; enabled?: boolean }) {
  return queryOptions({
    queryKey: stockKeys.executions({ source: options?.source }),
    queryFn: async () => unwrapStockResult(await getExecutions(token ?? "", { source: options?.source }), "체결 내역을 조회하지 못했습니다."),
    enabled: isEnabledWithToken(token, options?.enabled),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}
