import { useCallback } from "react";
import type { QueryClient } from "@tanstack/react-query";

import {
  invalidateAdminCashFlowQueries,
  invalidateAdminMarketFlowQueries,
  invalidateAutoMarketConfigurationQueries,
  invalidateAutoMarketDetailsQueries,
  invalidateAutoParticipantAdminQueries,
  invalidateAutoParticipantStrategyQueries,
  invalidateOrderBookMarketAdminQueries,
  invalidateSimulationClockQueries,
} from "@/app/lib/react-query/stockInvalidations";

export function useAdminQueryInvalidations(queryClient: QueryClient) {
  const reloadAutoMarketConfigurationState = useCallback(() => {
    void invalidateAutoMarketConfigurationQueries(queryClient);
  }, [queryClient]);

  const reloadAutoMarketDetailsState = useCallback(() => {
    void invalidateAutoMarketDetailsQueries(queryClient);
  }, [queryClient]);

  const reloadAutoParticipantState = useCallback(() => {
    void invalidateAutoParticipantAdminQueries(queryClient);
  }, [queryClient]);

  const reloadAutoParticipantStrategyState = useCallback(() => {
    void invalidateAutoParticipantStrategyQueries(queryClient);
  }, [queryClient]);

  const reloadAdminCashFlowState = useCallback(() => {
    void invalidateAdminCashFlowQueries(queryClient);
  }, [queryClient]);

  const reloadAdminMarketFlowState = useCallback(() => {
    void invalidateAdminMarketFlowQueries(queryClient);
  }, [queryClient]);

  const reloadOrderBookMarketState = useCallback(() => {
    void invalidateOrderBookMarketAdminQueries(queryClient);
  }, [queryClient]);

  const reloadSimulationClockState = useCallback(() => {
    void invalidateSimulationClockQueries(queryClient);
  }, [queryClient]);

  return {
    reloadAdminCashFlowState,
    reloadAdminMarketFlowState,
    reloadAutoMarketConfigurationState,
    reloadAutoMarketDetailsState,
    reloadAutoParticipantState,
    reloadAutoParticipantStrategyState,
    reloadOrderBookMarketState,
    reloadSimulationClockState,
  };
}
