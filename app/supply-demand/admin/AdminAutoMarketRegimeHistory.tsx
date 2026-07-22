"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { autoMarketRegimeHistoryRangeQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import type {
  AutoMarketDistributionBias,
  AutoMarketRegimeHistoryDay,
  AutoMarketRegimeHistorySourceStatus,
} from "@/app/types/stock";

type PressureKey = keyof AutoMarketDistributionBias;
type EffectivePressureWindow = AutoMarketDistributionBias & {
  modifierWindowStartAt: string;
};
type EffectiveHistoryDay = AutoMarketRegimeHistoryDay & {
  effectiveWindows: EffectivePressureWindow[];
};
type WindowApplicationStatus = "APPLIED" | "CURRENT" | "UPCOMING";
type ComparisonView = "TREND" | "HEATMAP";
type PressureTooltipState = {
  placement: "ABOVE" | "BELOW";
  pressureLabel: string;
  status: WindowApplicationStatus;
  time: string;
  tradeDate: string;
  value: number;
  x: number;
  y: number;
};
type TrendPoint = {
  value: number;
  window: EffectivePressureWindow;
  x: number;
  y: number;
};
type TrendSegment = {
  tone: "NEGATIVE" | "NEUTRAL" | "POSITIVE";
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

const PRESSURE_FIELDS: Array<{ key: PressureKey; label: string }> = [
  { key: "pricePressure", label: "가격" },
  { key: "assetPreferencePressure", label: "자산" },
  { key: "volatilityPressure", label: "변동" },
  { key: "liquidityPressure", label: "유동" },
  { key: "executionAggressionPressure", label: "공격" },
];

const WINDOW_TIMES = Array.from({ length: 24 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minute = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
});

const TREND_CHART = {
  bottom: 92,
  height: 104,
  left: 10,
  right: 950,
  top: 8,
  width: 960,
} as const;

const TREND_TIME_LABELS = [
  { index: 0, label: "06:00" },
  { index: 6, label: "09:00" },
  { index: 12, label: "12:00" },
  { index: 18, label: "15:00" },
  { index: 23, label: "17:30" },
];

const SOURCE_STATUS_META: Record<AutoMarketRegimeHistorySourceStatus, { label: string; className: string }> = {
  COMPLETE: { label: "준비 완료", className: "text-admin-success" },
  PARTIAL: { label: "일부 누락", className: "text-admin-warning-soft" },
  MISSING: { label: "기록 없음", className: "text-admin-danger" },
};

const WINDOW_STATUS_META: Record<WindowApplicationStatus, { label: string; className: string }> = {
  APPLIED: { label: "적용 완료", className: "text-admin-accent-label" },
  CURRENT: { label: "현재 적용", className: "text-admin-success" },
  UPCOMING: { label: "적용 예정", className: "text-admin-muted" },
};

function clampPressure(value: number) {
  return Math.min(100, Math.max(-100, Number.isFinite(value) ? value : 0));
}

function signed(value: number) {
  const normalized = Math.round(clampPressure(value));
  return normalized > 0 ? `+${normalized}` : `${normalized}`;
}

function pressureTone(value: number) {
  if (value > 0) {
    return "text-[#86efac]";
  }
  if (value < 0) {
    return "text-[#fca5a5]";
  }
  return "text-[#d7dee7]";
}

function pressureCellStyle(value: number) {
  const normalized = clampPressure(value);
  const strength = 0.18 + Math.abs(normalized) / 100 * 0.72;
  if (normalized > 0) {
    return { backgroundColor: `rgb(34 197 94 / ${strength})` };
  }
  if (normalized < 0) {
    return { backgroundColor: `rgb(239 68 68 / ${strength})` };
  }
  return { backgroundColor: "rgb(255 255 255 / 0.08)" };
}

function pressureLabel(pressureKey: PressureKey) {
  return PRESSURE_FIELDS.find((field) => field.key === pressureKey)?.label ?? "종합";
}

function pressurePointColor(value: number) {
  if (value > 0) {
    return "#22c55e";
  }
  if (value < 0) {
    return "#ef4444";
  }
  return "#aab4c0";
}

function pressureToChartY(value: number) {
  const plotHeight = TREND_CHART.bottom - TREND_CHART.top;
  return TREND_CHART.top + ((100 - clampPressure(value)) / 200) * plotHeight;
}

function indexToChartX(index: number) {
  const plotWidth = TREND_CHART.right - TREND_CHART.left;
  return TREND_CHART.left + (index / (WINDOW_TIMES.length - 1)) * plotWidth;
}

function buildTrendPoints(day: EffectiveHistoryDay, pressureKey: PressureKey): Array<TrendPoint | null> {
  const windowByTime = new Map(
    day.effectiveWindows.map((window) => [window.modifierWindowStartAt.slice(11, 16), window]),
  );
  return WINDOW_TIMES.map((time, index) => {
    const window = windowByTime.get(time);
    if (!window) {
      return null;
    }
    const value = clampPressure(window[pressureKey]);
    return {
      value,
      window,
      x: indexToChartX(index),
      y: pressureToChartY(value),
    };
  });
}

function segmentTone(value: number): TrendSegment["tone"] {
  if (value > 0) {
    return "POSITIVE";
  }
  if (value < 0) {
    return "NEGATIVE";
  }
  return "NEUTRAL";
}

function buildTrendSegments(points: Array<TrendPoint | null>) {
  const segments: TrendSegment[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) {
      continue;
    }
    const crossesZero = previous.value !== 0
      && current.value !== 0
      && Math.sign(previous.value) !== Math.sign(current.value);
    if (!crossesZero) {
      segments.push({
        tone: segmentTone(previous.value === 0 ? current.value : previous.value),
        x1: previous.x,
        x2: current.x,
        y1: previous.y,
        y2: current.y,
      });
      continue;
    }
    const zeroRatio = Math.abs(previous.value) / (Math.abs(previous.value) + Math.abs(current.value));
    const zeroX = previous.x + (current.x - previous.x) * zeroRatio;
    const zeroY = pressureToChartY(0);
    segments.push({
      tone: segmentTone(previous.value),
      x1: previous.x,
      x2: zeroX,
      y1: previous.y,
      y2: zeroY,
    });
    segments.push({
      tone: segmentTone(current.value),
      x1: zeroX,
      x2: current.x,
      y1: zeroY,
      y2: current.y,
    });
  }
  return segments;
}

