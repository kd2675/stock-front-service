import { createSimulationTimeSnapshot } from "@/app/lib/simulationTime";
import type { SimulationClock, SimulationClockJumpAction } from "@/app/types/stock";

type SimulationSession = SimulationClock["marketSession"];

type SimulationClockAction = {
  action: SimulationClockJumpAction;
  step: number;
  label: string;
  boundary: "close" | "midnight" | "transform" | "autoMarket" | "open";
  unlocks: string;
};

const SAFE_CLOCK_ACTIONS: SimulationClockAction[] = [
  {
    action: "TODAY_MARKET_CLOSE",
    step: 1,
    label: "장마감 처리 열기",
    boundary: "close",
    unlocks: "거래 차단·배출 → 원장 동결 → 포트폴리오 정산",
  },
  {
    action: "NEXT_SIMULATION_DAY_START",
    step: 2,
    label: "야간 처리 열기",
    boundary: "midnight",
    unlocks: "야간 현금흐름 → 기업행사 현금 → 보고서 집계",
  },
  {
    action: "NEXT_PREOPEN_TRANSFORM_START",
    step: 3,
    label: "개장 기반 준비 열기",
    boundary: "transform",
    unlocks: "증권 변환 → 시장 데이터 준비",
  },
  {
    action: "NEXT_AUTO_MARKET_PREPARATION_START",
    step: 4,
    label: "자동장·검증 열기",
    boundary: "autoMarket",
    unlocks: "자동장 준비 → 개장 readiness",
  },
  {
    action: "NEXT_MARKET_OPEN",
    step: 5,
    label: "다음 장 열기",
    boundary: "open",
    unlocks: "시장 OPEN → EOD cycle 완료",
  },
];

