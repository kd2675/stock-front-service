import { AdminFlowOverviewPanel } from "@/app/supply-demand/admin/AdminFlowPanels";
import { AdminMarketSummaryPanel } from "@/app/supply-demand/admin/AdminMarketSummaryPanel";
import { AdminOrderBookInstrumentTable } from "@/app/supply-demand/admin/AdminOrderBookInstrumentTable";
import { AdminSimulationClockControlPanel } from "@/app/supply-demand/admin/AdminSimulationClockControlPanel";
import type {
  AdminFlowOverview,
  AdminFundFlowSummary,
  AdminSymbolFlowList,
  AutoMarketStatus,
  MarketSessionStatus,
  OrderBookInstrument,
  OrderBookMarketStatus,
  SimulationClock,
  SimulationClockJumpAction,
} from "@/app/types/stock";

type AdminMarketSectionProps = {
  orderBookMarketSummary: OrderBookMarketStatus | null;
  autoMarketSummary: AutoMarketStatus | null;
  simulationClock: SimulationClock | null;
  orderBookInstrumentCount: number;
  openOrderBookConfigCount: number;
  adminFlowOverview: AdminFlowOverview | null;
  fundFlow: AdminFundFlowSummary | null;
  loadingFundFlow: boolean;
  fundFlowError: boolean;
  symbolFlowList: AdminSymbolFlowList;
  loadingSymbolFlows: boolean;
  loadingAllSymbolFlows: boolean;
  onLoadAllSymbolFlows: () => void;
  onRefreshFlow: () => void;
  instruments: OrderBookInstrument[];
  orderBookConfigBySymbol: ReadonlyMap<string, OrderBookMarketStatus["configs"][number]>;
  updatingStatusSymbol: string | null;
  onChangeMarketStatus: (symbol: string, marketStatus: MarketSessionStatus) => void;
  jumpingSimulationClockAction: SimulationClockJumpAction | null;
  onJumpSimulationClock: (action: SimulationClockJumpAction) => void;
};

export function AdminMarketSection({
  orderBookMarketSummary,
  autoMarketSummary,
  simulationClock,
  orderBookInstrumentCount,
  openOrderBookConfigCount,
  adminFlowOverview,
  fundFlow,
  loadingFundFlow,
  fundFlowError,
  symbolFlowList,
  loadingSymbolFlows,
  loadingAllSymbolFlows,
  onLoadAllSymbolFlows,
  onRefreshFlow,
  instruments,
  orderBookConfigBySymbol,
  updatingStatusSymbol,
  onChangeMarketStatus,
  jumpingSimulationClockAction,
  onJumpSimulationClock,
}: AdminMarketSectionProps) {
  return (
    <>
      <AdminSimulationClockControlPanel
        clock={simulationClock}
        jumpingAction={jumpingSimulationClockAction}
        onJump={onJumpSimulationClock}
      />

      <AdminMarketSummaryPanel
        orderBookMarketSummary={orderBookMarketSummary}
        autoMarketSummary={autoMarketSummary}
        orderBookInstrumentCount={orderBookInstrumentCount}
        openOrderBookConfigCount={openOrderBookConfigCount}
      />

      <AdminFlowOverviewPanel
        overview={adminFlowOverview}
        fundFlow={fundFlow}
        loadingFundFlow={loadingFundFlow}
        fundFlowError={fundFlowError}
        symbolFlowList={symbolFlowList}
        loadingSymbolFlows={loadingSymbolFlows}
        loadingAllSymbolFlows={loadingAllSymbolFlows}
        onLoadAllSymbolFlows={onLoadAllSymbolFlows}
        onRefresh={onRefreshFlow}
      />

      <AdminOrderBookInstrumentTable
        instruments={instruments}
        orderBookConfigBySymbol={orderBookConfigBySymbol}
        updatingStatusSymbol={updatingStatusSymbol}
        onChangeMarketStatus={onChangeMarketStatus}
      />
    </>
  );
}
