import { useQuery } from "@tanstack/react-query";

import {
  adminCashFlowsQueryOptions,
  adminFlowOverviewQueryOptions,
  adminFundFlowSummaryQueryOptions,
  adminInvestorFlowHistoryQueryOptions,
  adminInvestorFlowSummaryQueryOptions,
  adminUserFundFlowQueryOptions,
  autoParticipantsQueryOptions,
  autoParticipantProfileOverviewsQueryOptions,
  batchJobRuntimeControlsQueryOptions,
  eodOperationsOverviewQueryOptions,
  latestManualCashFlowRunQueryOptions,
} from "@/app/lib/react-query/stockAdminQueries";
import {
  autoMarketStatusQueryOptions,
  autoMarketSummaryStatusQueryOptions,
  corporateActionsQueryOptions,
  instrumentReportsQueryOptions,
  orderBookInstrumentsQueryOptions,
  orderBookMarketStatusQueryOptions,
  simulationClockQueryOptions,
} from "@/app/lib/react-query/stockMarketQueries";
import {
  ADMIN_CASH_FLOW_PAGE_SIZE,
  ADMIN_EOD_REFETCH_MS,
  ADMIN_LIVE_SUMMARY_REFETCH_MS,
  ADMIN_SYMBOL_FLOW_PREVIEW_SIZE,
  EMPTY_ORDER_BOOK_INSTRUMENTS,
} from "@/app/supply-demand/admin/AdminConstants";
import { isKnownOrderBookSymbol } from "@/app/supply-demand/admin/AdminSelectionHelpers";
import { resolveAdminPageQueryFlags } from "@/app/supply-demand/admin/AdminPageQueryFlags";
import type { AdminSection, AdminTab } from "@/app/supply-demand/admin/AdminNavigationConfig";
import { normalizeAdminPageQueryResults } from "@/app/supply-demand/admin/AdminPageQueryResults";
import { resolveParticipantProfileOverviewSummaries } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";

type AdminAccessStatus = "checking" | "allowed" | "denied";

type UseAdminPageQueriesParams = {
  accessToken: string | null;
  activeAdminSection: AdminSection;
  activeAdminTab: AdminTab;
  adminCashFlowPageIndex: number;
  adminStatus: AdminAccessStatus;
  editingAutoParticipantUserKey: string | null;
  historySymbol: string;
  reportSymbol: string;
  userFundFlowUserKey: string | null;
};

