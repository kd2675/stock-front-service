import { useCallback, useMemo, useRef, useState } from "react";

import {
  DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
  DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
  DEFAULT_STRATEGY_INTENSITY,
} from "@/app/supply-demand/admin/AdminConstants";
import {
  resolveAutoParticipantSelectionDraft,
  resolveParticipantStrategySymbolDraft,
  toStrategyDraft,
  type AutoParticipantStrategyDraftValues,
} from "@/app/supply-demand/admin/AdminDraftHelpers";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";
import type {
  AutoParticipantEditDraft,
  AutoParticipantEditDraftSetters,
} from "@/app/supply-demand/admin/AdminAutoParticipantCards";
import type {
  AutoMarketConfig,
  AutoParticipant,
  AutoParticipantSymbolConfig,
} from "@/app/types/stock";

type AutoParticipantDraftSelectionOptions = {
  autoMarketConfigs: AutoMarketConfig[];
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
};

const DEFAULT_AUTO_PARTICIPANT_EDIT_DRAFT: AutoParticipantEditDraft = {
  displayName: "",
  profileType: DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
  enabled: true,
  recurringCashAmount: "",
  recurringCashIntervalValue: "",
  recurringCashIntervalUnit: DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
  recurringCashDisabled: false,
  cashAdjustmentAmount: "",
};

const DEFAULT_AUTO_PARTICIPANT_STRATEGY_DRAFT: AutoParticipantStrategyDraftValues = {
  editingKey: null,
  userKey: "",
  symbol: "",
  enabled: true,
  intensity: DEFAULT_STRATEGY_INTENSITY,
};

