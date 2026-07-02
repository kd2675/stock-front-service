"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, createChart, HistogramSeries, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";

import { formatWon } from "@/app/lib/stockFormatters";
import {
  formatChartCrosshairTime,
  formatChartTickTime,
  formatShortDateTime,
  formatSignedPercent,
  toMarketChartPriceSummary,
  toMarketChartSeriesData,
} from "@/app/supply-demand/MarketChartFormatters";
import type { OrderBookCandle, OrderBookCandleInterval } from "@/app/types/stock";

type MarketCandleChartProps = {
  candles: OrderBookCandle[];
  expanded: boolean;
  interval: OrderBookCandleInterval;
  isLoading: boolean;
};

export function MarketCandleChart({ candles, expanded, interval, isLoading }: MarketCandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [isLiveFollowing, setIsLiveFollowing] = useState(true);
  const isLiveFollowingRef = useRef(true);
  const chartHeight = expanded ? 560 : 300;
  const chartData = useMemo(() => toMarketChartSeriesData(candles), [candles]);
  const priceSummary = useMemo(() => toMarketChartPriceSummary(candles), [candles]);
  const hasEnoughChartData = chartData.candleData.length >= 2;
  const emptyHeightClass = expanded ? "h-[560px]" : "h-[300px]";

  useEffect(() => {
    isLiveFollowingRef.current = isLiveFollowing;
  }, [isLiveFollowing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasEnoughChartData) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      height: 300,
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
        barSpacing: 8,
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
  }, [hasEnoughChartData, interval]);

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
  if (!hasEnoughChartData || !priceSummary) {
    return (
      <div className={`grid ${emptyHeightClass} place-items-center rounded-md bg-[#f7f8fa] px-4 text-center text-sm font-bold leading-6 text-[#8b95a1]`}>
        가격 이력과 체결이 더 쌓이면 시뮬일/시뮬주 차트와 거래량이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[#eef0f2] bg-[#fbfcfd] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#8b95a1]">최근 {candles.length}개 구간 · 시뮬레이션 시간 기준</p>
          <p className="mt-0.5 text-sm font-black tabular-nums text-[#191f28]">
            {formatWon(priceSummary.lastClosePrice)}
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
          <span className={priceSummary.changeRate >= 0 ? "text-sm font-black tabular-nums text-[#f04452]" : "text-sm font-black tabular-nums text-[#3182f6]"}>
            {formatSignedPercent(priceSummary.changeRate)}
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
        <span>{formatShortDateTime(priceSummary.firstBucketStart)}</span>
        <span>고가 {formatWon(priceSummary.maxPrice)} · 저가 {formatWon(priceSummary.minPrice)}</span>
        <span>{formatShortDateTime(priceSummary.lastBucketStart)}</span>
      </div>
    </div>
  );
}
