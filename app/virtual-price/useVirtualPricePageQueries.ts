import { useQuery } from "@tanstack/react-query";

import {
  accountStatusQueryOptions,
  corporateActionEntitlementsQueryOptions,
  executionsQueryOptions,
  holdingsQueryOptions,
  ordersQueryOptions,
  portfolioQueryOptions,
  portfolioSnapshotsQueryOptions,
  profitSummaryQueryOptions,
  profileQueryOptions,
} from "@/app/lib/react-query/stockAccountQueries";
import {
  instrumentsQueryOptions,
  orderBookQueryOptions,
  priceTicksQueryOptions,
  pricesQueryOptions,
  rankingsQueryOptions,
} from "@/app/lib/react-query/stockMarketQueries";
import { isEnabledWithAuthenticatedSession } from "@/app/lib/react-query/stockQueryCore";
import type { AuthStatus } from "@/app/types/auth";
import type { CorporateActionEntitlement, Execution, Instrument, Order, PortfolioSnapshot, Price, PriceTick, Ranking } from "@/app/types/stock";

const EMPTY_PRICES: Price[] = [];
const EMPTY_PRICE_TICKS: PriceTick[] = [];
const EMPTY_INSTRUMENTS: Instrument[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_EXECUTIONS: Execution[] = [];
const EMPTY_PORTFOLIO_SNAPSHOTS: PortfolioSnapshot[] = [];
const EMPTY_CORPORATE_ACTION_ENTITLEMENTS: CorporateActionEntitlement[] = [];
const EMPTY_RANKINGS: Ranking[] = [];

type UseVirtualPricePageQueriesOptions = {
  authStatus: AuthStatus;
  selectedSymbol: string;
  token: string | null;
};

export function useVirtualPricePageQueries({
  authStatus,
  selectedSymbol,
  token,
}: UseVirtualPricePageQueriesOptions) {
  const authenticatedQueryEnabled = isEnabledWithAuthenticatedSession({ authStatus, token });
  const instrumentsQuery = useQuery(instrumentsQueryOptions());
  const pricesQuery = useQuery(pricesQueryOptions());
  const rankingsQuery = useQuery(rankingsQueryOptions());
  const priceTicksQuery = useQuery(priceTicksQueryOptions(selectedSymbol));
  const orderBookQuery = useQuery(orderBookQueryOptions(selectedSymbol));
  const profileQuery = useQuery(profileQueryOptions(token, { enabled: authenticatedQueryEnabled }));
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token, { enabled: authenticatedQueryEnabled }));
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true || Boolean(profileQuery.data?.account);
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasTradingAccount));
  const portfolioSnapshotsQuery = useQuery(portfolioSnapshotsQueryOptions(token, hasTradingAccount));
  const profitSummaryQuery = useQuery(profitSummaryQueryOptions(token, hasTradingAccount));
  const corporateActionEntitlementsQuery = useQuery(corporateActionEntitlementsQueryOptions(token, hasTradingAccount));
  const ordersQuery = useQuery(ordersQueryOptions(token, { enabled: hasTradingAccount }));
  const executionsQuery = useQuery(executionsQueryOptions(token, { enabled: hasTradingAccount }));

  const lastUpdatedAtMs = Math.max(
    instrumentsQuery.dataUpdatedAt,
    pricesQuery.dataUpdatedAt,
    rankingsQuery.dataUpdatedAt,
    priceTicksQuery.dataUpdatedAt,
    orderBookQuery.dataUpdatedAt,
    portfolioQuery.dataUpdatedAt,
    holdingsQuery.dataUpdatedAt,
    ordersQuery.dataUpdatedAt,
    executionsQuery.dataUpdatedAt,
  );

  return {
    accountStatusQuery,
    corporateActionEntitlements: corporateActionEntitlementsQuery.data ?? EMPTY_CORPORATE_ACTION_ENTITLEMENTS,
    corporateActionEntitlementsQuery,
    executions: executionsQuery.data ?? EMPTY_EXECUTIONS,
    executionsQuery,
    hasTradingAccount,
    holdings: holdingsQuery.data ?? null,
    holdingsQuery,
    instruments: instrumentsQuery.data ?? EMPTY_INSTRUMENTS,
    instrumentsQuery,
    lastUpdatedAt: lastUpdatedAtMs > 0 ? new Date(lastUpdatedAtMs) : null,
    orderBook: orderBookQuery.data ?? null,
    orderBookQuery,
    portfolio: portfolioQuery.data ?? null,
    portfolioQuery,
    portfolioSnapshots: portfolioSnapshotsQuery.data ?? EMPTY_PORTFOLIO_SNAPSHOTS,
    portfolioSnapshotsQuery,
    prices: pricesQuery.data ?? EMPTY_PRICES,
    pricesQuery,
    priceTicks: priceTicksQuery.data ?? EMPTY_PRICE_TICKS,
    priceTicksQuery,
    profitSummary: profitSummaryQuery.data ?? null,
    profitSummaryQuery,
    profile: profileQuery.data ?? null,
    profileQuery,
    rankings: rankingsQuery.data ?? EMPTY_RANKINGS,
    rankingsQuery,
    refreshing: pricesQuery.isFetching || instrumentsQuery.isFetching || rankingsQuery.isFetching || portfolioQuery.isFetching || ordersQuery.isFetching || executionsQuery.isFetching,
    orders: ordersQuery.data ?? EMPTY_ORDERS,
    ordersQuery,
  };
}
