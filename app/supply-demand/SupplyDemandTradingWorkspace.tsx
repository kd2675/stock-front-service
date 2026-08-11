import { CorporateActionSubscriptionPanel } from "@/app/supply-demand/CorporateActionSubscriptionPanel";
import { MarketChartPanel } from "@/app/supply-demand/MarketChartPanel";
import { MarketTapePanel } from "@/app/supply-demand/MarketTapePanel";
import { OrderBookDepthPanel } from "@/app/supply-demand/OrderBookDepthPanel";
import type { FlashingOrderBookLevel, OrderBookSideType } from "@/app/supply-demand/OrderBookDepthModel";
import { OrderTicketPanel } from "@/app/supply-demand/OrderTicketPanel";
import { OrderBookExecutionPreviewPanel, OrderBookOrderPreviewPanel } from "@/app/supply-demand/SupplyDemandActivityPreviewPanels";
import {
  AutoMarketStatusPanel,
  SelectedOrderBookInstrumentPanel,
} from "@/app/supply-demand/SupplyDemandWorkspacePanels";
import type {
  AutoMarketConfig,
  AutoMarketStatus,
  CorporateAction,
  CorporateActionEntitlement,
  Execution,
  Holding,
  Order,
  OrderBook,
  OrderBookCandle,
  OrderBookCandleInterval,
  OrderBookInstrument,
  OrderBookMarketStatus,
  OrderBookRecentExecution,
  OrderBookTradeSummary,
  OrderSide,
  OrderType,
  Portfolio,
  SimulationClock,
  SymbolMarketConfig,
} from "@/app/types/stock";

type SupplyDemandTradingWorkspaceProps = {
  autoMarket: AutoMarketStatus | null;
  cancellingOrderId: number | null;
  candles: OrderBookCandle[];
  candleInterval: OrderBookCandleInterval;
  chartExpanded: boolean;
  corporateActionEntitlements: CorporateActionEntitlement[];
  corporateActionEntitlementsReady: boolean;
  corporateActionsErrorMessage: string | null;
  corporateActions: CorporateAction[];
  corporateActionCashErrorMessage: string | null;
  estimatedOrderAmount?: number;
  flashingOrderBookLevel: FlashingOrderBookLevel;
  instruments: OrderBookInstrument[];
  isCandlesLoading: boolean;
  isCorporateActionsLoading: boolean;
  isLoading: boolean;
  isRecentExecutionsLoading: boolean;
  isSelectedMarketOpen: boolean;
  limitPrice: string;
  message: string | null;
  orderBook: OrderBook | null;
  orderBookExecutions: Execution[];
  orderBookLayout: "split" | "stacked";
  orderBookMarket: OrderBookMarketStatus | null;
  orderBookOrders: Order[];
  orderBookRecentExecutions: OrderBookRecentExecution[];
  orderBookTradeSummary: OrderBookTradeSummary | null;
  orderType: OrderType;
  placingOrder: boolean;
  portfolio: Portfolio | null;
  quantity: string;
  selectedConfig?: AutoMarketConfig;
  selectedHolding?: Holding;
  selectedInstrument: OrderBookInstrument;
  selectedOrderBookConfig?: SymbolMarketConfig;
  selectedSymbol: string;
  simulationClock: SimulationClock | null;
  side: OrderSide;
  subscribingCorporateActionId: number | null;
  updatedAt: Date | null;
  onAssetPercentSelect: (percent: number) => void;
  onCancelOrder: (orderId: number) => void;
  onChartExpandedChange: (expanded: boolean) => void;
  onCandleIntervalChange: (interval: OrderBookCandleInterval) => void;
  onClearSelectedInstrument: () => void;
  onFlashEnd: () => void;
  onLayoutChange: (layout: "split" | "stacked") => void;
  onLimitPriceChange: (value: string) => void;
  onLimitPriceStep: (direction: -1 | 1) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
  onQuantityChange: (value: string) => void;
  onSelectInstrument: (symbol: string) => void;
  onSideChange: (value: OrderSide) => void;
  onSubscribeCorporateAction: (action: CorporateAction, shareQuantity: number) => void;
  onSubmitOrder: () => void;
};

