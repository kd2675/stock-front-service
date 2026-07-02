"use client";

import { useQuery } from "@tanstack/react-query";

import { createSimulationTimeSnapshot, type SimulationTimeSnapshot } from "@/app/lib/simulationTime";
import { simulationClockQueryOptions } from "@/app/lib/react-query/stockMarketQueries";

export default function SimulationTimeBadge() {
  const { data: clock } = useQuery(simulationClockQueryOptions());
  const snapshot: SimulationTimeSnapshot | null = clock ? createSimulationTimeSnapshot(clock) : null;

  return (
    <aside
      aria-label="시뮬레이션 시간"
      className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] rounded-md border border-[#d1d6db] bg-white/92 px-3 py-2 text-[#191f28] shadow-[0_10px_30px_rgba(25,31,40,0.12)] backdrop-blur"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] font-black tracking-[0.18em] text-[#3182f6]">SIM TIME</span>
        <span className="font-mono text-sm font-black tabular-nums">{snapshot?.simulationTime ?? "--:--:--"}</span>
        <span className="text-xs font-bold text-[#6b7684]">{snapshot?.simulationDayLabel ?? "동기화 중"}</span>
        <span className="text-xs font-black text-[#4e5968]">{snapshot?.statusLabel ?? "확인 중"}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-bold leading-4 text-[#8b95a1]">
        {snapshot ? snapshot.ruleLabel : "서버 기준 시뮬레이션 시간을 조회하고 있습니다."}
      </p>
    </aside>
  );
}
