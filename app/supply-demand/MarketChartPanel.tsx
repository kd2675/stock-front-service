"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, createChart, HistogramSeries, type CandlestickData, type HistogramData, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";

import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBookCandle, OrderBookCandleInterval, OrderBookTradeSummary } from "@/app/types/stock";

const CANDLE_INTERVAL_OPTIONS: { value: OrderBookCandleInterval; label: string }[] = [
  { value: "1M", label: "1분" },
  { value: "5M", label: "5분" },
  { value: "15M", label: "15분" },
  { value: "1H", label: "1시간" },
  { value: "1D", label: "일봉" },
  { value: "1W", label: "주봉" },
];

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
            <div className="grid grid-cols-5 rounded-md bg-[#f2f4f6] p-1">
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
            <StatusRow label="체결" value={summary ? `${formatNumber(summary.todayExecutionCount)}건` : "-"} />
            <StatusRow label="거래량" value={`${formatNumber(summary?.todayVolume ?? 0)}주`} />
            <StatusRow label="거래대금" value={formatWon(summary?.todayTurnover)} />
            <StatusRow label="VWAP" value={formatWon(summary?.vwap)} />
            <StatusRow label="최근 체결" value={summary?.lastExecutedAt ? formatTime(summary.lastExecutedAt) : "-"} />
          </div>
        </div>
      </section>
    </>
  );
}

