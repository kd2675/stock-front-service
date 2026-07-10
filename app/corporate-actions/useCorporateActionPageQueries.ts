import { useQuery } from "@tanstack/react-query";

import {
  accountStatusQueryOptions,
  corporateActionEntitlementsQueryOptions,
  portfolioQueryOptions,
} from "@/app/lib/react-query/stockAccountQueries";
import {
  corporateActionFeedQueryOptions,
  orderBookInstrumentsQueryOptions,
  simulationClockQueryOptions,
} from "@/app/lib/react-query/stockMarketQueries";
import { isEnabledWithAuthenticatedSession } from "@/app/lib/react-query/stockQueryCore";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import type { AuthStatus } from "@/app/types/auth";

type UseCorporateActionPageQueriesOptions = {
  authStatus: AuthStatus;
  isHydrated: boolean;
  token: string | null;
};

export function useCorporateActionPageQueries({
  authStatus,
  isHydrated,
  token,
}: UseCorporateActionPageQueriesOptions) {
  const authenticated = isEnabledWithAuthenticatedSession({ authStatus, isHydrated, token });
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token, { enabled: authenticated }));
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true;
  const instrumentsQuery = useQuery(orderBookInstrumentsQueryOptions({ enabled: hasTradingAccount }));
  const corporateActionFeedQuery = useQuery(corporateActionFeedQueryOptions({
    actionType: "PAID_IN_CAPITAL_INCREASE",
    enabled: hasTradingAccount,
    limit: 200,
  }));
  const corporateActionEntitlementsQuery = useQuery(corporateActionEntitlementsQueryOptions(token, hasTradingAccount));
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const simulationClockQuery = useQuery(simulationClockQueryOptions());
  const actionsErrorMessage = instrumentsQuery.isError
    ? getStockErrorMessage(instrumentsQuery.error, "기업 이벤트 종목을 조회하지 못했습니다.")
    : corporateActionFeedQuery.isError
      ? getStockErrorMessage(corporateActionFeedQuery.error, "유상증자 기업 이벤트를 조회하지 못했습니다.")
      : corporateActionEntitlementsQuery.isError
        ? getStockErrorMessage(corporateActionEntitlementsQuery.error, "내 기업 이벤트 권리를 조회하지 못했습니다.")
        : simulationClockQuery.isError
          ? getStockErrorMessage(simulationClockQuery.error, "시뮬레이션 장 상태를 조회하지 못했습니다.")
          : null;
  const cashErrorMessage = portfolioQuery.isError
    ? getStockErrorMessage(portfolioQuery.error, "청약 가능 예수금을 조회하지 못했습니다.")
    : null;

  return {
    accountStatusQuery,
    actionsErrorMessage,
    cashErrorMessage,
    corporateActions: corporateActionFeedQuery.data ?? [],
    entitlements: corporateActionEntitlementsQuery.data ?? [],
    entitlementsReady: corporateActionEntitlementsQuery.data !== undefined,
    hasTradingAccount,
    instruments: instrumentsQuery.data ?? [],
    isFetching: instrumentsQuery.isFetching
      || corporateActionFeedQuery.isFetching
      || corporateActionEntitlementsQuery.isFetching
      || portfolioQuery.isFetching,
    isLoading: instrumentsQuery.isLoading
      || corporateActionFeedQuery.isLoading
      || corporateActionEntitlementsQuery.isLoading
      || portfolioQuery.isLoading,
    portfolio: portfolioQuery.data ?? null,
    simulationClock: simulationClockQuery.data ?? null,
    refetchEvents: async () => {
      await Promise.all([
        instrumentsQuery.refetch(),
        corporateActionFeedQuery.refetch(),
        corporateActionEntitlementsQuery.refetch(),
        portfolioQuery.refetch(),
        simulationClockQuery.refetch(),
      ]);
    },
  };
}
