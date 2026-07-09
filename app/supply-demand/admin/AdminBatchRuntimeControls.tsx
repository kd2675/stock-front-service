import {
  BATCH_JOB_RUNTIME_LABELS,
  SUPPLY_DEMAND_BATCH_JOB_NAMES,
} from "@/app/supply-demand/admin/AdminConstants";
import {
  resolveBatchManualAction,
  summarizeBatchRuntimeControls,
} from "@/app/supply-demand/admin/AdminBatchRuntimeHelpers";
import {
  BatchRuntimeControlCard,
  BatchRuntimeMetric,
} from "@/app/supply-demand/admin/AdminBatchRuntimeCards";
import { formatCount } from "@/app/supply-demand/admin/AdminFormatters";
import type { BatchJobRuntimeStatus, StockBatchJobRun } from "@/app/types/stock";

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
        <BatchRuntimeMetric label="전체 배치" value={formatCount(summary.total, "개")} tone="neutral" />
        <BatchRuntimeMetric label="자동 실행" value={formatCount(summary.effective, "개")} tone="good" />
        <BatchRuntimeMetric label="DB 중지" value={formatCount(summary.runtimeOff, "개")} tone="danger" />
        <BatchRuntimeMetric label="설정 OFF" value={formatCount(summary.schedulerOff, "개")} tone="muted" />
      </div>

      {supplyDemandControls.length > 0 ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          {supplyDemandControls.map((control) => {
            const label = BATCH_JOB_RUNTIME_LABELS[control.jobName] ?? { label: control.jobName, description: "등록된 배치 자동 실행 제어입니다." };
            const updating = updatingBatchJobName === control.jobName;
            const manualAction = resolveBatchManualAction(control.jobName, {
              control,
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