function MarketCandleChart({ candles, expanded, interval, isLoading }: { candles: OrderBookCandle[]; expanded: boolean; interval: OrderBookCandleInterval; isLoading: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [isLiveFollowing, setIsLiveFollowing] = useState(true);
  const isLiveFollowingRef = useRef(true);
  const chartHeight = expanded ? 560 : 300;
  const chartData = useMemo(() => {
    const uniqueTimes = new Set<number>();
    const candleData: CandlestickData<Time>[] = [];
    const volumeData: HistogramData<Time>[] = [];
    for (const candle of candles) {
      const time = Math.floor(new Date(candle.bucketStart).getTime() / 1000);
      if (!Number.isFinite(time) || uniqueTimes.has(time)) {
        continue;
      }
      uniqueTimes.add(time);
      const up = candle.closePrice >= candle.openPrice;
      const hasExecution = candle.hasExecution !== false;
      const candleColor = hasExecution
        ? up ? "#f04452" : "#3182f6"
        : "#a8b0b8";
      candleData.push({
        time: time as Time,
        open: candle.openPrice,
        high: candle.highPrice,
        low: candle.lowPrice,
        close: candle.closePrice,
        color: candleColor,
        borderColor: candleColor,
        wickColor: candleColor,
      });
      volumeData.push({
        time: time as Time,
        value: candle.volume,
        color: hasExecution
          ? up ? "rgba(240, 68, 82, 0.28)" : "rgba(49, 130, 246, 0.28)"
          : "rgba(139, 149, 161, 0.10)",
      });
    }
    return { candleData, volumeData };
  }, [candles]);
  const emptyHeightClass = expanded ? "h-[560px]" : "h-[300px]";

  useEffect(() => {
    isLiveFollowingRef.current = isLiveFollowing;
  }, [isLiveFollowing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || chartData.candleData.length < 2) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      height: chartHeight,
      layout: {
        background: { color: "#fbfcfd" },
        textColor: "#4e5968",
      },
      grid: {
        vertLines: { color: "#eef0f2" },
        horzLines: { color: "#eef0f2" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.05,
          bottom: 0.26,
        },
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 6,
        barSpacing: expanded ? 12 : 8,
        minBarSpacing: 4,
        tickMarkFormatter: (time: Time) => formatChartTickTime(time, interval),
      },
      localization: {
        locale: "ko-KR",
        timeFormatter: (time: Time) => formatChartCrosshairTime(time, interval),
      },
      crosshair: {
        vertLine: { color: "#8b95a1", labelBackgroundColor: "#333d4b" },
        horzLine: { color: "#8b95a1", labelBackgroundColor: "#333d4b" },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#f04452",
      downColor: "#3182f6",
      borderUpColor: "#f04452",
      borderDownColor: "#3182f6",
      wickUpColor: "#f04452",
      wickDownColor: "#3182f6",
      priceLineVisible: true,
      lastValueVisible: true,
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceLineVisible: false,
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [chartData.candleData.length, chartHeight, expanded, interval]);

  useEffect(() => {
    candleSeriesRef.current?.setData(chartData.candleData);
    volumeSeriesRef.current?.setData(chartData.volumeData);
    chartRef.current?.applyOptions({
      height: chartHeight,
      timeScale: {
        barSpacing: expanded ? 12 : 8,
      },
    });
    if (isLiveFollowingRef.current) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [chartData, chartHeight, expanded]);

  const pauseLiveFollowing = () => {
    if (chartRef.current) {
      isLiveFollowingRef.current = false;
      setIsLiveFollowing(false);
    }
  };

  const resumeLiveFollowing = () => {
    isLiveFollowingRef.current = true;
    setIsLiveFollowing(true);
    window.requestAnimationFrame(() => {
      chartRef.current?.timeScale().fitContent();
    });
  };

  if (isLoading && candles.length === 0) {
    return (
      <div className={`grid ${emptyHeightClass} place-items-center rounded-md bg-[#f7f8fa] text-sm font-bold text-[#8b95a1]`}>
        차트 데이터를 불러오는 중입니다.
      </div>
    );
  }
  if (chartData.candleData.length < 2) {
    return (
      <div className={`grid ${emptyHeightClass} place-items-center rounded-md bg-[#f7f8fa] px-4 text-center text-sm font-bold leading-6 text-[#8b95a1]`}>
        가격 이력과 체결이 더 쌓이면 일봉/주봉 차트와 거래량이 표시됩니다.
      </div>
    );
  }

  const prices = candles.flatMap((candle) => [candle.highPrice, candle.lowPrice]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const last = candles[candles.length - 1];
  const first = candles[0];
  const changeRate = calculateChangeRate(last.closePrice, first.openPrice);

  return (
    <div className="rounded-md border border-[#eef0f2] bg-[#fbfcfd] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#8b95a1]">최근 {candles.length}개 구간</p>
          <p className="mt-0.5 text-sm font-black tabular-nums text-[#191f28]">
            {formatWon(last.closePrice)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!isLiveFollowing ? (
            <button
              type="button"
              onClick={resumeLiveFollowing}
              className="h-8 rounded-md border border-[#d1d6db] bg-white px-3 text-xs font-black text-[#333d4b] shadow-sm hover:bg-[#f7f8fa]"
            >
              실시간 아님 · 따라가기
            </button>
          ) : null}
          <span className={changeRate >= 0 ? "text-sm font-black tabular-nums text-[#f04452]" : "text-sm font-black tabular-nums text-[#3182f6]"}>
            {formatSignedPercent(changeRate)}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        aria-label="확대와 이동이 가능한 가격 캔들 및 거래량 차트"
        onPointerDown={pauseLiveFollowing}
        onTouchStart={pauseLiveFollowing}
        onWheel={pauseLiveFollowing}
        className="w-full min-w-0 overflow-hidden rounded-md bg-[#fbfcfd]"
        style={{ height: chartHeight }}
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-[#8b95a1]">
        <span>{formatShortDateTime(candles[0].bucketStart)}</span>
        <span>고가 {formatWon(maxPrice)} · 저가 {formatWon(minPrice)}</span>
        <span>{formatShortDateTime(last.bucketStart)}</span>
      </div>
    </div>
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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatChartCrosshairTime(time: Time, interval: OrderBookCandleInterval) {
  return formatChartTime(time, interval, "crosshair");
}

function formatChartTickTime(time: Time, interval: OrderBookCandleInterval) {
  return formatChartTime(time, interval, "tick");
}

function formatChartTime(time: Time, interval: OrderBookCandleInterval, mode: "crosshair" | "tick") {
  const date = resolveChartDate(time);
  if (!date) {
    return "";
  }
  if (interval === "1D" || interval === "1W") {
    return date.toLocaleDateString("ko-KR", {
      year: mode === "crosshair" ? "numeric" : undefined,
      month: "2-digit",
      day: "2-digit",
    });
  }
  return date.toLocaleString("ko-KR", {
    month: mode === "crosshair" ? "2-digit" : undefined,
    day: mode === "crosshair" ? "2-digit" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveChartDate(time: Time) {
  if (typeof time === "number") {
    return new Date(time * 1000);
  }
  if (typeof time === "string") {
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(time.year, time.month - 1, time.day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateChangeRate(currentPrice: number, basePrice: number) {
  if (basePrice <= 0) {
    return 0;
  }
  return (currentPrice - basePrice) / basePrice * 100;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
