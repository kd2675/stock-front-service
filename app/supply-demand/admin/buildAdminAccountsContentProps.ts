import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";

export function buildAdminAccountsContentProps({
  activeAdminSection,
  actions,
  derived,
  drafts,
  queries,
  setAdminCashFlowPageIndex,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["accountsProps"]> {
  const {
    amount: userCashAdjustmentAmount,
    fundFlowUserKey: userFundFlowUserKey,
    setAmount: setUserCashAdjustmentAmount,
    setUserKey: setUserCashAdjustmentUserKey,
    userKey: userCashAdjustmentUserKey,
  } = drafts.userCashAdjustment;
  const {
    adminCashFlowPage,
    adminCashFlowPageQuery,
    autoMarketDetailsQuery,
    autoParticipantsQuery,
    autoParticipantProfileOverviewsQuery,
    autoParticipantProfileOverviewsAllQuery,
    batchJobRuntimeControls,
    userFundFlow,
    userFundFlowQuery,
  } = queries;
  const {
    participantProfileOverviewSummaries,
    salaryEligibility,
  } = derived;
  const {
    adjustingUserCashType,
    adjustUserCashBalance,
    lastCashFlowRun,
    loadUserFundFlow,
    runAutoParticipantCashFlowNow,
    runningCashFlow,
  } = actions;

  return {
    activeSection: activeAdminSection,
    adjustingUserCashType,
    autoParticipantCashFlowRuntimeControl: batchJobRuntimeControls.find((control) => control.jobName === "auto-participant-cash-flow") ?? null,
    cashFlowPage: adminCashFlowPage,
    lastCashFlowRun,
    loadingCashFlowPage: adminCashFlowPageQuery.isFetching,
    loadingProfileOverviews: autoParticipantProfileOverviewsQuery.isFetching,
    loadingProfileOverviewAll: autoParticipantProfileOverviewsAllQuery.isFetching,
    loadingSalaryEligibility: autoParticipantsQuery.isFetching || autoMarketDetailsQuery.isFetching,
    loadingUserFundFlow: userFundFlowQuery.isFetching,
    onAdjustUserCash: (adjustmentType) => void adjustUserCashBalance(adjustmentType),
    onCashFlowPageChange: setAdminCashFlowPageIndex,
    onLoadUserFundFlow: () => void loadUserFundFlow(),
    onRefreshCashFlowPage: () => void adminCashFlowPageQuery.refetch(),
    onRefreshProfileOverviews: () => void autoParticipantProfileOverviewsQuery.refetch(),
    onLoadAllProfileOverviews: () => void autoParticipantProfileOverviewsAllQuery.refetch(),
    onRunCashFlow: () => void runAutoParticipantCashFlowNow(),
    onUserCashAmountChange: setUserCashAdjustmentAmount,
    onUserCashKeyChange: setUserCashAdjustmentUserKey,
    profileOverviewError: autoParticipantProfileOverviewsQuery.isError,
    profileOverviewAllError: autoParticipantProfileOverviewsAllQuery.isError,
    profileOverviewAllSummaries: autoParticipantProfileOverviewsAllQuery.data ?? [],
    profileOverviewSummaries: participantProfileOverviewSummaries,
    runningCashFlow,
    salaryEligibility,
    salaryEligibilityError: autoParticipantsQuery.isError || autoMarketDetailsQuery.isError,
    userCashAmount: userCashAdjustmentAmount,
    userCashKey: userCashAdjustmentUserKey,
    userFundFlow,
    userFundFlowUserKey,
  };
}
