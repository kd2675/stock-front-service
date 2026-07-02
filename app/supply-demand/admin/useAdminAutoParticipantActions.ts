import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantCards";
import type { AutoParticipantGenerateDraft } from "@/app/supply-demand/admin/AdminAutoParticipantActionTypes";
import { useAdminAutoParticipantCashActions } from "@/app/supply-demand/admin/useAdminAutoParticipantCashActions";
import { useAdminAutoParticipantGenerateActions } from "@/app/supply-demand/admin/useAdminAutoParticipantGenerateActions";
import { useAdminAutoParticipantMutationActions } from "@/app/supply-demand/admin/useAdminAutoParticipantMutationActions";
import type { AutoParticipant, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export function useAdminAutoParticipantActions({
  autoParticipantEditDraftSetters,
  autoParticipantUserKey,
  cashAdjustmentAmount,
  displayName,
  editingAutoParticipantUserKey,
  enabled,
  existingParticipants,
  generateDraft,
  profileType,
  recurringCashAmount,
  recurringCashIntervalUnit,
  recurringCashIntervalValue,
  reloadAdminCashFlowState,
  reloadAutoParticipantState,
  requireAdminToken,
  resetAutoParticipantDraft,
  setMessage,
}: {
  autoParticipantEditDraftSetters: AutoParticipantEditDraftSetters;
  autoParticipantUserKey: string;
  cashAdjustmentAmount: string;
  displayName: string;
  editingAutoParticipantUserKey: string | null;
  enabled: boolean;
  existingParticipants: AutoParticipant[];
  generateDraft: AutoParticipantGenerateDraft;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashIntervalValue: string;
  reloadAdminCashFlowState: () => void;
  reloadAutoParticipantState: () => void;
  requireAdminToken: RequireAdminToken;
  resetAutoParticipantDraft: () => void;
  setMessage: AdminActionMessageSetter;
}) {
  const {
    savingAutoParticipant,
    submitAutoParticipant,
    togglingAutoParticipantUserKey,
    toggleAutoParticipantEnabled,
    withdrawingAutoParticipantUserKey,
    withdrawAutoParticipantRow,
  } = useAdminAutoParticipantMutationActions({
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
  });
  const {
    generateAutoParticipants,
    generatingAutoParticipants,
  } = useAdminAutoParticipantGenerateActions({
    existingParticipants,
    generateDraft,
    requireAdminToken,
    resetAutoParticipantDraft,
    reloadAutoParticipantState,
    savingAutoParticipant,
    setMessage,
  });
  const {
    adjustingCashType,
    adjustAutoParticipantCashBalance,
  } = useAdminAutoParticipantCashActions({
    autoParticipantEditDraftSetters,
    autoParticipantUserKey,
    cashAdjustmentAmount,
    editingAutoParticipantUserKey,
    reloadAdminCashFlowState,
    reloadAutoParticipantState,
    requireAdminToken,
    setMessage,
  });

  return {
    adjustingCashType,
    adjustAutoParticipantCashBalance,
    generateAutoParticipants,
    generatingAutoParticipants,
    savingAutoParticipant,
    submitAutoParticipant,
    togglingAutoParticipantUserKey,
    toggleAutoParticipantEnabled,
    withdrawingAutoParticipantUserKey,
    withdrawAutoParticipantRow,
  };
}
