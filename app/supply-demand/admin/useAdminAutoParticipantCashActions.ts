import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { adminAdjustAutoParticipantCashMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantCards";
import { buildCashAdjustmentPayload, type CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import { useAdminCashAdjustmentRunner } from "@/app/supply-demand/admin/useAdminCashAdjustmentRunner";

export function useAdminAutoParticipantCashActions({
  autoParticipantEditDraftSetters,
  autoParticipantUserKey,
  cashAdjustmentAmount,
  editingAutoParticipantUserKey,
  reloadAdminCashFlowState,
  reloadAutoParticipantState,
  requireAdminToken,
  setMessage,
}: {
  autoParticipantEditDraftSetters: AutoParticipantEditDraftSetters;
  autoParticipantUserKey: string;
  cashAdjustmentAmount: string;
  editingAutoParticipantUserKey: string | null;
  reloadAdminCashFlowState: () => void;
  reloadAutoParticipantState: () => void;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const { adjustingCashType, runCashAdjustment } = useAdminCashAdjustmentRunner();
  const adjustAutoParticipantCashMutation = useMutation(adminAdjustAutoParticipantCashMutationOptions());
  const adjustAutoParticipantCash = adjustAutoParticipantCashMutation.mutateAsync;

  const adjustAutoParticipantCashBalance = useCallback(async (adjustmentType: CashAdjustmentType) => {
    const cashAdjustment = buildCashAdjustmentPayload({
      userKey: editingAutoParticipantUserKey ?? autoParticipantUserKey,
      amount: cashAdjustmentAmount,
      adjustmentType,
      invalidMessage: "입금/회수할 자동 참여자와 금액을 확인해 주세요.",
    });
    if (!cashAdjustment.ok) {
      setMessage(cashAdjustment.message);
      return;
    }
    await runCashAdjustment(adjustmentType, async () => {
      const token = await requireAdminToken("관리자 로그인 후 자동 참여자 현금을 조정할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await adjustAutoParticipantCash({
        token,
        userKey: cashAdjustment.userKey,
        payload: cashAdjustment.payload,
      });
      if (reportAdminActionFailure(result, "자동 참여자 현금 조정에 실패했습니다.", setMessage)) {
        return;
      }
      autoParticipantEditDraftSetters.setCashAdjustmentAmount("");
      setMessage(adjustmentType === "DEPOSIT" ? "자동 참여자 계좌에 입금했습니다." : "자동 참여자 계좌에서 회수했습니다.");
      reloadAdminCashFlowState();
      reloadAutoParticipantState();
    });
  }, [
    adjustAutoParticipantCash,
    autoParticipantEditDraftSetters,
    autoParticipantUserKey,
    cashAdjustmentAmount,
    editingAutoParticipantUserKey,
    reloadAdminCashFlowState,
    reloadAutoParticipantState,
    requireAdminToken,
    runCashAdjustment,
    setMessage,
  ]);

  return {
    adjustingCashType,
    adjustAutoParticipantCashBalance,
  };
}
