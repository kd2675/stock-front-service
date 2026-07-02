import type { ComponentProps } from "react";

import type {
  Execution,
  Holding,
  Instrument,
  Order,
  OrderBook,
  OrderSide,
  OrderType,
  Portfolio,
  Price,
  Ranking,
} from "@/app/types/stock";
import { OrderStatusPanel, RecentExecutionsPanel } from "@/app/virtual-price/VirtualPriceActivityPanels";
import { formatDate, formatNumber } from "@/app/virtual-price/VirtualPriceFormatters";
import { OrderBookPanel, Panel } from "@/app/virtual-price/VirtualPricePanels";
import { VirtualPriceOrderTicketPanel } from "@/app/virtual-price/VirtualPriceWorkspacePanels";
import type { VirtualPriceOrderDrafts } from "@/app/virtual-price/useVirtualPriceOrderActions";

export type VirtualPriceSideColumnProps = {
  amend: (order: Order) => void;
  amendingOrderId: number | null;
  cancel: (orderId: number) => void;
  cancelPartially: (order: Order) => void;
  cancellingOrderId: number | null;
  estimatedOrderValue: number | null;
  executions: Execution[];
  instruments: Instrument[];
  limitPrice: string;
  message: string | null;
  orderActionClassName: string;
  orderBook: OrderBook | null;
  orderDrafts: VirtualPriceOrderDrafts;
  orderType: OrderType;
  orderValidationMessage: string | null;
  partialCancellingOrderId: number | null;
  pendingOrderCount: number;
  placingOrder: boolean;
  portfolio: Portfolio | null;
  quantity: string;
  rankings: Ranking[];
  recentOrders: Order[];
  selectedHolding?: Holding;
  selectedPrice?: Price;
  selectedSymbol: string;
  side: OrderSide;
  onApplyAssetPercent: (percent: number) => void;
  onLimitPriceChange: (value: string) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onQuantityChange: (value: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onSideChange: (side: OrderSide) => void;
  onSubmitOrder: () => void;
  updateOrderDraft: ComponentProps<typeof OrderStatusPanel>["updateOrderDraft"];
};

export function VirtualPriceSideColumn({
  amend,
  amendingOrderId,
  cancel,
  cancelPartially,
  cancellingOrderId,
  estimatedOrderValue,
  executions,
  instruments,
  limitPrice,
  message,
  orderActionClassName,
  orderBook,
  orderDrafts,
  orderType,
  orderValidationMessage,
  partialCancellingOrderId,
  pendingOrderCount,
  placingOrder,
  portfolio,
  quantity,
  rankings,
  recentOrders,
  selectedHolding,
  selectedPrice,
  selectedSymbol,
  side,
  onApplyAssetPercent,
  onLimitPriceChange,
  onOrderTypeChange,
  onQuantityChange,
  onSelectSymbol,
  onSideChange,
  onSubmitOrder,
  updateOrderDraft,
}: VirtualPriceSideColumnProps) {
  return (
    <aside className="min-w-0 space-y-6">
      <Panel title="주문장">
        <OrderBookPanel orderBook={orderBook} />
      </Panel>

      <Panel title="랭킹">
        {rankings.length ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#6b7684]">기준일 {formatDate(rankings[0]?.snapshotDate)}</p>
            {rankings.map((ranking) => (
              <div key={`${ranking.rank}-${ranking.userKey}`} className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-[#f9fafb] p-3">
                <p className="min-w-0 truncate text-sm font-bold">#{ranking.rank} {ranking.displayName || ranking.userKey}</p>
                <p className={ranking.returnRate >= 0 ? "shrink-0 text-sm font-bold text-[#f04452] tabular-nums" : "shrink-0 text-sm font-bold text-[#3182f6] tabular-nums"}>{formatNumber(ranking.returnRate)}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6b7684]">장 마감 정산 후 표시됩니다.</p>
        )}
      </Panel>

      <VirtualPriceOrderTicketPanel
        estimatedOrderValue={estimatedOrderValue}
        instruments={instruments}
        limitPrice={limitPrice}
        message={message}
        orderActionClassName={orderActionClassName}
        orderType={orderType}
        orderValidationMessage={orderValidationMessage}
        placingOrder={placingOrder}
        portfolio={portfolio}
        quantity={quantity}
        selectedHolding={selectedHolding}
        selectedPrice={selectedPrice}
        selectedSymbol={selectedSymbol}
        side={side}
        onApplyAssetPercent={onApplyAssetPercent}
        onLimitPriceChange={onLimitPriceChange}
        onOrderTypeChange={onOrderTypeChange}
        onQuantityChange={onQuantityChange}
        onSelectSymbol={onSelectSymbol}
        onSideChange={onSideChange}
        onSubmit={onSubmitOrder}
      />

      <OrderStatusPanel
        amendingOrderId={amendingOrderId}
        amend={amend}
        cancel={cancel}
        cancelPartially={cancelPartially}
        cancellingOrderId={cancellingOrderId}
        orderDrafts={orderDrafts}
        partialCancellingOrderId={partialCancellingOrderId}
        pendingOrderCount={pendingOrderCount}
        recentOrders={recentOrders}
        updateOrderDraft={updateOrderDraft}
      />

      <RecentExecutionsPanel executions={executions} />
    </aside>
  );
}