export function useAdminPageQueries({
  accessToken,
  activeAdminSection,
  activeAdminTab,
  adminCashFlowPageIndex,
  adminStatus,
  editingAutoParticipantUserKey,
  historySymbol,
  reportSymbol,
  userFundFlowUserKey,
}: UseAdminPageQueriesParams) {
  const queryFlags = resolveAdminPageQueryFlags({
    activeAdminSection,
    activeAdminTab,
    adminStatus,
    editingAutoParticipantUserKey,
  });
  const isAdminAllowed = queryFlags.isAdminAllowed;

  const autoParticipantProfileOverviewsQuery = useQuery({
    ...autoParticipantProfileOverviewsQueryOptions(accessToken, {
      activityScope: "RECENT_SIMULATION_DAY",
      enabled: queryFlags.shouldUseAutoParticipantProfileOverviews,
      refetchIntervalMs: false,
    }),
    select: resolveParticipantProfileOverviewSummaries,
  });
  const autoParticipantProfileOverviewsAllQuery = useQuery({
    ...autoParticipantProfileOverviewsQueryOptions(accessToken, {
      activityScope: "ALL",
      enabled: false,
      refetchIntervalMs: false,
    }),
    select: resolveParticipantProfileOverviewSummaries,
  });
  const autoParticipantsQuery = useQuery(autoParticipantsQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseAutoParticipants,
  }));
  const orderBookInstrumentsQuery = useQuery(orderBookInstrumentsQueryOptions({
    enabled: queryFlags.shouldUseInstrumentDetails,
  }));
  const instruments = orderBookInstrumentsQuery.data ?? EMPTY_ORDER_BOOK_INSTRUMENTS;
  const corporateActionSymbol = isKnownOrderBookSymbol(instruments, historySymbol) ? historySymbol : "";
  const instrumentReportSymbol = isKnownOrderBookSymbol(instruments, reportSymbol) ? reportSymbol : "";

  const corporateActionsQuery = useQuery(corporateActionsQueryOptions(corporateActionSymbol, {
    enabled: queryFlags.shouldUseCorporateActions,
  }));
  const instrumentReportsQuery = useQuery(instrumentReportsQueryOptions(instrumentReportSymbol, {
    enabled: queryFlags.shouldUseInstrumentReports,
  }));
  const autoMarketDetailsQuery = useQuery(autoMarketStatusQueryOptions({
    enabled: queryFlags.shouldUseAutoMarketDetails,
    includeConfigs: queryFlags.includeConfigs,
    includeParticipants: queryFlags.includeParticipants,
    includeParticipantSymbolConfigs: queryFlags.includeParticipantSymbolConfigs,
    includeParticipantProfileConfigs: queryFlags.includeParticipantProfileConfigs,
    includeListingAutoAccounts: queryFlags.includeListingAutoAccounts,
    includeRuntimeMetrics: false,
    includeSalaryEligibility: false,
    participantSymbolConfigUserKey: queryFlags.includeParticipantSymbolConfigs ? editingAutoParticipantUserKey ?? undefined : undefined,
    refetchIntervalMs: false,
  }));
  const adminFundFlowSummaryQuery = useQuery(adminFundFlowSummaryQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseAdminFlowOverview,
    scope: "RECENT_SIMULATION_DAY",
  }));
  const adminAllFundFlowSummaryQuery = useQuery(adminFundFlowSummaryQueryOptions(accessToken, {
    enabled: false,
    scope: "ALL",
  }));
  const adminFlowOverviewQuery = useQuery(adminFlowOverviewQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseAdminFlowOverview,
    includeFundFlow: false,
    includeSymbolFlows: true,
    symbolFlowScope: "RECENT_SIMULATION_DAY",
    symbolFlowLimit: ADMIN_SYMBOL_FLOW_PREVIEW_SIZE,
  }));
  const adminInvestorFlowSummaryQuery = useQuery(adminInvestorFlowSummaryQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseAdminFlowOverview,
    refetchIntervalMs: ADMIN_LIVE_SUMMARY_REFETCH_MS,
  }));
  const adminInvestorFlowHistoryQuery = useQuery(adminInvestorFlowHistoryQueryOptions(accessToken, {
    days: 7,
    enabled: false,
  }));
  const adminCashFlowPageQuery = useQuery(adminCashFlowsQueryOptions(accessToken, adminCashFlowPageIndex, ADMIN_CASH_FLOW_PAGE_SIZE, {
    enabled: isAdminAllowed && queryFlags.isCashFlowLedgerSection,
  }));
  const userFundFlowQuery = useQuery(adminUserFundFlowQueryOptions(accessToken, userFundFlowUserKey ?? "", {
    enabled: false,
  }));
  const batchJobRuntimeControlsQuery = useQuery(batchJobRuntimeControlsQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseBatchRuntimeControls,
  }));
  const latestManualCashFlowRunQuery = useQuery(latestManualCashFlowRunQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseBatchRuntimeControls,
  }));
  const eodOperationsOverviewQuery = useQuery(eodOperationsOverviewQueryOptions(accessToken, {
    enabled: queryFlags.shouldUseEodOverview,
    refetchIntervalMs: ADMIN_EOD_REFETCH_MS,
  }));
  const autoMarketSummaryQuery = useQuery(autoMarketSummaryStatusQueryOptions({
    enabled: queryFlags.shouldUseAutoMarketSummary,
    includeRuntimeMetrics: false,
    includeSalaryEligibility: false,
    refetchIntervalMs: ADMIN_LIVE_SUMMARY_REFETCH_MS,
  }));
  const orderBookMarketSummaryQuery = useQuery(orderBookMarketStatusQueryOptions({
    enabled: queryFlags.shouldUseMarketSummary,
    includeConfigs: false,
    includeTodayExecution: true,
    refetchIntervalMs: ADMIN_LIVE_SUMMARY_REFETCH_MS,
  }));
  const orderBookMarketConfigQuery = useQuery(orderBookMarketStatusQueryOptions({
    enabled: queryFlags.shouldUseMarketSummary,
    includeConfigs: true,
    includeTodayExecution: false,
    refetchIntervalMs: false,
  }));
  const simulationClockQuery = useQuery({
    ...simulationClockQueryOptions(),
    enabled: queryFlags.shouldUseSimulationClock,
  });

  const queryResults = normalizeAdminPageQueryResults({
    adminCashFlowPage: isAdminAllowed && queryFlags.isCashFlowLedgerSection ? adminCashFlowPageQuery.data : null,
    adminFlowOverview: queryFlags.shouldUseAdminFlowOverview ? adminFlowOverviewQuery.data : null,
    adminSymbolFlowList: null,
    autoMarketDetails: queryFlags.shouldUseAutoMarketDetails ? autoMarketDetailsQuery.data : null,
    autoMarketSummary: queryFlags.shouldUseAutoMarketSummary ? autoMarketSummaryQuery.data : null,
    autoParticipants: queryFlags.shouldUseAutoParticipants ? autoParticipantsQuery.data : null,
    autoParticipantProfileOverviewSummaries: queryFlags.shouldUseAutoParticipantProfileOverviews ? autoParticipantProfileOverviewsQuery.data : null,
    batchJobRuntimeControls: queryFlags.shouldUseBatchRuntimeControls ? batchJobRuntimeControlsQuery.data : null,
    corporateActions: queryFlags.shouldUseCorporateActions ? corporateActionsQuery.data : null,
    instrumentReports: queryFlags.shouldUseInstrumentReports ? instrumentReportsQuery.data : null,
    instruments: queryFlags.shouldUseInstrumentDetails ? orderBookInstrumentsQuery.data : null,
    orderBookMarketConfig: queryFlags.shouldUseMarketSummary ? orderBookMarketConfigQuery.data : null,
    orderBookMarketSummary: queryFlags.shouldUseMarketSummary ? orderBookMarketSummaryQuery.data : null,
    userFundFlow: isAdminAllowed && queryFlags.isAccountCashSection ? userFundFlowQuery.data : null,
  });

  return {
    ...queryResults,
    accessToken,
    adminCashFlowPageQuery,
    adminAllFundFlowSummaryQuery,
    adminFlowOverviewQuery,
    adminFundFlowSummaryQuery,
    adminInvestorFlowHistoryQuery,
    adminInvestorFlowSummaryQuery,
    autoMarketDetailsQuery,
    autoParticipantsQuery,
    autoParticipantProfileOverviewsQuery,
    autoParticipantProfileOverviewsAllQuery,
    batchJobRuntimeControlsQuery,
    latestManualCashFlowRunQuery,
    eodOperationsOverviewQuery,
    corporateActionsQuery,
    shouldLoadInstrumentDetails: queryFlags.shouldLoadInstrumentDetails,
    simulationClockQuery,
    userFundFlowQuery,
  };
}
