import { memo, useMemo, useState } from "react";

import { formatCount, formatDateTime, formatInteger, formatNumber, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric, ProfileOverviewInfoItem } from "@/app/supply-demand/admin/AdminMetricCards";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import {
  resolveParticipantProfileOverviewReturnRate,
  resolveParticipantProfileOverviewTotal,
} from "@/app/supply-demand/admin/AdminParticipantOverviewTotals";

export function ParticipantProfileOverviewPanel({
  summaries,
  loading,
  error,
  onRefresh,
  allSummaries,
  loadingAll,
  allError,
  onLoadAll,
}: {
  summaries: ParticipantProfileOverviewSummary[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
  allSummaries: ParticipantProfileOverviewSummary[];
  loadingAll: boolean;
  allError: boolean;
  onLoadAll: () => void;
}) {
  const total = useMemo(() => resolveParticipantProfileOverviewTotal(summaries), [summaries]);
  const totalReturnRate = useMemo(() => resolveParticipantProfileOverviewReturnRate(total), [total]);
  const allTotal = useMemo(() => resolveParticipantProfileOverviewTotal(allSummaries), [allSummaries]);
  const allTotalReturnRate = useMemo(() => resolveParticipantProfileOverviewReturnRate(allTotal), [allTotal]);
  const [showAllModal, setShowAllModal] = useState(false);

  const openAllModal = () => {
    setShowAllModal(true);
    if (allSummaries.length === 0 && !loadingAll) {
      onLoadAll();
    }
  };

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">프로필별 자동참가자 현황</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">
            기본 조회는 요청 시점의 시뮬레이션 시간부터 최근 1일만 반영합니다. 전체 이력은 별도 조회로 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-[#d8ecff]">갱신 중</span> : null}
          {error ? <span className="rounded-md bg-[#3a1f1b] px-2 py-1 text-[#ffb4a8]">현황 조회 실패</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-8 rounded-md bg-[#f2f4f6] px-3 py-1.5 text-xs font-black text-[#191f28] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "조회 중" : "새로고침"}
          </button>
          <button
            type="button"
            onClick={openAllModal}
            className="min-h-8 rounded-md border border-white/10 px-3 py-1.5 text-xs font-black text-[#d8ecff] transition hover:border-[#64a8ff]/60"
          >
            전체 이력
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric label="전체 자동참가자" value={formatCount(total.totalCount, "명")} tone="blue" />
        <ProfileMiniMetric label="가동 참가자" value={formatCount(total.enabledCount, "명")} tone="green" />
        <ProfileMiniMetric label="가용 현금" value={formatWon(total.availableCash)} tone="blue" />
        <ProfileMiniMetric label="보유 평가액" value={formatWon(total.holdingMarketValue)} tone="muted" />
        <ProfileMiniMetric label="총 손익" value={formatWon(total.totalProfit)} tone={total.totalProfit > 0 ? "green" : total.totalProfit < 0 ? "red" : "muted"} />
        <ProfileMiniMetric label="전체 수익률" value={formatSignedPercent(totalReturnRate)} tone={totalReturnRate > 0 ? "green" : totalReturnRate < 0 ? "red" : "muted"} />
        <ProfileMiniMetric label="2시간 거래대금" value={formatWon(total.todayGrossAmount)} tone="muted" />
        <ProfileMiniMetric label="대기 주문" value={formatCount(total.openOrderCount, "건")} tone="muted" />
        <ProfileMiniMetric label="대기 매수/매도" value={`${formatInteger(total.openBuyQuantity)} / ${formatInteger(total.openSellQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="전략" value={`${formatInteger(total.enabledStrategyCount)} / ${formatInteger(total.strategyCount)}`} tone="blue" />
      </div>

      <div className="mt-4 grid min-w-0 gap-3">
        {summaries.map((summary) => (
          <ParticipantProfileOverviewCard key={summary.profileType} summary={summary} />
        ))}
      </div>
      {showAllModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8">
          <div className="w-full max-w-6xl rounded-lg border border-white/10 bg-[#11161d] p-4 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">프로필별 전체 이력</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">
                  요청 시점의 시뮬레이션 시간 이전 전체 주문/체결 이력을 기준으로 최근 활동을 다시 계산합니다. 장중에는 조회가 오래 걸릴 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                {loadingAll ? <span className="rounded-md bg-white/10 px-2 py-1 text-[#d8ecff]">전체 조회 중</span> : null}
                {allError ? <span className="rounded-md bg-[#3a1f1b] px-2 py-1 text-[#ffb4a8]">전체 조회 실패</span> : null}
                <button
                  type="button"
                  onClick={onLoadAll}
                  disabled={loadingAll}
                  className="min-h-8 rounded-md bg-[#f2f4f6] px-3 py-1.5 text-xs font-black text-[#191f28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다시 조회
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  className="min-h-8 rounded-md border border-white/10 px-3 py-1.5 text-xs font-black text-[#d8ecff] transition hover:border-white/30"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <ProfileMiniMetric label="전체 자동참가자" value={formatCount(allTotal.totalCount, "명")} tone="blue" />
              <ProfileMiniMetric label="가동 참가자" value={formatCount(allTotal.enabledCount, "명")} tone="green" />
              <ProfileMiniMetric label="가용 현금" value={formatWon(allTotal.availableCash)} tone="blue" />
              <ProfileMiniMetric label="보유 평가액" value={formatWon(allTotal.holdingMarketValue)} tone="muted" />
              <ProfileMiniMetric label="총 손익" value={formatWon(allTotal.totalProfit)} tone={allTotal.totalProfit > 0 ? "green" : allTotal.totalProfit < 0 ? "red" : "muted"} />
              <ProfileMiniMetric label="전체 수익률" value={formatSignedPercent(allTotalReturnRate)} tone={allTotalReturnRate > 0 ? "green" : allTotalReturnRate < 0 ? "red" : "muted"} />
            </div>
            <div className="mt-4 grid min-w-0 gap-3">
              {allSummaries.map((summary) => (
                <ParticipantProfileOverviewCard key={summary.profileType} summary={summary} />
              ))}
              {allSummaries.length === 0 && !loadingAll ? (
                <div className="rounded-md border border-white/10 bg-black/20 px-3 py-4 text-sm font-bold text-[#8b95a1]">
                  전체 이력 조회 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const ParticipantProfileOverviewCard = memo(function ParticipantProfileOverviewCard({
  summary,
}: {
  summary: ParticipantProfileOverviewSummary;
}) {
  const visibleSymbolHoldings = useMemo(() => summary.symbolHoldings.slice(0, 3), [summary.symbolHoldings]);

  return (
    <article className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-white">{summary.label}</p>
          <p className="mt-1 max-w-3xl break-words text-xs font-bold leading-5 text-[#8b95a1]">{summary.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-md bg-white/10 px-2 py-1 text-[#64a8ff]">{formatCount(summary.totalCount, "명")}</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-[#6ee7a8]">가동 {formatInteger(summary.enabledCount)}</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-[#8b95a1]">정지 {formatInteger(summary.disabledCount)}</span>
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
          <p className="font-black tabular-nums text-white">{formatCount(summary.holdingCount, "종목")}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">{formatNumber(summary.totalHoldingQuantity)}주</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">예약 {formatNumber(summary.reservedSellQuantity)}주</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="주문/체결">
          <p className="font-black tabular-nums text-white">대기 {formatCount(summary.openOrderCount, "건")}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">매수/매도 {formatInteger(summary.openBuyOrderCount)} / {formatCount(summary.openSellOrderCount, "건")}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">대기 수량 {formatNumber(summary.openBuyQuantity)} / {formatNumber(summary.openSellQuantity)}주</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">2시간 {formatInteger(summary.todayExecutionCount)}체결</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">2시간 매수/매도 {formatNumber(summary.todayBuyQuantity)} / {formatNumber(summary.todaySellQuantity)}주</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">2시간 거래대금 {formatWon(summary.todayGrossAmount)}</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="전략">
          <p className="font-black tabular-nums text-white">{formatInteger(summary.enabledStrategyCount)} / {formatInteger(summary.strategyCount)}</p>
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
          {visibleSymbolHoldings.map((holding) => (
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
  );
});
