import { calculateChangeRate } from "@/app/lib/priceMath";
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
  priceLimitBase,
}: {
  currentPrice: number;
  depth: OrderBookDepthModel;
  flashingLevel: FlashingOrderBookLevel;
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
  priceLimitBase: number;
}) {
  const visibleAsks = depth.stackedAsks.filter(isOrderBookLevel);
  const visibleBids = depth.stackedBids.filter(isOrderBookLevel);

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-stock-divider bg-stock-surface-muted">
      <div className="grid h-9 grid-cols-[minmax(70px,1fr)_minmax(132px,1.35fr)_minmax(70px,1fr)] items-center border-b border-stock-divider px-2 text-[11px] font-bold text-stock-subtle sm:grid-cols-[minmax(140px,1fr)_200px_minmax(140px,1fr)] sm:px-3 sm:text-xs">
        <span className="text-right">매도 잔량</span>
        <span className="text-center">가격 / 등락률</span>
        <span className="text-left">매수 잔량</span>
      </div>
      <div>
        {visibleAsks.length ? visibleAsks.map((level) => (
          <StackedOrderBookRow
            key={`stacked-ask-${level.price}`}
            flashNonce={flashingLevel?.side === "ask" && flashingLevel.price === level.price ? flashingLevel.nonce : null}
            level={level}
            maxQuantity={depth.maxAskQuantity}
            onFlashEnd={onFlashEnd}
            onPriceSelect={onPriceSelect}
            priceLimitBase={priceLimitBase}
            side="ask"
          />
        )) : <EmptyOrderBookSide side="ask" />}
        <CurrentPriceRow currentPrice={currentPrice} priceLimitBase={priceLimitBase} />
        {visibleBids.length ? visibleBids.map((level) => (
          <StackedOrderBookRow
            key={`stacked-bid-${level.price}`}
            flashNonce={flashingLevel?.side === "bid" && flashingLevel.price === level.price ? flashingLevel.nonce : null}
            level={level}
            maxQuantity={depth.maxBidQuantity}
            onFlashEnd={onFlashEnd}
            onPriceSelect={onPriceSelect}
            priceLimitBase={priceLimitBase}
            side="bid"
          />
        )) : <EmptyOrderBookSide side="bid" />}
      </div>
      <div className="grid grid-cols-2 border-t border-stock-border-strong bg-white">
        <OrderBookTotal label="매도 대기" quantity={depth.totalAskQuantity} side="ask" />
        <OrderBookTotal label="매수 대기" quantity={depth.totalBidQuantity} side="bid" />
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
  priceLimitBase,
  side,
}: {
  flashNonce: number | null;
  level: CumulativeOrderBookLevel;
  maxQuantity: number;
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
  priceLimitBase: number;
  side: OrderBookSideType;
}) {
  const quantityRate = resolveQuantityRate(level, maxQuantity);
  const changeRate = calculateChangeRate(level.price, priceLimitBase);
  const priceColor = resolvePriceColor(changeRate);
  const barClass = side === "ask" ? "right-0 bg-stock-accent-surface" : "left-0 bg-[#fff0f1]";
  const rowHover = side === "ask" ? "enabled:hover:bg-[#f5f9ff] enabled:focus-visible:bg-[#f5f9ff]" : "enabled:hover:bg-[#fff7f7] enabled:focus-visible:bg-[#fff7f7]";

  return (
    <button
      type="button"
      data-order-book-row={side}
      aria-label={`${side === "bid" ? "매수" : "매도"} 호가 ${formatWon(level.price)} 주문가로 선택`}
      onClick={() => {
        onPriceSelect(level.price, side);
      }}
      className={`relative grid h-8 min-w-0 grid-cols-[minmax(70px,1fr)_minmax(132px,1.35fr)_minmax(70px,1fr)] items-center border-b border-stock-divider text-xs transition enabled:cursor-pointer enabled:focus:outline-none sm:grid-cols-[minmax(140px,1fr)_200px_minmax(140px,1fr)] sm:text-sm ${rowHover}`}
    >
      {flashNonce !== null ? (
        <span
          aria-hidden="true"
          className="order-book-flash-overlay absolute inset-0 z-10"
          onAnimationEnd={onFlashEnd}
        />
      ) : null}
      <span className="relative z-20 flex h-full min-w-0 items-center justify-end overflow-hidden px-2 sm:px-3">
        {side === "ask" ? <QuantityCellContent barClass={barClass} quantity={level.quantity} quantityRate={quantityRate} side={side} /> : null}
      </span>
      <span className={`relative z-20 flex h-full min-w-0 items-center justify-center gap-1.5 border-x border-stock-divider bg-white/60 px-1 font-black tabular-nums ${priceColor}`} title={`${formatWon(level.price)}, 기준가 대비 ${formatSignedPercent(changeRate)}`}>
        <span className="truncate">{formatRoundedPrice(level.price)}</span>
        <span className="shrink-0 text-[10px] sm:text-xs">{formatSignedPercent(changeRate)}</span>
      </span>
      <span className="relative z-20 flex h-full min-w-0 items-center justify-start overflow-hidden px-2 sm:px-3">
        {side === "bid" ? <QuantityCellContent barClass={barClass} quantity={level.quantity} quantityRate={quantityRate} side={side} /> : null}
      </span>
    </button>
  );
}

