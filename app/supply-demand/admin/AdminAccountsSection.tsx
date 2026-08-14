import { AdminCashFlowLedgerPanel } from "@/app/supply-demand/admin/AdminCashFlowLedgerPanel";
import { AdminUserCashAdjustmentPanel } from "@/app/supply-demand/admin/AdminUserCashAdjustmentPanel";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import type { AdminSection } from "@/app/supply-demand/admin/AdminNavigationConfig";
import { ParticipantProfileOverviewPanel } from "@/app/supply-demand/admin/AdminParticipantOverviewPanels";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import type {
  AdminCashFlowPage,
  FundFlow,
} from "@/app/types/stock";

type AdminAccountsSectionProps = {
  activeSection: AdminSection;
  cashFlowPage: AdminCashFlowPage | null;
  loadingCashFlowPage: boolean;
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
  profileOverviewSummaries,
  profileOverviewAllSummaries,
  loadingProfileOverviews,
  loadingProfileOverviewAll,
  profileOverviewError,
  profileOverviewAllError,
}: AdminAccountsSectionProps) {
  if (activeSection === "funds-ledger") {
    return (
      <AdminCashFlowLedgerPanel
        cashFlowPage={cashFlowPage}
        loading={loadingCashFlowPage}
        onRefresh={onRefreshCashFlowPage}
        onPageChange={onCashFlowPageChange}
      />
    );
  }

  if (activeSection === "funds-accounts") {
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

  if (activeSection === "participants-overview") {
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
