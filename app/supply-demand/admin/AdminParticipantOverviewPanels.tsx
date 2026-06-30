import { useMemo } from "react";

import { formatDateTime, formatNumber, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminHelpers";
import { ProfileMiniMetric, ProfileOverviewInfoItem } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AutoParticipantOverview } from "@/app/types/stock";

export function AutoParticipantOverviewDetail({ overview }: { overview: AutoParticipantOverview }) {
  return (
    <section className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">자동참가자 투자 현황</p>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">실제 계좌 기준의 현금, 보유 주식, 주문, 당일 체결 흐름입니다.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-md bg-white/10 px-2 py-1 text-[#d8ecff]">계좌 {overview.accountStatus ?? "미확인"} · ID {overview.accountId ?? "-"}</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-[#64a8ff]">전략 {overview.enabledStrategyCount}/{overview.strategyCount}</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric label="가용 현금" value={formatWon(overview.availableCash)} tone="blue" />
        <ProfileMiniMetric label="예약 매수금" value={formatWon(overview.reservedBuyCash)} tone="muted" />
        <ProfileMiniMetric label="보유 평가액" value={formatWon(overview.holdingMarketValue)} tone="muted" />
        <ProfileMiniMetric label="추정 총자산" value={formatWon(overview.estimatedTotalAsset)} tone="blue" />
        <ProfileMiniMetric label="순입금" value={formatWon(overview.netCashFlow)} tone="muted" />
        <ProfileMiniMetric label="수익률" value={formatSignedPercent(overview.returnRate)} tone={overview.returnRate > 0 ? "green" : overview.returnRate < 0 ? "red" : "muted"} />
        <ProfileMiniMetric label="총 손익" value={formatWon(overview.totalProfit)} tone={overview.totalProfit > 0 ? "green" : overview.totalProfit < 0 ? "red" : "muted"} />
        <ProfileMiniMetric label="보유 종목" value={`${overview.holdingCount.toLocaleString("ko-KR")}개`} tone="muted" />
        <ProfileMiniMetric label="보유 수량" value={`${formatNumber(overview.totalHoldingQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="대기 주문" value={`${overview.openOrderCount.toLocaleString("ko-KR")}건`} tone="muted" />
        <ProfileMiniMetric label="매수/매도 대기" value={`${overview.openBuyOrderCount.toLocaleString("ko-KR")} / ${overview.openSellOrderCount.toLocaleString("ko-KR")}건`} tone="muted" />
        <ProfileMiniMetric label="대기 수량" value={`${formatNumber(overview.openBuyQuantity)} / ${formatNumber(overview.openSellQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="오늘 체결" value={`${overview.todayExecutionCount.toLocaleString("ko-KR")}건`} tone="muted" />
        <ProfileMiniMetric label="오늘 매수/매도" value={`${formatNumber(overview.todayBuyQuantity)} / ${formatNumber(overview.todaySellQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="오늘 거래대금" value={formatWon(overview.todayGrossAmount)} tone="muted" />
        <ProfileMiniMetric label="전략" value={`${overview.enabledStrategyCount.toLocaleString("ko-KR")} / ${overview.strategyCount.toLocaleString("ko-KR")}`} tone="blue" />
      </div>
      <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[760px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2 text-right">보유</th>
              <th className="px-3 py-2 text-right">가용/예약</th>
              <th className="px-3 py-2 text-right">평균단가</th>
              <th className="px-3 py-2 text-right">현재가</th>
              <th className="px-3 py-2 text-right">평가액</th>
              <th className="px-3 py-2 text-right">미실현손익</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {overview.holdings.map((holding) => (
              <tr key={holding.symbol}>
                <td className="px-3 py-2 font-black">{holding.symbol}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatNumber(holding.quantity)}주</td>
                <td className="px-3 py-2 text-right text-[#b8c2cc] tabular-nums">{formatNumber(holding.availableQuantity)} / {formatNumber(holding.reservedQuantity)}주</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatWon(holding.averagePrice)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatWon(holding.currentPrice)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatWon(holding.marketValue)}</td>
                <td className={["px-3 py-2 text-right font-black tabular-nums", holding.unrealizedProfit > 0 ? "text-[#6ee7a8]" : holding.unrealizedProfit < 0 ? "text-[#ffb4a8]" : "text-white"].join(" ")}>
                  {formatWon(holding.unrealizedProfit)}
                </td>
              </tr>
            ))}
            {overview.holdings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-[#8b95a1]">보유 중인 종목이 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs font-bold text-[#6f7a86]">
        최근 주문 {formatDateTime(overview.lastOrderAt)} · 최근 체결 {formatDateTime(overview.lastExecutionAt)}
      </p>
    </section>
  );
}

export function ParticipantProfileOverviewPanel({
  summaries,
  loading,
  error,
}: {
  summaries: ParticipantProfileOverviewSummary[];
  loading: boolean;
  error: boolean;
}) {
  const total = useMemo(
    () => summaries.reduce(
      (acc, summary) => ({
        totalCount: acc.totalCount + summary.totalCount,
        enabledCount: acc.enabledCount + summary.enabledCount,
        availableCash: acc.availableCash + summary.availableCash,
        holdingMarketValue: acc.holdingMarketValue + summary.holdingMarketValue,
        estimatedTotalAsset: acc.estimatedTotalAsset + summary.estimatedTotalAsset,
        totalProfit: acc.totalProfit + summary.totalProfit,
        openOrderCount: acc.openOrderCount + summary.openOrderCount,
        openBuyOrderCount: acc.openBuyOrderCount + summary.openBuyOrderCount,
        openSellOrderCount: acc.openSellOrderCount + summary.openSellOrderCount,
        openBuyQuantity: acc.openBuyQuantity + summary.openBuyQuantity,
        openSellQuantity: acc.openSellQuantity + summary.openSellQuantity,
        todayExecutionCount: acc.todayExecutionCount + summary.todayExecutionCount,
        todayGrossAmount: acc.todayGrossAmount + summary.todayGrossAmount,
        strategyCount: acc.strategyCount + summary.strategyCount,
        enabledStrategyCount: acc.enabledStrategyCount + summary.enabledStrategyCount,
      }),
      {
        totalCount: 0,
        enabledCount: 0,
        availableCash: 0,
        holdingMarketValue: 0,
        estimatedTotalAsset: 0,
        totalProfit: 0,
        openOrderCount: 0,
        openBuyOrderCount: 0,
        openSellOrderCount: 0,
        openBuyQuantity: 0,
        openSellQuantity: 0,
        todayExecutionCount: 0,
        todayGrossAmount: 0,
        strategyCount: 0,
        enabledStrategyCount: 0,
      },
    ),
    [summaries],
  );
  const totalReturnRate = total.estimatedTotalAsset - total.totalProfit === 0 ? 0 : (total.totalProfit / (total.estimatedTotalAsset - total.totalProfit)) * 100;

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">프로필별 자동참가자 현황</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">
            자동참가자를 심리 프로필 기준으로 묶어 현금, 보유 주식, 평가액, 손익, 주문과 체결 흐름을 봅니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-[#d8ecff]">갱신 중</span> : null}
          {error ? <span className="rounded-md bg-[#3a1f1b] px-2 py-1 text-[#ffb4a8]">현황 조회 실패</span> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric label="전체 자동참가자" value={`${total.totalCount.toLocaleString("ko-KR")}명`} tone="blue" />
        <ProfileMiniMetric label="가동 참가자" value={`${total.enabledCount.toLocaleString("ko-KR")}명`} tone="green" />
        <ProfileMiniMetric label="가용 현금" value={formatWon(total.availableCash)} tone="blue" />
        <ProfileMiniMetric label="보유 평가액" value={formatWon(total.holdingMarketValue)} tone="muted" />
        <ProfileMiniMetric label="총 손익" value={formatWon(total.totalProfit)} tone={total.totalProfit > 0 ? "green" : total.totalProfit < 0 ? "red" : "muted"} />
        <ProfileMiniMetric label="전체 수익률" value={formatSignedPercent(totalReturnRate)} tone={totalReturnRate > 0 ? "green" : totalReturnRate < 0 ? "red" : "muted"} />
        <ProfileMiniMetric label="오늘 거래대금" value={formatWon(total.todayGrossAmount)} tone="muted" />
        <ProfileMiniMetric label="대기 주문" value={`${total.openOrderCount.toLocaleString("ko-KR")}건`} tone="muted" />
        <ProfileMiniMetric label="대기 매수/매도" value={`${total.openBuyQuantity.toLocaleString("ko-KR")} / ${total.openSellQuantity.toLocaleString("ko-KR")}주`} tone="muted" />
        <ProfileMiniMetric label="전략" value={`${total.enabledStrategyCount.toLocaleString("ko-KR")} / ${total.strategyCount.toLocaleString("ko-KR")}`} tone="blue" />
      </div>

      <div className="mt-4 grid min-w-0 gap-3">
        {summaries.map((summary) => (
          <article key={summary.profileType} className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-black text-white">{summary.label}</p>
                <p className="mt-1 max-w-3xl break-words text-xs font-bold leading-5 text-[#8b95a1]">{summary.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-md bg-white/10 px-2 py-1 text-[#64a8ff]">{summary.totalCount.toLocaleString("ko-KR")}명</span>
                <span className="rounded-md bg-white/10 px-2 py-1 text-[#6ee7a8]">가동 {summary.enabledCount.toLocaleString("ko-KR")}</span>
                <span className="rounded-md bg-white/10 px-2 py-1 text-[#8b95a1]">정지 {summary.disabledCount.toLocaleString("ko-KR")}</span>
              </div>
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <ProfileOverviewInfoItem label="현금">
                <p className="font-black tabular-nums text-white">{formatWon(summary.availableCash)}</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">예약 매수금 {formatWon(summary.reservedBuyCash)}</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="자산">
                <p className="font-black tabular-nums text-white">{formatWon(summary.estimatedTotalAsset)}</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">보유 평가액 {formatWon(summary.holdingMarketValue)}</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="순입금">
                <p className="font-black tabular-nums text-white">{formatWon(summary.netCashFlow)}</p>
                <p className="mt-1 text-xs font-bold text-[#8b95a1]">외부 현금 흐름 기준</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="손익/수익률">
                <p className={["font-black tabular-nums", summary.totalProfit > 0 ? "text-[#6ee7a8]" : summary.totalProfit < 0 ? "text-[#ffb4a8]" : "text-white"].join(" ")}>{formatWon(summary.totalProfit)}</p>
                <p className={["mt-1 text-xs font-black tabular-nums", summary.returnRate > 0 ? "text-[#6ee7a8]" : summary.returnRate < 0 ? "text-[#ffb4a8]" : "text-[#8b95a1]"].join(" ")}>{formatSignedPercent(summary.returnRate)}</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="보유">
                <p className="font-black tabular-nums text-white">{summary.holdingCount.toLocaleString("ko-KR")}종목</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">{formatNumber(summary.totalHoldingQuantity)}주</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">예약 {formatNumber(summary.reservedSellQuantity)}주</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="주문/체결">
                <p className="font-black tabular-nums text-white">대기 {summary.openOrderCount.toLocaleString("ko-KR")}건</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">매수/매도 {summary.openBuyOrderCount.toLocaleString("ko-KR")} / {summary.openSellOrderCount.toLocaleString("ko-KR")}건</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">대기 수량 {formatNumber(summary.openBuyQuantity)} / {formatNumber(summary.openSellQuantity)}주</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">오늘 {summary.todayExecutionCount.toLocaleString("ko-KR")}체결</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">매수/매도 {formatNumber(summary.todayBuyQuantity)} / {formatNumber(summary.todaySellQuantity)}주</p>
                <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">거래대금 {formatWon(summary.todayGrossAmount)}</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="전략">
                <p className="font-black tabular-nums text-white">{summary.enabledStrategyCount.toLocaleString("ko-KR")} / {summary.strategyCount.toLocaleString("ko-KR")}</p>
                <p className="mt-1 text-xs font-bold text-[#8b95a1]">가동 / 전체</p>
              </ProfileOverviewInfoItem>
              <ProfileOverviewInfoItem label="최근 활동">
                <p className="text-xs font-bold leading-5 text-[#8b95a1]">주문 {formatDateTime(summary.lastOrderAt)}</p>
                <p className="text-xs font-bold leading-5 text-[#8b95a1]">체결 {formatDateTime(summary.lastExecutionAt)}</p>
              </ProfileOverviewInfoItem>
            </div>

            <div className="mt-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
              <p className="text-[11px] font-black text-[#8b95a1]">주요 보유종목</p>
              <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {summary.symbolHoldings.slice(0, 3).map((holding) => (
                  <div key={holding.symbol} className="min-w-0 rounded-md bg-black/20 px-3 py-2">
                    <p className="break-all text-xs font-black text-white">{holding.symbol}</p>
                    <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">{formatNumber(holding.quantity)}주</p>
                    <p className="mt-1 text-xs font-bold tabular-nums text-[#b8c2cc]">{formatWon(holding.marketValue)}</p>
                  </div>
                ))}
                {summary.symbolHoldings.length === 0 ? (
                  <p className="text-xs font-bold text-[#8b95a1]">보유 없음</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
