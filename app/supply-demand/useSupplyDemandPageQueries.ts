import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  accountStatusQueryOptions,
  corporateActionEntitlementsQueryOptions,
  executionsQueryOptions,
  holdingsQueryOptions,
  ordersQueryOptions,
  portfolioQueryOptions,
} from "@/app/lib/react-query/stockAccountQueries";
import {
  autoMarketStatusQueryOptions,
  corporateActionsQueryOptions,
  orderBookCandlesQueryOptions,
  orderBookInstrumentsQueryOptions,
  orderBookMarketStatusQueryOptions,
  orderBookQueryOptions,
  orderBookRecentExecutionsQueryOptions,
  orderBookTradeSummaryQueryOptions,
  simulationClockQueryOptions,
} from "@/app/lib/react-query/stockMarketQueries";
import { isEnabledWithAuthenticatedSession } from "@/app/lib/react-query/stockQueryCore";
import type { AuthStatus } from "@/app/types/auth";
import type {
  Execution,
  Order,
  OrderBookCandle,
  OrderBookCandleInterval,
  OrderBookInstrument,
  OrderBookRecentExecution,
} from "@/app/types/stock";

const EMPTY_ORDER_BOOK_INSTRUMENTS: OrderBookInstrument[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_EXECUTIONS: Execution[] = [];
const EMPTY_RECENT_ORDER_BOOK_EXECUTIONS: OrderBookRecentExecution[] = [];
const EMPTY_ORDER_BOOK_CANDLES: OrderBookCandle[] = [];
const ACTIVITY_PREVIEW_LIMIT = 5;

type UseSupplyDemandPageQueriesOptions = {
  authStatus: AuthStatus;
  candleInterval: OrderBookCandleInterval;
  isHydrated: boolean;
  selectedSymbol: string;
  token: string | null;
};

export function useSupplyDemandPageQueries({
  authStatus,
  candleInterval,
  isHydrated,
  selectedSymbol,
  token,
}: UseSupplyDemandPageQueriesOptions) {
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token, {
    enabled: isEnabledWithAuthenticatedSession({ authStatus, isHydrated, token }),
  }));
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true;
  const instrumentsQuery = useQuery(orderBookInstrumentsQueryOptions({ enabled: hasTradingAccount }));
  const autoMarketQuery = useQuery(autoMarketStatusQueryOptions({ enabled: hasTradingAccount }));
  const orderBookMarketQuery = useQuery(orderBookMarketStatusQueryOptions({
    enabled: hasTradingAccount,
    includeConfigs: true,
    includeTodayExecution: false,
  }));
  const orderBookQuery = useQuery(orderBookQueryOptions(selectedSymbol, { enabled: hasTradingAccount }));
  const orderBookTradeSummaryQuery = useQuery(orderBookTradeSummaryQueryOptions(selectedSymbol, { enabled: hasTradingAccount }));
  const orderBookRecentExecutionsQuery = useQuery(orderBookRecentExecutionsQueryOptions(selectedSymbol, { enabled: hasTradingAccount }));
  const orderBookCandlesQuery = useQuery(orderBookCandlesQueryOptions(selectedSymbol, candleInterval, { enabled: hasTradingAccount }));
  const corporateActionsQuery = useQuery(corporateActionsQueryOptions(selectedSymbol, { enabled: hasTradingAccount }));
  const corporateActionEntitlementsQuery = useQuery(corporateActionEntitlementsQueryOptions(token, hasTradingAccount));
  const simulationClockQuery = useQuery(simulationClockQueryOptions());
  const ordersQuery = useQuery(ordersQueryOptions(token, {
    marketType: "ORDER_BOOK",
    symbol: selectedSymbol,
    limit: ACTIVITY_PREVIEW_LIMIT,
    enabled: hasTradingAccount,
  }));
  const executionsQuery = useQuery(executionsQueryOptions(token, {
    source: "INTERNAL_ORDER_BOOK",
    symbol: selectedSymbol,
    limit: ACTIVITY_PREVIEW_LIMIT,
    enabled: hasTradingAccount,
  }));
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasTradingAccount));

  const holdings = useMemo(
    () => holdingsQuery.data ?? portfolioQuery.data?.holdings ?? [],
    [holdingsQuery.data, portfolioQuery.data?.holdings],
  );
  const updatedAtMs = Math.max(
    instrumentsQuery.dataUpdatedAt,
    autoMarketQuery.dataUpdatedAt,
    orderBookMarketQuery.dataUpdatedAt,
    orderBookQuery.dataUpdatedAt,
    orderBookTradeSummaryQuery.dataUpdatedAt,
    orderBookRecentExecutionsQuery.dataUpdatedAt,
    orderBookCandlesQuery.dataUpdatedAt,
    corporateActionsQuery.dataUpdatedAt,
    corporateActionEntitlementsQuery.dataUpdatedAt,
    simulationClockQuery.dataUpdatedAt,
    ordersQuery.dataUpdatedAt,
    executionsQuery.dataUpdatedAt,
    portfolioQuery.dataUpdatedAt,
    holdingsQuery.dataUpdatedAt,
  );

  return {
    accountStatusQuery,
    autoMarket: autoMarketQuery.data ?? null,
    autoMarketQuery,
    corporateActionEntitlements: corporateActionEntitlementsQuery.data ?? [],
    corporateActionEntitlementsQuery,
    corporateActions: corporateActionsQuery.data ?? [],
    corporateActionsQuery,
    executions: executionsQuery.data ?? EMPTY_EXECUTIONS,
    executionsQuery,
    hasTradingAccount,
    holdings,
    holdingsQuery,
    instruments: instrumentsQuery.data ?? EMPTY_ORDER_BOOK_INSTRUMENTS,
    instrumentsQuery,
    loading: instrumentsQuery.isLoading || autoMarketQuery.isLoading || orderBookMarketQuery.isLoading,
    orderBook: orderBookQuery.data ?? null,
    orderBookCandles: orderBookCandlesQuery.data ?? EMPTY_ORDER_BOOK_CANDLES,
    orderBookCandlesQuery,
    orderBookMarket: orderBookMarketQuery.data ?? null,
    orderBookMarketQuery,
    orderBookQuery,
    orderBookRecentExecutions: orderBookRecentExecutionsQuery.data ?? EMPTY_RECENT_ORDER_BOOK_EXECUTIONS,
    orderBookRecentExecutionsQuery,
    orderBookTradeSummary: orderBookTradeSummaryQuery.data ?? null,
    orderBookTradeSummaryQuery,
    orders: ordersQuery.data ?? EMPTY_ORDERS,
    ordersQuery,
    portfolio: portfolioQuery.data ?? null,
    portfolioQuery,
    simulationClock: simulationClockQuery.data ?? null,
    simulationClockQuery,
    updatedAt: updatedAtMs > 0 ? new Date(updatedAtMs) : null,
  };
}
