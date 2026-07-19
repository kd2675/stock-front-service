import {
  getAccountStatus,
  getCorporateActionEntitlements,
  getExecutions,
  getHoldings,
  getOrders,
  getPortfolio,
  getPortfolioSnapshots,
  getProfitSummary,
  getStockUserProfile,
} from "@/app/lib/stock";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import {
  ACCOUNT_HISTORY_REFETCH_MS,
  ACCOUNT_POSITION_REFETCH_MS,
  ACCOUNT_SUMMARY_REFETCH_MS,
  USER_ACTIVITY_REFETCH_MS,
  authenticatedStockQueryOptions,
  type AuthenticatedStockQueryOptionsConfig,
} from "@/app/lib/react-query/stockQueryCore";
import type { CorporateActionEntitlement, Execution, Holding, MarketType, Order, Portfolio, PortfolioSnapshot, ProfitSummary } from "@/app/types/stock";

export function profileQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
  } = {},
) {
  return authenticatedStockQueryOptions(token, {
    queryKey: stockKeys.profile(),
    request: getStockUserProfile,
    fallbackMessage: "사용자 정보를 조회하지 못했습니다.",
    enabled: options.enabled,
  });
}

export function accountStatusQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
  } = {},
) {
  return authenticatedStockQueryOptions(token, {
    queryKey: stockKeys.accountStatus(),
    request: getAccountStatus,
    fallbackMessage: "계좌 상태를 조회하지 못했습니다.",
    enabled: options.enabled,
  });
}

function authenticatedUserActivityQueryOptions<TData>(
  token: string | null,
  config: AuthenticatedStockQueryOptionsConfig<TData>,
  refetchInterval = USER_ACTIVITY_REFETCH_MS,
) {
  return authenticatedStockQueryOptions(token, {
    refetchInterval,
    ...config,
  });
}

export function portfolioQueryOptions(token: string | null, enabled = true) {
  return authenticatedUserActivityQueryOptions<Portfolio>(token, {
    queryKey: stockKeys.portfolio(),
    request: getPortfolio,
    fallbackMessage: "포트폴리오를 조회하지 못했습니다.",
    enabled,
  }, ACCOUNT_POSITION_REFETCH_MS);
}

export function portfolioSnapshotsQueryOptions(token: string | null, enabled = true) {
  return authenticatedUserActivityQueryOptions<PortfolioSnapshot[]>(token, {
    queryKey: stockKeys.portfolioSnapshots(),
    request: getPortfolioSnapshots,
    fallbackMessage: "자산 이력을 조회하지 못했습니다.",
    enabled,
  }, ACCOUNT_HISTORY_REFETCH_MS);
}

export function profitSummaryQueryOptions(token: string | null, enabled = true) {
  return authenticatedUserActivityQueryOptions<ProfitSummary>(token, {
    queryKey: stockKeys.profitSummary(),
    request: getProfitSummary,
    fallbackMessage: "손익 요약을 조회하지 못했습니다.",
    enabled,
  }, ACCOUNT_SUMMARY_REFETCH_MS);
}

export function holdingsQueryOptions(token: string | null, enabled = true) {
  return authenticatedUserActivityQueryOptions<Holding[]>(token, {
    queryKey: stockKeys.holdings(),
    request: getHoldings,
    fallbackMessage: "보유 종목을 조회하지 못했습니다.",
    enabled,
  }, ACCOUNT_POSITION_REFETCH_MS);
}

export function corporateActionEntitlementsQueryOptions(token: string | null, enabled = true) {
  return authenticatedUserActivityQueryOptions<CorporateActionEntitlement[]>(token, {
    queryKey: stockKeys.corporateActionEntitlements(),
    request: getCorporateActionEntitlements,
    fallbackMessage: "권리 내역을 조회하지 못했습니다.",
    enabled,
  }, ACCOUNT_SUMMARY_REFETCH_MS);
}

export function ordersQueryOptions(token: string | null, options?: {
  enabled?: boolean;
  limit?: number;
  marketType?: MarketType;
  symbol?: string;
}) {
  const symbol = options?.symbol?.trim() || undefined;
  return authenticatedUserActivityQueryOptions<Order[]>(token, {
    queryKey: stockKeys.orders({ marketType: options?.marketType, symbol, limit: options?.limit }),
    request: (nextToken) => getOrders(nextToken, { marketType: options?.marketType, symbol, limit: options?.limit }),
    fallbackMessage: "주문 내역을 조회하지 못했습니다.",
    enabled: options?.enabled,
  });
}

export function executionsQueryOptions(token: string | null, options?: {
  enabled?: boolean;
  limit?: number;
  source?: Execution["source"];
  symbol?: string;
}) {
  const symbol = options?.symbol?.trim() || undefined;
  return authenticatedUserActivityQueryOptions<Execution[]>(token, {
    queryKey: stockKeys.executions({ source: options?.source, symbol, limit: options?.limit }),
    request: (nextToken) => getExecutions(nextToken, { source: options?.source, symbol, limit: options?.limit }),
    fallbackMessage: "체결 내역을 조회하지 못했습니다.",
    enabled: options?.enabled,
  });
}
