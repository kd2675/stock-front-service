import { createSimulationTimeSnapshot } from "@/app/lib/simulationTime";
import type { SimulationClock, SimulationClockJumpAction } from "@/app/types/stock";

type SimulationSession = SimulationClock["marketSession"];

type SimulationClockAction = {
  action: SimulationClockJumpAction;
  enabledWhen: SimulationSession[];
  label: string;
};

const SAFE_CLOCK_ACTIONS: SimulationClockAction[] = [
  {
    action: "TODAY_MARKET_CLOSE",
    enabledWhen: ["REGULAR"],
    label: "오늘 장마감",
  },
  {
    action: "NEXT_SIMULATION_DAY_START",
    enabledWhen: ["AFTER_CLOSE"],
    label: "다음 일자 시작",
  },
  {
    action: "NEXT_MARKET_OPEN",
    enabledWhen: ["PRE_OPEN", "AFTER_CLOSE"],
    label: "다음 장 시작",
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
  const postCloseReady = Boolean(clock?.postCloseProcessingCompleted);

  return (
    <section className="admin-panel mt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">시뮬레이션 시간 제어</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            직접 입력 없이 세션 경계로만 이동합니다. 위험한 시간 이동은 서버에서 다시 차단됩니다.
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-[11px] font-black text-stock-subtle">현재 세션</p>
          <p className="mt-1 text-sm font-black text-white">{sessionLabel}</p>
          {session === "AFTER_CLOSE" || (session === "PRE_OPEN" && !postCloseReady) ? (
            <p className={["mt-1 text-[11px] font-black", postCloseReady ? "text-admin-success" : "text-[#ffd166]"].join(" ")}>
              {postCloseReady ? "후처리 완료" : session === "PRE_OPEN" ? "전일 후처리 대기" : "후처리 대기"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="grid min-w-0 grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/20 p-3">
          <ClockMetric label="시뮬일" value={snapshot?.simulationDayLabel ?? "-"} />
          <ClockMetric label="시뮬시간" value={snapshot?.simulationTime ?? "--:--:--"} />
          <ClockMetric label="진행" value={snapshot?.statusLabel ?? "확인 중"} />
          <ClockMetric label="규칙" value={snapshot?.ruleLabel ?? "-"} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {SAFE_CLOCK_ACTIONS.map((item) => {
            const enabled = Boolean(session && item.enabledWhen.includes(session) && canRunSafeClockAction(item.action, session, postCloseReady));
            const pending = jumpingAction === item.action;
            return (
              <button
                key={item.action}
                type="button"
                onClick={() => onJump(item.action)}
                disabled={!enabled || Boolean(jumpingAction)}
                className={[
                  "min-h-24 rounded-md border px-3 py-3 text-left transition",
                  enabled
                    ? "border-stock-accent/40 bg-[#15345f] text-white hover:border-admin-accent"
                    : "border-white/10 bg-white/[0.04] text-admin-disabled",
                  jumpingAction ? "cursor-wait" : enabled ? "cursor-pointer" : "cursor-not-allowed",
                ].join(" ")}
              >
                <span className="block text-sm font-black">{pending ? "처리 중" : item.label}</span>
                <span className="mt-2 block text-xs font-bold leading-5 opacity-80">
                  {resolveActionDescription(item.action, openTimeLabel, closeTimeLabel)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function canRunSafeClockAction(
  action: SimulationClockJumpAction,
  session: SimulationSession,
  postCloseReady: boolean,
) {
  if (session === "PRE_OPEN" && action === "NEXT_MARKET_OPEN") {
    return postCloseReady;
  }
  if (session !== "AFTER_CLOSE") {
    return true;
  }
  return action === "TODAY_MARKET_CLOSE" || postCloseReady;
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
      return `장전이면 전일 후처리 완료 후 오늘 ${openTimeLabel}, 장마감 후처리 완료 후면 다음날 ${openTimeLabel}으로 이동합니다.`;
    case "NEXT_SIMULATION_DAY_START":
      return "장마감 후처리 완료 후 다음 시뮬레이션 일자 00:00으로 이동합니다.";
    case "TODAY_MARKET_CLOSE":
      return `정규장 진행 중 후처리 경계인 ${closeTimeLabel}으로만 이동합니다.`;
  }
}

function formatClockBoundaryTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }
  return value.slice(0, 5);
}
