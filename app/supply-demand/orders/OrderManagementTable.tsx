import { formatMonthDayTime, formatNumber, formatOrderPrice, formatOrderStatus, formatWon } from "@/app/lib/stockFormatters";
import DataTableViewport from "@/app/components/DataTableViewport";
import type { Order, OrderBookInstrument } from "@/app/types/stock";

type OrderTableBaseProps = {
  instrumentBySymbol: Map<string, OrderBookInstrument>;
  orders: Order[];
};

type OrderTableActionProps = OrderTableBaseProps & {
  cancellingOrderId: number | null;
  partialCancelQuantityByOrderId: Record<number, string>;
  partialCancellingOrderId: number | null;
  showActions: true;
  onCancelPartial: (order: Order) => void;
  onCancelRemaining: (order: Order) => void;
  onPartialQuantityChange: (orderId: number, value: string) => void;
};

type OrderTableReadonlyProps = OrderTableBaseProps & {
  showActions?: false;
};

type OrderTableProps = OrderTableActionProps | OrderTableReadonlyProps;

export function OrderTable(props: OrderTableProps) {
  const { instrumentBySymbol, orders, showActions } = props;

  return (
    <DataTableViewport label="주문 내역">
      <table className="min-w-[1120px] w-full border-collapse text-sm">
        <thead className="bg-stock-surface-muted text-left text-xs font-black text-stock-muted">
          <tr>
            <th className="px-4 py-3">주문</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">주문가</th>
            <th className="px-4 py-3">주문/체결/잔량</th>
            <th className="px-4 py-3">평균 체결가</th>
            <th className="px-4 py-3">접수시각</th>
            {showActions ? <th className="px-4 py-3">취소</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-stock-divider">
          {orders.map((order) => {
            const instrument = instrumentBySymbol.get(order.symbol);
            const remainingQuantity = getRemainingQuantity(order);
            return (
              <tr key={order.id}>
                <td className="px-4 py-3">
                  <p className="font-black text-stock-ink">{order.side === "BUY" ? "매수" : "매도"} {order.symbol}</p>
                  <p className="mt-0.5 text-xs font-bold text-stock-subtle">{instrument?.name ?? order.clientOrderId}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={["inline-flex rounded-md px-2 py-1 text-xs font-black", order.status === "PARTIALLY_FILLED" ? "bg-[#fff3d6] text-[#a36300]" : isOpenOrder(order) ? "bg-[#eaf3ff] text-[#1f6ed4]" : "bg-stock-surface-strong text-stock-text-tertiary"].join(" ")}>
                    {formatOrderStatus(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold tabular-nums text-stock-text-secondary">{formatOrderPrice(order)}</td>
                <td className="px-4 py-3 font-bold tabular-nums text-stock-text-tertiary">
                  {formatNumber(order.quantity)} / {formatNumber(order.filledQuantity)} / {formatNumber(remainingQuantity)}주
                </td>
                <td className="px-4 py-3 font-bold tabular-nums text-stock-text-tertiary">{order.averageFillPrice == null ? "-" : formatWon(order.averageFillPrice)}</td>
                <td className="px-4 py-3 text-xs font-bold text-stock-muted">{formatMonthDayTime(order.createdAt)}</td>
                {showActions ? (
                  <td className="px-4 py-3">
                    <div className="grid min-w-[280px] gap-2">
                      <button
                        type="button"
                        onClick={() => props.onCancelRemaining(order)}
                        disabled={props.cancellingOrderId === order.id || props.partialCancellingOrderId === order.id}
                        className="h-9 rounded-md bg-stock-ink px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-50"
                      >
                        {props.cancellingOrderId === order.id ? "취소 중" : "잔량 전부 취소"}
                      </button>
                      {remainingQuantity > 1 ? (
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <input
                            value={props.partialCancelQuantityByOrderId[order.id] ?? ""}
                            onChange={(event) => props.onPartialQuantityChange(order.id, event.target.value)}
                            inputMode="numeric"
                            placeholder={`${remainingQuantity}주 이하`}
                            className="h-9 min-w-0 rounded-md border border-stock-border-strong px-2 text-right text-xs font-black outline-none focus:border-stock-accent"
                          />
                          <button
                            type="button"
                            onClick={() => props.onCancelPartial(order)}
                            disabled={props.cancellingOrderId === order.id || props.partialCancellingOrderId === order.id}
                            className="h-9 rounded-md bg-white px-3 text-xs font-black text-stock-text-secondary ring-1 ring-stock-border-strong disabled:cursor-wait disabled:opacity-50"
                          >
                            {props.partialCancellingOrderId === order.id ? "처리 중" : "부분 취소"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 7 : 6} className="px-4 py-8 text-center text-sm font-bold text-stock-subtle">표시할 주문이 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </DataTableViewport>
  );
}

export function isOpenOrder(order: Order) {
  return order.status === "PENDING" || order.status === "PARTIALLY_FILLED";
}

export function getRemainingQuantity(order: Order) {
  return Math.max(0, order.quantity - order.filledQuantity);
}

export function compareOrderCreatedDesc(left: Order, right: Order) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
