import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_AUTO_MARKET_MAX_ORDER_QUANTITY,
  DEFAULT_AUTO_MARKET_ORDER_TTL_SECONDS,
} from "@/app/supply-demand/admin/AdminConstants";
import { resolveAutoMarketConfigDraft } from "@/app/supply-demand/admin/AdminDraftHelpers";
import type {
  AutoMarketConfigDraft,
  AutoMarketConfigDraftSetters,
} from "@/app/supply-demand/admin/AdminAutoMarketConfigPanel";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";
import type { AutoMarketConfig } from "@/app/types/stock";

const DEFAULT_AUTO_MARKET_CONFIG_DRAFT: AutoMarketConfigDraft = {
  symbol: "",
  enabled: true,
  maxOrderQuantity: DEFAULT_AUTO_MARKET_MAX_ORDER_QUANTITY,
  orderTtlSeconds: DEFAULT_AUTO_MARKET_ORDER_TTL_SECONDS,
  primaryDistributionBias: createNeutralDistributionBiasDraft(),
  secondaryDistributionBias: createNeutralDistributionBiasDraft(),
};

export function useAdminAutoMarketConfigDraftState() {
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [draft, setDraft] = useState<AutoMarketConfigDraft>(DEFAULT_AUTO_MARKET_CONFIG_DRAFT);
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  const applyAutoMarketConfigDraft = useCallback((nextDraft: ReturnType<typeof resolveAutoMarketConfigDraft>) => {
    setDraft(nextDraft);
  }, []);

  const selectAutoMarketConfigDraft = useCallback((config: AutoMarketConfig) => {
    const draft = resolveAutoMarketConfigDraft(config);
    setEditingSymbol(draft.symbol);
    applyAutoMarketConfigDraft(draft);
  }, [applyAutoMarketConfigDraft]);

  const draftSetters: AutoMarketConfigDraftSetters = useMemo(() => ({
    setSymbol: (value) => setDraftField("symbol", value),
    setEnabled: (value) => setDraftField("enabled", value),
    setPrimaryDistributionBias: (field, value) => setDraft((current) => ({
      ...current,
      primaryDistributionBias: { ...current.primaryDistributionBias, [field]: value },
    })),
    setSecondaryDistributionBias: (field, value) => setDraft((current) => ({
      ...current,
      secondaryDistributionBias: { ...current.secondaryDistributionBias, [field]: value },
    })),
    setMaxOrderQuantity: (value) => setDraftField("maxOrderQuantity", value),
    setOrderTtlSeconds: (value) => setDraftField("orderTtlSeconds", value),
    setEditingSymbol,
  }), [setDraftField]);

  return {
    applyAutoMarketConfigDraft,
    draft,
    draftSetters,
    editingSymbol,
    selectAutoMarketConfigDraft,
    setEditingSymbol,
    setEnabled: draftSetters.setEnabled,
    setSymbol: draftSetters.setSymbol,
    symbol: draft.symbol,
  };
}

function createNeutralDistributionBiasDraft() {
  return {
    pricePressure: "0",
    assetPreferencePressure: "0",
    volatilityPressure: "0",
    liquidityPressure: "0",
    executionAggressionPressure: "0",
  };
}
