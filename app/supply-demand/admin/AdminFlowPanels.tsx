import { useState } from "react";

import Link from "next/link";

import { ADMIN_SYMBOL_FLOW_PREVIEW_SIZE } from "@/app/supply-demand/admin/AdminConstants";
import { formatCashFlowReason, formatDateTime, formatFlowMarketStatus, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { FundFlowLine, SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AdminFlowOverview, AdminFundFlowSummary, AdminSymbolFlowList } from "@/app/types/stock";

export function AdminFlowOverviewPanel({
  overview,
  fundFlow,
  loadingFundFlow,
  fundFlowError,
  symbolFlowList,
  loadingSymbolFlows,
  loadingAllSymbolFlows,
  onLoadAllSymbolFlows,
  onRefresh,
}: {
  overview: AdminFlowOverview | null;
  fundFlow: AdminFundFlowSummary | null;
  loadingFundFlow: boolean;
  fundFlowError: boolean;
  symbolFlowList: AdminSymbolFlowList;
  loadingSymbolFlows: boolean;
  loadingAllSymbolFlows: boolean;
  onLoadAllSymbolFlows: () => void;
  onRefresh: () => void;
}) {
  const [showAllSymbolFlows, setShowAllSymbolFlows] = useState(false);
  const orderFlow = overview?.orderFlow;
  const corporateActionFlow = overview?.corporateActionFlow;
  const symbolFlows = symbolFlowList.symbolFlows;
  const symbolFlowTotalCount = symbolFlowList.totalCount;
  const hasMoreSymbolFlows = symbolFlowTotalCount > symbolFlows.length;
  const canToggleSymbolFlows = symbolFlowTotalCount > ADMIN_SYMBOL_FLOW_PREVIEW_SIZE;
  const isShowingAllSymbolFlows = showAllSymbolFlows && !hasMoreSymbolFlows;
  const visibleSymbolFlows = isShowingAllSymbolFlows ? symbolFlows : symbolFlows.slice(0, ADMIN_SYMBOL_FLOW_PREVIEW_SIZE);
  const recentCashFlows = overview?.recentCashFlows.slice(0, 8) ?? [];

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">전체 흐름 대시보드</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">전체 계좌 자금, 주문장 종목 체결, 최근 현금 원장을 봅니다. 누적 자금 요약은 별도 조회로 갱신됩니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-md bg-[#19324a] px-2 py-1 text-xs font-black text-[#64a8ff]">
            {overview ? `갱신 ${formatDateTime(overview.generatedAt)}` : "조회 필요"}
          </span>
          {loadingFundFlow ? (
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#d8ecff]">자금 요약 조회 중</span>
          ) : null}
          {fundFlowError ? (
            <span className="rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8]">자금 요약 실패</span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-10 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418]"
          >
            흐름 새로고침
          </button>
        </div>
      </div>

      {fundFlow ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SalaryMetric label="활성 계좌" value={`${fundFlow.activeAccountCount.toLocaleString("ko-KR")}개`} tone="neutral" />
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
            <FundFlowLine label="전체 체결" value={`${fundFlow.executionCount.toLocaleString("ko-KR")}건`} />
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#8b95a1]">
          {loadingFundFlow ? "누적 자금 요약을 조회하고 있습니다." : fundFlowError ? "누적 자금 요약을 조회하지 못했습니다. 흐름 새로고침을 다시 눌러 주세요." : "누적 자금 요약을 아직 조회하지 못했습니다."}
        </div>
      )}

      {orderFlow && corporateActionFlow ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-white">주문 흐름</h3>
              <span className="text-xs font-bold text-[#8b95a1]">오늘 {orderFlow.todayOrderCount.toLocaleString("ko-KR")}건</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <FundFlowLine label="대기 주문" value={`${orderFlow.openOrderCount.toLocaleString("ko-KR")}건`} />
              <FundFlowLine label="매수/매도 대기" value={`${orderFlow.openBuyOrderCount.toLocaleString("ko-KR")} / ${orderFlow.openSellOrderCount.toLocaleString("ko-KR")}`} />
              <FundFlowLine label="부분체결" value={`${orderFlow.partiallyFilledOrderCount.toLocaleString("ko-KR")}건`} />
              <FundFlowLine label="예약 매수금" value={formatWon(orderFlow.reservedBuyCash)} />
              <FundFlowLine label="예약 매도수량" value={`${orderFlow.reservedSellQuantity.toLocaleString("ko-KR")}주`} />
              <FundFlowLine label="오늘 체결/취소/거절" value={`${orderFlow.todayFilledOrderCount.toLocaleString("ko-KR")} / ${orderFlow.todayCancelledOrderCount.toLocaleString("ko-KR")} / ${orderFlow.todayRejectedOrderCount.toLocaleString("ko-KR")}`} />
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-white">주식 이벤트 흐름</h3>
              <span className="text-xs font-bold text-[#8b95a1]">오늘 생성 {corporateActionFlow.todayCreatedCount.toLocaleString("ko-KR")}건</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <FundFlowLine label="진행 중" value={`${corporateActionFlow.pendingCount.toLocaleString("ko-KR")}건`} />
              <FundFlowLine label="공시/권리락" value={`${corporateActionFlow.announcedCount.toLocaleString("ko-KR")} / ${corporateActionFlow.exRightsAppliedCount.toLocaleString("ko-KR")}`} />
              <FundFlowLine label="지급 완료" value={`${corporateActionFlow.paidCount.toLocaleString("ko-KR")}건`} />
              <FundFlowLine label="상장 완료" value={`${corporateActionFlow.listedCount.toLocaleString("ko-KR")}건`} />
              <FundFlowLine label="상장폐지" value={`${corporateActionFlow.delistedCount.toLocaleString("ko-KR")}건`} />
              <FundFlowLine label="이벤트 총합" value={`${(
                corporateActionFlow.announcedCount
                + corporateActionFlow.exRightsAppliedCount
                + corporateActionFlow.paidCount
                + corporateActionFlow.listedCount
                + corporateActionFlow.delistedCount
              ).toLocaleString("ko-KR")}건`} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-white">종목 흐름</h3>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs font-bold text-[#8b95a1]">
                {isShowingAllSymbolFlows
                  ? `전체 ${visibleSymbolFlows.length.toLocaleString("ko-KR")}개 / ${symbolFlowTotalCount.toLocaleString("ko-KR")}개`
                  : `거래대금 상위 ${visibleSymbolFlows.length.toLocaleString("ko-KR")}개 / 전체 ${symbolFlowTotalCount.toLocaleString("ko-KR")}개`}
              </span>
              {canToggleSymbolFlows ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isShowingAllSymbolFlows) {
                      setShowAllSymbolFlows(false);
                      return;
                    }
                    if (hasMoreSymbolFlows) {
                      onLoadAllSymbolFlows();
                    }
                    setShowAllSymbolFlows(true);
                  }}
                  disabled={loadingAllSymbolFlows || loadingSymbolFlows}
                  className="min-h-9 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                >
                  {loadingAllSymbolFlows || loadingSymbolFlows ? "불러오는 중" : isShowingAllSymbolFlows ? "상위만 보기" : "전체 보기"}
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">종목</th>
                  <th className="px-3 py-2">장</th>
                  <th className="px-3 py-2 text-right">현재가</th>
                  <th className="px-3 py-2 text-right">등락</th>
                  <th className="px-3 py-2 text-right">거래대금</th>
                  <th className="px-3 py-2 text-right">체결</th>
                  <th className="px-3 py-2 text-right">대기주문</th>
                  <th className="px-3 py-2 text-right">보유자</th>
                  <th className="px-3 py-2">최근 체결</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visibleSymbolFlows.map((flow) => (
                  <tr key={flow.symbol}>
                    <td className="px-3 py-2">
                      <p className="font-black text-white">{flow.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{flow.symbol}</p>
                    </td>
                    <td className="px-3 py-2 text-xs font-bold text-[#b8c2cc]">{formatFlowMarketStatus(flow.marketStatus)}</td>
                    <td className="px-3 py-2 text-right font-black tabular-nums text-white">{formatWon(flow.currentPrice)}</td>
                    <td className={flow.changeRate >= 0 ? "px-3 py-2 text-right font-black tabular-nums text-[#ffb4a8]" : "px-3 py-2 text-right font-black tabular-nums text-[#64a8ff]"}>
                      {formatSignedPercent(flow.changeRate)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{formatWon(flow.turnoverAmount)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{flow.executionCount.toLocaleString("ko-KR")}건</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{flow.openOrderCount.toLocaleString("ko-KR")}건</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{flow.holderCount.toLocaleString("ko-KR")}명</td>
                    <td className="px-3 py-2 text-xs font-bold text-[#8b95a1]">{formatDateTime(flow.lastExecutedAt)}</td>
                  </tr>
                ))}
                {visibleSymbolFlows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-sm font-bold text-[#8b95a1]">
                      {loadingSymbolFlows ? "종목 흐름을 조회하고 있습니다." : "주문장 종목 흐름이 없습니다."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white">최근 현금 원장</h3>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">
                최근 {recentCashFlows.length.toLocaleString("ko-KR")}건 미리보기
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
            {recentCashFlows.map((cashFlow) => (
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
            {recentCashFlows.length === 0 ? (
              <p className="rounded-md bg-white/[0.04] px-3 py-4 text-sm font-bold text-[#8b95a1]">최근 현금 원장이 없습니다.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
