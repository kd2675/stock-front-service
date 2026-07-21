import { useMutation, type QueryClient } from "@tanstack/react-query";

import {
  setBatchRuntimeControlQueryData,
  setLatestManualCashFlowRunQueryData,
} from "@/app/lib/react-query/stockCacheUpdates";
import {
  invalidateBatchRuntimeControlQueries,
  invalidateEodOperationsOverviewQuery,
  invalidateLatestManualCashFlowRunQuery,
} from "@/app/lib/react-query/stockInvalidations";
import {
  adminRetryFailedEodPhaseMutationOptions,
  adminRunAutoParticipantCashFlowMutationOptions,
  adminUpdateBatchJobRuntimeControlMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import { BATCH_JOB_RUNTIME_LABELS } from "@/app/supply-demand/admin/AdminConstants";
import { formatCount, formatRuntimeUpdateMessage } from "@/app/supply-demand/admin/AdminFormatters";
import type { StockBatchJobRun } from "@/app/types/stock";

export function useAdminBatchActions({
  queryClient,
  reloadAdminCashFlowState,
  reloadAutoParticipantState,
  lastCashFlowRun,
  requireAdminToken,
  setMessage,
}: {
  queryClient: QueryClient;
  reloadAdminCashFlowState: () => void;
  reloadAutoParticipantState: () => void;
  lastCashFlowRun: StockBatchJobRun | null;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const batchJobRuntimeMutation = useMutation(adminUpdateBatchJobRuntimeControlMutationOptions());
  const retryEodPhaseMutation = useMutation(adminRetryFailedEodPhaseMutationOptions());
  const runCashFlowMutation = useMutation(adminRunAutoParticipantCashFlowMutationOptions());

  const setBatchJobRuntime = async (jobName: string, runtimeEnabled: boolean) => {
    if (batchJobRuntimeMutation.isPending) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 배치 자동 실행 상태를 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await batchJobRuntimeMutation.mutateAsync({
      token,
      jobName,
      payload: { runtimeEnabled },
    });
    const nextControlResult = getAdminActionData(result, "배치 자동 실행 상태 변경에 실패했습니다.");
    if (!nextControlResult.ok) {
      setMessage(nextControlResult.message);
      return;
    }
    const nextControl = nextControlResult.data;
    setBatchRuntimeControlQueryData(queryClient, nextControl);
    void invalidateBatchRuntimeControlQueries(queryClient);
    setMessage(formatRuntimeUpdateMessage(BATCH_JOB_RUNTIME_LABELS[jobName]?.label ?? "배치 자동 실행", runtimeEnabled, nextControl.effectiveEnabled));
  };

  const runAutoParticipantCashFlowNow = async () => {
    if (runCashFlowMutation.isPending) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 정기 자금 지급 배치를 실행할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await runCashFlowMutation.mutateAsync({ token });
    const cashFlowRunResult = getAdminActionData(result, "정기 자금 지급 배치 실행에 실패했습니다.");
    if (!cashFlowRunResult.ok) {
      setMessage(cashFlowRunResult.message);
      return;
    }
    setLatestManualCashFlowRunQueryData(queryClient, cashFlowRunResult.data);
    if (cashFlowRunResult.data.status === "QUEUED") {
      setMessage("정기 자금 지급 배치 실행 신호를 접수했습니다. 배치 서버가 순서대로 처리합니다.");
    } else if (cashFlowRunResult.data.status === "SKIPPED") {
      setMessage(cashFlowRunResult.data.message || "정기 자금 지급 배치가 실행되지 않았습니다.");
    } else {
      setMessage(`정기 자금 지급 배치를 실행했습니다. 처리 ${formatCount(cashFlowRunResult.data.processedCount, "건")}`);
    }
    reloadAdminCashFlowState();
    void invalidateLatestManualCashFlowRunQuery(queryClient);
    void invalidateBatchRuntimeControlQueries(queryClient);
    reloadAutoParticipantState();
  };

  const retryFailedEodPhase = async (cycleId: number) => {
    if (retryEodPhaseMutation.isPending) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 실패한 장마감 단계를 재시도할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await retryEodPhaseMutation.mutateAsync({ token, cycleId });
    const retryResult = getAdminActionData(result, "장마감 단계 재시도 요청에 실패했습니다.");
    if (!retryResult.ok) {
      setMessage(retryResult.message);
      return;
    }
    setMessage(
      `cycle #${retryResult.data.cycleId} ${retryResult.data.phase} 재시도를 요청했습니다. 다음 coordinator 판정에서 실행됩니다.`,
    );
    void invalidateEodOperationsOverviewQuery(queryClient);
  };

  return {
    lastCashFlowRun,
    retryFailedEodPhase,
    retryingEodCycleId: retryEodPhaseMutation.isPending
      ? retryEodPhaseMutation.variables?.cycleId ?? null
      : null,
    runAutoParticipantCashFlowNow,
    runningCashFlow: runCashFlowMutation.isPending,
    setBatchJobRuntime,
    updatingBatchJobName: batchJobRuntimeMutation.isPending ? batchJobRuntimeMutation.variables?.jobName ?? null : null,
  };
}
