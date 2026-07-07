import { AdminAutoMarketConfigPanel, type AutoMarketConfigDraft, type AutoMarketConfigDraftSetters } from "@/app/supply-demand/admin/AdminAutoMarketConfigPanel";
import { AdminBatchRuntimeControlPanel } from "@/app/supply-demand/admin/AdminBatchRuntimeControls";
import { AdminListingAutoAccountPanel, type ListingAutoAccountDraft, type ListingAutoAccountDraftSetters } from "@/app/supply-demand/admin/AdminListingAutoAccountPanel";
import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import { AdminProfilesSection } from "@/app/supply-demand/admin/AdminProfilesSection";
import type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type {
  AutoMarketConfig,
  AutoParticipantProfileConfig,
  AutoParticipantProfileType,
  BatchJobRuntimeStatus,
  ListingAutoAccount,
  StockBatchJobRun,
} from "@/app/types/stock";

type AdminAutomationSectionProps = {
  activeSection: AdminSection;
  autoMarketConfigs: AutoMarketConfig[];
  autoMarketDraft: AutoMarketConfigDraft;
  autoMarketDraftSetters: AutoMarketConfigDraftSetters;
  editingAutoConfigSymbol: string | null;
  updatingAutoConfig: boolean;
  togglingAutoConfigSymbol: string | null;
  regeneratingDailyRegimeSymbol: string | null;
  onSelectAutoMarketDraft: (config: AutoMarketConfig) => void;
  onSubmitAutoMarketConfig: () => void;
  onToggleAutoMarketEnabled: (config: AutoMarketConfig) => void;
  onRegenerateDailyRegime: (config: AutoMarketConfig) => void;
  listingAutoAccounts: ListingAutoAccount[];
  selectedListingAutoAccount: ListingAutoAccount | null;
  listingAutoDraft: ListingAutoAccountDraft;
  listingAutoDraftSetters: ListingAutoAccountDraftSetters;
  editingListingAutoSymbol: string | null;
  updatingListingAutoAccount: boolean;
  onSelectListingAutoDraft: (account: ListingAutoAccount) => void;
  onSubmitListingAutoConfig: () => void;
  batchJobRuntimeControls: BatchJobRuntimeStatus[];
  loadingBatchRuntimeControls: boolean;
  batchRuntimeControlsError: boolean;
  updatingBatchJobName: string | null;
  lastCashFlowRun: StockBatchJobRun | null;
  runningCashFlow: boolean;
  onRefreshBatchRuntimeControls: () => void;
  onSetBatchRuntime: (jobName: string, runtimeEnabled: boolean) => void;
  onRunCashFlow: () => void;
  profileConfigs: AutoParticipantProfileConfig[];
  editingProfileType: AutoParticipantProfileType | null;
  selectedProfileConfig: AutoParticipantProfileConfig | null;
  profileDraft: ProfileConfigDraft;
  profileDraftSetters: ProfileConfigDraftSetters;
  savingProfileConfig: boolean;
  onSelectProfile: (profileType: string) => void;
  onSubmitProfileConfig: () => void;
  onClearProfileSelection: () => void;
};

export function AdminAutomationSection({
  activeSection,
  autoMarketConfigs,
  autoMarketDraft,
  autoMarketDraftSetters,
  editingAutoConfigSymbol,
  updatingAutoConfig,
  togglingAutoConfigSymbol,
  regeneratingDailyRegimeSymbol,
  onSelectAutoMarketDraft,
  onSubmitAutoMarketConfig,
  onToggleAutoMarketEnabled,
  onRegenerateDailyRegime,
  listingAutoAccounts,
  selectedListingAutoAccount,
  listingAutoDraft,
  listingAutoDraftSetters,
  editingListingAutoSymbol,
  updatingListingAutoAccount,
  onSelectListingAutoDraft,
  onSubmitListingAutoConfig,
  batchJobRuntimeControls,
  loadingBatchRuntimeControls,
  batchRuntimeControlsError,
  updatingBatchJobName,
  lastCashFlowRun,
  runningCashFlow,
  onRefreshBatchRuntimeControls,
  onSetBatchRuntime,
  onRunCashFlow,
  profileConfigs,
  editingProfileType,
  selectedProfileConfig,
  profileDraft,
  profileDraftSetters,
  savingProfileConfig,
  onSelectProfile,
  onSubmitProfileConfig,
  onClearProfileSelection,
}: AdminAutomationSectionProps) {
  if (activeSection === "profiles") {
    return (
      <AdminProfilesSection
        profileConfigs={profileConfigs}
        editingProfileType={editingProfileType}
        selectedProfileConfig={selectedProfileConfig}
        draft={profileDraft}
        draftSetters={profileDraftSetters}
        saving={savingProfileConfig}
        onSelectProfile={onSelectProfile}
        onSubmit={onSubmitProfileConfig}
        onClearSelection={onClearProfileSelection}
      />
    );
  }

  if (activeSection === "auto-symbols") {
    return (
      <AdminAutoMarketConfigPanel
        configs={autoMarketConfigs}
        draft={autoMarketDraft}
        draftSetters={autoMarketDraftSetters}
        editingSymbol={editingAutoConfigSymbol}
        updating={updatingAutoConfig}
        togglingSymbol={togglingAutoConfigSymbol}
        regeneratingRegimeSymbol={regeneratingDailyRegimeSymbol}
        onSelectDraft={onSelectAutoMarketDraft}
        onSubmit={onSubmitAutoMarketConfig}
        onToggleEnabled={onToggleAutoMarketEnabled}
        onRegenerateRegime={onRegenerateDailyRegime}
      />
    );
  }

  if (activeSection === "listing-auto") {
    return (
      <AdminListingAutoAccountPanel
        accounts={listingAutoAccounts}
        selectedAccount={selectedListingAutoAccount}
        draft={listingAutoDraft}
        draftSetters={listingAutoDraftSetters}
        editingSymbol={editingListingAutoSymbol}
        updating={updatingListingAutoAccount}
        onSelectDraft={onSelectListingAutoDraft}
        onSubmit={onSubmitListingAutoConfig}
      />
    );
  }

  if (activeSection === "batch") {
    return (
      <AdminBatchRuntimeControlPanel
        controls={batchJobRuntimeControls}
        loading={loadingBatchRuntimeControls}
        error={batchRuntimeControlsError}
        updatingBatchJobName={updatingBatchJobName}
        lastCashFlowRun={lastCashFlowRun}
        runningCashFlow={runningCashFlow}
        onRefresh={onRefreshBatchRuntimeControls}
        onSetRuntime={onSetBatchRuntime}
        onRunCashFlow={onRunCashFlow}
      />
    );
  }

  return null;
}
