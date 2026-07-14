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
  shouldUseCorporateActions: boolean;
  shouldUseInstrumentReports: boolean;
  shouldUseSimulationClock: boolean;
  shouldUseBatchRuntimeControls: boolean;
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
  const isAccountCashSection = activeAdminSection === "funds-accounts";
  const isAdminAllowed = adminStatus === "allowed";
  const isBatchSection = activeAdminSection === "system-jobs";
  const isCashFlowLedgerSection = activeAdminSection === "funds-ledger";
  const isEventsSection = activeAdminTab === "corporate";
  const isMarketSection = activeAdminSection === "dashboard"
    || activeAdminSection === "market-instruments"
    || activeAdminSection === "market-flows";
  const shouldLoadBatchRuntimeControls = activeAdminSection === "system-jobs" || activeAdminSection === "funds-payroll";
  const shouldLoadAutoParticipants = activeAdminSection === "funds-payroll" || activeAdminSection === "participants-list";
  const includeParticipants = false;
  const includeParticipantStrategyDetails = activeAdminSection === "participants-list" && editingAutoParticipantUserKey !== null;
  const includeConfigs = activeAdminSection === "participants-symbols" || includeParticipantStrategyDetails;
  const includeParticipantSymbolConfigs = includeParticipantStrategyDetails;
  const includeParticipantProfileConfigs = activeAdminSection === "funds-payroll" || activeAdminSection === "participants-profiles";
  const includeListingAutoAccounts = activeAdminSection === "market-liquidity";
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
    shouldUseCorporateActions: isAdminAllowed && activeAdminSection === "corporate-history",
    shouldUseInstrumentReports: isAdminAllowed && activeAdminSection === "corporate-reports",
    shouldUseSimulationClock: isAdminAllowed && (
      activeAdminSection === "dashboard"
      || activeAdminSection === "market-instruments"
      || activeAdminSection === "corporate-actions"
    ),
    shouldUseBatchRuntimeControls: isAdminAllowed && shouldLoadBatchRuntimeControls,
    shouldLoadAdminFlowOverview: activeAdminSection === "market-flows",
    shouldLoadAutoMarketDetails,
    shouldLoadAutoMarketSummary: activeAdminSection === "dashboard",
    shouldLoadAutoParticipants,
    shouldLoadAutoParticipantProfileOverviews: activeAdminSection === "participants-overview",
    shouldLoadInstrumentDetails: activeAdminSection === "market-instruments" || activeAdminTab === "corporate",
    shouldLoadMarketSummary: activeAdminSection === "dashboard" || activeAdminSection === "market-instruments",
    shouldUseAdminFlowOverview: isAdminAllowed && activeAdminSection === "market-flows",
    shouldUseAutoMarketDetails: isAdminAllowed && shouldLoadAutoMarketDetails,
    shouldUseAutoMarketSummary: isAdminAllowed && activeAdminSection === "dashboard",
    shouldUseAutoParticipants: isAdminAllowed && shouldLoadAutoParticipants,
    shouldUseAutoParticipantProfileOverviews: isAdminAllowed && activeAdminSection === "participants-overview",
    shouldUseInstrumentDetails: isAdminAllowed && (activeAdminSection === "market-instruments" || activeAdminTab === "corporate"),
    shouldUseMarketSummary: isAdminAllowed && (activeAdminSection === "dashboard" || activeAdminSection === "market-instruments"),
  };
}
