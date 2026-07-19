import { formatCount, formatDateTime, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { EodOperationsOverview } from "@/app/types/stock";

type AdminEodSectionProps = {
  error: boolean;
  loading: boolean;
  overview: EodOperationsOverview | null;
  refreshing: boolean;
  onRefresh: () => void;
  onRetryFailedPhase: (cycleId: number) => void;
  retryingCycleId: number | null;
};

const EOD_PHASES = [
  { key: "CLOSE_REQUESTED", label: "거래 차단·배출", window: "18:00" },
  { key: "LEDGER_FROZEN", label: "원장 동결", window: "18:00 직후" },
  { key: "PORTFOLIO_SETTLED", label: "포트폴리오 정산", window: "18:10 이후" },
  { key: "OVERNIGHT_CASH_APPLIED", label: "야간 현금흐름", window: "00:00 이후" },
  { key: "CORPORATE_CASH_APPLIED", label: "기업행사 현금", window: "00:00 이후" },
  { key: "REPORTS_AGGREGATED", label: "보고서 집계", window: "00:00~04:30" },
  { key: "PREOPEN_SECURITY_TRANSFORMS_APPLIED", label: "증권 변환", window: "04:30 이후" },
  { key: "MARKET_DATA_PREPARED", label: "시장 데이터 준비", window: "04:30 이후" },
  { key: "AUTO_MARKET_PREPARED", label: "자동장 준비", window: "05:30 이후" },
  { key: "READY_TO_OPEN", label: "개장 검증", window: "05:30 이후" },
  { key: "COMPLETED", label: "완료", window: "06:00 개장 후" },
] as const;

const INTERNAL_CLOSE_PHASES = new Set(["ORDER_ENTRY_CLOSED", "EXECUTION_DRAINED"]);

const PHASE_LABELS: ReadonlyMap<string, string> = new Map([
  ...EOD_PHASES.map((phase) => [phase.key, phase.label] as const),
  ["ORDER_ENTRY_CLOSED", "거래 차단·배출"],
  ["EXECUTION_DRAINED", "거래 차단·배출"],
]);

const READINESS_LABELS: Readonly<Record<string, string>> = {
  PORTFOLIO_SETTLEMENT: "포트폴리오 정산",
  BUSINESS_STATE: "거래일 상태",
  MARKET_CLOSED: "시장 CLOSED",
  SESSION_FENCE_PREPARING: "종목 세션 fence",
  PRICE_SNAPSHOT: "종가·일일 스냅샷",
  CORPORATE_CASH: "기업행사 현금",
  CORPORATE_TRANSFORMS: "기업행사 증권 변환",
  AUTO_MARKET_REGIME: "자동장 regime",
  AUTO_MARKET_PROFILE_QUEUE: "프로필 Redis 큐",
  RUNTIME_IDENTITY: "build·schema 정체성",
};

function timelinePhase(phase: string) {
  return INTERNAL_CLOSE_PHASES.has(phase) ? "CLOSE_REQUESTED" : phase;
}

function completedTimelineIndex(currentPhase: string, cycleStatus: string) {
  if (cycleStatus === "COMPLETED") {
    return EOD_PHASES.length - 1;
  }
  const normalizedCurrentPhase = timelinePhase(currentPhase);
  const currentIndex = EOD_PHASES.findIndex((item) => item.key === normalizedCurrentPhase);
  if (normalizedCurrentPhase === "CLOSE_REQUESTED" || currentIndex < 0) {
    return -1;
  }
  return currentIndex;
}

function cycleHeading(currentPhase: string, cycleStatus: string) {
  if (cycleStatus === "COMPLETED") {
    return "EOD 처리 완료";
  }
  const completedIndex = completedTimelineIndex(currentPhase, cycleStatus);
  const completedPhase = completedIndex >= 0 ? EOD_PHASES[completedIndex] : null;
  const activePhase = EOD_PHASES[completedIndex + 1] ?? null;
  if (cycleStatus === "RUNNING") {
    return activePhase ? `${activePhase.label} 실행 중` : "EOD 처리 중";
  }
  if (cycleStatus === "FAILED") {
    return activePhase ? `${activePhase.label} 실패` : "EOD 처리 실패";
  }
  if (cycleStatus === "DEFERRED") {
    return activePhase ? `${activePhase.label} 연기` : "EOD 처리 연기";
  }
  if (completedPhase) {
    return `${completedPhase.label} 완료`;
  }
  return activePhase ? `${activePhase.label} 대기` : PHASE_LABELS.get(currentPhase) ?? currentPhase;
}

function cycleDescription(currentPhase: string, cycleStatus: string) {
  if (cycleStatus === "COMPLETED") {
    return "모든 장마감 후처리와 다음 장 개장 검증이 완료됐습니다.";
  }
  const completedIndex = completedTimelineIndex(currentPhase, cycleStatus);
  const completedPhase = completedIndex >= 0 ? EOD_PHASES[completedIndex] : null;
  const activePhase = EOD_PHASES[completedIndex + 1] ?? null;
  const completedCopy = completedPhase ? `${completedPhase.label} 완료 · ` : "";
  if (!activePhase) {
    return `${completedCopy}다음 단계 판정을 기다리고 있습니다.`;
  }
  if (cycleStatus === "RUNNING") {
    return `${completedCopy}${activePhase.label}을 처리하고 있습니다.`;
  }
  if (cycleStatus === "FAILED") {
    return `${completedCopy}${activePhase.label} 재시도가 필요합니다.`;
  }
  if (cycleStatus === "DEFERRED") {
    return `${completedCopy}${activePhase.label}은 ${activePhase.window} 실행 조건을 기다립니다.`;
  }
  return `${completedCopy}다음 단계 ${activePhase.label} · ${activePhase.window} 대기`;
}

function statusLabel(status: string) {
  if (status === "COMPLETED") return "전체 완료";
  if (status === "RUNNING") return "실행 중";
  if (status === "FAILED") return "실패";
  if (status === "DEFERRED") return "실행 연기";
  if (status === "PENDING") return "다음 단계 대기";
  return status;
}

function attemptedOperationLabel(phase: string) {
  const normalizedPhase = timelinePhase(phase);
  const phaseIndex = EOD_PHASES.findIndex((item) => item.key === normalizedPhase);
  return EOD_PHASES[phaseIndex + 1]?.label ?? PHASE_LABELS.get(normalizedPhase) ?? phase;
}

function statusTone(status: string | undefined) {
  if (status === "FAILED" || status === "DEAD_LETTER") {
    return "border-admin-danger/35 bg-admin-danger-surface text-admin-danger";
  }
  if (status === "RUNNING" || status === "PROCESSING") {
    return "border-admin-accent/40 bg-admin-accent-surface text-admin-accent-soft";
  }
  if (status === "DEFERRED" || status === "PENDING" || status === "QUEUED") {
    return "border-admin-warning/35 bg-admin-warning/10 text-admin-warning-soft";
  }
  return "border-admin-success/30 bg-admin-success-surface/60 text-admin-success";
}

function formatElapsed(startedAt: string | null | undefined, endedAt: string | null | undefined) {
  if (!startedAt || !endedAt) {
    return "-";
  }
  const elapsedSeconds = Math.max(0, Math.floor((Date.parse(endedAt) - Date.parse(startedAt)) / 1_000));
  if (!Number.isFinite(elapsedSeconds)) {
    return "-";
  }
  const hours = Math.floor(elapsedSeconds / 3_600);
  const minutes = Math.floor((elapsedSeconds % 3_600) / 60);
  const seconds = elapsedSeconds % 60;
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }
  return `${seconds}초`;
}

