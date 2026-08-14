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
    autoParticipantProfileOverviewsQuery,
    autoParticipantProfileOverviewsAllQuery,
    userFundFlow,
    userFundFlowQuery,
  } = queries;
  const { participantProfileOverviewSummaries } = derived;
  const {
    adjustingUserCashType,
    adjustUserCashBalance,
    loadUserFundFlow,
  } = actions;

  return {
    activeSection: activeAdminSection,
    adjustingUserCashType,
    cashFlowPage: adminCashFlowPage,
    loadingCashFlowPage: adminCashFlowPageQuery.isFetching,
    loadingProfileOverviews: autoParticipantProfileOverviewsQuery.isFetching,
    loadingProfileOverviewAll: autoParticipantProfileOverviewsAllQuery.isFetching,
    loadingUserFundFlow: userFundFlowQuery.isFetching,
    onAdjustUserCash: (adjustmentType) => void adjustUserCashBalance(adjustmentType),
    onCashFlowPageChange: setAdminCashFlowPageIndex,
    onLoadUserFundFlow: () => void loadUserFundFlow(),
    onRefreshCashFlowPage: () => void adminCashFlowPageQuery.refetch(),
    onRefreshProfileOverviews: () => {
      void autoParticipantProfileOverviewsQuery.refetch();
    },
    onLoadAllProfileOverviews: () => void autoParticipantProfileOverviewsAllQuery.refetch(),
    onUserCashAmountChange: setUserCashAdjustmentAmount,
    onUserCashKeyChange: setUserCashAdjustmentUserKey,
    profileOverviewError: autoParticipantProfileOverviewsQuery.isError,
    profileOverviewAllError: autoParticipantProfileOverviewsAllQuery.isError,
    profileOverviewAllSummaries: autoParticipantProfileOverviewsAllQuery.data ?? [],
    profileOverviewSummaries: participantProfileOverviewSummaries,
    userCashAmount: userCashAdjustmentAmount,
    userCashKey: userCashAdjustmentUserKey,
    userFundFlow,
    userFundFlowUserKey,
  };
}
