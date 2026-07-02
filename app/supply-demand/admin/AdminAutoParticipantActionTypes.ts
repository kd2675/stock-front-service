import type { AutoParticipantGenerateProfileMode } from "@/app/supply-demand/admin/useAdminAutoParticipantGenerateDraftState";
import type { AutoParticipant, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type AutoParticipantGenerateDraft = {
  count: string;
  createAccount: boolean;
  displayPrefix: string;
  initialCashAmount: string;
  keyPrefix: string;
  profileMode: AutoParticipantGenerateProfileMode;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashIntervalValue: string;
};

export type AutoParticipantActionParticipants = {
  existingParticipants: AutoParticipant[];
};

export type AutoParticipantRecurringCashDraftValues = {
  recurringCashAmount: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashIntervalValue: string;
};
