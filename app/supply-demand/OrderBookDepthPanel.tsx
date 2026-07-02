import { useMemo } from "react";

import { formatNumber } from "@/app/lib/stockFormatters";
import {
  buildOrderBookDepthModel,
  type FlashingOrderBookLevel,
  type OrderBookSideType,
} from "@/app/supply-demand/OrderBookDepthModel";
import { OrderBookSide, StackedOrderBook } from "@/app/supply-demand/OrderBookDepthRows";
import type { OrderBookLevel } from "@/app/types/stock";

type OrderBookDepthPanelProps = {
  currentPrice: number;
  flashingLevel: FlashingOrderBookLevel;
  layout: "split" | "stacked";
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] } | null;
  onFlashEnd: () => void;
  onLayoutChange: (layout: "split" | "stacked") => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
};

export function OrderBookDepthPanel({
  currentPrice,
  flashingLevel,
  layout,
  orderBook,
  onFlashEnd,
  onLayoutChange,
  onPriceSelect,
}: OrderBookDepthPanelProps) {
  const depth = useMemo(() => buildOrderBookDepthModel(orderBook), [orderBook]);

  return (
    <section className="rounded-lg border border-[#d1d6db] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#8b95a1]">ORDER BOOK DEPTH</p>
          <h3 className="mt-1 text-base font-black">호가 그래프</h3>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">
            매수 {formatNumber(depth.totalBidQuantity)}주 · 매도 {formatNumber(depth.totalAskQuantity)}주 · {formatOrderBookBias(depth.imbalance)}
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-md bg-[#f2f4f6] p-1">
          <button
            type="button"
            onClick={() => onLayoutChange("split")}
            className={layout === "split" ? "h-9 rounded-md bg-[#191f28] px-3 text-xs font-black text-white" : "h-9 rounded-md px-3 text-xs font-black text-[#6b7684] hover:bg-white"}
          >
            좌우
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange("stacked")}
            className={layout === "stacked" ? "h-9 rounded-md bg-[#191f28] px-3 text-xs font-black text-white" : "h-9 rounded-md px-3 text-xs font-black text-[#6b7684] hover:bg-white"}
          >
            상하
          </button>
        </div>
      </div>

      {layout === "split" ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <OrderBookSide title="매도" flashingLevel={flashingLevel} levels={depth.fixedAsks} maxQuantity={depth.maxQuantity} side="ask" onFlashEnd={onFlashEnd} onPriceSelect={onPriceSelect} />
          <OrderBookSide title="매수" flashingLevel={flashingLevel} levels={depth.fixedBids} maxQuantity={depth.maxQuantity} side="bid" onFlashEnd={onFlashEnd} onPriceSelect={onPriceSelect} />
        </div>
      ) : (
        <StackedOrderBook
          currentPrice={currentPrice}
          depth={depth}
          flashingLevel={flashingLevel}
          onFlashEnd={onFlashEnd}
          onPriceSelect={onPriceSelect}
        />
      )}
    </section>
  );
}

function formatOrderBookBias(imbalance: number) {
  if (!Number.isFinite(imbalance) || imbalance <= 0) {
    return "잔량 없음";
  }
  if (imbalance >= 1.25) {
    return "매수 잔량 우위";
  }
  if (imbalance <= 0.8) {
    return "매도 잔량 우위";
  }
  return "잔량 균형";
}
