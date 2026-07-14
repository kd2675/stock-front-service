import { formatNumber, formatRoundedPrice, formatWon } from "@/app/lib/stockFormatters";
import {
  resolveQuantityRate,
  type CumulativeOrderBookLevel,
  type FlashingOrderBookLevel,
  type OrderBookDepthModel,
  type OrderBookSideType,
} from "@/app/supply-demand/OrderBookDepthModel";

export function StackedOrderBook({
  currentPrice,
  depth,
  flashingLevel,
  onFlashEnd,
  onPriceSelect,
}: {
  currentPrice: number;
  depth: OrderBookDepthModel;
  flashingLevel: FlashingOrderBookLevel;
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-stock-divider bg-stock-surface-muted p-3">
      <div className="grid grid-cols-[minmax(76px,1fr)_minmax(90px,0.85fr)_minmax(76px,1fr)_44px] items-center gap-2 px-3 text-xs font-bold text-stock-subtle sm:grid-cols-[minmax(120px,1fr)_116px_minmax(120px,1fr)_58px]">
        <span className="text-left">매도 잔량</span>
        <span className="text-center">가격</span>
        <span className="text-right">매수 잔량</span>
        <span className="text-right">건수</span>
      </div>
      <div className="mt-2 grid gap-1">
        {depth.stackedAsks.map((level, index) => (
          <StackedOrderBookRow
            key={`stacked-ask-${index}`}
            flashNonce={level && flashingLevel?.side === "ask" && flashingLevel.price === level.price ? flashingLevel.nonce : null}
            level={level}
            maxQuantity={depth.maxQuantity}
            onFlashEnd={onFlashEnd}
            onPriceSelect={onPriceSelect}
            side="ask"
          />
        ))}
        <div className="my-1 grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-stock-border-strong bg-white px-3">
          <div>
            <p className="text-xs font-bold text-stock-subtle">중앙 현재가</p>
            <p className="mt-0.5 text-lg font-black tabular-nums text-stock-ink">{formatWon(currentPrice)}</p>
          </div>
          <span className="rounded-sm bg-stock-surface-strong px-2 py-1 text-xs font-black text-stock-text-secondary">매도 위 / 매수 아래</span>
        </div>
        {depth.stackedBids.map((level, index) => (
          <StackedOrderBookRow
            key={`stacked-bid-${index}`}
            flashNonce={level && flashingLevel?.side === "bid" && flashingLevel.price === level.price ? flashingLevel.nonce : null}
            level={level}
            maxQuantity={depth.maxQuantity}
            onFlashEnd={onFlashEnd}
            onPriceSelect={onPriceSelect}
            side="bid"
          />
        ))}
      </div>
    </div>
  );
}

function StackedOrderBookRow({
  flashNonce,
  level,
  maxQuantity,
  onFlashEnd,
  onPriceSelect,
  side,
}: {
  flashNonce: number | null;
  level: CumulativeOrderBookLevel | null;
  maxQuantity: number;
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
  side: OrderBookSideType;
}) {
  const quantityRate = resolveQuantityRate(level, maxQuantity);
  const priceColor = side === "ask" ? "text-stock-accent" : "text-stock-danger";
  const barClass = side === "ask" ? "left-0 bg-stock-accent-surface" : "right-0 bg-[#fff0f1]";
  const rowHover = side === "ask" ? "enabled:hover:bg-[#f5f9ff] enabled:focus-visible:bg-[#f5f9ff]" : "enabled:hover:bg-[#fff7f7] enabled:focus-visible:bg-[#fff7f7]";

  return (
    <button
      type="button"
      data-order-book-row={side}
      disabled={!level}
      aria-label={level ? `${side === "bid" ? "매수" : "매도"} 호가 ${formatWon(level.price)} 주문가로 선택` : undefined}
      onClick={() => {
        if (level) {
          onPriceSelect(level.price, side);
        }
      }}
      className={`relative grid h-10 min-w-0 grid-cols-[minmax(76px,1fr)_minmax(90px,0.85fr)_minmax(76px,1fr)_44px] items-center gap-2 overflow-hidden rounded-md bg-stock-surface-muted px-3 text-xs transition enabled:cursor-pointer enabled:focus:outline-none disabled:cursor-default sm:grid-cols-[minmax(120px,1fr)_116px_minmax(120px,1fr)_58px] sm:text-sm ${rowHover}`}
    >
      {level ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 z-0 ${barClass}`}
          style={{ width: `${quantityRate}%` }}
        />
      ) : null}
      {flashNonce !== null ? (
        <span
          aria-hidden="true"
          className="order-book-flash-overlay absolute inset-0 z-10"
          onAnimationEnd={onFlashEnd}
        />
      ) : null}
      <span className={`relative z-20 min-w-0 truncate text-left font-bold tabular-nums ${level && side === "ask" ? "text-stock-text-secondary" : "text-stock-disabled"}`} title={level && side === "ask" ? `${formatNumber(level.quantity)}주, 누적 ${formatNumber(level.cumulativeQuantity)}주` : undefined}>
        {level && side === "ask" ? `${formatNumber(level.quantity)}주` : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-center font-black tabular-nums ${level ? priceColor : "text-stock-disabled"}`} title={level ? formatRoundedPrice(level.price) : undefined}>
        {level ? formatRoundedPrice(level.price) : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level && side === "bid" ? "text-stock-text-secondary" : "text-stock-disabled"}`} title={level && side === "bid" ? `${formatNumber(level.quantity)}주, 누적 ${formatNumber(level.cumulativeQuantity)}주` : undefined}>
        {level && side === "bid" ? `${formatNumber(level.quantity)}주` : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-stock-subtle" : "text-stock-disabled"}`} title={level ? `누적 ${formatNumber(level.cumulativeQuantity)}주, ${formatNumber(level.orderCount)}건` : undefined}>
        {level ? formatNumber(level.orderCount) : "-"}
      </span>
    </button>
  );
}
