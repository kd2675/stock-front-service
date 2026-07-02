import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  adminUpsertAutoParticipantMutationOptions,
  adminWithdrawAutoParticipantMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import { toAutoParticipantTogglePayload } from "@/app/supply-demand/admin/AdminAutoParticipantActionHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantCards";
import { buildAutoParticipantPayload } from "@/app/supply-demand/admin/AdminAutoParticipantMutationPayloadHelpers";
import type { AutoParticipant, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export function useAdminAutoParticipantMutationActions({
  autoParticipantEditDraftSetters,
  autoParticipantUserKey,
  displayName,
  editingAutoParticipantUserKey,
  enabled,
  profileType,
  recurringCashAmount,
  recurringCashIntervalUnit,
  recurringCashIntervalValue,
  reloadAutoParticipantState,
  requireAdminToken,
  resetAutoParticipantDraft,
  setMessage,
}: {
  autoParticipantEditDraftSetters: AutoParticipantEditDraftSetters;
  autoParticipantUserKey: string;
  displayName: string;
  editingAutoParticipantUserKey: string | null;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashIntervalValue: string;
  reloadAutoParticipantState: () => void;
  requireAdminToken: RequireAdminToken;
  resetAutoParticipantDraft: () => void;
  setMessage: AdminActionMessageSetter;
}) {
  const saveAutoParticipantMutation = useMutation(adminUpsertAutoParticipantMutationOptions());
  const toggleAutoParticipantMutation = useMutation(adminUpsertAutoParticipantMutationOptions());
  const withdrawAutoParticipantMutation = useMutation(adminWithdrawAutoParticipantMutationOptions());
  const saveAutoParticipant = saveAutoParticipantMutation.mutateAsync;
  const toggleAutoParticipant = toggleAutoParticipantMutation.mutateAsync;
  const withdrawAutoParticipant = withdrawAutoParticipantMutation.mutateAsync;

  const submitAutoParticipant = useCallback(async () => {
    if (saveAutoParticipantMutation.isPending) {
      return;
    }
    const participantDraft = buildAutoParticipantPayload({
      userKey: editingAutoParticipantUserKey ?? autoParticipantUserKey,
      displayName,
      enabled,
      profileType,
      recurringCashAmount,
      recurringCashIntervalValue,
      recurringCashIntervalUnit,
    });
    if (!participantDraft.ok) {
      setMessage(participantDraft.message);
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 자동 참여자를 저장할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await saveAutoParticipant({
      token,
      userKey: participantDraft.userKey,
      payload: participantDraft.payload,
    });
    if (reportAdminActionFailure(result, "자동 참여자 저장에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage("자동 참여자를 저장했습니다.");
    if (editingAutoParticipantUserKey) {
      resetAutoParticipantDraft();
    }
    reloadAutoParticipantState();
  }, [
    autoParticipantUserKey,
    displayName,
    editingAutoParticipantUserKey,
    enabled,
    profileType,
    recurringCashAmount,
    recurringCashIntervalUnit,
    recurringCashIntervalValue,
    reloadAutoParticipantState,
    requireAdminToken,
    resetAutoParticipantDraft,
    saveAutoParticipant,
    saveAutoParticipantMutation.isPending,
    setMessage,
  ]);

  const toggleAutoParticipantEnabled = useCallback(async (participant: AutoParticipant) => {
    if (toggleAutoParticipantMutation.isPending) {
      return;
    }
    const nextEnabled = !participant.enabled;
    const token = await requireAdminToken("관리자 로그인 후 자동 참여자 상태를 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await toggleAutoParticipant({
      token,
      userKey: participant.userKey,
      payload: toAutoParticipantTogglePayload(participant, nextEnabled),
    });
    if (reportAdminActionFailure(result, "자동 참여자 상태 변경에 실패했습니다.", setMessage)) {
      return;
    }
    if (editingAutoParticipantUserKey === participant.userKey) {
      autoParticipantEditDraftSetters.setEnabled(nextEnabled);
    }
    setMessage(nextEnabled ? "자동 참여자를 가동했습니다." : "자동 참여자를 정지했습니다.");
    reloadAutoParticipantState();
  }, [
    autoParticipantEditDraftSetters,
    editingAutoParticipantUserKey,
    reloadAutoParticipantState,
    requireAdminToken,
    setMessage,
    toggleAutoParticipant,
    toggleAutoParticipantMutation.isPending,
  ]);

  const withdrawAutoParticipantRow = useCallback(async (participant: AutoParticipant) => {
    if (withdrawAutoParticipantMutation.isPending) {
      return;
    }
    const confirmed = window.confirm(`${participant.displayName} 자동 참여자를 탈퇴 처리할까요? 미체결 자동 주문은 취소됩니다.`);
    if (!confirmed) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 자동 참여자를 탈퇴 처리할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await withdrawAutoParticipant({
      token,
      userKey: participant.userKey,
    });
    if (reportAdminActionFailure(result, "자동 참여자 탈퇴 처리에 실패했습니다.", setMessage)) {
      return;
    }
    if (editingAutoParticipantUserKey === participant.userKey) {
      resetAutoParticipantDraft();
    }
    setMessage("자동 참여자를 탈퇴 처리했습니다.");
    reloadAutoParticipantState();
  }, [
    editingAutoParticipantUserKey,
    reloadAutoParticipantState,
    requireAdminToken,
    resetAutoParticipantDraft,
    setMessage,
    withdrawAutoParticipant,
    withdrawAutoParticipantMutation.isPending,
  ]);

  return {
    savingAutoParticipant: saveAutoParticipantMutation.isPending,
    submitAutoParticipant,
    togglingAutoParticipantUserKey: toggleAutoParticipantMutation.isPending ? toggleAutoParticipantMutation.variables?.userKey ?? null : null,
    toggleAutoParticipantEnabled,
    withdrawingAutoParticipantUserKey: withdrawAutoParticipantMutation.isPending ? withdrawAutoParticipantMutation.variables?.userKey ?? null : null,
    withdrawAutoParticipantRow,
  };
}
