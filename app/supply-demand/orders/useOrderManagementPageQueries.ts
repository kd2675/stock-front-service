import { useQuery } from "@tanstack/react-query";

import {
  accountStatusQueryOptions,
  ordersQueryOptions,
  portfolioQueryOptions,
} from "@/app/lib/react-query/stockAccountQueries";
import {
  orderBookInstrumentsQueryOptions,
  orderBookMarketStatusQueryOptions,
} from "@/app/lib/react-query/stockMarketQueries";
import { isEnabledWithAuthenticatedSession } from "@/app/lib/react-query/stockQueryCore";
import type { AuthStatus } from "@/app/types/auth";
import type { Order, OrderBookInstrument } from "@/app/types/stock";

const EMPTY_ORDERS: Order[] = [];
const EMPTY_INSTRUMENTS: OrderBookInstrument[] = [];

type UseOrderManagementPageQueriesOptions = {
  authStatus: AuthStatus;
  isHydrated: boolean;
  token: string | null;
};

export function useOrderManagementPageQueries({
  authStatus,
  isHydrated,
  token,
}: UseOrderManagementPageQueriesOptions) {
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token, {
    enabled: isEnabledWithAuthenticatedSession({ authStatus, isHydrated, token }),
  }));
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true;
  const ordersQuery = useQuery(ordersQueryOptions(token, { marketType: "ORDER_BOOK", enabled: hasTradingAccount }));
  const instrumentsQuery = useQuery(orderBookInstrumentsQueryOptions({ enabled: hasTradingAccount }));
  const orderBookMarketQuery = useQuery(orderBookMarketStatusQueryOptions({
    enabled: hasTradingAccount,
    includeConfigs: false,
    includeTodayExecution: false,
  }));
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));

  return {
    accountStatusQuery,
    hasTradingAccount,
    instruments: instrumentsQuery.data ?? EMPTY_INSTRUMENTS,
    instrumentsQuery,
    isRefreshing: ordersQuery.isFetching || orderBookMarketQuery.isFetching || portfolioQuery.isFetching,
    loading: accountStatusQuery.isPending || ordersQuery.isLoading || instrumentsQuery.isLoading,
    orderBookMarket: orderBookMarketQuery.data ?? null,
    orderBookMarketQuery,
    orders: ordersQuery.data ?? EMPTY_ORDERS,
    ordersQuery,
    portfolio: portfolioQuery.data ?? null,
    portfolioQuery,
  };
}
