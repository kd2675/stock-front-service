"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import MarketModeTabs from "@/app/components/MarketModeTabs";
import useAuthSession from "@/app/hooks/useAuthSession";
import { clearAccessToken, getAccessToken, logout } from "@/app/lib/auth";
import { accountStatusQueryOptions, holdingsQueryOptions, portfolioQueryOptions, profileQueryOptions } from "@/app/lib/react-query/stockQueries";
import type { Holding, Portfolio, StockUserProfile } from "@/app/types/stock";

type MarketMode = "virtual-price" | "order-book";

export default function TradingTopBar({ active, actions }: { active: MarketMode; actions?: ReactNode }) {
  const router = useRouter();
  const { authStatus, user } = useAuthSession();
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const token = authStatus === "in" ? getAccessToken() : null;
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token));
  const hasAccount = accountStatusQuery.data?.hasAccount === true;
  const profileQuery = useQuery(profileQueryOptions(token));
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasAccount));
  const profile = profileQuery.data ?? null;
  const portfolio = portfolioQuery.data ?? null;
  const holdings = holdingsQuery.data ?? portfolio?.holdings ?? [];

  const signOut = async () => {
    try {
      await logout();
    } finally {
      clearAccessToken();
      router.replace("/login");
    }
  };

  return (
    <div className="sticky top-0 z-30 border-b border-[#e5e8eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0 lg:w-[min(540px,50vw)]">
          <MarketModeTabs active={active} />
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 lg:justify-end">
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setAccountPanelOpen((open) => !open)}
              className="flex min-w-0 items-center gap-2 rounded-md bg-[#f2f4f6] px-2.5 py-2 text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-[#3182f6] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {initialOf(profile?.username ?? user?.username)}
              </div>
              <div className="min-w-0">
                <p className="max-w-[140px] truncate text-sm font-black text-[#191f28] sm:max-w-[180px]">{profile?.username ?? user?.username ?? "사용자"}</p>
                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-bold text-[#6b7684]">
                  <span className="shrink-0">{profile?.role ?? user?.role ?? "USER"}</span>
                  <span className="text-[#d1d6db]">/</span>
                  <span className="max-w-[120px] truncate sm:max-w-[170px]">{profile?.userKey ?? user?.userKey ?? "-"}</span>
                </div>
              </div>
            </button>

            {accountPanelOpen ? (
              <AccountPanel
                holdings={holdings}
                loading={profileQuery.isFetching || portfolioQuery.isFetching || holdingsQuery.isFetching}
                portfolio={portfolio}
                profile={profile}
                fallbackUser={user}
              />
            ) : null}
          </div>

          {actions}

          <button type="button" onClick={() => void signOut()} className="h-11 rounded-md bg-[#191f28] px-3 text-sm font-bold text-white">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountPanel({
  fallbackUser,
  holdings,
  loading,
  portfolio,
  profile,
}: {
  fallbackUser: { userKey?: string | null; username?: string | null; email?: string | null; role?: string | null } | null;
  holdings: Holding[];
  loading: boolean;
  portfolio: Portfolio | null;
  profile: StockUserProfile | null;
}) {
  const visibleHoldings = holdings.slice(0, 4);
  const userKey = profile?.userKey ?? fallbackUser?.userKey ?? "-";
  const username = profile?.username ?? fallbackUser?.username ?? "사용자";
  const role = profile?.role ?? fallbackUser?.role ?? "USER";
  const email = profile?.email ?? fallbackUser?.email ?? null;

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(92vw,380px)] rounded-lg border border-[#d1d6db] bg-white p-4 text-[#191f28] shadow-[0_18px_50px_rgba(25,31,40,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.14em] text-[#3182f6]">MY ACCOUNT</p>
          <h2 className="mt-1 truncate text-lg font-black">{username}</h2>
        </div>
        <span className="shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-black text-[#4e5968]">{role}</span>
      </div>

      <div className="mt-3 grid gap-2 rounded-md bg-[#f7f8fa] p-3 text-xs font-bold text-[#6b7684]">
        <AccountPanelRow label="식별키" value={userKey} wrap />
        <AccountPanelRow label="이메일" value={email ?? "-"} />
        <AccountPanelRow label="계좌코드" value={portfolio?.account.accountCode ?? profile?.account?.accountCode ?? "-"} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <AccountPanelMetric label="총자산" value={formatWon(portfolio?.totalAsset)} />
        <AccountPanelMetric label="현금" value={formatWon(portfolio?.account.cashBalance ?? profile?.account?.cashBalance)} />
        <AccountPanelMetric label="평가금액" value={formatWon(portfolio?.marketValue)} />
        <AccountPanelMetric label="수익률" value={portfolio ? `${formatNumber(portfolio.returnRate)}%` : "-"} tone={portfolio && portfolio.returnRate < 0 ? "blue" : "red"} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black">내 종목</h3>
          <span className="text-xs font-bold text-[#8b95a1]">{loading ? "조회 중" : `${holdings.length}종목`}</span>
        </div>
        <div className="mt-2 space-y-2">
          {visibleHoldings.length ? visibleHoldings.map((holding) => (
            <div key={holding.symbol} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md bg-[#f7f8fa] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{holding.symbol}</p>
                <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">가용 {formatNumber(holding.availableQuantity)}주 / 예약 {formatNumber(holding.reservedQuantity)}주</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black tabular-nums">{formatWon(holding.marketValue)}</p>
                <p className={holding.unrealizedProfit >= 0 ? "mt-0.5 text-xs font-bold text-[#f04452]" : "mt-0.5 text-xs font-bold text-[#3182f6]"}>
                  {formatWon(holding.unrealizedProfit)}
                </p>
              </div>
            </div>
          )) : (
            <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">보유 종목이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountPanelRow({ label, value, wrap = false }: { label: string; value: string; wrap?: boolean }) {
  return (
    <div className={wrap ? "grid min-w-0 gap-1" : "grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-2"}>
      <span>{label}</span>
      <span className={wrap ? "min-w-0 break-all rounded-sm bg-white px-2 py-1 text-left font-black leading-5 text-[#333d4b]" : "min-w-0 truncate text-right text-[#333d4b]"}>
        {value}
      </span>
    </div>
  );
}

function AccountPanelMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  const toneClass = tone === "red" ? "text-[#f04452]" : tone === "blue" ? "text-[#3182f6]" : "text-[#191f28]";
  return (
    <div className="rounded-md bg-[#f7f8fa] p-3">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className={`mt-1 truncate text-sm font-black tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function initialOf(username?: string | null) {
  const value = username?.trim();
  if (!value) {
    return "U";
  }
  return value.slice(0, 1).toUpperCase();
}

function formatWon(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "-";
  }
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "0";
  }
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}
