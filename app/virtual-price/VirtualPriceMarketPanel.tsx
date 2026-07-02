import { formatWon } from "@/app/lib/stockFormatters";
import type { Instrument, Price, PriceTick } from "@/app/types/stock";

import { formatDateTime, formatNumber } from "./VirtualPriceFormatters";
import { Sparkline } from "./VirtualPricePanels";

type VirtualPriceMarketPanelProps = {
  chronologicalTicks: PriceTick[];
  instrumentMap: Map<string, Instrument>;
  priceTicks: PriceTick[];
  prices: Price[];
  selectedInstrument?: Instrument;
  selectedPrice?: Price;
  selectedSymbol: string;
  onSelectPrice: (price: Price) => void;
};

export function VirtualPriceMarketPanel({
  chronologicalTicks,
  instrumentMap,
  priceTicks,
  prices,
  selectedInstrument,
  selectedPrice,
  selectedSymbol,
  onSelectPrice,
}: VirtualPriceMarketPanelProps) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">시장 가격</h2>
          <p className="mt-1 text-sm text-[#6b7684]">batch 서버가 갱신한 가격 테이블 기준입니다.</p>
        </div>
      </div>
      <div className="mt-5 divide-y divide-[#eef0f2]">
        {prices.map((item) => {
          const instrument = instrumentMap.get(item.symbol);
          return (
            <button
              type="button"
              key={item.symbol}
              onClick={() => onSelectPrice(item)}
              className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(88px,auto)_minmax(48px,auto)] items-center gap-3 py-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{instrument?.name ?? item.symbol}</p>
                <p className="text-xs text-[#8b95a1]">{item.symbol}</p>
              </div>
              <p className="min-w-0 break-words text-right text-sm font-bold tabular-nums">{formatWon(item.currentPrice)}</p>
              <p className={item.changeRate >= 0 ? "text-right text-sm font-bold text-[#f04452] tabular-nums" : "text-right text-sm font-bold text-[#3182f6] tabular-nums"}>
                {formatNumber(item.changeRate)}%
              </p>
            </button>
          );
        })}
      </div>
      <div className="mt-5 border-t border-[#eef0f2] pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold">가격 흐름</h3>
            <p className="mt-1 truncate text-xs text-[#8b95a1]">
              {selectedInstrument?.name ?? selectedSymbol} · 최근 {priceTicks.length}건
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="min-w-0 break-words text-sm font-black tabular-nums">{formatWon(selectedPrice?.currentPrice)}</p>
            <p className="mt-1 text-xs text-[#8b95a1]">{selectedPrice?.provider ?? "-"}</p>
          </div>
        </div>
        <div className="mt-4 h-24 w-full">
          <Sparkline ticks={chronologicalTicks} />
        </div>
        {priceTicks.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {priceTicks.slice(0, 4).map((tick) => (
              <div key={`${tick.symbol}-${tick.priceTime}-${tick.provider}`} className="flex min-w-0 items-center justify-between gap-3 border-b border-[#eef0f2] py-2">
                <span className="shrink-0 text-xs text-[#8b95a1]">{formatDateTime(tick.priceTime)}</span>
                <span className="min-w-0 break-words text-right text-sm font-semibold tabular-nums">{formatWon(tick.price)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#6b7684]">아직 수집된 가격 이력이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
