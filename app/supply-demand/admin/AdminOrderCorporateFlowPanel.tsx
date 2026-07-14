import { formatCount, formatInteger, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { FundFlowLine } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AdminCorporateActionFlowSummary, AdminOrderFlowSummary } from "@/app/types/stock";

export function AdminOrderCorporateFlowPanel({
  corporateActionFlow,
  orderFlow,
}: {
  corporateActionFlow: AdminCorporateActionFlowSummary | null | undefined;
  orderFlow: AdminOrderFlowSummary | null | undefined;
}) {
  if (!orderFlow || !corporateActionFlow) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className="rounded-md border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-white">주문 흐름</h3>
          <span className="text-xs font-bold text-stock-subtle">2시간 {formatCount(orderFlow.todayOrderCount, "건")}</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <FundFlowLine label="대기 주문" value={formatCount(orderFlow.openOrderCount, "건")} />
          <FundFlowLine label="매수/매도 대기" value={`${formatInteger(orderFlow.openBuyOrderCount)} / ${formatInteger(orderFlow.openSellOrderCount)}`} />
          <FundFlowLine label="부분체결" value={formatCount(orderFlow.partiallyFilledOrderCount, "건")} />
          <FundFlowLine label="예약 매수금" value={formatWon(orderFlow.reservedBuyCash)} />
          <FundFlowLine label="예약 매도수량" value={formatCount(orderFlow.reservedSellQuantity, "주")} />
          <FundFlowLine label="2시간 체결/취소/거절" value={`${formatInteger(orderFlow.todayFilledOrderCount)} / ${formatInteger(orderFlow.todayCancelledOrderCount)} / ${formatInteger(orderFlow.todayRejectedOrderCount)}`} />
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-white">주식 이벤트 흐름</h3>
          <span className="text-xs font-bold text-stock-subtle">2시간 생성 {formatCount(corporateActionFlow.todayCreatedCount, "건")}</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <FundFlowLine label="진행 중" value={formatCount(corporateActionFlow.pendingCount, "건")} />
          <FundFlowLine label="공시/권리락" value={`${formatInteger(corporateActionFlow.announcedCount)} / ${formatInteger(corporateActionFlow.exRightsAppliedCount)}`} />
          <FundFlowLine label="지급 완료" value={formatCount(corporateActionFlow.paidCount, "건")} />
          <FundFlowLine label="상장 완료" value={formatCount(corporateActionFlow.listedCount, "건")} />
          <FundFlowLine label="상장폐지" value={formatCount(corporateActionFlow.delistedCount, "건")} />
          <FundFlowLine label="이벤트 총합" value={formatCount(
            corporateActionFlow.announcedCount
            + corporateActionFlow.exRightsAppliedCount
            + corporateActionFlow.paidCount
            + corporateActionFlow.listedCount
            + corporateActionFlow.delistedCount,
            "건"
          )} />
        </div>
      </div>
    </div>
  );
}