function createPressureTooltip(
  element: HTMLElement,
  pressureKey: PressureKey,
  tradeDate: string,
  window: EffectivePressureWindow,
  currentSimulationDateTime: string,
): PressureTooltipState {
  const bounds = element.getBoundingClientRect();
  const viewportWidth = globalThis.innerWidth || 320;
  const placement = bounds.top < 110 ? "BELOW" : "ABOVE";
  return {
    placement,
    pressureLabel: pressureLabel(pressureKey),
    status: resolveWindowStatus(window.modifierWindowStartAt, currentSimulationDateTime),
    time: window.modifierWindowStartAt.slice(11, 16),
    tradeDate,
    value: window[pressureKey],
    x: Math.min(Math.max(bounds.left + bounds.width / 2, 112), viewportWidth - 112),
    y: placement === "ABOVE" ? bounds.top - 8 : bounds.bottom + 8,
  };
}

function calculateFinal(primary: number, secondary: number) {
  return clampPressure(primary * 0.7 + secondary * 0.3);
}

function buildEffectiveWindows(day: AutoMarketRegimeHistoryDay) {
  const dailyRegimeByPhase = new Map(day.dailyRegimes.map((regime) => [regime.regimePhase, regime]));
  return day.modifiers.flatMap((modifier) => {
    const dailyRegime = dailyRegimeByPhase.get(modifier.regimePhase);
    if (!dailyRegime) {
      return [];
    }
    return [{
      modifierWindowStartAt: modifier.modifierWindowStartAt,
      pricePressure: calculateFinal(dailyRegime.pricePressure, modifier.pricePressure),
      assetPreferencePressure: calculateFinal(dailyRegime.assetPreferencePressure, modifier.assetPreferencePressure),
      volatilityPressure: calculateFinal(dailyRegime.volatilityPressure, modifier.volatilityPressure),
      liquidityPressure: calculateFinal(dailyRegime.liquidityPressure, modifier.liquidityPressure),
      executionAggressionPressure: calculateFinal(
        dailyRegime.executionAggressionPressure,
        modifier.executionAggressionPressure,
      ),
    }];
  });
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value: string) {
  const [, month, day] = value.split("-");
  return month && day ? `${month}.${day}` : value;
}

function windowControlId(tradeDate: string, windowStartAt: string) {
  return `regime-history-${tradeDate}-${windowStartAt.slice(11, 16).replace(":", "")}`;
}

function resolveWindowStatus(windowStartAt: string, currentSimulationDateTime: string): WindowApplicationStatus {
  const windowStart = Date.parse(windowStartAt);
  const currentTime = Date.parse(currentSimulationDateTime);
  if (!Number.isFinite(windowStart) || !Number.isFinite(currentTime)) {
    return "APPLIED";
  }
  if (currentTime < windowStart) {
    return "UPCOMING";
  }
  if (currentTime < windowStart + 30 * 60 * 1000) {
    return "CURRENT";
  }
  return "APPLIED";
}

function PressureTrack({ value }: { value: number }) {
  const normalized = clampPressure(value);
  return (
    <span className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
      <span
        className={`absolute top-0 h-full rounded-full ${normalized >= 0 ? "bg-[#22c55e]" : "bg-[#ef4444]"}`}
        style={normalized >= 0
          ? { left: "50%", width: `${normalized / 2}%` }
          : { left: `${50 + normalized / 2}%`, width: `${Math.abs(normalized) / 2}%` }}
      />
    </span>
  );
}

