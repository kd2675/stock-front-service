import type { AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type AutoParticipantEditDraft = {
  displayName: string;
  profileType: AutoParticipantProfileType;
  enabled: boolean;
  recurringCashAmount: string;
  recurringCashIntervalValue: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashDisabled: boolean;
  cashAdjustmentAmount: string;
};

export type AutoParticipantEditDraftSetters = {
  setDisplayName: (value: string) => void;
  setProfileType: (value: AutoParticipantProfileType) => void;
  setEnabled: (value: boolean) => void;
  setRecurringCashAmount: (value: string) => void;
  setRecurringCashIntervalValue: (value: string) => void;
  setRecurringCashIntervalUnit: (value: RecurringCashIntervalUnit) => void;
  setCashAdjustmentAmount: (value: string) => void;
};
