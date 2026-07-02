import { useCallback } from "react";

import { resolveSelectedProfileConfig } from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type {
  AutoMarketConfig,
  AutoMarketStatus,
  AutoParticipant,
  AutoParticipantProfileConfig,
  AutoParticipantProfileType,
  AutoParticipantSymbolConfig,
} from "@/app/types/stock";

type AutoParticipantDraftSelectionOptions = {
  autoMarketConfigs: AutoMarketConfig[];
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
};

export function useAdminDraftSelectionActions({
  applyAutoParticipantDraftSelection,
  applyParticipantStrategySymbolDraftSelection,
  profileConfigs,
  selectProfileConfigDraft,
  setEditingProfileType,
  status,
}: {
  applyAutoParticipantDraftSelection: (participant: AutoParticipant, options: AutoParticipantDraftSelectionOptions) => void;
  applyParticipantStrategySymbolDraftSelection: (
    participantUserKey: string,
    symbol: string,
    options: AutoParticipantDraftSelectionOptions,
  ) => void;
  profileConfigs: AutoParticipantProfileConfig[];
  selectProfileConfigDraft: (config: AutoParticipantProfileConfig) => void;
  setEditingProfileType: (profileType: AutoParticipantProfileType | null) => void;
  status: AutoMarketStatus | null | undefined;
}) {
  const selectAutoParticipantDraft = useCallback((participant: AutoParticipant) => {
    applyAutoParticipantDraftSelection(participant, {
      participantSymbolConfigs: status?.participantSymbolConfigs ?? [],
      autoMarketConfigs: status?.configs ?? [],
    });
  }, [applyAutoParticipantDraftSelection, status]);

  const selectParticipantStrategySymbolDraft = useCallback((participantUserKey: string, symbol: string) => {
    applyParticipantStrategySymbolDraftSelection(participantUserKey, symbol, {
      participantSymbolConfigs: status?.participantSymbolConfigs ?? [],
      autoMarketConfigs: status?.configs ?? [],
    });
  }, [applyParticipantStrategySymbolDraftSelection, status]);

  const selectProfileConfigByType = useCallback((profileType: string) => {
    const config = resolveSelectedProfileConfig(profileConfigs, profileType);
    if (config) {
      selectProfileConfigDraft(config);
      return;
    }
    setEditingProfileType(null);
  }, [profileConfigs, selectProfileConfigDraft, setEditingProfileType]);

  return {
    selectAutoParticipantDraft,
    selectParticipantStrategySymbolDraft,
    selectProfileConfigByType,
  };
}
