"use client";

import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBookCandle, OrderBookCandleInterval, OrderBookTradeSummary } from "@/app/types/stock";
import { MarketCandleChart } from "@/app/supply-demand/MarketCandleChart";
import { CANDLE_INTERVAL_OPTIONS, formatTime } from "@/app/supply-demand/MarketChartFormatters";

export function MarketChartPanel({
  candles,
  expanded,
  interval,
  isLoading,
  summary,
  onExpandedChange,
  onIntervalChange,
}: {
  candles: OrderBookCandle[];
  expanded: boolean;
  interval: OrderBookCandleInterval;
  isLoading: boolean;
  summary: OrderBookTradeSummary | null;
  onExpandedChange: (expanded: boolean) => void;
  onIntervalChange: (interval: OrderBookCandleInterval) => void;
}) {
  return (
    <>
      {expanded ? (
        <button
          type="button"
          aria-label="차트 확대 닫기"
          onClick={() => onExpandedChange(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/30"
        />
      ) : null}
      <section className={expanded
        ? "fixed inset-3 z-50 overflow-auto rounded-lg border border-[#d1d6db] bg-white p-4 shadow-[0_18px_80px_rgba(25,31,40,0.26)] sm:inset-6"
        : "rounded-lg border border-[#e5e8eb] bg-white p-4"}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#8b95a1]">PRICE / VOLUME</p>
            <h3 className="mt-1 text-base font-black">가격 흐름</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid grid-cols-3 rounded-md bg-[#f2f4f6] p-1 sm:grid-cols-6">
              {CANDLE_INTERVAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onIntervalChange(option.value)}
                  className={interval === option.value
                    ? "h-9 rounded-md bg-[#191f28] px-2 text-xs font-black text-white"
                    : "h-9 rounded-md px-2 text-xs font-black text-[#6b7684] hover:bg-white"}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onExpandedChange(!expanded)}
              className="h-11 rounded-md bg-[#191f28] px-3 text-xs font-black text-white"
            >
              {expanded ? "축소" : "확대"}
            </button>
          </div>
        </div>

        <div className={expanded ? "mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]" : "mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]"}>
          <MarketCandleChart key={interval} candles={candles} expanded={expanded} interval={interval} isLoading={isLoading} />
          <div className="grid content-start gap-2 rounded-md bg-[#f7f8fa] p-3 text-sm">
            <StatusRow label="2시간 체결" value={summary ? `${formatNumber(summary.todayExecutionCount)}건` : "-"} />
            <StatusRow label="2시간 거래량" value={`${formatNumber(summary?.todayVolume ?? 0)}주`} />
            <StatusRow label="2시간 거래대금" value={formatWon(summary?.todayTurnover)} />
            <StatusRow label="VWAP" value={formatWon(summary?.vwap)} />
            <StatusRow label="최근 체결" value={summary?.lastExecutedAt ? formatTime(summary.lastExecutedAt) : "-"} />
          </div>
        </div>
      </section>
    </>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-bold text-[#6b7684]">{label}</span>
      <span className="font-black text-[#191f28]">{value}</span>
    </div>
  );
}
