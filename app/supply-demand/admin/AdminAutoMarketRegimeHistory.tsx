"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { autoMarketRegimeHistoryQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import type { AutoMarketDistributionBias } from "@/app/types/stock";

type PressureKey = keyof AutoMarketDistributionBias;
type EffectivePressureWindow = AutoMarketDistributionBias & {
  modifierWindowStartAt: string;
};

const PRESSURE_FIELDS: Array<{ key: PressureKey; label: string }> = [
  { key: "pricePressure", label: "가격" },
  { key: "assetPreferencePressure", label: "자산" },
  { key: "volatilityPressure", label: "변동" },
  { key: "liquidityPressure", label: "유동" },
  { key: "executionAggressionPressure", label: "공격" },
];

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

function calculateFinal(primary: number, secondary: number) {
  return clampPressure(primary * 0.7 + secondary * 0.3);
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

function EffectiveWindowCard({ window }: { window: EffectivePressureWindow }) {
  return (
    <article className="min-w-0 rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black tabular-nums text-white">{window.modifierWindowStartAt.slice(11, 16)}</p>
        <span className="text-[9px] font-black text-admin-accent-label">30분 적용</span>
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

export function AdminAutoMarketRegimeHistory({
  accessToken,
  currentTradeDate,
  symbol,
}: {
  accessToken: string | null;
  currentTradeDate?: string | null;
  symbol: string;
}) {
  const [selectedTradeDate, setSelectedTradeDate] = useState(currentTradeDate ?? "");
  const historyQuery = useQuery(autoMarketRegimeHistoryQueryOptions(accessToken, symbol, {
    enabled: true,
    tradeDate: selectedTradeDate || undefined,
  }));
  const history = historyQuery.data;
  const displayedTradeDate = selectedTradeDate || history?.simulationTradeDate || currentTradeDate || "";
  const currentSimulationTradeDate = history?.currentSimulationTradeDate || currentTradeDate || "";
  const effectiveWindows = useMemo<EffectivePressureWindow[]>(() => {
    if (!history) {
      return [];
    }
    const dailyRegimeByPhase = new Map(history.dailyRegimes.map((regime) => [regime.regimePhase, regime]));
    return history.modifiers.flatMap((modifier) => {
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
  }, [history]);
  const omittedWindowCount = history ? history.modifiers.length - effectiveWindows.length : 0;
  const canMoveForward = Boolean(
    displayedTradeDate
      && currentSimulationTradeDate
      && displayedTradeDate < currentSimulationTradeDate,
  );

  return (
    <div className="mt-4 rounded-md border border-admin-accent/20 bg-admin-canvas/60 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-white">시간대별 종합 압력</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-stock-subtle">
            선택한 시뮬레이션 거래일에 주문 생성에 실제 적용된 압력을 30분 단위로 확인합니다.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(190px,240px)_auto]">
          <label className="grid min-w-0 gap-1 text-xs font-bold text-admin-muted">
            시뮬레이션 거래일
            <input
              className="admin-control h-11 w-full min-w-0 px-3 text-sm font-black tabular-nums text-white outline-none"
              max={currentSimulationTradeDate || undefined}
              onChange={(event) => setSelectedTradeDate(event.target.value)}
              type="date"
              value={displayedTradeDate}
            />
          </label>
          <div className="grid grid-cols-3 gap-1.5 self-end">
            <button
              type="button"
              className="min-h-11 rounded-md bg-white/10 px-3 text-xs font-black text-white disabled:opacity-40"
              disabled={!displayedTradeDate}
              onClick={() => setSelectedTradeDate(shiftDate(displayedTradeDate, -1))}
            >
              이전일
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-admin-accent/15 px-3 text-xs font-black text-admin-accent-label disabled:opacity-40"
              disabled={!currentSimulationTradeDate || displayedTradeDate === currentSimulationTradeDate}
              onClick={() => setSelectedTradeDate(currentSimulationTradeDate)}
            >
              현재일
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-white/10 px-3 text-xs font-black text-white disabled:opacity-40"
              disabled={!canMoveForward}
              onClick={() => setSelectedTradeDate(shiftDate(displayedTradeDate, 1))}
            >
              다음일
            </button>
          </div>
        </div>
      </div>

      {historyQuery.isFetching ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-4 text-xs font-bold text-stock-subtle">
          {displayedTradeDate || "현재 거래일"} 기록을 조회하는 중입니다.
        </div>
      ) : null}
      {historyQuery.isError ? (
        <div className="mt-4 rounded-md border border-admin-danger/30 bg-admin-danger-surface px-3 py-4 text-xs font-bold text-admin-danger">
          {getStockErrorMessage(historyQuery.error, "시간대별 종합 압력을 조회하지 못했습니다.")}
        </div>
      ) : null}
      {history && !historyQuery.isFetching && !historyQuery.isError ? (
        effectiveWindows.length === 0 ? (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-4 text-xs font-bold text-stock-subtle">
            {history.simulationTradeDate}에 실제 적용된 시간대별 종합 압력 기록이 없습니다.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-stock-muted">
              <span className="rounded-full border border-admin-accent/25 bg-admin-accent/10 px-2.5 py-1 text-admin-accent-label">
                {history.simulationTradeDate}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-stock-muted">
                총 {effectiveWindows.length}개 시간대
              </span>
            </div>
            <section aria-label={`${history.simulationTradeDate} 시간대별 종합 압력`}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {effectiveWindows.map((window) => (
                  <EffectiveWindowCard key={window.modifierWindowStartAt} window={window} />
                ))}
              </div>
            </section>
            {omittedWindowCount > 0 ? (
              <p className="rounded-md border border-admin-warning/25 bg-admin-warning/10 px-3 py-2 text-[10px] font-bold text-admin-warning-soft">
                종합 계산에 필요한 기준값이 누락된 {omittedWindowCount}개 시간대는 표시에서 제외했습니다.
              </p>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
