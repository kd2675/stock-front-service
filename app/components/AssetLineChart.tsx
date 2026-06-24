"use client";

import { createChart, LineSeries, type IChartApi, type ISeriesApi, type LineData, type Time } from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";
import type { PortfolioSnapshot } from "@/app/types/stock";

export default function AssetLineChart({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const data = useMemo<LineData<Time>[]>(
    () =>
      [...snapshots]
        .reverse()
        .map((snapshot) => ({
          time: snapshot.snapshotDate,
          value: snapshot.totalAsset,
        })),
    [snapshots],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      height: 180,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#4e5968",
      },
      grid: {
        vertLines: { color: "#eef0f2" },
        horzLines: { color: "#eef0f2" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      crosshair: {
        vertLine: { color: "#8b95a1" },
        horzLine: { color: "#8b95a1" },
      },
    });
    const series = chart.addSeries(LineSeries, {
      color: "#3182f6",
      lineWidth: 3,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="mt-4 flex h-[180px] items-center justify-center rounded-md bg-[#f9fafb] text-sm font-semibold text-[#6b7684]">
        자산 기록이 더 쌓이면 차트가 표시됩니다.
      </div>
    );
  }

  return <div ref={containerRef} className="mt-4 h-[180px] w-full min-w-0 overflow-hidden rounded-md bg-white" />;
}
