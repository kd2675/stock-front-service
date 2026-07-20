"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { autoMarketRegimeHistoryQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import type {
  AutoMarketDistributionBias,
  AutoMarketRegimeHistoryDailyRegime,
  AutoMarketRegimeHistoryModifier,
  AutoMarketRegimePhase,
} from "@/app/types/stock";

type PressureKey = keyof AutoMarketDistributionBias;

const PRESSURE_FIELDS: Array<{ key: PressureKey; label: string }> = [
  { key: "pricePressure", label: "가격" },
  { key: "assetPreferencePressure", label: "자산" },
  { key: "volatilityPressure", label: "변동" },
  { key: "liquidityPressure", label: "유동" },
  { key: "executionAggressionPressure", label: "공격" },
];

const PHASE_LABELS: Record<AutoMarketRegimePhase, string> = {
  SLOT_0600: "06:00",
  SLOT_0900: "09:00",
  SLOT_1200: "12:00",
  SLOT_1500: "15:00",
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

function shortSeed(seed: string) {
  return seed.length > 8 ? `…${seed.slice(-8)}` : seed;
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

function DailyRegimeCard({ regime }: { regime: AutoMarketRegimeHistoryDailyRegime }) {
  const isNew = regime.regimePhase === regime.sourceRegimePhase;
  return (
    <article className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-white">{PHASE_LABELS[regime.regimePhase]}</p>
          <p className="mt-0.5 text-[10px] font-bold text-admin-subtle">
            {isNew ? "주 신규 생성" : `${PHASE_LABELS[regime.sourceRegimePhase]} 값 유지`}
          </p>
        </div>
        <span className="rounded-full border border-admin-accent/20 bg-admin-accent/10 px-2 py-1 text-[10px] font-black text-admin-accent-label">
          주 70%
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {PRESSURE_FIELDS.map((field) => (
          <div className="grid grid-cols-[34px_minmax(0,1fr)_32px] items-center gap-2 text-[10px] font-bold" key={field.key}>
            <span className="text-admin-subtle">{field.label}</span>
            <PressureTrack value={regime[field.key]} />
            <span className={`text-right tabular-nums ${pressureTone(regime[field.key])}`}>{signed(regime[field.key])}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 truncate border-t border-white/[0.07] pt-2 text-[9px] font-bold tabular-nums text-admin-disabled" title={regime.seed}>
        seed {shortSeed(regime.seed)}
      </p>
    </article>
  );
}

function ModifierCard({
  modifier,
  primary,
}: {
  modifier: AutoMarketRegimeHistoryModifier;
  primary?: AutoMarketRegimeHistoryDailyRegime;
}) {
  return (
    <article className="min-w-0 rounded-md border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black text-white">{modifier.modifierWindowStartAt.slice(11, 16)}</p>
          <p className="mt-0.5 text-[9px] font-bold text-admin-subtle">주 {PHASE_LABELS[modifier.regimePhase]}</p>
        </div>
        <span className="text-[9px] font-black text-admin-accent-label">보조 30% → 최종</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {PRESSURE_FIELDS.map((field) => {
          const secondaryValue = modifier[field.key];
          const finalValue = calculateFinal(primary?.[field.key] ?? 0, secondaryValue);
          return (
            <div className="grid grid-cols-[32px_1fr_1fr] items-center gap-1 text-[9px] font-bold" key={field.key}>
              <span className="text-admin-subtle">{field.label}</span>
              <span className={`text-right tabular-nums ${pressureTone(secondaryValue)}`}>보조 {signed(secondaryValue)}</span>
              <span className={`text-right tabular-nums ${pressureTone(finalValue)}`}>최종 {signed(finalValue)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 truncate border-t border-white/[0.06] pt-1.5 text-[8px] font-bold tabular-nums text-admin-disabled" title={modifier.seed}>
        seed {shortSeed(modifier.seed)}
      </p>
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
  const dailyRegimeByPhase = useMemo(() => new Map(
    (history?.dailyRegimes ?? []).map((regime) => [regime.regimePhase, regime]),
  ), [history?.dailyRegimes]);
  const canMoveForward = Boolean(
    displayedTradeDate
      && currentSimulationTradeDate
      && displayedTradeDate < currentSimulationTradeDate,
  );

  return (
    <div className="mt-4 rounded-md border border-admin-accent/20 bg-admin-canvas/60 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black text-white">랜덤 압력 기록</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-stock-subtle">
            저장된 주 슬롯과 30분 보조값을 조회합니다. 최종값은 당시 적용식인 주 70% + 보조 30%로 다시 계산합니다.
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
              이전
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-admin-accent/15 px-3 text-xs font-black text-admin-accent-label disabled:opacity-40"
              disabled={!currentSimulationTradeDate || displayedTradeDate === currentSimulationTradeDate}
              onClick={() => setSelectedTradeDate(currentSimulationTradeDate)}
            >
              현재
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-white/10 px-3 text-xs font-black text-white disabled:opacity-40"
              disabled={!canMoveForward}
              onClick={() => setSelectedTradeDate(shiftDate(displayedTradeDate, 1))}
            >
              다음
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
          {getStockErrorMessage(historyQuery.error, "랜덤 압력 기록을 조회하지 못했습니다.")}
        </div>
      ) : null}
      {history && !historyQuery.isFetching && !historyQuery.isError ? (
        history.dailyRegimes.length === 0 && history.modifiers.length === 0 ? (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-4 text-xs font-bold text-stock-subtle">
            {history.simulationTradeDate}에 저장된 랜덤 압력 기록이 없습니다.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
              <span className="rounded-full border border-admin-accent/25 bg-admin-accent/10 px-2.5 py-1 text-admin-accent-label">
                주 신규 {history.dailyApplicationCount}회
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-stock-muted">
                슬롯 {history.preparedRegimeSlotCount}/4
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-stock-muted">
                보조 {history.modifiers.length}개
              </span>
            </div>
            <section>
              <h3 className="text-[11px] font-black text-admin-subtle">주 랜덤 슬롯</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {history.dailyRegimes.map((regime) => <DailyRegimeCard key={regime.regimePhase} regime={regime} />)}
              </div>
            </section>
            <section>
              <h3 className="text-[11px] font-black text-admin-subtle">30분 보조 랜덤과 최종 적용값</h3>
              {history.modifiers.length > 0 ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {history.modifiers.map((modifier) => (
                    <ModifierCard
                      key={modifier.modifierWindowStartAt}
                      modifier={modifier}
                      primary={dailyRegimeByPhase.get(modifier.regimePhase)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-2 rounded-md border border-white/10 bg-black/20 px-3 py-4 text-xs font-bold text-stock-subtle">
                  이 거래일에는 보조 랜덤 기록이 없습니다.
                </div>
              )}
            </section>
          </div>
        )
      ) : null}
    </div>
  );
}
