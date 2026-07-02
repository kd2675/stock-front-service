import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useState } from "react";

import useAdminAccess from "@/app/hooks/useAdminAccess";
import { buildAdminPageContentProps } from "@/app/supply-demand/admin/buildAdminPageContentProps";
import {
  resolveAdminSectionFromPath,
  resolveAdminTabFromPath,
} from "@/app/supply-demand/admin/AdminNavigationConfig";
import { useAdminPageActions } from "@/app/supply-demand/admin/useAdminPageActions";
import { useAdminPageDerivedState } from "@/app/supply-demand/admin/useAdminPageDerivedState";
import { useAdminPageDraftState } from "@/app/supply-demand/admin/useAdminPageDraftState";
import { useAdminPageQueries } from "@/app/supply-demand/admin/useAdminPageQueries";
import { useAdminQueryInvalidations } from "@/app/supply-demand/admin/useAdminQueryInvalidations";

export function useSupplyDemandAdminPageModel() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const activeAdminTab = resolveAdminTabFromPath(pathname);
  const activeAdminSection = resolveAdminSectionFromPath(pathname);
  const { accessToken, adminStatus } = useAdminAccess();
  const queryInvalidations = useAdminQueryInvalidations(queryClient);
  const [adminCashFlowPageIndex, setAdminCashFlowPageIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const drafts = useAdminPageDraftState();

  const queries = useAdminPageQueries({
    accessToken,
    activeAdminSection,
    activeAdminTab,
    adminCashFlowPageIndex,
    adminStatus,
    actionSymbol: drafts.stockEvent.actionSymbol,
    editingAutoParticipantUserKey: drafts.autoParticipant.editingAutoParticipantUserKey,
    reportSymbol: drafts.instrumentReport.symbol,
    userFundFlowUserKey: drafts.userCashAdjustment.fundFlowUserKey,
  });
  const actions = useAdminPageActions({
    drafts,
    queryClient,
    queries,
    queryInvalidations,
    setMessage,
  });
  const derived = useAdminPageDerivedState({
    accessToken,
    activeAdminSection,
    adminStatus,
    autoParticipantProfileOverviewSummaries: queries.autoParticipantProfileOverviewSummaries,
    autoParticipantSymbolConfigs: queries.autoParticipantSymbolConfigs,
    autoParticipants: queries.autoParticipants,
    editingAutoParticipantUserKey: drafts.autoParticipant.editingAutoParticipantUserKey,
    editingProfileType: drafts.profileConfig.editingProfileType,
    listingAutoAccounts: queries.listingAutoAccounts,
    listingAutoSymbol: drafts.listingAutoAccount.symbol,
    orderBookConfigs: queries.orderBookConfigs,
    profileConfigs: queries.profileConfigs,
    status: queries.status,
    strategySymbol: drafts.autoParticipant.strategySymbol,
    applyAutoParticipantDraftSelection: drafts.autoParticipant.selectAutoParticipantDraft,
    applyParticipantStrategySymbolDraftSelection: drafts.autoParticipant.selectParticipantStrategySymbolDraft,
    seedAutoParticipantStrategy: drafts.autoParticipant.seedAutoParticipantStrategy,
    selectProfileConfigDraft: drafts.profileConfig.selectProfileConfigDraft,
    setEditingProfileType: drafts.profileConfig.setEditingProfileType,
  });

  return {
    adminStatus,
    contentProps: buildAdminPageContentProps({
      activeAdminSection,
      activeAdminTab,
      actions,
      derived,
      drafts,
      message,
      queries,
      queryInvalidations,
      setAdminCashFlowPageIndex,
      setMessage,
    }),
  };
}
