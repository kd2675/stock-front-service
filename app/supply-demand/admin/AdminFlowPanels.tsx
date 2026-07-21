import { ADMIN_SYMBOL_FLOW_PREVIEW_SIZE } from "@/app/supply-demand/admin/AdminConstants";
import { formatDateTime } from "@/app/supply-demand/admin/AdminFormatters";
import { AdminFlowFundSummaryPanel } from "@/app/supply-demand/admin/AdminFlowFundSummaryPanel";
import { AdminInvestorFlowPanel } from "@/app/supply-demand/admin/AdminInvestorFlowPanel";
import { AdminOrderCorporateFlowPanel } from "@/app/supply-demand/admin/AdminOrderCorporateFlowPanel";
import { AdminRecentCashFlowPreviewPanel } from "@/app/supply-demand/admin/AdminRecentCashFlowPreviewPanel";
import { AdminSymbolFlowTablePanel } from "@/app/supply-demand/admin/AdminSymbolFlowTablePanel";
import type { AdminFlowOverview, AdminFundFlowSummary, AdminInvestorFlowHistory, AdminInvestorFlowSummary, AdminSymbolFlowList, AdminTotalAssetHistoryPage } from "@/app/types/stock";

export function AdminFlowOverviewPanel({
  overview,
  fundFlow,
  allFundFlow,
  loadingFundFlow,
  loadingAllFundFlow,
  fundFlowError,
  allFundFlowError,
  investorFlow,
  investorFlowError,
  investorFlowHistory,
  investorFlowHistoryError,
  investorFlowHistoryLoading,
  investorFlowRefreshing,
  symbolFlowList,
  loadingSymbolFlows,
  onLoadAllFundFlow,
  onLoadTotalAssetHistory,
  onLoadInvestorFlowHistory,
  onLoadWeeklySymbolFlows,
  onRefresh,
}: {
  overview: AdminFlowOverview | null;
  fundFlow: AdminFundFlowSummary | null;
  allFundFlow: AdminFundFlowSummary | null;
  loadingFundFlow: boolean;
  loadingAllFundFlow: boolean;
  fundFlowError: boolean;
  allFundFlowError: boolean;
  investorFlow: AdminInvestorFlowSummary | null;
  investorFlowError: boolean;
  investorFlowHistory: AdminInvestorFlowHistory | null;
  investorFlowHistoryError: boolean;
  investorFlowHistoryLoading: boolean;
  investorFlowRefreshing: boolean;
  symbolFlowList: AdminSymbolFlowList;
  loadingSymbolFlows: boolean;
  onLoadAllFundFlow: () => void;
  onLoadTotalAssetHistory: (page: number) => Promise<AdminTotalAssetHistoryPage | null>;
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

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">전체 흐름 대시보드</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">전체 계좌 자금, 주문장 종목 체결, 최근 현금 원장을 봅니다. 자금과 종목 흐름은 기본적으로 시뮬레이션 하루 기준입니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-xs font-black text-admin-accent">
            {overview ? `갱신 ${formatDateTime(overview.generatedAt)}` : "조회 필요"}
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
          allFundFlow={allFundFlow}
          loading={loadingFundFlow}
          loadingAll={loadingAllFundFlow}
          error={fundFlowError}
          allError={allFundFlowError}
          onLoadAll={onLoadAllFundFlow}
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
