import { useEffect, useMemo } from "react";

import {
  ADMIN_PARTICIPANT_PAGE_SIZE,
} from "@/app/supply-demand/admin/AdminConstants";
import type { AutoParticipantListView } from "@/app/supply-demand/admin/AdminAutoParticipantManagementTypes";
import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import { useAdminDraftSelectionActions } from "@/app/supply-demand/admin/useAdminDraftSelectionActions";
import { useAdminParticipantListControls } from "@/app/supply-demand/admin/useAdminParticipantListControls";
import { useAdminParticipantRows } from "@/app/supply-demand/admin/useAdminParticipantRows";
import { useAdminSalaryEligibilityRows } from "@/app/supply-demand/admin/useAdminSalaryEligibilityRows";
import { useAdminSelectionState } from "@/app/supply-demand/admin/useAdminSelectionState";
import type {
  AutoMarketConfig,
  AutoMarketStatus,
  AutoParticipant,
  AutoParticipantProfileConfig,
  AutoParticipantSymbolConfig,
  ListingAutoAccount,
  OrderBookMarketStatus,
} from "@/app/types/stock";

type AdminPageDerivedStateOptions = {
  accessToken: string | null;
  activeAdminSection: AdminSection;
  adminStatus: "checking" | "allowed" | "denied";
  autoParticipantProfileOverviewSummaries: ParticipantProfileOverviewSummary[];
  autoParticipants: AutoParticipant[];
  autoParticipantSymbolConfigs: AutoParticipantSymbolConfig[];
  editingAutoParticipantUserKey: string | null;
  editingProfileType: AutoParticipantProfileConfig["profileType"] | null;
  listingAutoAccounts: ListingAutoAccount[];
  listingAutoSymbol: string;
  orderBookConfigs: OrderBookMarketStatus["configs"];
  profileConfigs: AutoParticipantProfileConfig[];
  status: AutoMarketStatus | null | undefined;
  strategySymbol: string;
  applyAutoParticipantDraftSelection: (participant: AutoParticipant, options: {
    autoMarketConfigs: AutoMarketConfig[];
    participantSymbolConfigs: AutoParticipantSymbolConfig[];
  }) => void;
  applyParticipantStrategySymbolDraftSelection: (participantUserKey: string, symbol: string, options: {
    autoMarketConfigs: AutoMarketConfig[];
    participantSymbolConfigs: AutoParticipantSymbolConfig[];
  }) => void;
  seedAutoParticipantStrategy: (participantUserKey: string, selectedSymbolConfigs: AutoParticipantSymbolConfig[]) => void;
  selectProfileConfigDraft: (config: AutoParticipantProfileConfig) => void;
  setEditingProfileType: (profileType: AutoParticipantProfileConfig["profileType"] | null) => void;
};

const EMPTY_PARTICIPANT_PROFILE_OVERVIEW_SUMMARIES: ParticipantProfileOverviewSummary[] = [];

export function useAdminPageDerivedState(options: AdminPageDerivedStateOptions) {
  const {
    accessToken,
    activeAdminSection,
    adminStatus,
    autoParticipantProfileOverviewSummaries,
    autoParticipants,
    autoParticipantSymbolConfigs,
    editingAutoParticipantUserKey,
    editingProfileType,
    listingAutoAccounts,
    listingAutoSymbol,
    orderBookConfigs,
    profileConfigs,
    status,
    strategySymbol,
    applyAutoParticipantDraftSelection,
    applyParticipantStrategySymbolDraftSelection,
    seedAutoParticipantStrategy,
    selectProfileConfigDraft,
    setEditingProfileType,
  } = options;
  const participantListControls = useAdminParticipantListControls();
  const {
    orderBookConfigBySymbol,
    profileConfigByType,
    selectedAutoParticipant,
    selectedAutoParticipantSymbolConfigs,
    selectedListingAutoAccount,
    selectedParticipantStrategyKey,
    selectedProfileConfig,
  } = useAdminSelectionState({
    autoParticipantSymbolConfigs,
    autoParticipants,
    editingAutoParticipantUserKey,
    editingProfileType,
    listingAutoAccounts,
    listingAutoSymbol,
    orderBookConfigs,
    profileConfigs,
    strategySymbol,
  });

  useEffect(() => {
    if (editingAutoParticipantUserKey === null) {
      return;
    }
    seedAutoParticipantStrategy(editingAutoParticipantUserKey, selectedAutoParticipantSymbolConfigs);
  }, [editingAutoParticipantUserKey, seedAutoParticipantStrategy, selectedAutoParticipantSymbolConfigs]);

  const salaryEligibility = useAdminSalaryEligibilityRows({
    enabled: activeAdminSection === "salary",
    participants: autoParticipants,
    profileConfigByType,
  });
  const participantProfileOverviewSummaries = activeAdminSection === "profile-overview"
    ? autoParticipantProfileOverviewSummaries
    : EMPTY_PARTICIPANT_PROFILE_OVERVIEW_SUMMARIES;
  const {
    filteredParticipants,
    pagination: participantPagination,
    visibleAutoParticipantOverviewByUserKey,
    visibleParticipantOverviewsQuery,
    visibleParticipants,
  } = useAdminParticipantRows({
    accessToken,
    adminStatus,
    enabled: activeAdminSection === "participants",
    page: participantListControls.page,
    pageSize: ADMIN_PARTICIPANT_PAGE_SIZE,
    participants: autoParticipants,
    profileType: participantListControls.profileFilter,
    search: participantListControls.search,
    status: participantListControls.statusFilter,
  });
  const {
    selectAutoParticipantDraft,
    selectParticipantStrategySymbolDraft,
    selectProfileConfigByType,
  } = useAdminDraftSelectionActions({
    applyAutoParticipantDraftSelection,
    applyParticipantStrategySymbolDraftSelection,
    profileConfigs,
    selectProfileConfigDraft,
    setEditingProfileType,
    status,
  });
  const participantList: AutoParticipantListView = useMemo(() => ({
    controls: {
      search: participantListControls.search,
      statusFilter: participantListControls.statusFilter,
      profileFilter: participantListControls.profileFilter,
      onSearchChange: participantListControls.updateSearch,
      onStatusFilterChange: participantListControls.updateStatusFilter,
      onProfileFilterChange: participantListControls.updateProfileFilter,
      onPageChange: participantListControls.setPage,
    },
    filteredCount: filteredParticipants.length,
    totalCount: autoParticipants.length,
    pagination: participantPagination,
    visibleParticipants,
    overviewByUserKey: visibleAutoParticipantOverviewByUserKey,
    overviewsFetching: visibleParticipantOverviewsQuery.isFetching,
  }), [
    filteredParticipants.length,
    participantListControls.profileFilter,
    participantListControls.search,
    participantListControls.setPage,
    participantListControls.statusFilter,
    participantListControls.updateProfileFilter,
    participantListControls.updateSearch,
    participantListControls.updateStatusFilter,
    participantPagination,
    autoParticipants.length,
    visibleAutoParticipantOverviewByUserKey,
    visibleParticipantOverviewsQuery.isFetching,
    visibleParticipants,
  ]);

  return {
    orderBookConfigBySymbol,
    participantList,
    participantProfileOverviewSummaries,
    salaryEligibility,
    selectAutoParticipantDraft,
    selectParticipantStrategySymbolDraft,
    selectProfileConfigByType,
    selectedAutoParticipant,
    selectedAutoParticipantSymbolConfigs,
    selectedListingAutoAccount,
    selectedParticipantStrategyKey,
    selectedProfileConfig,
  };
}
