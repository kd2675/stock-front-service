import { ADMIN_SYMBOL_FLOW_PREVIEW_SIZE } from "@/app/supply-demand/admin/AdminConstants";
import { formatDateTime } from "@/app/supply-demand/admin/AdminFormatters";
import { AdminFlowFundSummaryPanel } from "@/app/supply-demand/admin/AdminFlowFundSummaryPanel";
import { AdminInvestorFlowPanel } from "@/app/supply-demand/admin/AdminInvestorFlowPanel";
import { AdminOrderCorporateFlowPanel } from "@/app/supply-demand/admin/AdminOrderCorporateFlowPanel";
import { AdminRecentCashFlowPreviewPanel } from "@/app/supply-demand/admin/AdminRecentCashFlowPreviewPanel";
import { AdminSymbolFlowTablePanel } from "@/app/supply-demand/admin/AdminSymbolFlowTablePanel";
import type { AdminFlowOverview, AdminFundFlowBreakdown, AdminInvestorFlowHistory, AdminInvestorFlowSummary, AdminParticipantScope, AdminSymbolFlowList, AdminTotalAssetHistoryPage } from "@/app/types/stock";

export function AdminFlowOverviewPanel({
  overview,
  fundFlow,
  cumulativeFundFlow,
  loadingFundFlow,
  loadingCumulativeFundFlow,
  fundFlowError,
  cumulativeFundFlowError,
  investorFlow,
  investorFlowError,
  investorFlowHistory,
  investorFlowHistoryError,
  investorFlowHistoryLoading,
  investorFlowRefreshing,
  symbolFlowList,
  loadingSymbolFlows,
  onLoadCumulativeFundFlow,
  onLoadTotalAssetHistory,
  onLoadInvestorFlowHistory,
  onLoadWeeklySymbolFlows,
  onRefresh,
}: {
  overview: AdminFlowOverview | null;
  fundFlow: AdminFundFlowBreakdown | null;
  cumulativeFundFlow: AdminFundFlowBreakdown | null;
  loadingFundFlow: boolean;
  loadingCumulativeFundFlow: boolean;
  fundFlowError: boolean;
  cumulativeFundFlowError: boolean;
  investorFlow: AdminInvestorFlowSummary | null;
  investorFlowError: boolean;
  investorFlowHistory: AdminInvestorFlowHistory | null;
  investorFlowHistoryError: boolean;
  investorFlowHistoryLoading: boolean;
  investorFlowRefreshing: boolean;
  symbolFlowList: AdminSymbolFlowList;
  loadingSymbolFlows: boolean;
  onLoadCumulativeFundFlow: () => void;
  onLoadTotalAssetHistory: (page: number, participantScope: AdminParticipantScope) => Promise<AdminTotalAssetHistoryPage | null>;
  onLoadInvestorFlowHistory: () => void;
  onLoadWeeklySymbolFlows: (dayOffset: number) => Promise<AdminSymbolFlowList | null>;
  onRefresh: () => void;
}) {
  const orderFlow = overview?.orderFlow;
  const corporateActionFlow = overview?.corporateActionFlow;
  const symbolFlows = symbolFlowList.symbolFlows;
  const symbolFlowTotalCount = symbolFlowList.totalCount;
  const visibleSymbolFlows = symbolFlows.slice(0, ADMIN_SYMBOL_FLOW_PREVIEW_SIZE);
  const recentCashFlows = overview?.recentCashFlows.slice(0, 8) ?? [];
  const flowGeneratedAt = overview?.generatedAt ?? fundFlow?.generatedAt;

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">시장 흐름 요약</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">전체·역할별 계좌 자산, 참여자별 체결, 주문장 종목 거래와 최근 현금 원장을 확인합니다. 자산과 거래 흐름은 기본적으로 시뮬레이션 하루 기준입니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-xs font-black text-admin-accent">
            {flowGeneratedAt ? `갱신 ${formatDateTime(flowGeneratedAt)}` : "조회 필요"}
          </span>
          {loadingFundFlow ? (
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">하루 자금 조회 중</span>
          ) : null}
          {fundFlowError ? (
            <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-xs font-black text-admin-danger">하루 자금 실패</span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-11 rounded-md bg-white px-3 py-2 text-xs font-black text-admin-canvas"
          >
            흐름 새로고침
          </button>
        </div>
      </div>

      <div>
        <AdminFlowFundSummaryPanel
          fundFlow={fundFlow}
          cumulativeFundFlow={cumulativeFundFlow}
          loading={loadingFundFlow}
          loadingCumulative={loadingCumulativeFundFlow}
          error={fundFlowError}
          cumulativeError={cumulativeFundFlowError}
          onLoadCumulative={onLoadCumulativeFundFlow}
          onLoadTotalAssetHistory={onLoadTotalAssetHistory}
        />
      </div>
      <AdminInvestorFlowPanel
        error={investorFlowError}
        history={investorFlowHistory}
        historyError={investorFlowHistoryError}
        historyLoading={investorFlowHistoryLoading}
        investorFlow={investorFlow}
        refreshing={investorFlowRefreshing}
        onLoadHistory={onLoadInvestorFlowHistory}
      />
      <div>
        <AdminOrderCorporateFlowPanel orderFlow={orderFlow} corporateActionFlow={corporateActionFlow} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <AdminSymbolFlowTablePanel
          loading={loadingSymbolFlows}
          onLoadWeekly={onLoadWeeklySymbolFlows}
          symbolFlowTotalCount={symbolFlowTotalCount}
          visibleSymbolFlows={visibleSymbolFlows}
        />
        <AdminRecentCashFlowPreviewPanel cashFlows={recentCashFlows} />
      </div>
    </section>
  );
}
