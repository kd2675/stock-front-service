import { formatOrderPrice, formatOrderStatus, formatWon } from "@/app/lib/stockFormatters";
import type { Execution, Order } from "@/app/types/stock";

import { formatDateTime, formatExecutionSource, orderStatusClassName } from "./VirtualPriceFormatters";
import { Panel } from "./VirtualPricePanels";

type OrderDraft = {
  quantity: string;
  limitPrice: string;
  cancelQuantity: string;
};

type OrderStatusPanelProps = {
  amendingOrderId: number | null;
  cancel: (orderId: number) => void;
  cancelPartially: (order: Order) => void;
  cancellingOrderId: number | null;
  orderDrafts: Record<number, OrderDraft>;
  partialCancellingOrderId: number | null;
  pendingOrderCount: number;
  recentOrders: Order[];
  amend: (order: Order) => void;
  updateOrderDraft: (order: Order, patch: Partial<OrderDraft>) => void;
};

export function OrderStatusPanel({
  amendingOrderId,
  amend,
  cancel,
  cancelPartially,
  cancellingOrderId,
  orderDrafts,
  partialCancellingOrderId,
  pendingOrderCount,
  recentOrders,
  updateOrderDraft,
}: OrderStatusPanelProps) {
  return (
    <Panel title="주문 상태">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#6b7684]">
          <span className="rounded-sm bg-[#f2f4f6] px-2 py-1">미체결 {pendingOrderCount}건</span>
          <span className="rounded-sm bg-[#f2f4f6] px-2 py-1">최근 {recentOrders.length}건</span>
        </div>
        {recentOrders.map((order) => {
          const isOpenOrder = order.status === "PENDING" || order.status === "PARTIALLY_FILLED";
          const remainingQuantity = Math.max(0, order.quantity - order.filledQuantity);
          const draft = orderDrafts[order.id] ?? {
            quantity: String(order.quantity),
            limitPrice: order.limitPrice?.toString() ?? "",
            cancelQuantity: String(Math.max(1, remainingQuantity)),
          };

          return (
            <article key={order.id} className="rounded-md bg-[#f9fafb] p-4">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-bold">{order.side === "BUY" ? "매수" : "매도"} {order.symbol}</p>
                <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${orderStatusClassName(order.status)}`}>
                  {formatOrderStatus(order.status)}
                </span>
              </div>
              <div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 text-sm text-[#6b7684]">
                <span>{order.filledQuantity}/{order.quantity}주</span>
                <span className="min-w-0 break-words text-right tabular-nums">{formatOrderPrice(order)}</span>
              </div>
              {order.status === "REJECTED" ? (
                <p className="mt-2 text-xs font-semibold text-[#f04452]">체결 시점 잔고 조건을 만족하지 못했습니다.</p>
              ) : null}
              {isOpenOrder ? (
                <div className="mt-3 space-y-2">
                  {order.orderType === "LIMIT" ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        value={draft.quantity}
                        onChange={(event) => updateOrderDraft(order, { quantity: event.target.value })}
                        inputMode="numeric"
                        className="min-w-0 rounded-md border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-bold text-[#191f28]"
                        aria-label={`${order.symbol} 정정 수량`}
                      />
                      <input
                        value={draft.limitPrice}
                        onChange={(event) => updateOrderDraft(order, { limitPrice: event.target.value })}
                        inputMode="decimal"
                        className="min-w-0 rounded-md border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-bold text-[#191f28]"
                        aria-label={`${order.symbol} 정정 지정가`}
                      />
                      <button type="button" onClick={() => amend(order)} disabled={amendingOrderId === order.id} className="col-span-2 rounded-md bg-white px-3 py-2 text-xs font-bold text-[#333d4b] ring-1 ring-[#e5e8eb] disabled:cursor-wait disabled:opacity-60">
                        {amendingOrderId === order.id ? "정정 중" : "수량/가격 정정"}
                      </button>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <input
                      value={draft.cancelQuantity}
                      onChange={(event) => updateOrderDraft(order, { cancelQuantity: event.target.value })}
                      inputMode="numeric"
                      className="min-w-0 rounded-md border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-bold text-[#191f28]"
                      aria-label={`${order.symbol} 부분 취소 수량`}
                    />
                    <button type="button" onClick={() => cancelPartially(order)} disabled={partialCancellingOrderId === order.id} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-[#333d4b] ring-1 ring-[#e5e8eb] disabled:cursor-wait disabled:opacity-60">
                      {partialCancellingOrderId === order.id ? "처리 중" : "부분 취소"}
                    </button>
                    <button type="button" onClick={() => cancel(order.id)} disabled={cancellingOrderId === order.id} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-[#333d4b] ring-1 ring-[#e5e8eb] disabled:cursor-wait disabled:opacity-60">
                      {cancellingOrderId === order.id ? "취소 중" : "전체 취소"}
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-[#8b95a1]">남은 미체결 {remainingQuantity}주</p>
                </div>
              ) : null}
            </article>
          );
        })}
        {!recentOrders.length ? <p className="text-sm text-[#6b7684]">주문 내역이 없습니다.</p> : null}
      </div>
    </Panel>
  );
}

export function RecentExecutionsPanel({ executions }: { executions: Execution[] }) {
  return (
    <Panel title="최근 체결">
      <div className="space-y-3">
        {executions.map((execution) => (
          <article key={execution.id} className="rounded-md bg-[#f9fafb] p-4">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-bold">{execution.side === "BUY" ? "매수" : "매도"} {execution.symbol}</p>
              <span className="shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-semibold">{execution.quantity}주</span>
            </div>
            <p className="mt-2 min-w-0 break-words text-sm font-semibold tabular-nums">{formatWon(execution.price)}</p>
            <div className="mt-2 grid gap-1 text-xs font-semibold text-[#6b7684]">
              <span>순금액 {formatWon(execution.netAmount)}</span>
              {(execution.feeAmount > 0 || execution.taxAmount > 0) ? (
                <span>비용 {formatWon(execution.feeAmount + execution.taxAmount)}</span>
              ) : null}
              {execution.realizedProfit !== null && execution.realizedProfit !== undefined ? (
                <span className={execution.realizedProfit >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}>
                  실현손익 {formatWon(execution.realizedProfit)}
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b7684]">
              <span>{formatDateTime(execution.executedAt)}</span>
              <span>{formatExecutionSource(execution.source)}</span>
            </div>
          </article>
        ))}
        {!executions.length ? <p className="text-sm text-[#6b7684]">체결 내역이 없습니다.</p> : null}
      </div>
    </Panel>
  );
}
