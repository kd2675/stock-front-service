import { AdminFlowOverviewPanel } from "@/app/supply-demand/admin/AdminFlowPanels";
import { AdminMarketSummaryPanel } from "@/app/supply-demand/admin/AdminMarketSummaryPanel";
import { AdminOrderBookInstrumentTable } from "@/app/supply-demand/admin/AdminOrderBookInstrumentTable";
import { AdminSimulationClockControlPanel } from "@/app/supply-demand/admin/AdminSimulationClockControlPanel";
import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import type {
  AdminFlowOverview,
  AdminFundFlowBreakdown,
  AdminInvestorFlowHistory,
  AdminInvestorFlowSummary,
  AdminParticipantScope,
  AdminSymbolFlowList,
  AdminTotalAssetHistoryPage,
  AutoMarketStatus,
  MarketSessionStatus,
  OrderBookInstrument,
  OrderBookMarketStatus,
  SimulationClock,
  SimulationClockJumpAction,
} from "@/app/types/stock";

type AdminMarketSectionProps = {
  activeSection: AdminSection;
  orderBookMarketSummary: OrderBookMarketStatus | null;
  autoMarketSummary: AutoMarketStatus | null;
  simulationClock: SimulationClock | null;
  orderBookInstrumentCount: number;
  openOrderBookConfigCount: number;
  adminFlowOverview: AdminFlowOverview | null;
  fundFlow: AdminFundFlowBreakdown | null;
  cumulativeFundFlow: AdminFundFlowBreakdown | null;
  loadingFundFlow: boolean;
  loadingCumulativeFundFlow: boolean;
  fundFlowError: boolean;
  cumulativeFundFlowError: boolean;
  investorFlow: AdminInvestorFlowSummary | null;
  investorFlowError: boolean;
  investorFlowHistory: AdminInvestorFlowHistory | null;
  investorFlowHistoryError: boolean;
  investorFlowHistoryLoading: boolean;
  investorFlowRefreshing: boolean;
  symbolFlowList: AdminSymbolFlowList;
  loadingSymbolFlows: boolean;
  onLoadCumulativeFundFlow: () => void;
  onLoadTotalAssetHistory: (page: number, participantScope: AdminParticipantScope) => Promise<AdminTotalAssetHistoryPage | null>;
  onLoadInvestorFlowHistory: () => void;
  onLoadWeeklySymbolFlows: (dayOffset: number) => Promise<AdminSymbolFlowList | null>;
  onRefreshFlow: () => void;
  instruments: OrderBookInstrument[];
  orderBookConfigBySymbol: ReadonlyMap<string, OrderBookMarketStatus["configs"][number]>;
  updatingStatusSymbol: string | null;
  updatingTradingRulesSymbol: string | null;
  onChangeMarketStatus: (symbol: string, marketStatus: MarketSessionStatus) => void;
  onUpdateTradingRules: (symbol: string, payload: { priceLimitRate: number }) => Promise<boolean>;
  jumpingSimulationClockAction: SimulationClockJumpAction | null;
  onJumpSimulationClock: (action: SimulationClockJumpAction) => void;
};

export function AdminMarketSection({
  activeSection,
  orderBookMarketSummary,
  autoMarketSummary,
  simulationClock,
  orderBookInstrumentCount,
  openOrderBookConfigCount,
  adminFlowOverview,
  fundFlow,
  cumulativeFundFlow,
  loadingFundFlow,
  loadingCumulativeFundFlow,
  fundFlowError,
  cumulativeFundFlowError,
  investorFlow,
  investorFlowError,
  investorFlowHistory,
  investorFlowHistoryError,
  investorFlowHistoryLoading,
  investorFlowRefreshing,
  symbolFlowList,
  loadingSymbolFlows,
  onLoadCumulativeFundFlow,
  onLoadTotalAssetHistory,
  onLoadInvestorFlowHistory,
  onLoadWeeklySymbolFlows,
  onRefreshFlow,
  instruments,
  orderBookConfigBySymbol,
  updatingStatusSymbol,
  updatingTradingRulesSymbol,
  onChangeMarketStatus,
  onUpdateTradingRules,
  jumpingSimulationClockAction,
  onJumpSimulationClock,
}: AdminMarketSectionProps) {
  if (activeSection === "dashboard") {
    return (
      <>
        <AdminSimulationClockControlPanel clock={simulationClock} jumpingAction={jumpingSimulationClockAction} onJump={onJumpSimulationClock} />
        <AdminMarketSummaryPanel
          orderBookMarketSummary={orderBookMarketSummary}
          autoMarketSummary={autoMarketSummary}
          orderBookInstrumentCount={orderBookInstrumentCount}
          openOrderBookConfigCount={openOrderBookConfigCount}
        />
      </>
    );
  }

  if (activeSection === "market-flows") {
    return (
      <AdminFlowOverviewPanel
        overview={adminFlowOverview}
        fundFlow={fundFlow}
        cumulativeFundFlow={cumulativeFundFlow}
        loadingFundFlow={loadingFundFlow}
        loadingCumulativeFundFlow={loadingCumulativeFundFlow}
        fundFlowError={fundFlowError}
        cumulativeFundFlowError={cumulativeFundFlowError}
        investorFlow={investorFlow}
        investorFlowError={investorFlowError}
        investorFlowHistory={investorFlowHistory}
        investorFlowHistoryError={investorFlowHistoryError}
        investorFlowHistoryLoading={investorFlowHistoryLoading}
        investorFlowRefreshing={investorFlowRefreshing}
        symbolFlowList={symbolFlowList}
        loadingSymbolFlows={loadingSymbolFlows}
        onLoadCumulativeFundFlow={onLoadCumulativeFundFlow}
        onLoadTotalAssetHistory={onLoadTotalAssetHistory}
        onLoadInvestorFlowHistory={onLoadInvestorFlowHistory}
        onLoadWeeklySymbolFlows={onLoadWeeklySymbolFlows}
        onRefresh={onRefreshFlow}
      />
    );
  }

  return (
    <>
      <AdminSimulationClockControlPanel
        clock={simulationClock}
        jumpingAction={jumpingSimulationClockAction}
        onJump={onJumpSimulationClock}
      />

      <AdminOrderBookInstrumentTable
        instruments={instruments}
        orderBookConfigBySymbol={orderBookConfigBySymbol}
        simulationClock={simulationClock}
        updatingStatusSymbol={updatingStatusSymbol}
        updatingTradingRulesSymbol={updatingTradingRulesSymbol}
        onChangeMarketStatus={onChangeMarketStatus}
        onUpdateTradingRules={onUpdateTradingRules}
      />
    </>
  );
}
