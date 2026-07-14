"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { simulationClockQueryOptions } from "@/app/lib/react-query/stockMarketQueries";
import { createSimulationTimeSnapshot, type SimulationTimeSnapshot } from "@/app/lib/simulationTime";

export default function SimulationTimeBadge() {
  const { data: clock } = useQuery(simulationClockQueryOptions());
  const [expanded, setExpanded] = useState(false);
  const snapshot: SimulationTimeSnapshot | null = clock ? createSimulationTimeSnapshot(clock) : null;

  if (!expanded) {
    return (
      <aside
        id="simulation-time-details"
        aria-label="시뮬레이션 시간"
        className="simulation-time-badge fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 transition-[opacity,transform] sm:bottom-4 sm:right-4"
      >
        <button
          type="button"
          aria-expanded="false"
          aria-controls="simulation-time-details"
          aria-label="시뮬레이션 시간 열기"
          onClick={() => setExpanded(true)}
          className="grid size-12 place-items-center rounded-lg border border-white/10 bg-stock-ink text-white shadow-[var(--shadow-float)] hover:bg-stock-text-secondary"
        >
          <span className="grid gap-0.5 text-center text-[9px] font-black leading-none tracking-[0.12em]">
            <span>SIM</span>
            <span>TIME</span>
          </span>
          <span className="sr-only">{snapshot?.simulationTime ?? "동기화 중"}</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      id="simulation-time-details"
      aria-label="시뮬레이션 시간"
      className="simulation-time-badge fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 w-[min(calc(100vw-1.5rem),320px)] rounded-lg border border-stock-border-strong bg-white/95 p-3 text-stock-ink shadow-[var(--shadow-float)] backdrop-blur transition-[opacity,transform] sm:bottom-4 sm:right-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.12em] text-stock-accent">SIM TIME</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-base font-black tabular-nums">{snapshot?.simulationTime ?? "--:--:--"}</span>
            <span className="text-xs font-bold text-stock-muted">{snapshot?.simulationDayLabel ?? "동기화 중"}</span>
            <span className="text-xs font-black text-stock-text-tertiary">{snapshot?.statusLabel ?? "확인 중"}</span>
          </div>
        </div>
        <button
          type="button"
          aria-expanded="true"
          aria-controls="simulation-time-details"
          aria-label="시뮬레이션 시간 닫기"
          onClick={() => setExpanded(false)}
          className="grid size-9 shrink-0 place-items-center rounded-md bg-stock-surface-strong text-sm font-black text-stock-text-secondary hover:bg-stock-border"
        >
          ×
        </button>
      </div>
      <p className="mt-2 border-t border-stock-divider pt-2 text-[11px] font-bold leading-4 text-stock-subtle">
        {snapshot ? snapshot.ruleLabel : "서버 기준 시뮬레이션 시간을 조회하고 있습니다."}
      </p>
    </aside>
  );
}

export function SimulationTimeInline({ inverse = false }: { inverse?: boolean }) {
  const { data: clock } = useQuery(simulationClockQueryOptions());
  const snapshot: SimulationTimeSnapshot | null = clock ? createSimulationTimeSnapshot(clock) : null;

  return (
    <div
      role="status"
      aria-label="시뮬레이션 시간"
      title={snapshot?.ruleLabel ?? "서버 기준 시뮬레이션 시간을 조회하고 있습니다."}
      className={[
        "simulation-time-inline flex min-h-9 min-w-0 items-center gap-2 text-xs font-bold",
        inverse ? "text-admin-muted" : "text-stock-muted",
      ].join(" ")}
    >
      <span className={inverse ? "shrink-0 text-[9px] font-black tracking-[0.12em] text-admin-accent" : "shrink-0 text-[9px] font-black tracking-[0.12em] text-stock-accent"}>SIM TIME</span>
      <span className={inverse ? "shrink-0 font-mono text-sm font-black tabular-nums text-white" : "shrink-0 font-mono text-sm font-black tabular-nums text-stock-ink"}>
        {snapshot?.simulationTime ?? "--:--:--"}
      </span>
      <span className="hidden min-w-0 truncate sm:inline">{snapshot?.simulationDayLabel ?? "동기화 중"}</span>
      <span className={inverse ? "shrink-0 text-admin-accent-soft" : "shrink-0 text-stock-text-secondary"}>{snapshot?.statusLabel ?? "확인 중"}</span>
      <span className="hidden min-w-0 truncate xl:inline">· {snapshot?.ruleLabel ?? "시간 규칙 확인 중"}</span>
    </div>
  );
}