function EffectiveWindowCard({
  currentSimulationDateTime,
  selected,
  window,
}: {
  currentSimulationDateTime: string;
  selected: boolean;
  window: EffectivePressureWindow;
}) {
  const status = resolveWindowStatus(window.modifierWindowStartAt, currentSimulationDateTime);
  const statusMeta = WINDOW_STATUS_META[status];
  return (
    <article
      className={`min-w-0 rounded-md border p-3 ${selected
        ? "border-admin-accent/60 bg-admin-accent-surface/60 shadow-[inset_3px_0_0_var(--admin-accent)]"
        : "border-white/[0.08] bg-white/[0.025]"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black tabular-nums text-white">{window.modifierWindowStartAt.slice(11, 16)}</p>
        <span className={`text-[9px] font-black ${statusMeta.className}`}>{statusMeta.label}</span>
      </div>
      <div className="mt-3 space-y-2">
        {PRESSURE_FIELDS.map((field) => (
          <div className="grid grid-cols-[34px_minmax(0,1fr)_32px] items-center gap-2 text-[10px] font-bold" key={field.key}>
            <span className="text-admin-subtle">{field.label}</span>
            <PressureTrack value={window[field.key]} />
            <span className={`text-right tabular-nums ${pressureTone(window[field.key])}`}>{signed(window[field.key])}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function PressureTooltip({ tooltip }: { tooltip: PressureTooltipState | null }) {
  if (!tooltip) {
    return null;
  }
  const statusMeta = WINDOW_STATUS_META[tooltip.status];
  return createPortal(
    <div
      className={`pointer-events-none fixed z-[90] w-max max-w-56 -translate-x-1/2 rounded-md border border-white/15 bg-[#10141b]/95 px-3 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.5)] backdrop-blur ${tooltip.placement === "ABOVE" ? "-translate-y-full" : ""}`}
      role="tooltip"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      <p className="text-[10px] font-black tabular-nums text-white">{tooltip.tradeDate} · {tooltip.time}</p>
      <div className="mt-1 flex items-center justify-between gap-5">
        <span className="text-[10px] font-bold text-admin-muted">{tooltip.pressureLabel} 압력</span>
        <span className={`text-xs font-black tabular-nums ${pressureTone(tooltip.value)}`}>{signed(tooltip.value)}</span>
      </div>
      <p className={`mt-1 text-[9px] font-black ${statusMeta.className}`}>{statusMeta.label}</p>
    </div>,
    document.body,
  );
}

function SelectedWindowDetail({
  controlId,
  currentSimulationDateTime,
  onClose,
  tradeDate,
  window,
}: {
  controlId: string;
  currentSimulationDateTime: string;
  onClose: () => void;
  tradeDate: string;
  window: EffectivePressureWindow;
}) {
  const status = resolveWindowStatus(window.modifierWindowStartAt, currentSimulationDateTime);
  const statusMeta = WINDOW_STATUS_META[status];
  const time = window.modifierWindowStartAt.slice(11, 16);

  return (
    <section
      aria-label={`${tradeDate} ${time} 선택 시간 상세`}
      className="rounded-sm border border-admin-accent/30 bg-admin-accent/[0.07] p-3 shadow-[inset_3px_0_0_var(--admin-accent)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-black tabular-nums text-white">{tradeDate} · {time}</p>
          <span className={`text-[9px] font-black ${statusMeta.className}`}>{statusMeta.label}</span>
          <span className="text-[9px] font-bold text-admin-subtle">주 70% + 보조 30%</span>
        </div>
        <button
          type="button"
          aria-label={`${tradeDate} ${time} 선택 시간 상세 닫기`}
          className="min-h-8 rounded-sm border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black text-admin-muted transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          onClick={() => {
            onClose();
            globalThis.requestAnimationFrame(() => globalThis.document.getElementById(controlId)?.focus());
          }}
        >
          닫기
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {PRESSURE_FIELDS.map((field) => (
          <div className="rounded-sm bg-black/20 px-2.5 py-2" key={field.key}>
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
              <span className="text-admin-subtle">{field.label}</span>
              <span className={`font-black tabular-nums ${pressureTone(window[field.key])}`}>{signed(window[field.key])}</span>
            </div>
            <div className="mt-2 grid">
              <PressureTrack value={window[field.key]} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoryTrendChart({
  currentSimulationDateTime,
  days,
  pressureKey,
  selectedTradeDate,
  selectedWindowStartAt,
  onSelect,
}: {
  currentSimulationDateTime: string;
  days: EffectiveHistoryDay[];
  pressureKey: PressureKey;
  selectedTradeDate: string;
  selectedWindowStartAt: string | null;
  onSelect: (tradeDate: string, windowStartAt: string | null) => void;
}) {
  const [tooltip, setTooltip] = useState<PressureTooltipState | null>(null);

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-black/20">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.08] px-3 py-2 text-[9px] font-bold text-admin-muted">
        <span>-100~+100 고정축 · 가운데 선은 중립 0</span>
        <span className="hidden tabular-nums sm:inline">06:00 → 17:30</span>
      </div>
      <div className="divide-y divide-white/[0.07]">
        {days.map((day) => {
          const points = buildTrendPoints(day, pressureKey);
          const availablePoints = points.filter((point): point is TrendPoint => point !== null);
          const segments = buildTrendSegments(points);
          const selectedDay = day.simulationTradeDate === selectedTradeDate;
          const statusMeta = SOURCE_STATUS_META[day.sourceStatus];
          const values = availablePoints.map((point) => point.value);
          const average = values.length > 0
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : null;
          const minimum = values.length > 0 ? Math.min(...values) : null;
          const maximum = values.length > 0 ? Math.max(...values) : null;
          const selectedPoint = selectedDay
            ? availablePoints.find((point) => point.window.modifierWindowStartAt === selectedWindowStartAt) ?? null
            : null;
          return (
            <article
              className={`grid min-w-0 gap-2 px-2 py-3 transition md:grid-cols-[94px_minmax(0,1fr)_104px] md:items-center md:gap-3 md:px-3 ${selectedDay ? "bg-admin-accent/[0.055]" : "hover:bg-white/[0.018]"}`}
              key={day.simulationTradeDate}
            >
              <button
                type="button"
                className={`flex min-w-0 items-center justify-between rounded-sm px-2 py-1.5 text-left transition md:block ${selectedDay ? "bg-admin-accent-surface" : "hover:bg-white/[0.05]"}`}
                onClick={() => onSelect(day.simulationTradeDate, null)}
              >
                <span className="text-xs font-black tabular-nums text-white md:block">{formatShortDate(day.simulationTradeDate)}</span>
                <span className={`text-[9px] font-black md:mt-1 md:block ${statusMeta.className}`}>
                  {day.sourceStatus === "COMPLETE" ? `${day.availableWindowCount}/${day.expectedWindowCount}` : statusMeta.label}
                </span>
              </button>

              {availablePoints.length === 0 ? (
                <div className="flex h-28 items-center justify-center rounded-sm border border-dashed border-white/10 bg-white/[0.018] text-[10px] font-bold text-admin-subtle">
                  계산 가능한 기록이 없습니다.
                </div>
              ) : (
                <div>
                  <div
                    aria-label={`${day.simulationTradeDate} ${pressureLabel(pressureKey)} 압력 추이`}
                    className="relative h-28 overflow-hidden rounded-sm bg-white/[0.025]"
                    role="group"
                  >
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full"
                      preserveAspectRatio="none"
                      viewBox={`0 0 ${TREND_CHART.width} ${TREND_CHART.height}`}
                    >
                      {[50, -50].map((value) => (
                        <line
                          key={value}
                          stroke="rgb(255 255 255 / 0.055)"
                          strokeDasharray="3 5"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                          x1={TREND_CHART.left}
                          x2={TREND_CHART.right}
                          y1={pressureToChartY(value)}
                          y2={pressureToChartY(value)}
                        />
                      ))}
                      {TREND_TIME_LABELS.map(({ index }) => (
                        <line
                          key={index}
                          stroke="rgb(255 255 255 / 0.045)"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                          x1={indexToChartX(index)}
                          x2={indexToChartX(index)}
                          y1={TREND_CHART.top}
                          y2={TREND_CHART.bottom}
                        />
                      ))}
                      <line
                        stroke="rgb(255 255 255 / 0.22)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        x1={TREND_CHART.left}
                        x2={TREND_CHART.right}
                        y1={pressureToChartY(0)}
                        y2={pressureToChartY(0)}
                      />
                      {segments.map((segment, index) => (
                        <line
                          key={`${segment.x1}-${segment.x2}-${index}`}
                          stroke={segment.tone === "POSITIVE" ? "#22c55e" : segment.tone === "NEGATIVE" ? "#ef4444" : "#aab4c0"}
                          strokeLinecap="round"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                          x1={segment.x1}
                          x2={segment.x2}
                          y1={segment.y1}
                          y2={segment.y2}
                        />
                      ))}
                    </svg>
                    {selectedPoint ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-[11.5%] top-[7.7%] w-px -translate-x-1/2 bg-admin-accent/45"
                        style={{ left: `${selectedPoint.x / TREND_CHART.width * 100}%` }}
                      />
                    ) : null}
                    {availablePoints.map((point) => {
                      const selected = selectedWindowStartAt === point.window.modifierWindowStartAt;
                      const status = resolveWindowStatus(point.window.modifierWindowStartAt, currentSimulationDateTime);
                      return (
                        <button
                          type="button"
                          aria-label={`${day.simulationTradeDate} ${point.window.modifierWindowStartAt.slice(11, 16)} ${pressureLabel(pressureKey)} 압력 ${signed(point.value)}, ${WINDOW_STATUS_META[status].label}`}
                          aria-pressed={selected}
                          className="group absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
                          id={windowControlId(day.simulationTradeDate, point.window.modifierWindowStartAt)}
                          key={point.window.modifierWindowStartAt}
                          onBlur={() => setTooltip(null)}
                          onClick={() => {
                            setTooltip(null);
                            onSelect(day.simulationTradeDate, selected ? null : point.window.modifierWindowStartAt);
                          }}
                          onFocus={(event) => setTooltip(createPressureTooltip(
                            event.currentTarget,
                            pressureKey,
                            day.simulationTradeDate,
                            point.window,
                            currentSimulationDateTime,
                          ))}
                          onMouseEnter={(event) => setTooltip(createPressureTooltip(
                            event.currentTarget,
                            pressureKey,
                            day.simulationTradeDate,
                            point.window,
                            currentSimulationDateTime,
                          ))}
                          onMouseLeave={() => setTooltip(null)}
                          style={{
                            left: `${point.x / TREND_CHART.width * 100}%`,
                            top: `${point.y / TREND_CHART.height * 100}%`,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className={`block h-2 w-2 rounded-full border border-[#10141b] transition group-hover:scale-150 ${selected ? "scale-150 ring-2 ring-admin-accent ring-offset-1 ring-offset-[#10141b]" : ""}`}
                            style={{ backgroundColor: pressurePointColor(point.value) }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between px-0.5 text-[8px] font-bold tabular-nums text-admin-subtle">
                    {TREND_TIME_LABELS.map(({ index, label }) => <span key={index}>{label}</span>)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 px-2 text-[9px] font-bold md:block md:px-0 md:text-right">
                <div>
                  <span className="text-admin-subtle">일평균</span>
                  <p className={`mt-0.5 text-sm font-black tabular-nums ${average === null ? "text-admin-muted" : pressureTone(average)}`}>
                    {average === null ? "—" : signed(average)}
                  </p>
                </div>
                <div className="md:mt-2">
                  <span className="text-admin-subtle">최저 ~ 최고</span>
                  <p className="mt-0.5 text-[10px] font-black tabular-nums text-white">
                    {minimum === null || maximum === null ? "—" : `${signed(minimum)} ~ ${signed(maximum)}`}
                  </p>
                </div>
              </div>

              {selectedPoint ? (
                <div className="md:col-span-2 md:col-start-2">
                  <SelectedWindowDetail
                    controlId={windowControlId(day.simulationTradeDate, selectedPoint.window.modifierWindowStartAt)}
                    currentSimulationDateTime={currentSimulationDateTime}
                    onClose={() => onSelect(day.simulationTradeDate, null)}
                    tradeDate={day.simulationTradeDate}
                    window={selectedPoint.window}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <PressureTooltip tooltip={tooltip} />
    </div>
  );
}

function HistoryHeatmap({
  currentSimulationDateTime,
  days,
  pressureKey,
  selectedTradeDate,
  selectedWindowStartAt,
  onSelect,
}: {
  currentSimulationDateTime: string;
  days: EffectiveHistoryDay[];
  pressureKey: PressureKey;
  selectedTradeDate: string;
  selectedWindowStartAt: string | null;
  onSelect: (tradeDate: string, windowStartAt: string | null) => void;
}) {
  const [tooltip, setTooltip] = useState<PressureTooltipState | null>(null);
  const selectedHistoryDay = days.find((day) => day.simulationTradeDate === selectedTradeDate) ?? null;
  const selectedWindow = selectedHistoryDay?.effectiveWindows.find(
    (window) => window.modifierWindowStartAt === selectedWindowStartAt,
  ) ?? null;

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-white/10 bg-black/20">
        <table className="w-full min-w-[850px] border-separate border-spacing-0" aria-label="7일 시간대별 종합 압력 비교">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-28 border-b border-r border-white/10 bg-admin-canvas px-2 py-2 text-left text-[10px] font-black text-admin-muted">
              거래일
            </th>
            {WINDOW_TIMES.map((time) => (
              <th className="border-b border-white/10 px-0.5 py-2 text-center text-[9px] font-black tabular-nums text-admin-subtle" key={time}>
                <span className="block">{time.slice(0, 2)}</span>
                <span className="block text-[8px] opacity-70">{time.slice(3)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const windowByTime = new Map(day.effectiveWindows.map((window) => [window.modifierWindowStartAt.slice(11, 16), window]));
            const selectedDay = day.simulationTradeDate === selectedTradeDate;
            const statusMeta = SOURCE_STATUS_META[day.sourceStatus];
            return (
              <tr className={selectedDay ? "bg-admin-accent/[0.045]" : undefined} key={day.simulationTradeDate}>
                <th className="sticky left-0 z-10 border-r border-t border-white/[0.06] bg-admin-canvas p-1 text-left">
                  <button
                    type="button"
                    className={`w-full rounded-sm px-2 py-1.5 text-left transition ${selectedDay ? "bg-admin-accent-surface" : "hover:bg-white/[0.05]"}`}
                    onClick={() => onSelect(day.simulationTradeDate, null)}
                  >
                    <span className="block text-xs font-black tabular-nums text-white">{formatShortDate(day.simulationTradeDate)}</span>
                    <span className={`mt-0.5 block text-[8px] font-black ${statusMeta.className}`}>
                      {day.sourceStatus === "COMPLETE" ? `${day.availableWindowCount}/${day.expectedWindowCount}` : statusMeta.label}
                    </span>
                  </button>
                </th>
                {WINDOW_TIMES.map((time) => {
                  const window = windowByTime.get(time);
                  if (!window) {
                    return (
                      <td className="border-t border-white/[0.06] p-0.5" key={time}>
                        <span className="flex h-8 min-w-7 items-center justify-center rounded-sm bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.025),rgba(255,255,255,0.025)_4px,rgba(255,255,255,0.055)_4px,rgba(255,255,255,0.055)_5px)]">
                          <span className="sr-only">{day.simulationTradeDate} {time} 기록 없음</span>
                        </span>
                      </td>
                    );
                  }
                  const value = window[pressureKey];
                  const status = resolveWindowStatus(window.modifierWindowStartAt, currentSimulationDateTime);
                  const selected = selectedWindowStartAt === window.modifierWindowStartAt;
                  return (
                    <td className="border-t border-white/[0.06] p-0.5" key={time}>
                      <button
                        type="button"
                        aria-label={`${day.simulationTradeDate} ${time} ${pressureLabel(pressureKey)} 압력 ${signed(value)}, ${WINDOW_STATUS_META[status].label}`}
                        aria-pressed={selected}
                        className={`group flex h-8 w-full min-w-7 items-center justify-center rounded-sm transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-accent ${selected ? "ring-2 ring-admin-accent ring-offset-1 ring-offset-admin-canvas" : ""}`}
                        id={windowControlId(day.simulationTradeDate, window.modifierWindowStartAt)}
                        onBlur={() => setTooltip(null)}
                        onClick={() => {
                          setTooltip(null);
                          onSelect(day.simulationTradeDate, selected ? null : window.modifierWindowStartAt);
                        }}
                        onFocus={(event) => setTooltip(createPressureTooltip(
                          event.currentTarget,
                          pressureKey,
                          day.simulationTradeDate,
                          window,
                          currentSimulationDateTime,
                        ))}
                        onMouseEnter={(event) => setTooltip(createPressureTooltip(
                          event.currentTarget,
                          pressureKey,
                          day.simulationTradeDate,
                          window,
                          currentSimulationDateTime,
                        ))}
                        onMouseLeave={() => setTooltip(null)}
                        style={pressureCellStyle(value)}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full bg-white transition ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70"}`}
                        />
                        <span className="sr-only">{signed(value)}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      {selectedHistoryDay && selectedWindow ? (
        <SelectedWindowDetail
          controlId={windowControlId(selectedHistoryDay.simulationTradeDate, selectedWindow.modifierWindowStartAt)}
          currentSimulationDateTime={currentSimulationDateTime}
          onClose={() => onSelect(selectedHistoryDay.simulationTradeDate, null)}
          tradeDate={selectedHistoryDay.simulationTradeDate}
          window={selectedWindow}
        />
      ) : null}
      <PressureTooltip tooltip={tooltip} />
    </>
  );
}

export function AdminAutoMarketRegimeHistory({
  accessToken,
  currentTradeDate,
  symbol,
}: {
  accessToken: string | null;
  currentTradeDate?: string | null;
  symbol: string;
}) {
  const [rangeEndDate, setRangeEndDate] = useState(currentTradeDate ?? "");
  const [selectedTradeDate, setSelectedTradeDate] = useState(currentTradeDate ?? "");
  const [selectedWindowStartAt, setSelectedWindowStartAt] = useState<string | null>(null);
  const [pressureKey, setPressureKey] = useState<PressureKey>("pricePressure");
  const [comparisonView, setComparisonView] = useState<ComparisonView>("TREND");
  const [fullDayDetailsOpen, setFullDayDetailsOpen] = useState(false);
  const historyQuery = useQuery(autoMarketRegimeHistoryRangeQueryOptions(accessToken, symbol, {
    enabled: true,
    endDate: rangeEndDate || undefined,
  }));
  const history = historyQuery.data;
  const days = useMemo<EffectiveHistoryDay[]>(() => (history?.days ?? [])
    .map((day) => ({
      ...day,
      effectiveWindows: buildEffectiveWindows(day),
    }))
    .sort((left, right) => right.simulationTradeDate.localeCompare(left.simulationTradeDate)), [history]);
  const displayedRangeEndDate = rangeEndDate || history?.rangeEndDate || currentTradeDate || "";
  const currentSimulationTradeDate = history?.currentSimulationDateTime.slice(0, 10) || currentTradeDate || "";
  const rangeIsChanging = Boolean(
    historyQuery.isPlaceholderData
      && history
      && displayedRangeEndDate
      && history.rangeEndDate !== displayedRangeEndDate,
  );
  const displayedRangeStartDate = displayedRangeEndDate
    ? history && !rangeIsChanging && history.rangeEndDate === displayedRangeEndDate
      ? history.rangeStartDate
      : shiftDate(displayedRangeEndDate, -6)
    : "";
  const visibleSelectedTradeDate = days.some((day) => day.simulationTradeDate === selectedTradeDate)
    ? selectedTradeDate
    : history?.rangeEndDate ?? selectedTradeDate;
  const selectedDay = days.find((day) => day.simulationTradeDate === visibleSelectedTradeDate) ?? null;
  const canMoveForward = Boolean(
    displayedRangeEndDate
      && currentSimulationTradeDate
      && displayedRangeEndDate < currentSimulationTradeDate,
  );

  function moveRange(daysToShift: number) {
    if (!displayedRangeEndDate) {
      return;
    }
    const shiftedDate = shiftDate(displayedRangeEndDate, daysToShift);
    const nextEndDate = currentSimulationTradeDate && shiftedDate > currentSimulationTradeDate
      ? currentSimulationTradeDate
      : shiftedDate;
    setRangeEndDate(nextEndDate);
    setSelectedTradeDate(nextEndDate);
    setSelectedWindowStartAt(null);
    setFullDayDetailsOpen(false);
  }

  function selectWindow(tradeDate: string, windowStartAt: string | null) {
    if (tradeDate !== selectedTradeDate) {
      setFullDayDetailsOpen(false);
    }
    setSelectedTradeDate(tradeDate);
    setSelectedWindowStartAt(windowStartAt);
  }

  return (
    <div className="mt-4 rounded-md border border-admin-accent/20 bg-admin-canvas/60 p-3 sm:p-4">
      <header>
        <p className="text-sm font-black text-white">7일 종합 압력 기록</p>
        <p className="mt-1 max-w-3xl text-[11px] font-bold leading-5 text-stock-subtle">
          7일 범위의 30분 단위 종합 압력을 비교하고, 선택한 날짜의 적용 완료·현재 적용·적용 예정 값을 확인합니다.
        </p>
      </header>

      <div className="mt-4 grid min-w-0 gap-3 rounded-md border border-white/[0.08] bg-black/20 p-3 lg:grid-cols-[minmax(190px,240px)_minmax(220px,1fr)_minmax(160px,auto)] lg:items-start">
        <label className="grid min-w-0 gap-1 text-xs font-bold text-admin-muted">
          조회 종료일
          <input
            aria-describedby="regime-history-visible-range"
            className="admin-control h-11 w-full min-w-0 px-3 text-sm font-black tabular-nums text-white outline-none"
            max={currentSimulationTradeDate || undefined}
            onChange={(event) => {
              setRangeEndDate(event.target.value);
              setSelectedTradeDate(event.target.value);
              setSelectedWindowStartAt(null);
              setFullDayDetailsOpen(false);
            }}
            type="date"
            value={displayedRangeEndDate}
          />
          <span className="text-[10px] font-bold tabular-nums text-admin-placeholder" id="regime-history-visible-range">
            조회 범위 {displayedRangeStartDate && displayedRangeEndDate ? `${displayedRangeStartDate} ~ ${displayedRangeEndDate}` : "선택 필요"}
          </span>
        </label>

        <fieldset className="min-w-0">
          <legend className="mb-1 text-xs font-bold text-admin-muted">7일 단위 이동</legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-11 rounded-md bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15 disabled:opacity-40"
              disabled={!displayedRangeEndDate}
              onClick={() => moveRange(-7)}
            >
              이전 7일
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15 disabled:opacity-40"
              disabled={!canMoveForward}
              onClick={() => moveRange(7)}
            >
              다음 7일
            </button>
          </div>
        </fieldset>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold text-admin-muted">최신 범위</p>
          <button
            type="button"
            className="min-h-11 w-full rounded-md bg-admin-accent/15 px-3 text-xs font-black text-admin-accent-label transition hover:bg-admin-accent/20 disabled:opacity-40"
            disabled={!currentSimulationTradeDate || displayedRangeEndDate === currentSimulationTradeDate}
            onClick={() => {
              setRangeEndDate(currentSimulationTradeDate);
              setSelectedTradeDate(currentSimulationTradeDate);
              setSelectedWindowStartAt(null);
              setFullDayDetailsOpen(false);
            }}
          >
            최근 7일로 이동
          </button>
        </div>
      </div>

      {historyQuery.isFetching ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-stock-subtle">
          선택한 7일 기록을 조회하는 중입니다.
        </div>
      ) : null}
      {historyQuery.isError ? (
        <div className="mt-4 rounded-md border border-admin-danger/30 bg-admin-danger-surface px-3 py-4 text-xs font-bold text-admin-danger">
          {getStockErrorMessage(historyQuery.error, "7일 종합 압력을 조회하지 못했습니다.")}
        </div>
      ) : null}

      {history && !historyQuery.isError && !rangeIsChanging ? (
        <div className="mt-4 space-y-4">
          <section aria-labelledby="regime-history-comparison-title">
            <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h3 className="text-xs font-black text-white" id="regime-history-comparison-title">7일 비교</h3>
                <p className="mt-1 text-[10px] font-bold text-admin-muted">
                  {comparisonView === "TREND"
                    ? "동일한 축에서 날짜별 흐름을 비교하고 점을 누르면 상세값을 선택합니다."
                    : "색은 방향과 강도를 나타내며 정확한 값은 마우스나 키보드 포커스로 확인합니다."}
                </p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="grid grid-cols-2 gap-1 rounded-md bg-black/20 p-1" role="group" aria-label="비교 보기 방식">
                  <button
                    type="button"
                    aria-pressed={comparisonView === "TREND"}
                    className={`min-h-8 rounded-sm px-3 text-[10px] font-black transition ${comparisonView === "TREND"
                      ? "bg-admin-accent text-admin-canvas"
                      : "text-admin-muted hover:bg-white/[0.06] hover:text-white"}`}
                    onClick={() => setComparisonView("TREND")}
                  >
                    추이 그래프
                  </button>
                  <button
                    type="button"
                    aria-pressed={comparisonView === "HEATMAP"}
                    className={`min-h-8 rounded-sm px-3 text-[10px] font-black transition ${comparisonView === "HEATMAP"
                      ? "bg-admin-accent text-admin-canvas"
                      : "text-admin-muted hover:bg-white/[0.06] hover:text-white"}`}
                    onClick={() => setComparisonView("HEATMAP")}
                  >
                    히트맵
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1 rounded-md bg-black/20 p-1" role="group" aria-label="비교할 압력 지표">
                  {PRESSURE_FIELDS.map((field) => (
                    <button
                      type="button"
                      aria-pressed={pressureKey === field.key}
                      className={`min-h-8 rounded-sm px-2 text-[10px] font-black transition ${pressureKey === field.key
                        ? "bg-white/15 text-white"
                        : "text-admin-muted hover:bg-white/[0.06] hover:text-white"}`}
                      key={field.key}
                      onClick={() => setPressureKey(field.key)}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3">
              {comparisonView === "TREND" ? (
                <HistoryTrendChart
                  currentSimulationDateTime={history.currentSimulationDateTime}
                  days={days}
                  onSelect={selectWindow}
                  pressureKey={pressureKey}
                  selectedTradeDate={visibleSelectedTradeDate}
                  selectedWindowStartAt={selectedWindowStartAt}
                />
              ) : (
                <HistoryHeatmap
                  currentSimulationDateTime={history.currentSimulationDateTime}
                  days={days}
                  onSelect={selectWindow}
                  pressureKey={pressureKey}
                  selectedTradeDate={visibleSelectedTradeDate}
                  selectedWindowStartAt={selectedWindowStartAt}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-bold text-admin-muted">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#ef4444]" />음수 압력</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-white/15" />중립</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#22c55e]" />양수 압력</span>
              <span>{comparisonView === "TREND"
                ? "누락 구간은 선을 연결하지 않습니다."
                : "색이 진할수록 절댓값이 크며, 정확한 값은 툴팁으로 확인합니다."}</span>
            </div>
          </section>

          <section aria-labelledby="regime-history-full-day-title" className="border-t border-white/[0.08] pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-black text-white" id="regime-history-full-day-title">
                    {visibleSelectedTradeDate || history.rangeEndDate} 전체 24구간
                  </h3>
                  {selectedDay ? (
                    <>
                      <span className="rounded-sm border border-admin-accent/25 bg-admin-accent/10 px-2 py-1 text-[9px] font-black text-admin-accent-label">
                        주 랜덤 {selectedDay.dailyApplicationCount}회
                      </span>
                      <span className={`rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black ${SOURCE_STATUS_META[selectedDay.sourceStatus].className}`}>
                        {selectedDay.availableWindowCount}/{selectedDay.expectedWindowCount} 구간
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] font-bold text-admin-muted">
                  선택한 한 구간은 그래프 행에서 바로 확인하고, 하루 전체 값이 필요할 때만 목록을 펼칩니다.
                </p>
              </div>
              <button
                type="button"
                aria-controls="regime-history-full-day-content"
                aria-expanded={fullDayDetailsOpen}
                className="min-h-10 shrink-0 rounded-sm border border-white/10 bg-white/[0.05] px-4 text-[10px] font-black text-white transition hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedDay || selectedDay.effectiveWindows.length === 0}
                onClick={() => setFullDayDetailsOpen((open) => !open)}
              >
                {fullDayDetailsOpen ? "전체 상세 닫기" : "전체 24구간 보기"}
              </button>
            </div>

            {fullDayDetailsOpen ? (
              <div id="regime-history-full-day-content">
                {!selectedDay || selectedDay.effectiveWindows.length === 0 ? (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-4 text-xs font-bold text-stock-subtle">
                    {visibleSelectedTradeDate || history.rangeEndDate}에 계산 가능한 종합 압력 기록이 없습니다.
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {selectedDay.effectiveWindows.map((window) => (
                      <EffectiveWindowCard
                        currentSimulationDateTime={history.currentSimulationDateTime}
                        key={window.modifierWindowStartAt}
                        selected={selectedWindowStartAt === window.modifierWindowStartAt}
                        window={window}
                      />
                    ))}
                  </div>
                )}
                {selectedDay && selectedDay.availableWindowCount > selectedDay.effectiveWindows.length ? (
                  <p className="mt-3 rounded-md border border-admin-warning/25 bg-admin-warning/10 px-3 py-2 text-[10px] font-bold text-admin-warning-soft">
                    종합 계산에 필요한 주 랜덤값이 누락된 {selectedDay.availableWindowCount - selectedDay.effectiveWindows.length}개 시간대는 상세에서 제외했습니다.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
