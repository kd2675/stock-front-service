import {
  BATCH_JOB_RUNTIME_LABELS,
  SUPPLY_DEMAND_BATCH_JOB_NAMES,
} from "@/app/supply-demand/admin/AdminConstants";
import {
  formatDateTime,
  formatRuntimeReason,
} from "@/app/supply-demand/admin/AdminFormatters";
import type { BatchJobRuntimeStatus, StockBatchJobRun } from "@/app/types/stock";

type BatchManualAction = {
  label: string;
  description: string;
  buttonLabel: string;
  runningLabel: string;
  running: boolean;
  lastRunText: string;
  onRun: () => void;
};

export function AdminBatchRuntimeControlPanel({
  controls,
  loading,
  error,
  updatingBatchJobName,
  lastCashFlowRun,
  runningCashFlow,
  onRefresh,
  onSetRuntime,
  onRunCashFlow,
}: {
  controls: BatchJobRuntimeStatus[];
  loading: boolean;
  error: boolean;
  updatingBatchJobName: string | null;
  lastCashFlowRun: StockBatchJobRun | null;
  runningCashFlow: boolean;
  onRefresh: () => void;
  onSetRuntime: (jobName: string, runtimeEnabled: boolean) => void;
  onRunCashFlow: () => void;
}) {
  const supplyDemandControls = controls.filter((control) => SUPPLY_DEMAND_BATCH_JOB_NAMES.has(control.jobName));
  const summary = summarizeBatchRuntimeControls(supplyDemandControls);

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">배치 자동 실행 제어</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">
            배치 서버는 실행 직전에 DB 런타임 값을 읽습니다. 스케줄러 설정은 서버 설정값이고, DB 런타임은 운영 중 중지/재개 값입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:cursor-wait disabled:opacity-55"
        >
          {loading ? "조회 중" : "전체 상태 새로고침"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BatchRuntimeMetric label="전체 배치" value={`${summary.total.toLocaleString("ko-KR")}개`} tone="neutral" />
        <BatchRuntimeMetric label="자동 실행" value={`${summary.effective.toLocaleString("ko-KR")}개`} tone="good" />
        <BatchRuntimeMetric label="DB 중지" value={`${summary.runtimeOff.toLocaleString("ko-KR")}개`} tone="danger" />
        <BatchRuntimeMetric label="설정 OFF" value={`${summary.schedulerOff.toLocaleString("ko-KR")}개`} tone="muted" />
      </div>

      {supplyDemandControls.length > 0 ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          {supplyDemandControls.map((control) => {
            const label = BATCH_JOB_RUNTIME_LABELS[control.jobName] ?? { label: control.jobName, description: "등록된 배치 자동 실행 제어입니다." };
            const updating = updatingBatchJobName === control.jobName;
            const manualAction = resolveBatchManualAction(control.jobName, {
              lastCashFlowRun,
              runningCashFlow,
              onRunCashFlow,
            });
            return (
              <BatchRuntimeControlCard
                key={control.jobName}
                control={control}
                label={label.label}
                description={label.description}
                manualAction={manualAction}
                updating={updating}
                onStart={() => onSetRuntime(control.jobName, true)}
                onStop={() => onSetRuntime(control.jobName, false)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#8b95a1]">
          {error
            ? "배치 자동 실행 상태를 조회하지 못했습니다. 배치 서버가 켜져 있으면 전체 상태 새로고침으로 다시 확인하세요."
            : "배치 자동 실행 상태를 아직 조회하지 않았습니다. 배치 서버가 켜져 있으면 전체 상태 새로고침으로 현재 스케줄러 설정과 DB 런타임 값을 확인할 수 있습니다."}
        </div>
      )}
    </section>
  );
}

export function BatchRuntimeMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "good" | "danger" | "muted";
}) {
  const toneClassName = {
    neutral: "border-white/10 bg-black/20 text-white",
    good: "border-[#1f6f45]/40 bg-[#123820]/60 text-[#6ee7a8]",
    danger: "border-[#7c2c22]/50 bg-[#3a1f1b]/80 text-[#ffb4a8]",
    muted: "border-white/10 bg-white/[0.04] text-[#b8c2cc]",
  }[tone];

  return (
    <div className={`min-w-0 rounded-md border p-3 ${toneClassName}`}>
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

export function BatchRuntimeControlCard({
  control,
  label,
  description,
  manualAction,
  updating,
  onStart,
  onStop,
}: {
  control: BatchJobRuntimeStatus;
  label: string;
  description: string;
  manualAction: BatchManualAction | null;
  updating: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <article className="grid min-w-0 gap-4 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{label}</h3>
            <RuntimeBadge active={control.effectiveEnabled} activeText="자동실행" inactiveText="스킵" />
          </div>
          <p className="mt-1 break-all font-mono text-[11px] font-bold text-[#6f7a86]">{control.jobName}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#b8c2cc]">{description}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <BatchRuntimeState label="스케줄러 설정" active={control.schedulerConfigured} activeText="ON" inactiveText="OFF" />
        <BatchRuntimeState label="DB 런타임" active={control.runtimeEnabled} activeText="ON" inactiveText="OFF" />
        <BatchRuntimeState label="실제 자동실행" active={control.effectiveEnabled} activeText="실행" inactiveText="스킵" />
      </div>

      <div className="rounded-md bg-white/[0.04] px-3 py-2">
        <p className="text-xs font-bold leading-5 text-[#b8c2cc]">{formatRuntimeReason(control)}</p>
        <p className="mt-1 text-[11px] font-bold text-[#6f7a86]">
          수정 {formatDateTime(control.updatedAt)} · {control.updatedBy ?? "-"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={updating || control.runtimeEnabled}
          className="min-h-11 rounded-md bg-[#123820] px-3 py-3 text-sm font-black text-[#6ee7a8] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {updating && !control.runtimeEnabled ? "재개 중" : "재개"}
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={updating || !control.runtimeEnabled}
          className="min-h-11 rounded-md bg-[#3a1f1b] px-3 py-3 text-sm font-black text-[#ffb4a8] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {updating && control.runtimeEnabled ? "중지 중" : "중지"}
        </button>
      </div>

      {manualAction ? (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-white">{manualAction.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">{manualAction.description}</p>
            </div>
            <button
              type="button"
              onClick={manualAction.onRun}
              disabled={manualAction.running}
              className="min-h-10 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418] disabled:cursor-wait disabled:opacity-55"
            >
              {manualAction.running ? manualAction.runningLabel : manualAction.buttonLabel}
            </button>
          </div>
          <p className="mt-2 text-xs font-bold text-[#6f7a86]">{manualAction.lastRunText}</p>
        </div>
      ) : null}
    </article>
  );
}

function RuntimeBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span className={active ? "inline-flex rounded-md bg-[#123820] px-2 py-1 text-xs font-black text-[#6ee7a8]" : "inline-flex rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8]"}>
      {active ? activeText : inactiveText}
    </span>
  );
}

function BatchRuntimeState({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3">
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className={active ? "mt-1 text-sm font-black text-[#6ee7a8]" : "mt-1 text-sm font-black text-[#ffb4a8]"}>
        {activeText}
      </p>
      {!active ? <p className="mt-0.5 text-[11px] font-bold text-[#6f7a86]">{inactiveText}</p> : null}
    </div>
  );
}

function summarizeBatchRuntimeControls(controls: BatchJobRuntimeStatus[]) {
  return controls.reduce(
    (summary, control) => ({
      total: summary.total + 1,
      effective: summary.effective + (control.effectiveEnabled ? 1 : 0),
      runtimeOff: summary.runtimeOff + (!control.runtimeEnabled ? 1 : 0),
      schedulerOff: summary.schedulerOff + (!control.schedulerConfigured ? 1 : 0),
    }),
    {
      total: 0,
      effective: 0,
      runtimeOff: 0,
      schedulerOff: 0,
    },
  );
}

function resolveBatchManualAction(
  jobName: string,
  options: {
    lastCashFlowRun: StockBatchJobRun | null;
    runningCashFlow: boolean;
    onRunCashFlow: () => void;
  },
): BatchManualAction | null {
  if (jobName === "auto-participant-cash-flow") {
    return {
      label: "월급 수동 지급",
      description: "자동 실행이 중지되어 있어도 관리자가 명시적으로 한 번 지급할 수 있습니다.",
      buttonLabel: "수동 월급 지급",
      runningLabel: "지급 실행 중",
      running: options.runningCashFlow,
      lastRunText: `마지막 수동 실행 ${options.lastCashFlowRun ? `${options.lastCashFlowRun.status} · ${options.lastCashFlowRun.processedCount.toLocaleString("ko-KR")}건` : "-"}`,
      onRun: options.onRunCashFlow,
    };
  }
  return null;
}
