import Link from "next/link";

import { formatOrderPrice, formatOrderStatus, formatWon } from "@/app/lib/stockFormatters";
import type { Execution, Order } from "@/app/types/stock";

export function OrderBookOrderPreviewPanel({
  cancellingOrderId,
  orders,
  onCancel,
}: {
  cancellingOrderId: number | null;
  orders: Order[];
  onCancel: (orderId: number) => void;
}) {
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-black">내 주문</h3>
          <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">선택 종목 최근 5건</p>
        </div>
        <Link href="/supply-demand/orders" className="rounded-md bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-black text-[#333d4b]">
          전체 보기
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {orders.length ? orders.map((order) => {
          const isOpenOrder = order.status === "PENDING" || order.status === "PARTIALLY_FILLED";
          return (
            <article key={order.id} className="rounded-md bg-[#f7f8fa] p-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-black">{order.side === "BUY" ? "매수" : "매도"} {order.symbol}</p>
                <span className="shrink-0 rounded-sm bg-white px-2 py-1 text-xs font-bold text-[#4e5968]">
                  {formatOrderStatus(order.status)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs font-bold text-[#6b7684]">
                <span>{order.filledQuantity}/{order.quantity}주</span>
                <span className="tabular-nums">{formatOrderPrice(order)}</span>
              </div>
              {isOpenOrder ? (
                <button
                  type="button"
                  onClick={() => onCancel(order.id)}
                  disabled={cancellingOrderId === order.id}
                  className="mt-3 w-full rounded-md bg-white px-3 py-2 text-xs font-black text-[#333d4b] ring-1 ring-[#d1d6db] disabled:opacity-50"
                >
                  {cancellingOrderId === order.id ? "취소 중" : "취소"}
                </button>
              ) : null}
            </article>
          );
        }) : (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">주문장 주문 내역이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export function OrderBookExecutionPreviewPanel({ executions }: { executions: Execution[] }) {
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <h3 className="text-base font-black">최근 체결</h3>
      <div className="mt-3 space-y-3">
        {executions.length ? executions.map((execution) => (
          <article key={execution.id} className="rounded-md bg-[#f7f8fa] p-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-black">{execution.side === "BUY" ? "매수" : "매도"} {execution.symbol}</p>
              <span className="shrink-0 text-xs font-bold text-[#6b7684]">{execution.quantity}주</span>
            </div>
            <p className="mt-2 text-sm font-black tabular-nums">{formatWon(execution.price)}</p>
            <p className="mt-1 text-xs font-bold text-[#6b7684]">순금액 {formatWon(execution.netAmount)}</p>
          </article>
        )) : (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">주문장 체결 내역이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
