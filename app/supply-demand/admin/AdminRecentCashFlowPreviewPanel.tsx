import Link from "next/link";

import { formatCashFlowReason, formatCount, formatDateTime, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminRecentCashFlow } from "@/app/types/stock";

export function AdminRecentCashFlowPreviewPanel({
  cashFlows,
}: {
  cashFlows: AdminRecentCashFlow[];
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white">최근 현금 원장</h3>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">
            최근 {formatCount(cashFlows.length, "건")} 미리보기
          </p>
        </div>
        <Link
          href="/supply-demand/admin/accounts/cash-flows"
          className="inline-flex min-h-9 items-center rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418]"
        >
          전체 보기
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {cashFlows.map((cashFlow) => (
          <div key={cashFlow.id} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-black text-white">{cashFlow.userKey ?? `계좌 ${cashFlow.accountId}`}</p>
              <span className={cashFlow.flowType === "WITHDRAW" ? "shrink-0 text-sm font-black tabular-nums text-[#ffb4a8]" : "shrink-0 text-sm font-black tabular-nums text-[#6ee7a8]"}>
                {cashFlow.flowType === "WITHDRAW" ? "-" : "+"}{formatWon(cashFlow.amount)}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-[#8b95a1]">{formatCashFlowReason(cashFlow.reason)} · {formatDateTime(cashFlow.createdAt)}</p>
          </div>
        ))}
        {cashFlows.length === 0 ? (
          <p className="rounded-md bg-white/[0.04] px-3 py-4 text-sm font-bold text-[#8b95a1]">최근 현금 원장이 없습니다.</p>
        ) : null}
      </div>
    </div>
  );
}
