import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";

export function buildAdminMarketContentProps({
  activeAdminSection,
  actions,
  derived,
  queries,
  queryInvalidations,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["marketProps"]> {
  const { reloadAdminMarketFlowState } = queryInvalidations;
  const {
    adminAllFundFlowSummaryQuery,
    adminFlowOverview,
    adminFlowOverviewQuery,
    adminFundFlowSummaryQuery,
    adminInvestorFlowHistoryQuery,
    adminInvestorFlowSummaryQuery,
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
    loadWeeklyAdminSymbolFlows,
    loadAdminTotalAssetHistory,
    updatingStatusSymbol,
    updatingTradingRulesSymbol,
    updateOrderBookInstrumentTradingRules,
  } = actions;

  return {
    activeSection: activeAdminSection,
    adminFlowOverview,
    allFundFlow: adminAllFundFlowSummaryQuery.data ?? null,
    allFundFlowError: adminAllFundFlowSummaryQuery.isError,
    autoMarketSummary,
    fundFlow: adminFundFlowSummaryQuery.data ?? adminFlowOverview?.fundFlow ?? null,
    fundFlowError: adminFundFlowSummaryQuery.isError,
    instruments,
    investorFlow: adminInvestorFlowSummaryQuery.data ?? adminFlowOverview?.investorFlow ?? null,
    investorFlowError: adminInvestorFlowSummaryQuery.isError,
    investorFlowHistory: adminInvestorFlowHistoryQuery.data ?? null,
    investorFlowHistoryError: adminInvestorFlowHistoryQuery.isError,
    investorFlowHistoryLoading: adminInvestorFlowHistoryQuery.isFetching,
    investorFlowRefreshing: adminInvestorFlowSummaryQuery.isFetching,
    jumpingSimulationClockAction,
    loadingAllFundFlow: adminAllFundFlowSummaryQuery.isFetching,
    loadingFundFlow: adminFundFlowSummaryQuery.isFetching,
    loadingSymbolFlows: adminFlowOverviewQuery.isFetching && adminFlowOverview === null,
    onChangeMarketStatus: (symbol, marketStatus) => void changeOrderBookMarketStatus(symbol, marketStatus),
    onLoadAllFundFlow: () => void adminAllFundFlowSummaryQuery.refetch(),
    onUpdateTradingRules: updateOrderBookInstrumentTradingRules,
    onJumpSimulationClock: (action) => void jumpSimulationClock(action),
    onLoadWeeklySymbolFlows: loadWeeklyAdminSymbolFlows,
    onLoadTotalAssetHistory: loadAdminTotalAssetHistory,
    onLoadInvestorFlowHistory: () => void adminInvestorFlowHistoryQuery.refetch(),
    onRefreshFlow: reloadAdminMarketFlowState,
    openOrderBookConfigCount,
    orderBookConfigBySymbol,
    orderBookInstrumentCount,
    orderBookMarketSummary,
    simulationClock: simulationClockQuery.data ?? null,
    symbolFlowList: {
      totalCount: adminFlowOverview?.symbolFlowTotalCount ?? 0,
      symbolFlows: adminFlowOverview?.symbolFlows ?? [],
    },
    updatingStatusSymbol,
    updatingTradingRulesSymbol,
  };
}