export function useAdminAutoParticipantDraftState() {
  const [editingAutoParticipantUserKey, setEditingAutoParticipantUserKey] = useState<string | null>(null);
  const [autoParticipantUserKey, setAutoParticipantUserKey] = useState("");
  const [autoParticipantEditDraft, setAutoParticipantEditDraft] = useState<AutoParticipantEditDraft>(DEFAULT_AUTO_PARTICIPANT_EDIT_DRAFT);
  const [autoParticipantStrategyDraft, setAutoParticipantStrategyDraft] = useState<AutoParticipantStrategyDraftValues>(DEFAULT_AUTO_PARTICIPANT_STRATEGY_DRAFT);
  const autoParticipantStrategySeedRef = useRef<string | null>(null);
  const setAutoParticipantStrategyDraftField = useAdminDraftFieldSetter(setAutoParticipantStrategyDraft);

  const setAutoParticipantEditDraftField = useCallback(<K extends keyof AutoParticipantEditDraft>(
    key: K,
    value: AutoParticipantEditDraft[K],
  ) => {
    setAutoParticipantEditDraft((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "profileType" ? { recurringCashDisabled: value === "DIVIDEND_REINVESTOR" } : {}),
    }));
  }, []);

  const applyAutoStrategyDraft = useCallback((draft: AutoParticipantStrategyDraftValues) => {
    setAutoParticipantStrategyDraft(draft);
  }, []);

  const resetAutoParticipantDraft = useCallback(() => {
    autoParticipantStrategySeedRef.current = null;
    setEditingAutoParticipantUserKey(null);
    setAutoParticipantUserKey("");
    setAutoParticipantEditDraft(DEFAULT_AUTO_PARTICIPANT_EDIT_DRAFT);
    setAutoParticipantStrategyDraft(DEFAULT_AUTO_PARTICIPANT_STRATEGY_DRAFT);
  }, []);

  const selectAutoParticipantDraft = useCallback((participant: AutoParticipant, options: AutoParticipantDraftSelectionOptions) => {
    autoParticipantStrategySeedRef.current = null;
    const draft = resolveAutoParticipantSelectionDraft({
      participant,
      participantSymbolConfigs: options.participantSymbolConfigs,
      autoMarketConfigs: options.autoMarketConfigs,
      defaultRecurringCashIntervalUnit: DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
      defaultStrategyIntensity: DEFAULT_STRATEGY_INTENSITY,
    });
    setEditingAutoParticipantUserKey(draft.participant.userKey);
    setAutoParticipantUserKey(draft.participant.userKey);
    setAutoParticipantEditDraft({
      ...draft.participant,
      recurringCashDisabled: draft.participant.profileType === "DIVIDEND_REINVESTOR",
    });
    applyAutoStrategyDraft(draft.strategy);
  }, [applyAutoStrategyDraft]);

  const selectAutoStrategyDraft = useCallback((config: AutoParticipantSymbolConfig) => {
    applyAutoStrategyDraft(toStrategyDraft(config));
  }, [applyAutoStrategyDraft]);

  const selectParticipantStrategySymbolDraft = useCallback((participantUserKey: string, symbol: string, options: AutoParticipantDraftSelectionOptions) => {
    applyAutoStrategyDraft(resolveParticipantStrategySymbolDraft({
      userKey: participantUserKey,
      symbol,
      participantSymbolConfigs: options.participantSymbolConfigs,
      autoMarketConfigs: options.autoMarketConfigs,
      defaultStrategyIntensity: DEFAULT_STRATEGY_INTENSITY,
    }));
  }, [applyAutoStrategyDraft]);

  const clearAutoStrategyDraft = useCallback((participantUserKey: string) => {
    setAutoParticipantStrategyDraft({
      ...DEFAULT_AUTO_PARTICIPANT_STRATEGY_DRAFT,
      userKey: participantUserKey,
    });
  }, []);

  const seedAutoParticipantStrategy = useCallback((participantUserKey: string, selectedSymbolConfigs: AutoParticipantSymbolConfig[]) => {
    if (selectedSymbolConfigs.length === 0) {
      return;
    }
    if (autoParticipantStrategySeedRef.current === participantUserKey) {
      return;
    }
    autoParticipantStrategySeedRef.current = participantUserKey;
    applyAutoStrategyDraft(toStrategyDraft(selectedSymbolConfigs[0]));
  }, [applyAutoStrategyDraft]);

  const autoParticipantEditDraftSetters: AutoParticipantEditDraftSetters = useMemo(() => ({
    setDisplayName: (value) => setAutoParticipantEditDraftField("displayName", value),
    setProfileType: (value) => setAutoParticipantEditDraftField("profileType", value),
    setEnabled: (value) => setAutoParticipantEditDraftField("enabled", value),
    setRecurringCashAmount: (value) => setAutoParticipantEditDraftField("recurringCashAmount", value),
    setRecurringCashIntervalValue: (value) => setAutoParticipantEditDraftField("recurringCashIntervalValue", value),
    setRecurringCashIntervalUnit: (value) => setAutoParticipantEditDraftField("recurringCashIntervalUnit", value),
    setCashAdjustmentAmount: (value) => setAutoParticipantEditDraftField("cashAdjustmentAmount", value),
  }), [setAutoParticipantEditDraftField]);

  return {
    autoParticipantEditDraft,
    autoParticipantEditDraftSetters,
    autoParticipantUserKey,
    cashAdjustmentAmount: autoParticipantEditDraft.cashAdjustmentAmount,
    clearAutoStrategyDraft,
    editingAutoParticipantUserKey,
    editingStrategyKey: autoParticipantStrategyDraft.editingKey,
    enabled: autoParticipantEditDraft.enabled,
    profileType: autoParticipantEditDraft.profileType,
    recurringCashAmount: autoParticipantEditDraft.recurringCashAmount,
    recurringCashIntervalUnit: autoParticipantEditDraft.recurringCashIntervalUnit,
    recurringCashIntervalValue: autoParticipantEditDraft.recurringCashIntervalValue,
    resetAutoParticipantDraft,
    selectAutoParticipantDraft,
    selectAutoStrategyDraft,
    selectParticipantStrategySymbolDraft,
    seedAutoParticipantStrategy,
    setAutoParticipantUserKey,
    setEditingStrategyKey: (value: string | null) => setAutoParticipantStrategyDraftField("editingKey", value),
    setStrategyEnabled: (value: boolean) => setAutoParticipantStrategyDraftField("enabled", value),
    setStrategyIntensity: (value: string) => setAutoParticipantStrategyDraftField("intensity", value),
    strategyEnabled: autoParticipantStrategyDraft.enabled,
    strategyIntensity: autoParticipantStrategyDraft.intensity,
    strategySymbol: autoParticipantStrategyDraft.symbol,
    strategyUserKey: autoParticipantStrategyDraft.userKey,
    displayName: autoParticipantEditDraft.displayName,
  };
}
