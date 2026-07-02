import { formatWon } from "@/app/lib/stockFormatters";
import type { AuthUser } from "@/app/types/auth";
import type { Portfolio, ProfitSummary, StockUserProfile } from "@/app/types/stock";

import { formatCompactWon, formatDateTime, formatNumber, formatSignedWon } from "./VirtualPriceFormatters";
import { Metric } from "./VirtualPricePanels";

type VirtualPriceHeroPanelProps = {
  lastUpdatedAt: Date | null;
  portfolio: Portfolio | null;
  priceStreamConnected: boolean;
  profile: StockUserProfile | null;
  profitSummary: ProfitSummary | null;
  refreshError: string | null;
  refreshing: boolean;
  user: AuthUser | null;
};

export function VirtualPriceHeroPanel({
  lastUpdatedAt,
  portfolio,
  priceStreamConnected,
  profile,
  profitSummary,
  refreshError,
  refreshing,
  user,
}: VirtualPriceHeroPanelProps) {
  return (
    <>
      <header className="rounded-lg bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-[#3182f6]">STOCK MOCK TRADING</p>
            <h1 className="mt-2 text-2xl font-black md:text-4xl">모의투자 워크스페이스</h1>
            <p className="mt-2 text-sm text-[#6b7684]">{profile?.username ?? user?.username ?? "사용자"}님의 실전형 가상 계좌</p>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs font-semibold text-[#4e5968]">
              <span className="max-w-full truncate rounded-sm bg-[#f2f4f6] px-2 py-1">{profile?.userKey ?? user?.userKey ?? "user-key"}</span>
              <span className="rounded-sm bg-[#f2f4f6] px-2 py-1">{profile?.role ?? user?.role ?? "USER"}</span>
              {profile?.email ? <span className="max-w-full truncate rounded-sm bg-[#f2f4f6] px-2 py-1">{profile.email}</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-7 min-w-0">
          <p className="text-sm font-bold text-[#6b7684]">총 자산</p>
          <p className="mt-1 min-w-0 break-words text-[clamp(2rem,7vw,3.5rem)] font-black leading-none text-[#191f28] tabular-nums">
            {formatWon(portfolio?.totalAsset)}
          </p>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-[#6b7684] sm:grid-cols-3">
            <span className="min-w-0 truncate">현금 {formatCompactWon(portfolio?.account.cashBalance)}</span>
            <span className="min-w-0 truncate">평가 {formatCompactWon(portfolio?.marketValue)}</span>
            <span className={portfolio && portfolio.returnRate >= 0 ? "min-w-0 truncate text-[#f04452]" : "min-w-0 truncate text-[#3182f6]"}>
              수익률 {formatNumber(portfolio?.returnRate)}%
            </span>
          </div>
        </div>
      </header>

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
        <Metric label="현금" value={formatCompactWon(portfolio?.account.cashBalance)} tone="blue" />
        <Metric label="예약 현금" value={formatCompactWon(portfolio?.reservedBuyCash)} tone="gray" />
        <Metric label="평가금액" value={formatCompactWon(portfolio?.marketValue)} tone="green" />
        <Metric label="총 손익" value={formatSignedWon(profitSummary?.totalProfit ?? 0)} tone={profitSummary && profitSummary.totalProfit < 0 ? "blue" : "red"} />
        <Metric label="실현손익" value={formatSignedWon(profitSummary?.realizedProfit ?? 0)} tone={profitSummary && profitSummary.realizedProfit < 0 ? "blue" : "red"} />
        <Metric label="미체결" value={`${portfolio?.pendingOrderCount ?? 0}건`} tone="gray" />
      </section>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-y border-[#e5e8eb] py-3 text-xs font-semibold text-[#6b7684]">
        <span>{priceStreamConnected ? "실시간 연결됨" : refreshing ? "갱신 중" : "자동 갱신 대기"}</span>
        <span className="min-w-0 break-words text-right">{refreshError ?? `마지막 갱신 ${formatDateTime(lastUpdatedAt?.toISOString())}`}</span>
      </div>
    </>
  );
}
