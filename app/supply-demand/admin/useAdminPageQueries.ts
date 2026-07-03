import { useQuery } from "@tanstack/react-query";

import {
  adminCashFlowsQueryOptions,
  adminFlowOverviewQueryOptions,
  adminFundFlowSummaryQueryOptions,
  adminSymbolFlowsQueryOptions,
  adminUserFundFlowQueryOptions,
  autoParticipantsQueryOptions,
  autoParticipantProfileOverviewsQueryOptions,
  batchJobRuntimeControlsQueryOptions,
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
  actionSymbol: string;
  editingAutoParticipantUserKey: string | null;
  reportSymbol: string;
  userFundFlowUserKey: string | null;
};

export function useAdminPageQueries({
  accessToken,
  activeAdminSection,
  activeAdminTab,
  adminCashFlowPageIndex,
  adminStatus,
  actionSymbol,
  editingAutoParticipantUserKey,
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
  const corporateActionSymbol = isKnownOrderBookSymbol(instruments, actionSymbol) ? actionSymbol : "";
  const instrumentReportSymbol = isKnownOrderBookSymbol(instruments, reportSymbol) ? reportSymbol : "";

  const corporateActionsQuery = useQuery(corporateActionsQueryOptions(corporateActionSymbol, {
    enabled: isAdminAllowed && queryFlags.isEventsSection,
  }));
  const instrumentReportsQuery = useQuery(instrumentReportsQueryOptions(instrumentReportSymbol, {
    enabled: isAdminAllowed && queryFlags.isEventsSection,
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
    enabled: isAdminAllowed && queryFlags.isMarketSection,
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
    symbolFlowLimit: ADMIN_SYMBOL_FLOW_PREVIEW_SIZE,
  }));
  const adminSymbolFlowsQuery = useQuery(adminSymbolFlowsQueryOptions(accessToken, {
    enabled: false,
  }));
  const adminCashFlowPageQuery = useQuery(adminCashFlowsQueryOptions(accessToken, adminCashFlowPageIndex, ADMIN_CASH_FLOW_PAGE_SIZE, {
    enabled: isAdminAllowed && queryFlags.isCashFlowLedgerSection,
  }));
  const userFundFlowQuery = useQuery(adminUserFundFlowQueryOptions(accessToken, userFundFlowUserKey ?? "", {
    enabled: false,
  }));
  const batchJobRuntimeControlsQuery = useQuery(batchJobRuntimeControlsQueryOptions(accessToken, {
    enabled: isAdminAllowed && queryFlags.isBatchSection,
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
    enabled: isAdminAllowed && queryFlags.isMarketSection,
  });

  const queryResults = normalizeAdminPageQueryResults({
    adminCashFlowPage: isAdminAllowed && queryFlags.isCashFlowLedgerSection ? adminCashFlowPageQuery.data : null,
    adminFlowOverview: queryFlags.shouldUseAdminFlowOverview ? adminFlowOverviewQuery.data : null,
    adminSymbolFlowList: queryFlags.shouldUseAdminFlowOverview ? adminSymbolFlowsQuery.data : null,
    autoMarketDetails: queryFlags.shouldUseAutoMarketDetails ? autoMarketDetailsQuery.data : null,
    autoMarketSummary: queryFlags.shouldUseAutoMarketSummary ? autoMarketSummaryQuery.data : null,
    autoParticipants: queryFlags.shouldUseAutoParticipants ? autoParticipantsQuery.data : null,
    autoParticipantProfileOverviewSummaries: queryFlags.shouldUseAutoParticipantProfileOverviews ? autoParticipantProfileOverviewsQuery.data : null,
    batchJobRuntimeControls: isAdminAllowed && queryFlags.isBatchSection ? batchJobRuntimeControlsQuery.data : null,
    corporateActions: isAdminAllowed && queryFlags.isEventsSection ? corporateActionsQuery.data : null,
    instrumentReports: isAdminAllowed && queryFlags.isEventsSection ? instrumentReportsQuery.data : null,
    instruments: queryFlags.shouldUseInstrumentDetails ? orderBookInstrumentsQuery.data : null,
    orderBookMarketConfig: queryFlags.shouldUseMarketSummary ? orderBookMarketConfigQuery.data : null,
    orderBookMarketSummary: queryFlags.shouldUseMarketSummary ? orderBookMarketSummaryQuery.data : null,
    userFundFlow: isAdminAllowed && queryFlags.isAccountCashSection ? userFundFlowQuery.data : null,
  });

  return {
    ...queryResults,
    adminCashFlowPageQuery,
    adminAllFundFlowSummaryQuery,
    adminFlowOverviewQuery,
    adminFundFlowSummaryQuery,
    adminSymbolFlowsQuery,
    autoMarketDetailsQuery,
    autoParticipantsQuery,
    autoParticipantProfileOverviewsQuery,
    autoParticipantProfileOverviewsAllQuery,
    batchJobRuntimeControlsQuery,
    shouldLoadInstrumentDetails: queryFlags.shouldLoadInstrumentDetails,
    simulationClockQuery,
    userFundFlowQuery,
  };
}
