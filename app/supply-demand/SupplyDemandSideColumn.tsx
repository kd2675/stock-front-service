import { MarketTapePanel } from "@/app/supply-demand/MarketTapePanel";
import { OrderTicketPanel } from "@/app/supply-demand/OrderTicketPanel";
import { OrderBookExecutionPreviewPanel, OrderBookOrderPreviewPanel } from "@/app/supply-demand/SupplyDemandActivityPreviewPanels";
import { AutoMarketConfigListPanel, AutoMarketStatusPanel } from "@/app/supply-demand/SupplyDemandWorkspacePanels";
import type {
  AutoMarketConfig,
  AutoMarketStatus,
  Execution,
  Holding,
  Order,
  OrderBookInstrument,
  OrderBookMarketStatus,
  OrderBookRecentExecution,
  OrderSide,
  OrderType,
  Portfolio,
  SymbolMarketConfig,
} from "@/app/types/stock";

export type SupplyDemandSideColumnProps = {
  autoMarket: AutoMarketStatus | null;
  cancellingOrderId: number | null;
  estimatedOrderAmount?: number;
  isLoading: boolean;
  isRecentExecutionsLoading: boolean;
  isSelectedMarketOpen: boolean;
  limitPrice: string;
  orderBookExecutions: Execution[];
  orderBookMarket: OrderBookMarketStatus | null;
  orderBookOrders: Order[];
  orderBookRecentExecutions: OrderBookRecentExecution[];
  orderType: OrderType;
  placingOrder: boolean;
  portfolio: Portfolio | null;
  quantity: string;
  selectedConfig?: AutoMarketConfig;
  selectedHolding?: Holding;
  selectedInstrument: OrderBookInstrument;
  selectedOrderBookConfig?: SymbolMarketConfig;
  side: OrderSide;
  updatedAt: Date | null;
  onAssetPercentSelect: (percent: number) => void;
  onCancelOrder: (orderId: number) => void;
  onLimitPriceChange: (value: string) => void;
  onLimitPriceStep: (direction: -1 | 1) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onQuantityChange: (value: string) => void;
  onSelectInstrument: (symbol: string) => void;
  onSideChange: (value: OrderSide) => void;
  onSubmitOrder: () => void;
};

export function SupplyDemandSideColumn({
  autoMarket,
  cancellingOrderId,
  estimatedOrderAmount,
  isLoading,
  isRecentExecutionsLoading,
  isSelectedMarketOpen,
  limitPrice,
  orderBookExecutions,
  orderBookMarket,
  orderBookOrders,
  orderBookRecentExecutions,
  orderType,
  placingOrder,
  portfolio,
  quantity,
  selectedConfig,
  selectedHolding,
  selectedInstrument,
  selectedOrderBookConfig,
  side,
  updatedAt,
  onAssetPercentSelect,
  onCancelOrder,
  onLimitPriceChange,
  onLimitPriceStep,
  onOrderTypeChange,
  onQuantityChange,
  onSelectInstrument,
  onSideChange,
  onSubmitOrder,
}: SupplyDemandSideColumnProps) {
  return (
    <aside className="space-y-5">
      <OrderTicketPanel
        estimatedOrderAmount={estimatedOrderAmount}
        isMarketOpen={isSelectedMarketOpen}
        limitPrice={limitPrice}
        orderType={orderType}
        placingOrder={placingOrder}
        quantity={quantity}
        totalAsset={portfolio?.totalAsset}
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

      <AutoMarketStatusPanel
        autoMarket={autoMarket}
        loading={isLoading}
        orderBookMarket={orderBookMarket}
        selectedConfig={selectedConfig}
        selectedOrderBookConfig={selectedOrderBookConfig}
        updatedAt={updatedAt}
      />

      <MarketTapePanel executions={orderBookRecentExecutions} isLoading={isRecentExecutionsLoading} />

      <AutoMarketConfigListPanel configs={autoMarket?.configs ?? []} onSelectInstrument={onSelectInstrument} />

      <OrderBookOrderPreviewPanel
        cancellingOrderId={cancellingOrderId}
        orders={orderBookOrders}
        onCancel={onCancelOrder}
      />

      <OrderBookExecutionPreviewPanel executions={orderBookExecutions} />
    </aside>
  );
}
