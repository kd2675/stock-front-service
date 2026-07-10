import { formatCount } from "@/app/supply-demand/admin/AdminFormatters";
import type { BatchJobRuntimeStatus, StockBatchJobRun } from "@/app/types/stock";

export type BatchManualAction = {
  label: string;
  description: string;
  buttonLabel: string;
  runningLabel: string;
  running: boolean;
  disabled: boolean;
  lastRunText: string;
  onRun: () => void;
};

export function formatBatchJobRunSummary(run: StockBatchJobRun) {
  if (run.status !== "COMPLETED") {
    return run.status;
  }
  return `${run.status} · ${formatCount(run.processedCount, "건")}`;
}

export function summarizeBatchRuntimeControls(controls: BatchJobRuntimeStatus[]) {
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

export function resolveBatchManualAction(
  jobName: string,
  options: {
    control: BatchJobRuntimeStatus;
    lastCashFlowRun: StockBatchJobRun | null;
    runningCashFlow: boolean;
    onRunCashFlow: () => void;
  },
): BatchManualAction | null {
  if (jobName === "auto-participant-cash-flow") {
    return {
      label: "월급 수동 지급",
      description: "자동 월급 지급이 꺼져 있을 때만 관리자가 명시적으로 한 번 지급할 수 있습니다.",
      buttonLabel: "수동 월급 지급",
      runningLabel: "지급 실행 중",
      running: options.runningCashFlow,
      disabled: options.control.effectiveEnabled,
      lastRunText: `마지막 수동 실행 ${options.lastCashFlowRun ? formatBatchJobRunSummary(options.lastCashFlowRun) : "-"}`,
      onRun: options.onRunCashFlow,
    };
  }
  return null;
}
