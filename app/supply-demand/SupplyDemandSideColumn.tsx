import { CorporateActionSubscriptionPanel } from "@/app/supply-demand/CorporateActionSubscriptionPanel";
import { MarketTapePanel } from "@/app/supply-demand/MarketTapePanel";
import { OrderTicketPanel } from "@/app/supply-demand/OrderTicketPanel";
import { OrderBookExecutionPreviewPanel, OrderBookOrderPreviewPanel } from "@/app/supply-demand/SupplyDemandActivityPreviewPanels";
import { AutoMarketConfigListPanel, AutoMarketStatusPanel } from "@/app/supply-demand/SupplyDemandWorkspacePanels";
import type {
  AutoMarketConfig,
  AutoMarketStatus,
  CorporateAction,
  CorporateActionEntitlement,
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
  corporateActionEntitlements: CorporateActionEntitlement[];
  corporateActions: CorporateAction[];
  estimatedOrderAmount?: number;
  isCorporateActionsLoading: boolean;
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
  subscribingCorporateActionId: number | null;
  updatedAt: Date | null;
  onAssetPercentSelect: (percent: number) => void;
  onCancelOrder: (orderId: number) => void;
  onLimitPriceChange: (value: string) => void;
  onLimitPriceStep: (direction: -1 | 1) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onQuantityChange: (value: string) => void;
  onSelectInstrument: (symbol: string) => void;
  onSideChange: (value: OrderSide) => void;
  onSubscribeCorporateAction: (actionId: number, shareQuantity: number) => void;
  onSubmitOrder: () => void;
};

export function SupplyDemandSideColumn({
  autoMarket,
  cancellingOrderId,
  corporateActionEntitlements,
  corporateActions,
  estimatedOrderAmount,
  isCorporateActionsLoading,
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
  subscribingCorporateActionId,
  updatedAt,
  onAssetPercentSelect,
  onCancelOrder,
  onLimitPriceChange,
  onLimitPriceStep,
  onOrderTypeChange,
  onQuantityChange,
  onSelectInstrument,
  onSideChange,
  onSubscribeCorporateAction,
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

      <CorporateActionSubscriptionPanel
        actions={corporateActions}
        availableCash={portfolio?.account.cashBalance}
        entitlements={corporateActionEntitlements}
        isLoading={isCorporateActionsLoading}
        subscribingActionId={subscribingCorporateActionId}
        onSubscribe={onSubscribeCorporateAction}
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
