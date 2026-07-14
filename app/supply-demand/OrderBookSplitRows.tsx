import { formatNumber, formatRoundedPrice, formatWon } from "@/app/lib/stockFormatters";
import {
  ORDER_BOOK_VISIBLE_LEVELS,
  resolveQuantityRate,
  type CumulativeOrderBookLevel,
  type FlashingOrderBookLevel,
  type OrderBookSideType,
} from "@/app/supply-demand/OrderBookDepthModel";

export function OrderBookSide({
  flashingLevel,
  title,
  levels,
  maxQuantity,
  onFlashEnd,
  onPriceSelect,
  side,
}: {
  flashingLevel: FlashingOrderBookLevel;
  title: string;
  levels: (CumulativeOrderBookLevel | null)[];
  maxQuantity: number;
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
  side: OrderBookSideType;
}) {
  const color = side === "bid" ? "text-stock-danger" : "text-stock-accent";
  return (
    <div className="rounded-md border border-stock-divider bg-stock-surface-muted p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-base font-black ${color}`}>{title}</h3>
        <span className="shrink-0 text-xs font-bold text-stock-subtle">고정 {ORDER_BOOK_VISIBLE_LEVELS}호가</span>
      </div>
      <div className="mt-3 grid h-[376px] grid-rows-[24px_repeat(8,40px)] gap-1 overflow-hidden">
        <div className="grid grid-cols-[minmax(78px,1fr)_minmax(58px,0.9fr)_minmax(58px,0.9fr)_42px] items-center gap-2 px-3 text-xs font-bold text-stock-subtle sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_52px]">
          <span>가격</span>
          <span className="text-right">잔량</span>
          <span className="text-right">누적</span>
          <span className="text-right">주문</span>
        </div>
        {levels.map((level, index) => (
          <OrderBookRow
            key={`${side}-slot-${index}`}
            flashNonce={level && flashingLevel?.side === side && flashingLevel.price === level.price ? flashingLevel.nonce : null}
            level={level}
            maxQuantity={maxQuantity}
            onFlashEnd={onFlashEnd}
            onPriceSelect={onPriceSelect}
            side={side}
          />
        ))}
      </div>
    </div>
  );
}

function OrderBookRow({
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
  const barColor = side === "bid" ? "bg-[#fff0f1]" : "bg-stock-accent-surface";
  const textColor = side === "bid" ? "text-stock-danger" : "text-stock-accent";
  const quantityRate = resolveQuantityRate(level, maxQuantity);

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
      className="relative grid h-10 min-w-0 grid-cols-[minmax(78px,1fr)_minmax(58px,0.9fr)_minmax(58px,0.9fr)_42px] items-center gap-2 overflow-hidden rounded-md bg-stock-surface-muted px-3 text-left text-xs transition enabled:cursor-pointer enabled:hover:bg-[#eef6ff] enabled:focus:outline-none enabled:focus-visible:bg-[#eef6ff] disabled:cursor-default sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_52px] sm:text-sm"
    >
      {level ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 right-0 z-0 ${barColor}`}
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
      <span className={`relative z-20 min-w-0 truncate font-black tabular-nums ${level ? textColor : "text-stock-disabled"}`} title={level ? formatRoundedPrice(level.price) : undefined}>
        {level ? formatRoundedPrice(level.price) : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-stock-text-secondary" : "text-stock-disabled"}`} title={level ? `${formatNumber(level.quantity)}주` : undefined}>
        {level ? formatNumber(level.quantity) : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-admin-placeholder" : "text-stock-disabled"}`} title={level ? `누적 ${formatNumber(level.cumulativeQuantity)}주` : undefined}>
        {level ? formatNumber(level.cumulativeQuantity) : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-stock-subtle" : "text-stock-disabled"}`} title={level ? `${formatNumber(level.orderCount)}건` : undefined}>
        {level ? formatNumber(level.orderCount) : "-"}
      </span>
    </button>
  );
}
