import {
  formatDateTime,
  formatRuntimeReason,
} from "@/app/supply-demand/admin/AdminFormatters";
import type { BatchManualAction } from "@/app/supply-demand/admin/AdminBatchRuntimeHelpers";
import type { BatchJobRuntimeStatus } from "@/app/types/stock";

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
