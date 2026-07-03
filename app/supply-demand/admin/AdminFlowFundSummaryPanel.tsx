import { useState } from "react";

import { formatCount, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { FundFlowLine, SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AdminFundFlowSummary } from "@/app/types/stock";

export function AdminFlowFundSummaryPanel({
  fundFlow,
  allFundFlow,
  loading,
  loadingAll,
  error,
  allError,
  onLoadAll,
}: {
  fundFlow: AdminFundFlowSummary | null;
  allFundFlow: AdminFundFlowSummary | null;
  loading: boolean;
  loadingAll: boolean;
  error: boolean;
  allError: boolean;
  onLoadAll: () => void;
}) {
  const [showAllFundFlow, setShowAllFundFlow] = useState(false);

  const openAllFundFlow = () => {
    setShowAllFundFlow(true);
    if (!allFundFlow && !loadingAll) {
      onLoadAll();
    }
  };

  if (!fundFlow) {
    return (
      <>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold leading-6 text-[#8b95a1]">
            {loading ? "시뮬레이션 하루 자금 흐름을 조회하고 있습니다." : error ? "시뮬레이션 하루 자금 흐름을 조회하지 못했습니다. 흐름 새로고침을 다시 눌러 주세요." : "시뮬레이션 하루 자금 흐름을 아직 조회하지 못했습니다."}
          </p>
          <button
            type="button"
            onClick={openAllFundFlow}
            className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-[#d8ecff] transition hover:border-[#64a8ff] hover:text-white"
          >
            전체 보기
          </button>
        </div>
        <AdminAllFundFlowModal
          fundFlow={allFundFlow}
          loading={loadingAll}
          error={allError}
          open={showAllFundFlow}
          onClose={() => setShowAllFundFlow(false)}
          onRefresh={onLoadAll}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">시뮬레이션 하루 자금 흐름</h3>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">현재 조회 시점의 시뮬레이션 장 시작부터 지금까지의 입출금, 체결, 손익입니다.</p>
        </div>
        <button
          type="button"
          onClick={openAllFundFlow}
          className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-[#d8ecff] transition hover:border-[#64a8ff] hover:text-white"
        >
          전체 보기
        </button>
      </div>

      <AdminFundFlowMetricGrids fundFlow={fundFlow} executionLabel="하루 체결" />

      <AdminAllFundFlowModal
        fundFlow={allFundFlow}
        loading={loadingAll}
        error={allError}
        open={showAllFundFlow}
        onClose={() => setShowAllFundFlow(false)}
        onRefresh={onLoadAll}
      />
    </>
  );
}

function AdminFundFlowMetricGrids({
  fundFlow,
  executionLabel,
}: {
  fundFlow: AdminFundFlowSummary;
  executionLabel: string;
}) {
  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SalaryMetric label="활성 계좌" value={formatCount(fundFlow.activeAccountCount, "개")} tone="neutral" />
        <SalaryMetric label="전체 현금" value={formatWon(fundFlow.totalCashBalance)} tone="neutral" />
        <SalaryMetric label="예약 매수 현금" value={formatWon(fundFlow.totalReservedBuyCash)} tone="warn" />
        <SalaryMetric label="전체 총자산" value={formatWon(fundFlow.totalAsset)} tone="good" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FundFlowLine label="순입금" value={formatWon(fundFlow.netExternalCashFlow)} />
        <FundFlowLine label="배당 수입" value={formatWon(fundFlow.dividendIncomeAmount)} />
        <FundFlowLine label="거래 순현금" value={formatWon(fundFlow.tradeNetCashFlow)} />
        <FundFlowLine label="수수료/세금" value={formatWon(fundFlow.totalFeeAmount + fundFlow.totalTaxAmount)} />
        <FundFlowLine label="매수 순유출" value={formatWon(fundFlow.buyNetAmount)} />
        <FundFlowLine label="매도 순유입" value={formatWon(fundFlow.sellNetAmount)} />
        <FundFlowLine label="실현 손익" value={formatWon(fundFlow.realizedProfit)} />
        <FundFlowLine label={executionLabel} value={formatCount(fundFlow.executionCount, "건")} />
      </div>
    </>
  );
}

function AdminAllFundFlowModal({
  fundFlow,
  loading,
  error,
  open,
  onClose,
  onRefresh,
}: {
  fundFlow: AdminFundFlowSummary | null;
  loading: boolean;
  error: boolean;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl rounded-lg border border-white/10 bg-[#11161d] p-4 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white">전체 누적 자금 흐름</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">서비스에 쌓인 전체 원장과 전체 체결 기준의 누적 흐름입니다. 계좌 잔액과 총자산은 현재 스냅샷입니다.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {loading ? (
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#d8ecff]">조회 중</span>
            ) : null}
            {error ? (
              <span className="rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8]">조회 실패</span>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-[#d8ecff] transition hover:border-[#64a8ff] hover:text-white"
            >
              다시 조회
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418]"
            >
              닫기
            </button>
          </div>
        </div>

        {fundFlow ? (
          <AdminFundFlowMetricGrids fundFlow={fundFlow} executionLabel="전체 체결" />
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#8b95a1]">
            {loading ? "전체 누적 자금 흐름을 조회하고 있습니다." : "전체 누적 자금 흐름을 아직 조회하지 못했습니다."}
          </div>
        )}
      </div>
    </div>
  );
}
