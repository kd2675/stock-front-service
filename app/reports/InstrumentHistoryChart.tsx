"use client";

import {
  createChart,
  HistogramSeries,
  LineSeries,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";

import type { InstrumentDailyHistoryPoint } from "@/app/types/stock";

export default function InstrumentHistoryChart({ history }: { history: InstrumentDailyHistoryPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const chartData = useMemo(() => {
    const ordered = [...history].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate));
    return {
      prices: ordered.map<LineData<Time>>((point) => ({
        time: point.tradeDate,
        value: point.closePrice,
      })),
      volumes: ordered.map<HistogramData<Time>>((point) => ({
        time: point.tradeDate,
        value: point.volume,
        color: point.reportDate ? "rgba(49, 130, 246, 0.55)" : "rgba(139, 149, 161, 0.32)",
      })),
    };
  }, [history]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      height: 280,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#6b7684",
      },
      grid: {
        vertLines: { color: "#f2f4f6" },
        horzLines: { color: "#f2f4f6" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: "#8b95a1" },
        horzLine: { color: "#8b95a1" },
      },
    });
    const priceSeries = chart.addSeries(LineSeries, {
      color: "#3182f6",
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
      borderVisible: false,
    });
    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    priceSeriesRef.current?.setData(chartData.prices);
    volumeSeriesRef.current?.setData(chartData.volumes);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  if (chartData.prices.length < 2) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-md bg-stock-surface-muted px-4 text-center text-sm font-bold text-stock-subtle">
        마감 데이터가 2일 이상 쌓이면 가격·거래량 차트가 표시됩니다.
      </div>
    );
  }

  return <div ref={containerRef} className="h-[280px] w-full min-w-0 overflow-hidden rounded-md bg-white" />;
}
