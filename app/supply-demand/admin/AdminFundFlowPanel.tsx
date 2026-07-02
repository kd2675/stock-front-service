import { formatCashFlowReason, formatCount, formatDateTime, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { FundFlowLine, SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { FundFlow } from "@/app/types/stock";

export function AdminFundFlowPanel({ userKey, fundFlow }: { userKey: string; fundFlow: FundFlow }) {
  return (
    <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">자금 흐름</h3>
          <p className="mt-1 break-all text-xs font-bold text-[#8b95a1]">{userKey}</p>
        </div>
        <span className="rounded-md bg-[#19324a] px-2 py-1 text-xs font-black text-[#64a8ff]">
          {formatCount(fundFlow.executionCount, "체결")}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SalaryMetric label="현재 현금" value={formatWon(fundFlow.cashBalance)} tone="neutral" />
        <SalaryMetric label="예약 현금" value={formatWon(fundFlow.reservedBuyCash)} tone="warn" />
        <SalaryMetric label="평가 금액" value={formatWon(fundFlow.marketValue)} tone="neutral" />
        <SalaryMetric label="총 자산" value={formatWon(fundFlow.totalAsset)} tone="good" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FundFlowLine label="순입금" value={formatWon(fundFlow.netExternalCashFlow)} />
        <FundFlowLine label="배당 수입" value={formatWon(fundFlow.dividendIncomeAmount)} />
        <FundFlowLine label="거래 순현금" value={formatWon(fundFlow.tradeNetCashFlow)} />
        <FundFlowLine label="수수료/세금" value={formatWon(fundFlow.totalFeeAmount + fundFlow.totalTaxAmount)} />
        <FundFlowLine label="매수 순유출" value={formatWon(fundFlow.buyNetAmount)} />
        <FundFlowLine label="매도 순유입" value={formatWon(fundFlow.sellNetAmount)} />
        <FundFlowLine label="실현 손익" value={formatWon(fundFlow.realizedProfit)} />
        <FundFlowLine label="평가 손익" value={formatWon(fundFlow.unrealizedProfit)} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[720px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">일시</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">사유</th>
              <th className="px-3 py-2 text-right">금액</th>
              <th className="px-3 py-2">처리자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {fundFlow.recentCashFlows.slice(0, 10).map((cashFlow) => (
              <tr key={cashFlow.id}>
                <td className="px-3 py-2 text-xs font-bold text-[#8b95a1]">{formatDateTime(cashFlow.createdAt)}</td>
                <td className="px-3 py-2 font-black text-white">{cashFlow.flowType === "WITHDRAW" ? "회수" : "입금"}</td>
                <td className="px-3 py-2 text-[#b8c2cc]">{formatCashFlowReason(cashFlow.reason)}</td>
                <td className={cashFlow.flowType === "WITHDRAW" ? "px-3 py-2 text-right font-black tabular-nums text-[#ffb4a8]" : "px-3 py-2 text-right font-black tabular-nums text-[#6ee7a8]"}>
                  {cashFlow.flowType === "WITHDRAW" ? "-" : "+"}{formatWon(cashFlow.amount)}
                </td>
                <td className="px-3 py-2 text-xs font-bold text-[#8b95a1]">{cashFlow.createdBy ?? "-"}</td>
              </tr>
            ))}
            {fundFlow.recentCashFlows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm font-bold text-[#8b95a1]">현금 흐름 원장 내역이 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
