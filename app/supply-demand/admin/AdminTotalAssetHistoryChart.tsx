"use client";

import { AreaSeries, createChart, type AreaData, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";

import type { AdminTotalAssetHistoryPoint } from "@/app/types/stock";

export function AdminTotalAssetHistoryChart({ points }: { points: AdminTotalAssetHistoryPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const data = useMemo<AreaData<Time>[]>(
    () => [...points].reverse().map((point) => ({ time: point.snapshotDate, value: point.totalAsset })),
    [points],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const chart = createChart(container, {
      autoSize: true,
      height: 220,
      layout: {
        background: { color: "#101418" },
        textColor: "#aab6c3",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)" },
      crosshair: {
        vertLine: { color: "#64a8ff" },
        horzLine: { color: "#64a8ff" },
      },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#64a8ff",
      lineWidth: 3,
      topColor: "rgba(100,168,255,0.35)",
      bottomColor: "rgba(100,168,255,0.02)",
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: "custom",
        minMove: 1,
        formatter: (price: number) => `${Math.round(price).toLocaleString("ko-KR")}원`,
      },
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
      <div className="flex h-[220px] items-center justify-center rounded-md border border-white/10 bg-admin-canvas/60 text-sm font-bold text-stock-subtle">
        자산 정산 기록이 2일 이상 쌓이면 추이 차트가 표시됩니다.
      </div>
    );
  }

  return <div ref={containerRef} className="h-[220px] w-full min-w-0 overflow-hidden rounded-md border border-white/10 bg-admin-canvas" />;
}
