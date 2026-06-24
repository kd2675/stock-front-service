import { queryOptions } from "@tanstack/react-query";
import {
  getAccountStatus,
  getAutoParticipantOverviews,
  getAutoMarketStatus,
  getCorporateActionEntitlements,
  getCorporateActions,
  getExecutions,
  getHoldings,
  getInstrumentReports,
  getInstruments,
  getOrderBook,
  getOrderBookInstruments,
  getOrderBookMarketStatus,
  getOrders,
  getPortfolio,
  getPortfolioSnapshots,
  getPrices,
  getPriceTicks,
  getProfitSummary,
  getRankings,
  getStockUserProfile,
  getVirtualMarketStatus,
} from "@/app/lib/stock";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { unwrapStockResult } from "@/app/lib/react-query/stockResult";
import type { Execution, MarketType } from "@/app/types/stock";

const FAST_MARKET_REFETCH_MS = 2_000;
const USER_ACTIVITY_REFETCH_MS = 5_000;

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

export function orderBookMarketStatusQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.orderBookMarketStatus(),
    queryFn: async () => unwrapStockResult(await getOrderBookMarketStatus(), "주문장 상태를 조회하지 못했습니다."),
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function autoMarketStatusQueryOptions() {
  return queryOptions({
    queryKey: stockKeys.autoMarketStatus(),
    queryFn: async () => unwrapStockResult(await getAutoMarketStatus(), "자동장 상태를 조회하지 못했습니다."),
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function autoParticipantOverviewsQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: stockKeys.autoParticipantOverviews(),
    queryFn: async () => unwrapStockResult(await getAutoParticipantOverviews(token ?? ""), "자동 참여자 현황을 조회하지 못했습니다."),
    enabled: Boolean(token),
    refetchInterval: FAST_MARKET_REFETCH_MS,
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
    enabled: Boolean(token),
  });
}

export function accountStatusQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: stockKeys.accountStatus(),
    queryFn: async () => unwrapStockResult(await getAccountStatus(token ?? ""), "계좌 상태를 조회하지 못했습니다."),
    enabled: Boolean(token),
  });
}

export function portfolioQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.portfolio(),
    queryFn: async () => unwrapStockResult(await getPortfolio(token ?? ""), "포트폴리오를 조회하지 못했습니다."),
    enabled: Boolean(token) && enabled,
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function portfolioSnapshotsQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.portfolioSnapshots(),
    queryFn: async () => unwrapStockResult(await getPortfolioSnapshots(token ?? ""), "자산 이력을 조회하지 못했습니다."),
    enabled: Boolean(token) && enabled,
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function profitSummaryQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.profitSummary(),
    queryFn: async () => unwrapStockResult(await getProfitSummary(token ?? ""), "손익 요약을 조회하지 못했습니다."),
    enabled: Boolean(token) && enabled,
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function holdingsQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.holdings(),
    queryFn: async () => unwrapStockResult(await getHoldings(token ?? ""), "보유 종목을 조회하지 못했습니다."),
    enabled: Boolean(token) && enabled,
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function corporateActionEntitlementsQueryOptions(token: string | null, enabled = true) {
  return queryOptions({
    queryKey: stockKeys.corporateActionEntitlements(),
    queryFn: async () => unwrapStockResult(await getCorporateActionEntitlements(token ?? ""), "권리 내역을 조회하지 못했습니다."),
    enabled: Boolean(token) && enabled,
  });
}

export function ordersQueryOptions(token: string | null, options?: { marketType?: MarketType; enabled?: boolean }) {
  return queryOptions({
    queryKey: stockKeys.orders({ marketType: options?.marketType }),
    queryFn: async () => unwrapStockResult(await getOrders(token ?? "", { marketType: options?.marketType }), "주문 내역을 조회하지 못했습니다."),
    enabled: Boolean(token) && (options?.enabled ?? true),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function executionsQueryOptions(token: string | null, options?: { source?: Execution["source"]; enabled?: boolean }) {
  return queryOptions({
    queryKey: stockKeys.executions({ source: options?.source }),
    queryFn: async () => unwrapStockResult(await getExecutions(token ?? "", { source: options?.source }), "체결 내역을 조회하지 못했습니다."),
    enabled: Boolean(token) && (options?.enabled ?? true),
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}
