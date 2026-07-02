import type { AdminSection, AdminTab } from "@/app/supply-demand/admin/AdminNavigationConfig";

type AdminAccessStatus = "checking" | "allowed" | "denied";

export type AdminPageQueryFlags = {
  includeConfigs: boolean;
  includeListingAutoAccounts: boolean;
  includeParticipantProfileConfigs: boolean;
  includeParticipants: boolean;
  includeParticipantSymbolConfigs: boolean;
  isAdminAllowed: boolean;
  isAccountCashSection: boolean;
  isBatchSection: boolean;
  isCashFlowLedgerSection: boolean;
  isEventsSection: boolean;
  isMarketSection: boolean;
  shouldLoadAdminFlowOverview: boolean;
  shouldLoadAutoMarketDetails: boolean;
  shouldLoadAutoMarketSummary: boolean;
  shouldLoadAutoParticipants: boolean;
  shouldLoadAutoParticipantProfileOverviews: boolean;
  shouldLoadInstrumentDetails: boolean;
  shouldLoadMarketSummary: boolean;
  shouldUseAdminFlowOverview: boolean;
  shouldUseAutoMarketDetails: boolean;
  shouldUseAutoMarketSummary: boolean;
  shouldUseAutoParticipants: boolean;
  shouldUseAutoParticipantProfileOverviews: boolean;
  shouldUseInstrumentDetails: boolean;
  shouldUseMarketSummary: boolean;
};

export function resolveAdminPageQueryFlags({
  activeAdminSection,
  activeAdminTab,
  adminStatus,
  editingAutoParticipantUserKey,
}: {
  activeAdminSection: AdminSection;
  activeAdminTab: AdminTab;
  adminStatus: AdminAccessStatus;
  editingAutoParticipantUserKey: string | null;
}): AdminPageQueryFlags {
  const isAccountCashSection = activeAdminSection === "account-cash";
  const isAdminAllowed = adminStatus === "allowed";
  const isBatchSection = activeAdminSection === "batch";
  const isCashFlowLedgerSection = activeAdminSection === "cash-flow-ledger";
  const isEventsSection = activeAdminSection === "events";
  const isMarketSection = activeAdminSection === "market";
  const shouldLoadAutoParticipants = activeAdminSection === "salary" || activeAdminSection === "participants";
  const includeParticipants = false;
  const includeParticipantStrategyDetails = activeAdminSection === "participants" && editingAutoParticipantUserKey !== null;
  const includeConfigs = activeAdminSection === "auto-symbols" || includeParticipantStrategyDetails;
  const includeParticipantSymbolConfigs = includeParticipantStrategyDetails;
  const includeParticipantProfileConfigs = activeAdminSection === "salary" || activeAdminSection === "profiles";
  const includeListingAutoAccounts = activeAdminSection === "listing-auto";
  const shouldLoadAutoMarketDetails = includeParticipants
    || includeConfigs
    || includeParticipantSymbolConfigs
    || includeParticipantProfileConfigs
    || includeListingAutoAccounts;

  return {
    includeConfigs,
    includeListingAutoAccounts,
    includeParticipantProfileConfigs,
    includeParticipants,
    includeParticipantSymbolConfigs,
    isAccountCashSection,
    isAdminAllowed,
    isBatchSection,
    isCashFlowLedgerSection,
    isEventsSection,
    isMarketSection,
    shouldLoadAdminFlowOverview: activeAdminSection === "market",
    shouldLoadAutoMarketDetails,
    shouldLoadAutoMarketSummary: activeAdminTab === "market",
    shouldLoadAutoParticipants,
    shouldLoadAutoParticipantProfileOverviews: activeAdminSection === "profile-overview",
    shouldLoadInstrumentDetails: activeAdminSection === "market" || activeAdminSection === "events",
    shouldLoadMarketSummary: activeAdminTab === "market",
    shouldUseAdminFlowOverview: isAdminAllowed && activeAdminSection === "market",
    shouldUseAutoMarketDetails: isAdminAllowed && shouldLoadAutoMarketDetails,
    shouldUseAutoMarketSummary: isAdminAllowed && activeAdminTab === "market",
    shouldUseAutoParticipants: isAdminAllowed && shouldLoadAutoParticipants,
    shouldUseAutoParticipantProfileOverviews: isAdminAllowed && activeAdminSection === "profile-overview",
    shouldUseInstrumentDetails: isAdminAllowed && (activeAdminSection === "market" || activeAdminSection === "events"),
    shouldUseMarketSummary: isAdminAllowed && activeAdminTab === "market",
  };
}
