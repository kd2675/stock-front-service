import { formatCount, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { FundFlowLine, SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AdminFundFlowSummary } from "@/app/types/stock";

export function AdminFlowFundSummaryPanel({
  fundFlow,
  loading,
  error,
}: {
  fundFlow: AdminFundFlowSummary | null;
  loading: boolean;
  error: boolean;
}) {
  if (!fundFlow) {
    return (
      <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#8b95a1]">
        {loading ? "누적 자금 요약을 조회하고 있습니다." : error ? "누적 자금 요약을 조회하지 못했습니다. 흐름 새로고침을 다시 눌러 주세요." : "누적 자금 요약을 아직 조회하지 못했습니다."}
      </div>
    );
  }

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
        <FundFlowLine label="전체 체결" value={formatCount(fundFlow.executionCount, "건")} />
      </div>
    </>
  );
}
