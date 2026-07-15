"use client";

import { AreaSeries, createChart, type AreaData, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { useEffect, useMemo, useRef } from "react";

import {
  ADMIN_ASSET_HISTORY_METRICS,
  type AdminAssetHistoryMetric,
} from "@/app/supply-demand/admin/adminTotalAssetHistoryMetrics";
import type { AdminTotalAssetHistoryPoint } from "@/app/types/stock";

export function AdminTotalAssetHistoryChart({
  points,
  metric,
}: {
  points: AdminTotalAssetHistoryPoint[];
  metric: AdminAssetHistoryMetric;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const metricDefinition = ADMIN_ASSET_HISTORY_METRICS[metric];
  const data = useMemo<AreaData<Time>[]>(
    () => [...points]
      .reverse()
      .map((point) => ({ time: point.snapshotDate, value: metricDefinition.value(point) }))
      .filter((point): point is { time: string; value: number } => point.value != null),
    [metricDefinition, points],
  );
  const hasChartData = data.length >= 2;

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
        formatter: (price: number) => `${Math.round(price).toLocaleString("ko-KR")}${metricDefinition.unit === "WON" ? "원" : "주"}`,
      },
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [hasChartData, metricDefinition.unit]);

  useEffect(() => {
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (!hasChartData) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-md border border-white/10 bg-admin-canvas/60 text-sm font-bold text-stock-subtle">
        {metricDefinition.label} 정산 기록이 2일 이상 쌓이면 추이 차트가 표시됩니다.
      </div>
    );
  }

  return <div ref={containerRef} role="img" aria-label={`${metricDefinition.label} 7일 변화 차트`} className="h-[220px] w-full min-w-0 overflow-hidden rounded-md border border-white/10 bg-admin-canvas" />;
}
