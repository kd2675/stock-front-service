import { ADMIN_CASH_FLOW_PAGE_SIZE } from "@/app/supply-demand/admin/AdminConstants";
import { formatCashFlowReason, formatCount, formatDateTime, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminCashFlowPage } from "@/app/types/stock";

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
            {cashFlowPage ? `총 ${formatCount(cashFlowPage.totalElements, "건")}` : "조회 필요"}
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
          {cashFlowPage ? `페이지당 ${formatCount(cashFlowPage.size, "건")}` : `페이지당 ${formatCount(ADMIN_CASH_FLOW_PAGE_SIZE, "건")}`}
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
