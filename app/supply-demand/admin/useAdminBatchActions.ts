import { useState } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";

import { setBatchRuntimeControlQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { invalidateBatchRuntimeControlQueries } from "@/app/lib/react-query/stockInvalidations";
import {
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
  requireAdminToken,
  setMessage,
}: {
  queryClient: QueryClient;
  reloadAdminCashFlowState: () => void;
  reloadAutoParticipantState: () => void;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const [lastCashFlowRun, setLastCashFlowRun] = useState<StockBatchJobRun | null>(null);
  const batchJobRuntimeMutation = useMutation(adminUpdateBatchJobRuntimeControlMutationOptions());
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
    const token = await requireAdminToken("관리자 로그인 후 월급 지급 배치를 실행할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await runCashFlowMutation.mutateAsync({ token });
    const cashFlowRunResult = getAdminActionData(result, "월급 지급 배치 실행에 실패했습니다.");
    if (!cashFlowRunResult.ok) {
      setMessage(cashFlowRunResult.message);
      return;
    }
    setLastCashFlowRun(cashFlowRunResult.data);
    if (cashFlowRunResult.data.status === "QUEUED") {
      setMessage("월급 지급 배치 실행 신호를 접수했습니다. 배치 서버가 순서대로 처리합니다.");
    } else if (cashFlowRunResult.data.status === "SKIPPED") {
      setMessage(cashFlowRunResult.data.message || "월급 지급 배치가 실행되지 않았습니다.");
    } else {
      setMessage(`월급 지급 배치를 실행했습니다. 처리 ${formatCount(cashFlowRunResult.data.processedCount, "건")}`);
    }
    reloadAdminCashFlowState();
    void invalidateBatchRuntimeControlQueries(queryClient);
    reloadAutoParticipantState();
  };

  return {
    lastCashFlowRun,
    runAutoParticipantCashFlowNow,
    runningCashFlow: runCashFlowMutation.isPending,
    setBatchJobRuntime,
    updatingBatchJobName: batchJobRuntimeMutation.isPending ? batchJobRuntimeMutation.variables?.jobName ?? null : null,
  };
}
