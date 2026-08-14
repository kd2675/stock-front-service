import type { AdminSection, AdminTab } from "@/app/supply-demand/admin/AdminNavigationConfig";

type AdminAccessStatus = "checking" | "allowed" | "denied";

export type AdminPageQueryFlags = {
  includeConfigs: boolean;
  includeParticipantProfileConfigs: boolean;
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
  shouldUseEodOverview: boolean;
  shouldLoadAdminFlowOverview: boolean;
  shouldLoadAutoMarketDetails: boolean;
  shouldLoadAutoMarketSummary: boolean;
  shouldLoadAutoParticipantProfileOverviews: boolean;
  shouldLoadInstrumentDetails: boolean;
  shouldLoadMarketSummary: boolean;
  shouldUseAdminFlowOverview: boolean;
  shouldUseAdminMarketIndex: boolean;
  shouldUseAdminParticipantFlow: boolean;
  shouldUseAutoMarketDetails: boolean;
  shouldUseAutoMarketSummary: boolean;
  shouldUseAutoParticipantProfileOverviews: boolean;
  shouldUseInstrumentDetails: boolean;
  shouldUseInstitutionPortfolios: boolean;
  shouldUseInstitutionRecommendation: boolean;
  shouldUseLiquidityProviderMandates: boolean;
  shouldUseLiquidityProviderRecommendation: boolean;
  shouldUseMarketSummary: boolean;
  shouldUseSystemCustodyOverview: boolean;
  shouldUseUnderwritingContracts: boolean;
  shouldUseUnderwritingRecommendation: boolean;
};

export function resolveAdminPageQueryFlags({
  activeAdminSection,
  activeAdminTab,
  adminStatus,
}: {
  activeAdminSection: AdminSection;
  activeAdminTab: AdminTab;
  adminStatus: AdminAccessStatus;
}): AdminPageQueryFlags {
  const isAccountCashSection = activeAdminSection === "funds-accounts";
  const isAdminAllowed = adminStatus === "allowed";
  const isBatchSection = activeAdminSection === "system-jobs";
  const isCashFlowLedgerSection = activeAdminSection === "funds-ledger";
  const isEventsSection = activeAdminTab === "corporate";
  const isFlowSection = activeAdminTab === "flows";
  const isLiveFlowSection = activeAdminSection === "flows-live";
  const isParticipantFlowSection = isFlowSection && !isLiveFlowSection;
  const isMarketSection = activeAdminSection === "dashboard"
    || activeAdminSection === "market-instruments"
    || activeAdminSection === "market-auto-market"
    || isFlowSection;
  const shouldLoadBatchRuntimeControls = activeAdminSection === "system-jobs";
  const includeConfigs = activeAdminSection === "market-auto-market";
  const includeParticipantProfileConfigs = activeAdminSection === "participants-profiles";
  const shouldLoadAutoMarketDetails = includeConfigs || includeParticipantProfileConfigs;

  return {
    includeConfigs,
    includeParticipantProfileConfigs,
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
    shouldUseEodOverview: isAdminAllowed && activeAdminSection === "system-eod",
    shouldLoadAdminFlowOverview: isLiveFlowSection,
    shouldLoadAutoMarketDetails,
    shouldLoadAutoMarketSummary: activeAdminSection === "dashboard",
    shouldLoadAutoParticipantProfileOverviews: activeAdminSection === "participants-overview",
    shouldLoadInstrumentDetails: activeAdminSection === "market-instruments" || activeAdminTab === "corporate",
    shouldLoadMarketSummary: activeAdminSection === "dashboard" || activeAdminSection === "market-instruments",
    shouldUseAdminFlowOverview: isAdminAllowed && isLiveFlowSection,
    shouldUseAdminMarketIndex: isAdminAllowed && activeAdminSection === "flows-overview",
    shouldUseAdminParticipantFlow: isAdminAllowed && isParticipantFlowSection,
    shouldUseAutoMarketDetails: isAdminAllowed && shouldLoadAutoMarketDetails,
    shouldUseAutoMarketSummary: isAdminAllowed && activeAdminSection === "dashboard",
    shouldUseAutoParticipantProfileOverviews: isAdminAllowed && activeAdminSection === "participants-overview",
    shouldUseInstrumentDetails: isAdminAllowed && (activeAdminSection === "market-instruments" || activeAdminTab === "corporate"),
    shouldUseInstitutionPortfolios: isAdminAllowed && activeAdminSection === "participants-institutions",
    shouldUseInstitutionRecommendation: isAdminAllowed && activeAdminSection === "participants-institutions",
    shouldUseLiquidityProviderMandates: isAdminAllowed && activeAdminSection === "market-liquidity-providers",
    shouldUseLiquidityProviderRecommendation: isAdminAllowed && activeAdminSection === "market-liquidity-providers",
    shouldUseMarketSummary: isAdminAllowed && (activeAdminSection === "dashboard" || activeAdminSection === "market-instruments"),
    shouldUseSystemCustodyOverview: isAdminAllowed && activeAdminSection === "funds-custody",
    shouldUseUnderwritingContracts: isAdminAllowed && activeAdminSection === "corporate-underwriting",
    shouldUseUnderwritingRecommendation: isAdminAllowed && activeAdminSection === "corporate-underwriting",
  };
}
