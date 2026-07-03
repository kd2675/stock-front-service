import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";

export function buildAdminMarketContentProps({
  actions,
  derived,
  queries,
  queryInvalidations,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["marketProps"]> {
  const { reloadAdminMarketFlowState } = queryInvalidations;
  const {
    adminFlowOverview,
    adminFlowOverviewQuery,
    adminFundFlowSummaryQuery,
    adminSymbolFlowList,
    adminSymbolFlowsQuery,
    autoMarketSummary,
    instruments,
    openOrderBookConfigCount,
    orderBookInstrumentCount,
    orderBookMarketSummary,
    simulationClockQuery,
  } = queries;
  const { orderBookConfigBySymbol } = derived;
  const {
    changeOrderBookMarketStatus,
    jumpSimulationClock,
    jumpingSimulationClockAction,
    loadAllAdminSymbolFlows,
    updatingStatusSymbol,
  } = actions;

  return {
    adminFlowOverview,
    autoMarketSummary,
    fundFlow: adminFundFlowSummaryQuery.data ?? adminFlowOverview?.fundFlow ?? null,
    fundFlowError: adminFundFlowSummaryQuery.isError,
    instruments,
    jumpingSimulationClockAction,
    loadingAllSymbolFlows: adminSymbolFlowsQuery.isFetching,
    loadingFundFlow: adminFundFlowSummaryQuery.isFetching,
    loadingSymbolFlows: adminFlowOverviewQuery.isFetching && adminSymbolFlowList === null,
    onChangeMarketStatus: (symbol, marketStatus) => void changeOrderBookMarketStatus(symbol, marketStatus),
    onJumpSimulationClock: (action) => void jumpSimulationClock(action),
    onLoadAllSymbolFlows: () => void loadAllAdminSymbolFlows(),
    onRefreshFlow: reloadAdminMarketFlowState,
    openOrderBookConfigCount,
    orderBookConfigBySymbol,
    orderBookInstrumentCount,
    orderBookMarketSummary,
    simulationClock: simulationClockQuery.data ?? null,
    symbolFlowList: adminSymbolFlowList ?? {
      totalCount: adminFlowOverview?.symbolFlowTotalCount ?? 0,
      symbolFlows: adminFlowOverview?.symbolFlows ?? [],
    },
    updatingStatusSymbol,
  };
}
