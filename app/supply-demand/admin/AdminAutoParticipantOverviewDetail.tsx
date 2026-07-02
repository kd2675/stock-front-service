import { formatCount, formatDateTime, formatInteger, formatNumber, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AutoParticipantOverview } from "@/app/types/stock";

export function AutoParticipantOverviewDetail({ overview }: { overview: AutoParticipantOverview }) {
  return (
    <section className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">자동참가자 투자 현황</p>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">실제 계좌 기준의 현금, 보유 주식, 주문, 2시간 시뮬레이션일 체결 흐름입니다.</p>
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
        <ProfileMiniMetric label="보유 종목" value={formatCount(overview.holdingCount, "개")} tone="muted" />
        <ProfileMiniMetric label="보유 수량" value={`${formatNumber(overview.totalHoldingQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="대기 주문" value={formatCount(overview.openOrderCount, "건")} tone="muted" />
        <ProfileMiniMetric label="매수/매도 대기" value={`${formatInteger(overview.openBuyOrderCount)} / ${formatCount(overview.openSellOrderCount, "건")}`} tone="muted" />
        <ProfileMiniMetric label="대기 수량" value={`${formatNumber(overview.openBuyQuantity)} / ${formatNumber(overview.openSellQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="2시간 체결" value={formatCount(overview.todayExecutionCount, "건")} tone="muted" />
        <ProfileMiniMetric label="2시간 매수/매도" value={`${formatNumber(overview.todayBuyQuantity)} / ${formatNumber(overview.todaySellQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="2시간 거래대금" value={formatWon(overview.todayGrossAmount)} tone="muted" />
        <ProfileMiniMetric label="전략" value={`${formatInteger(overview.enabledStrategyCount)} / ${formatInteger(overview.strategyCount)}`} tone="blue" />
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