export function SupplyDemandTradingWorkspace({
  autoMarket,
  cancellingOrderId,
  candles,
  candleInterval,
  chartExpanded,
  corporateActionEntitlements,
  corporateActionEntitlementsReady,
  corporateActionsErrorMessage,
  corporateActions,
  corporateActionCashErrorMessage,
  estimatedOrderAmount,
  flashingOrderBookLevel,
  instruments,
  isCandlesLoading,
  isCorporateActionsLoading,
  isLoading,
  isRecentExecutionsLoading,
  isSelectedMarketOpen,
  limitPrice,
  message,
  orderBook,
  orderBookExecutions,
  orderBookLayout,
  orderBookMarket,
  orderBookOrders,
  orderBookRecentExecutions,
  orderBookTradeSummary,
  orderType,
  placingOrder,
  portfolio,
  quantity,
  selectedConfig,
  selectedHolding,
  selectedInstrument,
  selectedOrderBookConfig,
  selectedSymbol,
  simulationClock,
  side,
  subscribingCorporateActionId,
  updatedAt,
  onAssetPercentSelect,
  onCancelOrder,
  onChartExpandedChange,
  onCandleIntervalChange,
  onClearSelectedInstrument,
  onFlashEnd,
  onLayoutChange,
  onLimitPriceChange,
  onLimitPriceStep,
  onOrderTypeChange,
  onPriceSelect,
  onQuantityChange,
  onSelectInstrument,
  onSideChange,
  onSubscribeCorporateAction,
  onSubmitOrder,
}: SupplyDemandTradingWorkspaceProps) {
  return (
    <section className="stock-trade-workspace mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="stock-trade-instrument min-w-0">
        <SelectedOrderBookInstrumentPanel
          instruments={instruments}
          isSelectedMarketOpen={isSelectedMarketOpen}
          message={message}
          selectedInstrument={selectedInstrument}
          selectedOrderBookConfig={selectedOrderBookConfig}
          selectedSymbol={selectedSymbol}
          summary={orderBookTradeSummary}
          onClearSelectedInstrument={onClearSelectedInstrument}
          onSelectInstrument={onSelectInstrument}
        />
      </div>

      <div className="stock-trade-core">
        <div className="stock-trade-chart min-w-0">
          <MarketChartPanel
            candles={candles}
            expanded={chartExpanded}
            interval={candleInterval}
            isLoading={isCandlesLoading}
            summary={orderBookTradeSummary}
            onExpandedChange={onChartExpandedChange}
            onIntervalChange={onCandleIntervalChange}
          />
        </div>

        <div className="stock-trade-order-book min-w-0">
          <OrderBookDepthPanel
            currentPrice={selectedInstrument.currentPrice}
            flashingLevel={flashingOrderBookLevel}
            layout={orderBookLayout}
            orderBook={orderBook}
            priceLimitBase={selectedInstrument.priceLimitBase}
            onFlashEnd={onFlashEnd}
            onLayoutChange={onLayoutChange}
            onPriceSelect={onPriceSelect}
          />
        </div>

        <div className="stock-trade-ticket min-w-0">
          <OrderTicketPanel
            estimatedOrderAmount={estimatedOrderAmount}
            isMarketOpen={isSelectedMarketOpen}
            limitPrice={limitPrice}
            orderType={orderType}
            placingOrder={placingOrder}
            quantity={quantity}
            availableCash={portfolio?.account.cashBalance}
            availableSellQuantity={selectedHolding?.availableQuantity}
            selectedInstrument={selectedInstrument}
            side={side}
            onAssetPercentSelect={onAssetPercentSelect}
            onLimitPriceChange={onLimitPriceChange}
            onLimitPriceStep={onLimitPriceStep}
            onOrderTypeChange={onOrderTypeChange}
            onQuantityChange={onQuantityChange}
            onSideChange={onSideChange}
            onSubmit={onSubmitOrder}
          />
        </div>
      </div>

      <div className="stock-trade-secondary">
        <div className="stock-trade-tape min-w-0">
          <MarketTapePanel executions={orderBookRecentExecutions} isLoading={isRecentExecutionsLoading} />
        </div>

        <div className="stock-trade-orders min-w-0">
          <OrderBookOrderPreviewPanel
            cancellingOrderId={cancellingOrderId}
            orders={orderBookOrders}
            onCancel={onCancelOrder}
          />
        </div>

        <div className="stock-trade-executions min-w-0">
          <OrderBookExecutionPreviewPanel executions={orderBookExecutions} />
        </div>

        <div className="stock-trade-status min-w-0">
          <AutoMarketStatusPanel
            autoMarket={autoMarket}
            loading={isLoading}
            orderBookMarket={orderBookMarket}
            selectedConfig={selectedConfig}
            selectedOrderBookConfig={selectedOrderBookConfig}
            updatedAt={updatedAt}
          />
        </div>

        <div className="stock-trade-events min-w-0">
          <CorporateActionSubscriptionPanel
            actions={corporateActions}
            availableCash={portfolio?.account.cashBalance}
            cashErrorMessage={corporateActionCashErrorMessage}
            currentDate={simulationClock?.activeBusinessDate || simulationClock?.simulationDate}
            entitlements={corporateActionEntitlements}
            entitlementsReady={corporateActionEntitlementsReady}
            errorMessage={corporateActionsErrorMessage}
            isLoading={isCorporateActionsLoading}
            marketSession={simulationClock?.marketSession}
            maxVisibleActions={3}
            showAllLink
            subscribingActionId={subscribingCorporateActionId}
            onSubscribe={onSubscribeCorporateAction}
          />
        </div>
      </div>
    </section>
  );
}
