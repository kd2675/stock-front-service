import { useCallback, useMemo, useState } from "react";

import { DEFAULT_RECURRING_CASH_INTERVAL_UNIT } from "@/app/supply-demand/admin/AdminConstants";
import {
  resolveProfileConfigDraft,
} from "@/app/supply-demand/admin/AdminDraftHelpers";
import { buildDefaultProfileConfigDraft } from "@/app/supply-demand/admin/AdminProfileConfigFieldMetadata";
import type {
  ProfileConfigDraft,
  ProfileConfigDraftSetters,
  ProfileConfigDraftWithType,
} from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";
import type {
  AutoParticipantProfileConfig,
  AutoParticipantProfileType,
} from "@/app/types/stock";

const DEFAULT_PROFILE_CONFIG_DRAFT = buildDefaultProfileConfigDraft();

export function useAdminProfileConfigDraftState() {
  const [editingProfileType, setEditingProfileType] = useState<AutoParticipantProfileType | null>(null);
  const [draft, setDraft] = useState<ProfileConfigDraft>(DEFAULT_PROFILE_CONFIG_DRAFT);
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  const applyProfileConfigDraft = useCallback((nextDraft: ProfileConfigDraftWithType) => {
    const { profileType, ...draftValues } = nextDraft;
    setEditingProfileType(profileType);
    setDraft(draftValues);
  }, []);

  const selectProfileConfigDraft = useCallback((config: AutoParticipantProfileConfig) => {
    applyProfileConfigDraft(resolveProfileConfigDraft(config, DEFAULT_RECURRING_CASH_INTERVAL_UNIT));
  }, [applyProfileConfigDraft]);

  const draftSetters: ProfileConfigDraftSetters = useMemo(() => ({
    setNewsWeight: (value) => setDraftField("newsWeight", value),
    setMomentumWeight: (value) => setDraftField("momentumWeight", value),
    setContrarianWeight: (value) => setDraftField("contrarianWeight", value),
    setLossAversionWeight: (value) => setDraftField("lossAversionWeight", value),
    setHerdingWeight: (value) => setDraftField("herdingWeight", value),
    setMarketMakingWeight: (value) => setDraftField("marketMakingWeight", value),
    setOverconfidenceWeight: (value) => setDraftField("overconfidenceWeight", value),
    setNoiseWeight: (value) => setDraftField("noiseWeight", value),
    setPanicSellWeight: (value) => setDraftField("panicSellWeight", value),
    setDipBuyWeight: (value) => setDraftField("dipBuyWeight", value),
    setOrderMultiplier: (value) => setDraftField("orderMultiplier", value),
    setAggressionMultiplier: (value) => setDraftField("aggressionMultiplier", value),
    setPricePressureSensitivity: (value) => setDraftField("pricePressureSensitivity", value),
    setOrderTtlMultiplier: (value) => setDraftField("orderTtlMultiplier", value),
    setQuantityMultiplier: (value) => setDraftField("quantityMultiplier", value),
    setHoldingPatienceWeight: (value) => setDraftField("holdingPatienceWeight", value),
    setDeepLossHoldWeight: (value) => setDraftField("deepLossHoldWeight", value),
    setProfitTakingWeight: (value) => setDraftField("profitTakingWeight", value),
    setRecurringDepositAmount: (value) => setDraftField("recurringDepositAmount", value),
    setRecurringDepositIntervalValue: (value) => setDraftField("recurringDepositIntervalValue", value),
    setRecurringDepositIntervalUnit: (value) => setDraftField("recurringDepositIntervalUnit", value),
  }), [setDraftField]);

  return {
    draft,
    draftSetters,
    editingProfileType,
    selectProfileConfigDraft,
    setEditingProfileType,
  };
}
