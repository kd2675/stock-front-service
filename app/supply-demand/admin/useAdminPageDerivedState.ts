import { useCallback, useMemo } from "react";

import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import {
  buildSymbolMap,
  resolveSelectedProfileConfig,
} from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type {
  AutoParticipantProfileConfig,
  OrderBookMarketStatus,
} from "@/app/types/stock";

type AdminPageDerivedStateOptions = {
  activeAdminSection: AdminSection;
  autoParticipantProfileOverviewSummaries: ParticipantProfileOverviewSummary[];
  editingProfileType: AutoParticipantProfileConfig["profileType"] | null;
  orderBookConfigs: OrderBookMarketStatus["configs"];
  profileConfigs: AutoParticipantProfileConfig[];
  selectProfileConfigDraft: (config: AutoParticipantProfileConfig) => void;
  setEditingProfileType: (profileType: AutoParticipantProfileConfig["profileType"] | null) => void;
};

const EMPTY_PARTICIPANT_PROFILE_OVERVIEW_SUMMARIES: ParticipantProfileOverviewSummary[] = [];

export function useAdminPageDerivedState({
  activeAdminSection,
  autoParticipantProfileOverviewSummaries,
  editingProfileType,
  orderBookConfigs,
  profileConfigs,
  selectProfileConfigDraft,
  setEditingProfileType,
}: AdminPageDerivedStateOptions) {
  const orderBookConfigBySymbol = useMemo<Map<string, OrderBookMarketStatus["configs"][number]>>(
    () => buildSymbolMap(orderBookConfigs),
    [orderBookConfigs],
  );
  const selectedProfileConfig = useMemo(
    () => resolveSelectedProfileConfig(profileConfigs, editingProfileType),
    [editingProfileType, profileConfigs],
  );
  const selectProfileConfigByType = useCallback((profileType: string) => {
    const config = resolveSelectedProfileConfig(profileConfigs, profileType);
    if (config) {
      selectProfileConfigDraft(config);
      return;
    }
    setEditingProfileType(null);
  }, [profileConfigs, selectProfileConfigDraft, setEditingProfileType]);
  const participantProfileOverviewSummaries = activeAdminSection === "participants-overview"
    ? autoParticipantProfileOverviewSummaries
    : EMPTY_PARTICIPANT_PROFILE_OVERVIEW_SUMMARIES;

  return {
    orderBookConfigBySymbol,
    participantProfileOverviewSummaries,
    selectProfileConfigByType,
    selectedProfileConfig,
  };
}
