import { useState } from "react";

import {
  DEFAULT_AUTO_GENERATE_COUNT,
  DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX,
  DEFAULT_AUTO_GENERATE_KEY_PREFIX,
  DEFAULT_AUTO_GENERATE_PROFILE_MODE,
  DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
  DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
} from "@/app/supply-demand/admin/AdminConstants";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";
import type { AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type AutoParticipantGenerateProfileMode = "ROTATE" | "SINGLE";

type AutoParticipantGenerateDraftState = {
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

const DEFAULT_AUTO_PARTICIPANT_GENERATE_DRAFT: AutoParticipantGenerateDraftState = {
  count: DEFAULT_AUTO_GENERATE_COUNT,
  createAccount: true,
  displayPrefix: DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX,
  initialCashAmount: "",
  keyPrefix: DEFAULT_AUTO_GENERATE_KEY_PREFIX,
  profileMode: DEFAULT_AUTO_GENERATE_PROFILE_MODE,
  profileType: DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
  recurringCashAmount: "",
  recurringCashIntervalUnit: DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
  recurringCashIntervalValue: "",
};

export function useAdminAutoParticipantGenerateDraftState() {
  const [draft, setDraft] = useState<AutoParticipantGenerateDraftState>(DEFAULT_AUTO_PARTICIPANT_GENERATE_DRAFT);
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  return {
    draft,
    setCount: (value: string) => setDraftField("count", value),
    setCreateAccount: (value: boolean) => setDraftField("createAccount", value),
    setDisplayPrefix: (value: string) => setDraftField("displayPrefix", value),
    setInitialCashAmount: (value: string) => setDraftField("initialCashAmount", value),
    setKeyPrefix: (value: string) => setDraftField("keyPrefix", value),
    setProfileMode: (value: AutoParticipantGenerateProfileMode) => setDraftField("profileMode", value),
    setProfileType: (value: AutoParticipantProfileType) => setDraftField("profileType", value),
    setRecurringCashAmount: (value: string) => setDraftField("recurringCashAmount", value),
    setRecurringCashIntervalUnit: (value: RecurringCashIntervalUnit) => setDraftField("recurringCashIntervalUnit", value),
    setRecurringCashIntervalValue: (value: string) => setDraftField("recurringCashIntervalValue", value),
  };
}