function QuantityCellContent({
  barClass,
  quantity,
  quantityRate,
  side,
}: {
  barClass: string;
  quantity: number;
  quantityRate: number;
  side: OrderBookSideType;
}) {
  return (
    <>
      <span aria-hidden="true" className={`absolute inset-y-1 ${barClass}`} style={{ width: `${quantityRate}%` }} />
      <span className={`relative z-10 min-w-0 truncate font-bold tabular-nums ${side === "ask" ? "text-stock-accent" : "text-stock-danger"}`} title={`${formatNumber(quantity)}주`}>
        {formatNumber(quantity)}
      </span>
    </>
  );
}

function CurrentPriceRow({ currentPrice, priceLimitBase }: { currentPrice: number; priceLimitBase: number }) {
  const changeRate = calculateChangeRate(currentPrice, priceLimitBase);
  return (
    <div
      aria-label={`현재가 ${formatWon(currentPrice)}, 기준가 대비 ${formatSignedPercent(changeRate)}`}
      className="grid h-11 grid-cols-[minmax(70px,1fr)_minmax(132px,1.35fr)_minmax(70px,1fr)] items-center border-y border-stock-border-strong bg-white sm:grid-cols-[minmax(140px,1fr)_200px_minmax(140px,1fr)]"
    >
      <span />
      <span className={`flex h-full items-center justify-center gap-2 border-x border-stock-border-strong px-1 font-black tabular-nums ${resolvePriceColor(changeRate)}`}>
        <span className="text-base sm:text-lg">{formatRoundedPrice(currentPrice)}</span>
        <span className="text-[11px] sm:text-xs">{formatSignedPercent(changeRate)}</span>
      </span>
      <span />
    </div>
  );
}

function EmptyOrderBookSide({ side }: { side: OrderBookSideType }) {
  return (
    <div className="grid h-10 grid-cols-[minmax(70px,1fr)_minmax(132px,1.35fr)_minmax(70px,1fr)] items-center border-b border-stock-divider text-xs font-bold text-stock-subtle sm:grid-cols-[minmax(140px,1fr)_200px_minmax(140px,1fr)]">
      <span />
      <span className="text-center">{side === "ask" ? "매도 잔량 없음" : "매수 잔량 없음"}</span>
      <span />
    </div>
  );
}

function OrderBookTotal({ label, quantity, side }: { label: string; quantity: number; side: OrderBookSideType }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 px-3 py-2.5 ${side === "ask" ? "justify-start border-r border-stock-divider" : "justify-end"}`}>
      <span className="text-[11px] font-bold text-stock-subtle sm:text-xs">{label}</span>
      <strong className={`min-w-0 truncate text-sm font-black tabular-nums sm:text-base ${side === "ask" ? "text-stock-accent" : "text-stock-danger"}`} title={`${formatNumber(quantity)}주`}>
        {formatNumber(quantity)}주
      </strong>
    </div>
  );
}

function isOrderBookLevel(level: CumulativeOrderBookLevel | null): level is CumulativeOrderBookLevel {
  return level !== null;
}

function resolvePriceColor(changeRate: number) {
  if (changeRate > 0) {
    return "text-stock-danger";
  }
  if (changeRate < 0) {
    return "text-stock-accent";
  }
  return "text-stock-ink";
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
