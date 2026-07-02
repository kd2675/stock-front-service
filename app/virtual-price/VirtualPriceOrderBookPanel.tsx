import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBook, OrderBookLevel } from "@/app/types/stock";

export function OrderBookPanel({ orderBook }: { orderBook: OrderBook | null }) {
  if (!orderBook || (!orderBook.bids.length && !orderBook.asks.length)) {
    return <p className="text-sm text-[#6b7684]">아직 공개 호가가 없습니다.</p>;
  }

  const maxQuantity = Math.max(
    ...orderBook.bids.map((level) => level.quantity),
    ...orderBook.asks.map((level) => level.quantity),
    1,
  );

  return (
    <div className="grid gap-4">
      <OrderBookSide title="매도 대기" levels={[...orderBook.asks].reverse()} tone="ask" maxQuantity={maxQuantity} />
      <div className="h-px bg-[#eef0f2]" />
      <OrderBookSide title="매수 대기" levels={orderBook.bids} tone="bid" maxQuantity={maxQuantity} />
    </div>
  );
}

function OrderBookSide({
  title,
  levels,
  tone,
  maxQuantity,
}: {
  title: string;
  levels: OrderBookLevel[];
  tone: "bid" | "ask";
  maxQuantity: number;
}) {
  if (!levels.length) {
    return (
      <div>
        <p className="text-xs font-bold text-[#6b7684]">{title}</p>
        <p className="mt-2 text-sm text-[#6b7684]">대기 물량 없음</p>
      </div>
    );
  }

  const barColor = tone === "bid" ? "rgba(49, 130, 246, 0.13)" : "rgba(240, 68, 82, 0.12)";
  const priceColor = tone === "bid" ? "text-[#3182f6]" : "text-[#f04452]";

  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-[#6b7684]">{title}</p>
      <div className="mt-2 space-y-1">
        {levels.map((level) => {
          const width = Math.max((level.quantity / maxQuantity) * 100, 8);
          return (
            <div key={`${tone}-${level.price}`} className="relative min-w-0 overflow-hidden rounded-sm bg-[#f9fafb] px-2 py-2">
              <div className="absolute inset-y-0 right-0" style={{ width: `${width}%`, backgroundColor: barColor }} />
              <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-xs">
                <span className={`min-w-0 break-words font-black tabular-nums ${priceColor}`}>{formatWon(level.price)}</span>
                <span className="shrink-0 text-[#333d4b] tabular-nums">{formatNumber(level.quantity)}주</span>
                <span className="shrink-0 text-[#8b95a1]">{level.orderCount}건</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