function DefinitionItem({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 border-t border-white/10 py-3 first:border-t-0 sm:first:border-t">
      <dt className="text-[11px] font-black tracking-[0.08em] text-admin-subtle">{label}</dt>
      <dd className="mt-1 break-words text-sm font-black text-white">{value}</dd>
      {note ? <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">{note}</p> : null}
    </div>
  );
}

export function AdminEodSection({
  error,
  loading,
  overview,
  refreshing,
  onRefresh,
  onRetryFailedPhase,
  retryingCycleId,
}: AdminEodSectionProps) {
  if (loading && !overview) {
    return (
      <section aria-busy="true" className="mt-5 border-y border-white/10 py-8">
        <p className="text-sm font-bold text-stock-subtle">장마감 cycle 상태를 불러오고 있습니다.</p>
      </section>
    );
  }

  if (error && !overview) {
    return (
      <section className="mt-5 border-y border-admin-danger/30 py-6">
        <p className="text-sm font-black text-admin-danger">장마감 운영 상태를 조회하지 못했습니다.</p>
        <button type="button" onClick={onRefresh} className="mt-3 min-h-10 rounded-md border border-white/15 px-3 text-sm font-black text-white">
          다시 조회
        </button>
      </section>
    );
  }

  const cycle = overview?.cycle ?? null;
  const metrics = overview?.metrics ?? null;
  const businessState = overview?.businessState ?? null;
  const attempt = overview?.latestAttempt ?? null;
  const signal = overview?.latestSignal ?? null;
  const readinessChecks = overview?.readinessChecks ?? [];
  const retryingCurrentCycle = cycle?.id === retryingCycleId;
  const canRetryFailedPhase = cycle?.status === "FAILED" && !overview?.marketState.orderEntryOpen;
  const completedPhaseIndex = cycle ? completedTimelineIndex(cycle.phase, cycle.status) : -1;
  const activePhaseIndex = cycle?.status === "COMPLETED" ? -1 : completedPhaseIndex + 1;

  return (
    <div className="mt-5 min-w-0 space-y-7">
      <section aria-labelledby="eod-current-state" className="border-y border-white/10 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.14em] text-admin-accent">END OF DAY CONTROL</p>
            <h2 id="eod-current-state" className="mt-2 text-xl font-black text-white">
              {cycle ? cycleHeading(cycle.phase, cycle.status) : "대기 중인 장마감 없음"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-stock-subtle">
              {cycle
                ? cycleDescription(cycle.phase, cycle.status)
                : "운영 조회는 주문·체결 원장을 다시 집계하지 않고, 각 단계가 한 번 기록한 cycle 요약값만 읽습니다."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cycle ? (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(cycle.status)}`}>
                {statusLabel(cycle.status)}
              </span>
            ) : null}
            {cycle?.status === "FAILED" ? (
              <button
                type="button"
                onClick={() => onRetryFailedPhase(cycle.id)}
                disabled={!canRetryFailedPhase || retryingCurrentCycle}
                className="min-h-10 rounded-md border border-admin-danger/40 bg-admin-danger-surface px-3 text-sm font-black text-admin-danger transition-colors hover:bg-admin-danger/15 disabled:cursor-not-allowed disabled:opacity-45"
                title={canRetryFailedPhase ? "완료된 이전 단계는 건너뛰고 실패한 현재 단계의 backoff만 해제합니다." : "주문 접수가 닫힌 뒤에만 재시도할 수 있습니다."}
              >
                {retryingCurrentCycle ? "재시도 요청 중" : "현재 단계 재시도"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="min-h-10 rounded-md border border-white/15 px-3 text-sm font-black text-white transition-colors hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-50"
            >
              {refreshing ? "확인 중" : "새로고침"}
            </button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-5 sm:grid-cols-2 xl:grid-cols-4">
          <DefinitionItem label="활성 거래일" value={businessState?.activeBusinessDate ?? "-"} />
          <DefinitionItem
            label="원시 시뮬레이션 시각"
            value={formatDateTime(businessState?.rawSimulationDateTime)}
            note={businessState?.rawSimulationDate ? `원시 일자 ${businessState.rawSimulationDate}` : undefined}
          />
          <DefinitionItem label="다음 준비 거래일" value={businessState?.preparingBusinessDate ?? "-"} />
          <DefinitionItem
            label="주문 접수 상태"
            value={overview?.marketState.orderEntryOpen ? "OPEN" : "CLOSED"}
            note={`${formatCount(overview?.marketState.openSymbolCount ?? 0, "개")} / ${formatCount(overview?.marketState.enabledSymbolCount ?? 0, "개")} 종목 OPEN`}
          />
        </dl>
      </section>

      {cycle ? (
        <section aria-labelledby="eod-phase-timeline">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="eod-phase-timeline" className="text-base font-black text-white">거래일 단계</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
                거래일 {cycle.businessDate} · cycle #{cycle.id} · {cycle.cycleKind}
              </p>
              <p className="mt-1 max-w-3xl text-[11px] font-bold leading-5 text-admin-muted">
                주문 접수 차단과 이미 승인된 거래 배출은 마감 요청 안에서 연속 수행되며, 정상 실행에서는 별도 cycle phase로 저장하지 않습니다.
              </p>
            </div>
            <p className="text-xs font-bold text-stock-subtle">갱신 {formatDateTime(overview?.generatedAt)}</p>
          </div>
          <ol className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {EOD_PHASES.map((phase, index) => {
              const state = index <= completedPhaseIndex
                ? "complete"
                : index === activePhaseIndex
                  ? "current"
                  : "pending";
              return (
                <li
                  key={phase.key}
                  aria-current={state === "current" ? "step" : undefined}
                  className={[
                    "min-w-0 bg-admin-canvas px-3 py-3",
                    state === "current" ? "shadow-[inset_3px_0_0_var(--admin-accent)]" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={[
                        "grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-black",
                        state === "complete" ? "border-admin-success/40 bg-admin-success-surface/60 text-admin-success" : "",
                        state === "current" ? "border-admin-accent/50 bg-admin-accent-surface text-admin-accent-soft" : "",
                        state === "pending" ? "border-white/15 text-admin-subtle" : "",
                      ].join(" ")}
                    >
                      {state === "complete" ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{phase.label}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-admin-subtle">{phase.window}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section className="border-y border-white/10 py-8 text-sm font-bold text-stock-subtle">
          생성된 전체 시장 close cycle이 없습니다. 첫 장마감 이후 단계와 대사 지표가 표시됩니다.
        </section>
      )}

      {cycle ? (
        <section aria-labelledby="eod-reconciliation" className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="min-w-0">
            <h2 id="eod-reconciliation" className="text-base font-black text-white">동결·정산 대사</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-5 sm:grid-cols-2 lg:grid-cols-3">
              <DefinitionItem label="마감 포착 주문" value={formatCount(metrics?.capturedOpenOrderCount ?? 0, "건")} />
              <DefinitionItem label="취소 완료 주문" value={formatCount(metrics?.cancelledOrderCount ?? 0, "건")} />
              <DefinitionItem label="반환 매수 예약금" value={formatWon(metrics?.releasedBuyCash ?? 0)} />
              <DefinitionItem label="반환 매도 예약수량" value={formatCount(metrics?.releasedSellQuantity ?? 0, "주")} />
              <DefinitionItem label="대사 불일치" value={formatCount(metrics?.reconciliationMismatchCount ?? 0, "건")} />
              <DefinitionItem label="정산 대상 계좌" value={formatCount(metrics?.settlementTargetAccountCount ?? 0, "개")} />
              <DefinitionItem label="정산 완료 계좌" value={formatCount(metrics?.settledAccountCount ?? 0, "개")} />
              <DefinitionItem label="정산 누락 계좌" value={formatCount(metrics?.settlementMissingAccountCount ?? 0, "개")} />
              <DefinitionItem label="계좌 스냅샷" value={formatCount(metrics?.accountSnapshotCount ?? 0, "건")} />
              <DefinitionItem label="보유 스냅샷" value={formatCount(metrics?.holdingSnapshotCount ?? 0, "건")} />
              <DefinitionItem label="가격 스냅샷" value={formatCount(metrics?.priceSnapshotCount ?? 0, "건")} />
            </dl>
          </div>

          <div className="min-w-0 border-l-0 border-white/10 xl:border-l xl:pl-6">
            <h2 className="text-base font-black text-white">실행 추적</h2>
            <dl className="mt-3">
              <DefinitionItem label="close run" value={cycle.closeRunId ? `#${cycle.closeRunId} · ${cycle.closeRunStatus ?? "-"}` : "-"} />
              <DefinitionItem
                label="cycle 실행 시간"
                value={formatElapsed(cycle.startedAt, cycle.completedAt ?? overview?.generatedAt)}
                note={`${formatDateTime(cycle.startedAt)} → ${cycle.completedAt ? formatDateTime(cycle.completedAt) : "진행 중"}`}
              />
              <DefinitionItem label="정산 실행 가능" value={formatDateTime(cycle.settlementEligibleAt)} />
              <DefinitionItem
                label="cycle 재시도 가능(서버)"
                value={formatDateTime(cycle.nextRetryAt)}
                note={cycle.nextRetryAt ? "실패·연기된 phase는 이 시각 전까지 다시 실행하지 않아 DB 부하를 제한합니다." : undefined}
              />
              <DefinitionItem
                label="최근 attempt"
                value={attempt ? `#${attempt.attemptNo} · ${attemptedOperationLabel(attempt.phase)} · ${statusLabel(attempt.status)}` : "-"}
                note={attempt ? `${formatDateTime(attempt.startedAt)} → ${attempt.completedAt ? formatDateTime(attempt.completedAt) : "진행 중"} · ${formatElapsed(attempt.startedAt, attempt.completedAt ?? overview?.generatedAt)}` : undefined}
              />
              <DefinitionItem label="실행 버전" value={`${cycle.buildVersion ?? "unknown"} / ${cycle.schemaVersion ?? "unknown"}`} />
              <DefinitionItem label="마지막 신호" value={signal ? `#${signal.id} · ${signal.status}` : "-"} note={signal?.message ?? signal?.errorMessage ?? undefined} />
              <DefinitionItem
                label="신호 실행 가능"
                value={signal ? formatDateTime(signal.eligibleAt) : "-"}
                note={signal ? `시도 ${signal.attemptCount}/${signal.maxAttempts} · 다음 판정 ${formatDateTime(signal.nextAttemptAt)}` : undefined}
              />
            </dl>
          </div>
        </section>
      ) : null}

      {cycle ? (
        <section aria-labelledby="eod-readiness-checks" className="border-y border-white/10 py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="eod-readiness-checks" className="text-base font-black text-white">개장 readiness 검사</h2>
              <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
                05:30 검사 시 고정된 최대 10개 제어 결과입니다. 화면 갱신은 주문·체결·기업행사 원장을 다시 집계하지 않습니다.
              </p>
            </div>
            {readinessChecks.length > 0 ? (
              <p className="text-xs font-bold text-stock-subtle">
                검사 {formatDateTime(readinessChecks[0]?.checkedAt)}
              </p>
            ) : null}
          </div>

          {readinessChecks.length === 0 ? (
            <p className="mt-4 text-sm font-bold text-stock-subtle">
              아직 AUTO_MARKET_PREPARED 이후 readiness 검사를 실행하지 않았습니다.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
              {readinessChecks.map((check) => (
                <li key={check.checkCode} className="min-w-0 bg-admin-canvas px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white">
                        {READINESS_LABELS[check.checkCode] ?? check.checkCode}
                      </p>
                      <p className="mt-1 break-words text-[11px] font-bold leading-5 text-stock-subtle">
                        {check.message ?? "검사 설명 없음"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${statusTone(check.status)}`}>
                      {check.status === "PASSED" ? "통과" : `실패 ${check.failureCount}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {cycle?.lastErrorMessage || attempt?.errorMessage ? (
        <section role="alert" className="border-y border-admin-danger/30 bg-admin-danger-surface/40 px-3 py-4">
          <p className="text-xs font-black tracking-[0.08em] text-admin-danger">최근 오류</p>
          <p className="mt-2 break-words text-sm font-bold leading-6 text-admin-danger">
            {cycle?.lastErrorCode ?? attempt?.errorCode ?? "EOD_ERROR"} · {cycle?.lastErrorMessage ?? attempt?.errorMessage}
          </p>
          {cycle?.status === "FAILED" ? (
            <p className="mt-2 text-xs font-bold leading-5 text-stock-subtle">
              재시도 요청은 현재 phase의 대기시간만 해제합니다. Job을 즉시 실행하거나 완료된 phase를 다시 실행하지 않으며,
              시장이 열려 있으면 요청할 수 없습니다.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
