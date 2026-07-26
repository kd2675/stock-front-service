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
    draft: profileConfigDraft,
    draftSetters: profileConfigDraftSetters,
    editingProfileType,
    setEditingProfileType,
  } = drafts.profileConfig;
  const {
    autoMarketConfigs,
    batchJobRuntimeControls,
    batchJobRuntimeControlsQuery,
    profileConfigs,
  } = queries;
  const {
    selectProfileConfigByType,
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
    regenerateDailyRegime,
    regeneratingDailyRegimeSymbol,
    regenerateRegimeModifier,
    regeneratingRegimeModifierSymbol,
    toggleAutoConfigEnabled,
    togglingAutoConfigSymbol,
    updatingAutoConfig,
    updatingBatchJobName,
  } = actions;

  return {
    accessToken: queries.accessToken,
    activeSection: activeAdminSection,
    autoMarketConfigs,
    autoMarketDraft: autoMarketConfigDraft,
    autoMarketDraftSetters: autoMarketConfigDraftSetters,
    batchJobRuntimeControls,
    batchRuntimeControlsError: batchJobRuntimeControlsQuery.isError,
    editingAutoConfigSymbol,
    lastCashFlowRun,
    liquidityProviderMandates: queries.liquidityProviderMandatesQuery.data ?? [],
    liquidityProviderMandatesError: queries.liquidityProviderMandatesQuery.isError
      || queries.liquidityProviderRecommendationQuery.isError,
    liquidityProviderRecommendation: queries.liquidityProviderRecommendationQuery.data ?? null,
    loadingBatchRuntimeControls: batchJobRuntimeControlsQuery.isFetching,
    loadingLiquidityProviderMandates: queries.liquidityProviderMandatesQuery.isFetching
      || queries.liquidityProviderRecommendationQuery.isFetching,
    onRefreshBatchRuntimeControls: () => void batchJobRuntimeControlsQuery.refetch().then((result) => {
      if (result.isError) {
        setMessage(getAdminUnknownErrorMessage(result.error, "배치 자동 실행 상태를 조회하지 못했습니다."));
      }
    }),
    onRefreshLiquidityProviderMandates: () => {
      void Promise.all([
        queries.liquidityProviderMandatesQuery.refetch(),
        queries.liquidityProviderRecommendationQuery.refetch(),
      ]);
    },
    onClearProfileSelection: () => setEditingProfileType(null),
    onRunCashFlow: () => void runAutoParticipantCashFlowNow(),
    onSelectAutoMarketDraft: selectAutoMarketConfigDraft,
    onSelectProfile: selectProfileConfigByType,
    onSetBatchRuntime: (jobName, runtimeEnabled) => void setBatchJobRuntime(jobName, runtimeEnabled),
    onSubmitAutoMarketConfig: () => void submitAutoConfig(),
    onSubmitProfileConfig: () => void submitProfileConfig(),
    onRegenerateDailyRegime: (config) => void regenerateDailyRegime(config),
    onRegenerateRegimeModifier: (config) => void regenerateRegimeModifier(config),
    onToggleAutoMarketEnabled: (config) => void toggleAutoConfigEnabled(config),
    editingProfileType,
    profileConfigs,
    profileDraft: profileConfigDraft,
    profileDraftSetters: profileConfigDraftSetters,
    runningCashFlow,
    savingProfileConfig,
    selectedProfileConfig,
    regeneratingDailyRegimeSymbol,
    regeneratingRegimeModifierSymbol,
    togglingAutoConfigSymbol,
    updatingAutoConfig,
    updatingBatchJobName,
  };
}
