import { createSimulationTimeSnapshot } from "@/app/lib/simulationTime";
import type { SimulationClock, SimulationClockJumpAction } from "@/app/types/stock";

type SimulationSession = SimulationClock["marketSession"];

type SimulationClockAction = {
  action: SimulationClockJumpAction;
  step: number;
  label: string;
};

const SAFE_CLOCK_ACTIONS: SimulationClockAction[] = [
  {
    action: "TODAY_MARKET_CLOSE",
    step: 1,
    label: "오늘 18:00 진입",
  },
  {
    action: "NEXT_SIMULATION_DAY_START",
    step: 2,
    label: "다음 일자 00:00 진입",
  },
  {
    action: "NEXT_MARKET_OPEN",
    step: 3,
    label: "다음 장 06:00 진입",
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
            배치 Job을 강제 실행하지 않고, 서버가 허용한 다음 시간대 경계로 시계만 이동합니다.
            원장 동결·정산·야간 후처리·개장 준비는 EOD coordinator가 단계 순서대로 수행합니다.
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid min-w-0 grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/20 p-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          <ClockMetric label="원시 일자" value={snapshot?.simulationDayLabel ?? "-"} />
          <ClockMetric label="원시 시간" value={snapshot?.simulationTime ?? "--:--:--"} />
          <ClockMetric label="활성 거래일" value={clock?.activeBusinessDate ?? "-"} />
          <ClockMetric label="다음 준비 거래일" value={clock?.preparingBusinessDate ?? "-"} />
          <ClockMetric label="진행" value={snapshot?.statusLabel ?? "확인 중"} />
          <ClockMetric label="규칙" value={snapshot?.ruleLabel ?? "-"} />
        </div>

        <ol className="grid gap-2 sm:grid-cols-3">
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
            return (
              <li key={item.action} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onJump(item.action)}
                  disabled={!enabled || Boolean(jumpingAction)}
                  className={[
                    "flex min-h-36 w-full flex-col border px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent",
                    enabled
                      ? "border-admin-accent/40 bg-admin-accent-surface text-white hover:border-admin-accent hover:bg-admin-accent/20"
                      : "border-white/10 bg-white/[0.04] text-admin-disabled",
                    jumpingAction ? "cursor-wait" : enabled ? "cursor-pointer" : "cursor-not-allowed",
                  ].join(" ")}
                >
                  <span className="text-[10px] font-black tracking-[0.12em] opacity-70">단계 {item.step}</span>
                  <span className="mt-1 block text-sm font-black">{pending ? "이동 중" : item.label}</span>
                  <span className="mt-2 block text-xs font-bold leading-5 opacity-80">
                    {resolveActionDescription(item.action, openTimeLabel, closeTimeLabel)}
                  </span>
                  <span className={[
                    "mt-auto pt-3 text-[11px] font-black",
                    enabled ? "text-admin-accent-soft" : "text-admin-muted",
                  ].join(" ")}
                  >
                    {availabilityLabel}
                  </span>
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
  if (session === "REGULAR") {
    return "장전 또는 장마감 후 사용";
  }
  if (!marketOpenReady) {
    return "야간 후처리·개장 준비 대기";
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
    return { label: "개장 준비 완료", ready: true };
  }
  if (settlementReady) {
    return { label: "정산 완료 · 야간 후처리 대기", ready: false };
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

function resolveActionDescription(
  action: SimulationClockJumpAction,
  openTimeLabel: string,
  closeTimeLabel: string,
) {
  switch (action) {
    case "NEXT_MARKET_OPEN":
      return `야간 현금·기업행사·보고서·가격·자동장·readiness 완료 후에만 ${openTimeLabel}으로 이동합니다.`;
    case "NEXT_SIMULATION_DAY_START":
      return "원장 동결·포트폴리오 정산 완료 후 다음 일자 00:00으로 이동해 야간 처리 시간을 엽니다.";
    case "TODAY_MARKET_CLOSE":
      return `시계만 ${closeTimeLabel}으로 이동합니다. 시장 차단·원장 동결·정산은 coordinator가 이어서 처리합니다.`;
  }
}

function formatClockBoundaryTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }
  return value.slice(0, 5);
}
