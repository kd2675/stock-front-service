import { AdminFlowOverviewPanel } from "@/app/supply-demand/admin/AdminFlowPanels";
import { AdminMarketSummaryPanel } from "@/app/supply-demand/admin/AdminMarketSummaryPanel";
import { AdminOrderBookInstrumentTable } from "@/app/supply-demand/admin/AdminOrderBookInstrumentTable";
import { AdminSimulationClockControlPanel } from "@/app/supply-demand/admin/AdminSimulationClockControlPanel";
import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import type {
  AdminFlowOverview,
  AdminFundFlowSummary,
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
  fundFlow: AdminFundFlowSummary | null;
  allFundFlow: AdminFundFlowSummary | null;
  loadingFundFlow: boolean;
  loadingAllFundFlow: boolean;
  fundFlowError: boolean;
  allFundFlowError: boolean;
  symbolFlowList: AdminSymbolFlowList;
  loadingSymbolFlows: boolean;
  onLoadAllFundFlow: () => void;
  onLoadTotalAssetHistory: (page: number) => Promise<AdminTotalAssetHistoryPage | null>;
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
  allFundFlow,
  loadingFundFlow,
  loadingAllFundFlow,
  fundFlowError,
  allFundFlowError,
  symbolFlowList,
  loadingSymbolFlows,
  onLoadAllFundFlow,
  onLoadTotalAssetHistory,
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
        allFundFlow={allFundFlow}
        loadingFundFlow={loadingFundFlow}
        loadingAllFundFlow={loadingAllFundFlow}
        fundFlowError={fundFlowError}
        allFundFlowError={allFundFlowError}
        symbolFlowList={symbolFlowList}
        loadingSymbolFlows={loadingSymbolFlows}
        onLoadAllFundFlow={onLoadAllFundFlow}
        onLoadTotalAssetHistory={onLoadTotalAssetHistory}
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