export function AdminSimulationClockControlPanel({
  clock,
  jumpingAction,
  onJump,
}: {
  clock: SimulationClock | null;
  jumpingAction: SimulationClockJumpAction | null;
  onJump: (action: SimulationClockJumpAction) => void;
}) {
  const snapshot = clock ? createSimulationTimeSnapshot(clock) : null;
  const session = clock?.marketSession ?? null;
  const sessionLabel = session ? formatSimulationSession(session) : "조회 중";
  const openTimeLabel = formatClockBoundaryTime(clock?.marketOpenTime);
  const closeTimeLabel = formatClockBoundaryTime(clock?.marketCloseTime);
  const transformTimeLabel = formatClockBoundaryTime(clock?.preOpenTransformTime);
  const autoMarketTimeLabel = formatClockBoundaryTime(clock?.autoMarketPreparationTime);
  const settlementReady = Boolean(clock?.postCloseProcessingCompleted);
  const marketOpenReady = Boolean(clock?.marketOpenReady);
  const availableJumpActions = new Set(clock?.availableJumpActions ?? []);
  const readiness = resolveReadinessLabel(
    clock,
    session,
    settlementReady,
    marketOpenReady,
  );

  return (
    <section className="admin-panel mt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">시뮬레이션 경계 이동</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            각 버튼은 시계만 다음 작업 시간대로 이동합니다. 바로 앞 phase 묶음이 끝나야 다음 경계가 열리며,
            coordinator의 처리 순서와 재시도 정책은 건너뛰지 않습니다.
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-[11px] font-black text-stock-subtle">현재 세션</p>
          <p className="mt-1 text-sm font-black text-white">{sessionLabel}</p>
          {readiness ? (
            <p className={["mt-1 text-[11px] font-black", readiness.ready ? "text-admin-success" : "text-admin-warning-soft"].join(" ")}>
              {readiness.label}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.8fr)]">
        <div className="grid min-w-0 grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/20 p-3 sm:grid-cols-3 xl:grid-cols-2">
          <ClockMetric label="원시 일자" value={snapshot?.simulationDayLabel ?? "-"} />
          <ClockMetric label="원시 시간" value={snapshot?.simulationTime ?? "--:--:--"} />
          <ClockMetric label="활성 거래일" value={clock?.activeBusinessDate ?? "-"} />
          <ClockMetric label="다음 준비 거래일" value={clock?.preparingBusinessDate ?? "-"} />
          <ClockMetric label="진행" value={snapshot?.statusLabel ?? "확인 중"} />
          <ClockMetric label="EOD 기준 단계" value={formatPostClosePhase(clock?.postClosePhase)} />
        </div>

        <ol className="overflow-hidden rounded-md border border-white/10 bg-black/20">
          {SAFE_CLOCK_ACTIONS.map((item) => {
            const enabled = availableJumpActions.has(item.action);
            const availabilityLabel = resolveActionAvailabilityLabel(
              item.action,
              enabled,
              clock,
              session,
              settlementReady,
              marketOpenReady,
            );
            const pending = jumpingAction === item.action;
            const boundaryLabel = resolveBoundaryLabel(
              item.boundary,
              openTimeLabel,
              closeTimeLabel,
              transformTimeLabel,
              autoMarketTimeLabel,
            );
            return (
              <li
                key={item.action}
                className={[
                  "grid min-w-0 gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center",
                  enabled ? "bg-admin-accent-surface/70" : "bg-white/[0.02]",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-black",
                    enabled
                      ? "border-admin-accent/50 bg-admin-accent/15 text-admin-accent-soft"
                      : "border-white/15 text-admin-subtle",
                  ].join(" ")}
                >
                  {item.step}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="text-[11px] font-black text-admin-accent-soft">{boundaryLabel}</p>
                  </div>
                  <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">{item.unlocks}</p>
                  <p className={[
                    "mt-1 text-[11px] font-black",
                    enabled ? "text-admin-accent-soft" : "text-admin-muted",
                  ].join(" ")}
                  >
                    {availabilityLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onJump(item.action)}
                  disabled={!enabled || Boolean(jumpingAction)}
                  className={[
                    "min-h-10 min-w-28 rounded-md border px-3 text-xs font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent",
                    enabled
                      ? "border-admin-accent/50 bg-admin-accent text-admin-canvas hover:bg-admin-accent-soft"
                      : "cursor-not-allowed border-white/10 bg-white/[0.04] text-admin-disabled",
                    jumpingAction ? "cursor-wait" : "",
                  ].join(" ")}
                >
                  {pending ? "이동 중" : enabled ? `${boundaryLabel} 이동` : "대기"}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function resolveActionAvailabilityLabel(
  action: SimulationClockJumpAction,
  enabled: boolean,
  clock: SimulationClock | null,
  session: SimulationSession | null,
  settlementReady: boolean,
  marketOpenReady: boolean,
) {
  if (enabled) {
    return "실행 가능";
  }
  if (!clock || !session) {
    return "상태 조회 중";
  }
  if (action === "TODAY_MARKET_CLOSE") {
    if (session !== "REGULAR") {
      return "정규장에서 사용";
    }
    return "활성 거래일 동기화 대기";
  }
  if (action === "NEXT_SIMULATION_DAY_START") {
    if (session !== "AFTER_CLOSE") {
      return "18:00 이후 사용";
    }
    if (clock.activeBusinessDate !== clock.simulationDate) {
      return "활성 거래일 동기화 대기";
    }
    return settlementReady ? "서버 단계 확인 대기" : "원장 동결·정산 대기";
  }
  if (action === "NEXT_PREOPEN_TRANSFORM_START") {
    if (session !== "PRE_OPEN") {
      return "00:00 진입 후 사용";
    }
    if (clock.preparingBusinessDate !== clock.simulationDate) {
      return "다음 거래일 준비 동기화 대기";
    }
    return hasReachedBoundary(clock, clock.preOpenTransformTime)
      ? "04:30 경계 통과"
      : "야간 현금·기업행사·보고서 대기";
  }
  if (action === "NEXT_AUTO_MARKET_PREPARATION_START") {
    if (session !== "PRE_OPEN") {
      return "04:30 진입 후 사용";
    }
    return hasReachedBoundary(clock, clock.autoMarketPreparationTime)
      ? "05:30 경계 통과"
      : "증권 변환·시장 데이터 준비 대기";
  }
  if (session === "REGULAR") {
    return "장전 또는 장마감 후 사용";
  }
  if (session === "PRE_OPEN" && !hasReachedBoundary(clock, clock.autoMarketPreparationTime)) {
    return "05:30 자동장·검증 경계 후 사용";
  }
  if (!marketOpenReady) {
    return "자동장 준비·개장 검증 대기";
  }
  return "준비 거래일 동기화 대기";
}

function resolveReadinessLabel(
  clock: SimulationClock | null,
  session: SimulationSession | null,
  settlementReady: boolean,
  marketOpenReady: boolean,
) {
  if (session !== "AFTER_CLOSE" && session !== "PRE_OPEN") {
    return null;
  }
  if (clock && session === "AFTER_CLOSE" && clock.activeBusinessDate !== clock.simulationDate) {
    return { label: "활성 거래일 복구 대기", ready: false };
  }
  if (clock && session === "PRE_OPEN" && marketOpenReady
    && clock.preparingBusinessDate !== clock.simulationDate) {
    return { label: "다음 거래일 준비 동기화 대기", ready: false };
  }
  if (marketOpenReady) {
    return { label: "개장 검증 완료 · 06:00 이동 가능", ready: true };
  }
  if (settlementReady) {
    return { label: `${formatPostClosePhase(clock?.postClosePhase)} 완료 · 다음 시간대 대기`, ready: false };
  }
  return {
    label: session === "PRE_OPEN" ? "전일 원장 동결·정산 대기" : "원장 동결·정산 대기",
    ready: false,
  };
}

function ClockMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white" title={value}>{value}</p>
    </div>
  );
}

function formatSimulationSession(session: SimulationSession) {
  switch (session) {
    case "AFTER_CLOSE":
      return "장마감 후";
    case "PRE_OPEN":
      return "장전";
    case "REGULAR":
      return "정규장";
  }
}

function resolveBoundaryLabel(
  boundary: SimulationClockAction["boundary"],
  openTimeLabel: string,
  closeTimeLabel: string,
  transformTimeLabel: string,
  autoMarketTimeLabel: string,
) {
  switch (boundary) {
    case "close": return `오늘 ${closeTimeLabel}`;
    case "midnight": return "다음 일자 00:00";
    case "transform": return `다음 일자 ${transformTimeLabel}`;
    case "autoMarket": return `다음 일자 ${autoMarketTimeLabel}`;
    case "open": return `다음 장 ${openTimeLabel}`;
  }
}

function hasReachedBoundary(clock: SimulationClock, boundary: string) {
  return clock.simulationDateTime.slice(11, 16) >= formatClockBoundaryTime(boundary);
}

function formatPostClosePhase(phase: string | null | undefined) {
  const labels: Readonly<Record<string, string>> = {
    OPEN: "정규장",
    CLOSE_REQUESTED: "거래 차단·배출",
    ORDER_ENTRY_CLOSED: "거래 차단·배출",
    EXECUTION_DRAINED: "거래 배출",
    LEDGER_FROZEN: "원장 동결",
    PORTFOLIO_SETTLED: "포트폴리오 정산",
    OVERNIGHT_CASH_APPLIED: "야간 현금흐름",
    CORPORATE_CASH_APPLIED: "기업행사 현금",
    REPORTS_AGGREGATED: "보고서 집계",
    PREOPEN_SECURITY_TRANSFORMS_APPLIED: "증권 변환",
    MARKET_DATA_PREPARED: "시장 데이터 준비",
    AUTO_MARKET_PREPARED: "자동장 준비",
    READY_TO_OPEN: "개장 검증",
    COMPLETED: "EOD 완료",
  };
  return phase ? labels[phase] ?? phase : "대기 없음";
}

function formatClockBoundaryTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }
  return value.slice(0, 5);
}
