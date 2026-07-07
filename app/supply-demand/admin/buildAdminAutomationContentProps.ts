import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";
import { getAdminUnknownErrorMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";

export function buildAdminAutomationContentProps({
  activeAdminSection,
  actions,
  derived,
  drafts,
  queries,
  setMessage,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["automationProps"]> {
  const {
    draft: autoMarketConfigDraft,
    draftSetters: autoMarketConfigDraftSetters,
    editingSymbol: editingAutoConfigSymbol,
    selectAutoMarketConfigDraft,
  } = drafts.autoMarketConfig;
  const {
    draft: listingAutoAccountDraft,
    draftSetters: listingAutoAccountDraftSetters,
    editingSymbol: editingListingAutoSymbol,
    selectListingAutoAccountDraft,
  } = drafts.listingAutoAccount;
  const {
    draft: profileConfigDraft,
    draftSetters: profileConfigDraftSetters,
    editingProfileType,
    setEditingProfileType,
  } = drafts.profileConfig;
  const {
    autoMarketConfigs,
    batchJobRuntimeControls,
    batchJobRuntimeControlsQuery,
    listingAutoAccounts,
    profileConfigs,
  } = queries;
  const {
    selectProfileConfigByType,
    selectedListingAutoAccount,
    selectedProfileConfig,
  } = derived;
  const {
    lastCashFlowRun,
    runAutoParticipantCashFlowNow,
    runningCashFlow,
    savingProfileConfig,
    setBatchJobRuntime,
    submitAutoConfig,
    submitProfileConfig,
    submitListingAutoAccountConfig,
    regenerateDailyRegime,
    regeneratingDailyRegimeSymbol,
    toggleAutoConfigEnabled,
    togglingAutoConfigSymbol,
    updatingAutoConfig,
    updatingBatchJobName,
    updatingListingAutoAccount,
  } = actions;

  return {
    activeSection: activeAdminSection,
    autoMarketConfigs,
    autoMarketDraft: autoMarketConfigDraft,
    autoMarketDraftSetters: autoMarketConfigDraftSetters,
    batchJobRuntimeControls,
    batchRuntimeControlsError: batchJobRuntimeControlsQuery.isError,
    editingAutoConfigSymbol,
    editingListingAutoSymbol,
    lastCashFlowRun,
    listingAutoAccounts,
    listingAutoDraft: listingAutoAccountDraft,
    listingAutoDraftSetters: listingAutoAccountDraftSetters,
    loadingBatchRuntimeControls: batchJobRuntimeControlsQuery.isFetching,
    onRefreshBatchRuntimeControls: () => void batchJobRuntimeControlsQuery.refetch().then((result) => {
      if (result.isError) {
        setMessage(getAdminUnknownErrorMessage(result.error, "배치 자동 실행 상태를 조회하지 못했습니다."));
      }
    }),
    onClearProfileSelection: () => setEditingProfileType(null),
    onRunCashFlow: () => void runAutoParticipantCashFlowNow(),
    onSelectAutoMarketDraft: selectAutoMarketConfigDraft,
    onSelectListingAutoDraft: selectListingAutoAccountDraft,
    onSelectProfile: selectProfileConfigByType,
    onSetBatchRuntime: (jobName, runtimeEnabled) => void setBatchJobRuntime(jobName, runtimeEnabled),
    onSubmitAutoMarketConfig: () => void submitAutoConfig(),
    onSubmitListingAutoConfig: () => void submitListingAutoAccountConfig(),
    onSubmitProfileConfig: () => void submitProfileConfig(),
    onRegenerateDailyRegime: (config) => void regenerateDailyRegime(config),
    onToggleAutoMarketEnabled: (config) => void toggleAutoConfigEnabled(config),
    editingProfileType,
    profileConfigs,
    profileDraft: profileConfigDraft,
    profileDraftSetters: profileConfigDraftSetters,
    runningCashFlow,
    savingProfileConfig,
    selectedListingAutoAccount,
    selectedProfileConfig,
    regeneratingDailyRegimeSymbol,
    togglingAutoConfigSymbol,
    updatingAutoConfig,
    updatingBatchJobName,
    updatingListingAutoAccount,
  };
}
