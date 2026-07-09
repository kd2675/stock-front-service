import { AdminCashFlowLedgerPanel } from "@/app/supply-demand/admin/AdminCashFlowLedgerPanel";
import { AdminUserCashAdjustmentPanel } from "@/app/supply-demand/admin/AdminUserCashAdjustmentPanel";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import { ParticipantProfileOverviewPanel } from "@/app/supply-demand/admin/AdminParticipantOverviewPanels";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import { SalaryEligibilityPanel } from "@/app/supply-demand/admin/AdminSalaryPanels";
import type { AdminSalaryEligibilityRowsState } from "@/app/supply-demand/admin/useAdminSalaryEligibilityRows";
import type {
  AdminCashFlowPage,
  BatchJobRuntimeStatus,
  FundFlow,
  StockBatchJobRun,
} from "@/app/types/stock";

type AdminAccountsSectionProps = {
  activeSection: AdminSection;
  cashFlowPage: AdminCashFlowPage | null;
  loadingCashFlowPage: boolean;
  loadingSalaryEligibility: boolean;
  onRefreshCashFlowPage: () => void;
  onRefreshProfileOverviews: () => void;
  onLoadAllProfileOverviews: () => void;
  onCashFlowPageChange: (page: number) => void;
  userCashKey: string;
  userCashAmount: string;
  loadingUserFundFlow: boolean;
  adjustingUserCashType: CashAdjustmentType | null;
  userFundFlow: FundFlow | null;
  userFundFlowUserKey: string | null;
  onUserCashKeyChange: (value: string) => void;
  onUserCashAmountChange: (value: string) => void;
  onLoadUserFundFlow: () => void;
  onAdjustUserCash: (adjustmentType: CashAdjustmentType) => void;
  salaryEligibility: AdminSalaryEligibilityRowsState;
  salaryEligibilityError: boolean;
  autoParticipantCashFlowRuntimeControl: BatchJobRuntimeStatus | null;
  runningCashFlow: boolean;
  lastCashFlowRun: StockBatchJobRun | null;
  onRunCashFlow: () => void;
  profileOverviewSummaries: ParticipantProfileOverviewSummary[];
  profileOverviewAllSummaries: ParticipantProfileOverviewSummary[];
  loadingProfileOverviews: boolean;
  loadingProfileOverviewAll: boolean;
  profileOverviewError: boolean;
  profileOverviewAllError: boolean;
};

export function AdminAccountsSection({
  activeSection,
  cashFlowPage,
  loadingCashFlowPage,
  loadingSalaryEligibility,
  onRefreshCashFlowPage,
  onRefreshProfileOverviews,
  onLoadAllProfileOverviews,
  onCashFlowPageChange,
  userCashKey,
  userCashAmount,
  loadingUserFundFlow,
  adjustingUserCashType,
  userFundFlow,
  userFundFlowUserKey,
  onUserCashKeyChange,
  onUserCashAmountChange,
  onLoadUserFundFlow,
  onAdjustUserCash,
  salaryEligibility,
  salaryEligibilityError,
  autoParticipantCashFlowRuntimeControl,
  runningCashFlow,
  lastCashFlowRun,
  onRunCashFlow,
  profileOverviewSummaries,
  profileOverviewAllSummaries,
  loadingProfileOverviews,
  loadingProfileOverviewAll,
  profileOverviewError,
  profileOverviewAllError,
}: AdminAccountsSectionProps) {
  if (activeSection === "cash-flow-ledger") {
    return (
      <AdminCashFlowLedgerPanel
        cashFlowPage={cashFlowPage}
        loading={loadingCashFlowPage}
        onRefresh={onRefreshCashFlowPage}
        onPageChange={onCashFlowPageChange}
      />
    );
  }

  if (activeSection === "account-cash") {
    return (
      <AdminUserCashAdjustmentPanel
        userKey={userCashKey}
        amount={userCashAmount}
        loadingFundFlow={loadingUserFundFlow}
        adjustingUserCashType={adjustingUserCashType}
        fundFlow={userFundFlow}
        fundFlowUserKey={userFundFlowUserKey}
        onUserKeyChange={onUserCashKeyChange}
        onAmountChange={onUserCashAmountChange}
        onLoadFundFlow={onLoadUserFundFlow}
        onAdjustCash={onAdjustUserCash}
      />
    );
  }

  if (activeSection === "salary") {
    return (
      <SalaryEligibilityPanel
        rows={salaryEligibility.visibleRows}
        totalCount={salaryEligibility.rows.length}
        pageStart={salaryEligibility.pagination.pageStart}
        pageEnd={salaryEligibility.pagination.pageEnd}
        currentPage={salaryEligibility.pagination.boundedPage}
        totalPages={salaryEligibility.pagination.totalPages}
        receivableCount={salaryEligibility.summary.receivableCount}
        policyCount={salaryEligibility.summary.policyCount}
        accountCheckCount={salaryEligibility.summary.accountCheckCount}
        excludedCount={salaryEligibility.summary.excludedCount}
        loading={loadingSalaryEligibility}
        error={salaryEligibilityError}
        runtimeControl={autoParticipantCashFlowRuntimeControl}
        running={runningCashFlow}
        lastRun={lastCashFlowRun}
        onPageChange={salaryEligibility.setPage}
        onRun={onRunCashFlow}
      />
    );
  }

  if (activeSection === "profile-overview") {
    return (
      <ParticipantProfileOverviewPanel
        summaries={profileOverviewSummaries}
        loading={loadingProfileOverviews}
        error={profileOverviewError}
        onRefresh={onRefreshProfileOverviews}
        allSummaries={profileOverviewAllSummaries}
        loadingAll={loadingProfileOverviewAll}
        allError={profileOverviewAllError}
        onLoadAll={onLoadAllProfileOverviews}
      />
    );
  }

  return null;
}
