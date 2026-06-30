import { ADMIN_CASH_FLOW_PAGE_SIZE } from "@/app/supply-demand/admin/AdminConstants";
import { formatCashFlowReason, formatDateTime, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput } from "@/app/supply-demand/admin/AdminFormControls";
import { FundFlowLine, SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AdminCashFlowPage, FundFlow } from "@/app/types/stock";

export function AdminCashFlowLedgerPanel({
  cashFlowPage,
  loading,
  onRefresh,
  onPageChange,
}: {
  cashFlowPage: AdminCashFlowPage | null;
  loading: boolean;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, cashFlowPage?.totalPages ?? 0);

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">전체 현금 원장</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">유저와 자동참여자 계좌의 입금, 회수, 월급, 배당 현금 흐름을 페이지 단위로 조회합니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-md bg-[#19324a] px-2 py-1 text-xs font-black text-[#64a8ff]">
            {cashFlowPage ? `총 ${cashFlowPage.totalElements.toLocaleString("ko-KR")}건` : "조회 필요"}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-10 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418] disabled:cursor-wait disabled:opacity-55"
          >
            {loading ? "조회 중" : "새로고침"}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">일시</th>
              <th className="px-3 py-2">사용자/계좌</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">사유</th>
              <th className="px-3 py-2 text-right">금액</th>
              <th className="px-3 py-2">처리자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {cashFlowPage?.content.map((cashFlow) => (
              <tr key={cashFlow.id}>
                <td className="px-3 py-2 text-xs font-bold text-[#8b95a1]">{formatDateTime(cashFlow.createdAt)}</td>
                <td className="px-3 py-2">
                  <p className="max-w-[280px] break-all text-xs font-black text-white">{cashFlow.userKey ?? `계좌 ${cashFlow.accountId}`}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#8b95a1]">계좌 ID {cashFlow.accountId}</p>
                </td>
                <td className="px-3 py-2 font-black text-white">{cashFlow.flowType === "WITHDRAW" ? "회수" : "입금"}</td>
                <td className="px-3 py-2 text-[#b8c2cc]">{formatCashFlowReason(cashFlow.reason)}</td>
                <td className={cashFlow.flowType === "WITHDRAW" ? "px-3 py-2 text-right font-black tabular-nums text-[#ffb4a8]" : "px-3 py-2 text-right font-black tabular-nums text-[#6ee7a8]"}>
                  {cashFlow.flowType === "WITHDRAW" ? "-" : "+"}{formatWon(cashFlow.amount)}
                </td>
                <td className="px-3 py-2 text-xs font-bold text-[#8b95a1]">{cashFlow.createdBy ?? "-"}</td>
              </tr>
            ))}
            {(!cashFlowPage || cashFlowPage.content.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm font-bold text-[#8b95a1]">
                  {loading ? "현금 원장을 조회하고 있습니다." : "현금 원장 내역이 없습니다."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#8b95a1]">
          {cashFlowPage ? `페이지당 ${cashFlowPage.size.toLocaleString("ko-KR")}건` : `페이지당 ${ADMIN_CASH_FLOW_PAGE_SIZE.toLocaleString("ko-KR")}건`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cashFlowPage ? onPageChange(cashFlowPage.page - 1) : undefined}
            disabled={loading || !cashFlowPage?.hasPrevious}
            className="min-h-9 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            이전
          </button>
          <span className="min-w-20 text-center text-xs font-black text-white tabular-nums">
            {cashFlowPage ? cashFlowPage.page + 1 : 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => cashFlowPage ? onPageChange(cashFlowPage.page + 1) : undefined}
            disabled={loading || !cashFlowPage?.hasNext}
            className="min-h-9 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            다음
          </button>
        </div>
      </div>
    </section>
  );
}

export function AdminUserCashAdjustmentPanel({
  userKey,
  amount,
  loadingFundFlow,
  adjustingUserCashType,
  fundFlow,
  fundFlowUserKey,
  onUserKeyChange,
  onAmountChange,
  onLoadFundFlow,
  onAdjustCash,
}: {
  userKey: string;
  amount: string;
  loadingFundFlow: boolean;
  adjustingUserCashType: "DEPOSIT" | "WITHDRAW" | null;
  fundFlow: FundFlow | null;
  fundFlowUserKey: string | null;
  onUserKeyChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onLoadFundFlow: () => void;
  onAdjustCash: (adjustmentType: "DEPOSIT" | "WITHDRAW") => void;
}) {
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">실제 유저 계좌 현금</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동참여자가 아닌 로그인 유저의 모의투자 계좌에 입금하거나 회수합니다.</p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">stock_account_cash_flow 원장 기록</span>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto_auto]">
        <DarkInput label="유저 식별키" value={userKey} onChange={onUserKeyChange} placeholder="userKey" />
        <DarkInput label="입금/회수 금액" value={amount} onChange={onAmountChange} placeholder="1000000" />
        <button
          type="button"
          onClick={onLoadFundFlow}
          disabled={loadingFundFlow}
          className="min-h-11 rounded-md bg-white px-4 py-3 text-sm font-black text-[#101418] disabled:cursor-wait disabled:opacity-55"
        >
          {loadingFundFlow ? "조회 중" : "흐름 조회"}
        </button>
        <button
          type="button"
          onClick={() => onAdjustCash("DEPOSIT")}
          disabled={adjustingUserCashType !== null}
          className="min-h-11 rounded-md bg-[#f04452] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {adjustingUserCashType === "DEPOSIT" ? "입금 중" : "입금"}
        </button>
        <button
          type="button"
          onClick={() => onAdjustCash("WITHDRAW")}
          disabled={adjustingUserCashType !== null}
          className="min-h-11 rounded-md bg-[#3182f6] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {adjustingUserCashType === "WITHDRAW" ? "회수 중" : "회수"}
        </button>
      </div>
      {fundFlow ? (
        <AdminFundFlowPanel userKey={fundFlowUserKey ?? userKey.trim()} fundFlow={fundFlow} />
      ) : (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#8b95a1]">
          유저 식별키를 입력하고 흐름 조회를 누르면 입출금, 예약 현금, 거래 순현금, 배당 수입, 최근 현금 원장을 확인할 수 있습니다.
        </div>
      )}
    </section>
  );
}

export function AdminFundFlowPanel({ userKey, fundFlow }: { userKey: string; fundFlow: FundFlow }) {
  return (
    <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">자금 흐름</h3>
          <p className="mt-1 break-all text-xs font-bold text-[#8b95a1]">{userKey}</p>
        </div>
        <span className="rounded-md bg-[#19324a] px-2 py-1 text-xs font-black text-[#64a8ff]">
          {fundFlow.executionCount.toLocaleString("ko-KR")}체결
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
