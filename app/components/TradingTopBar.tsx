"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

import MarketModeTabs, { type MarketMode } from "@/app/components/MarketModeTabs";
import { SimulationTimeInline } from "@/app/components/SimulationTimeBadge";
import StockBrandLink from "@/app/components/StockBrandLink";
import useAuthSession from "@/app/hooks/useAuthSession";
import { getAccessTokenForAuthStatus, isAdminRole, logout } from "@/app/lib/auth";
import { accountStatusQueryOptions, holdingsQueryOptions, portfolioQueryOptions, profileQueryOptions } from "@/app/lib/react-query/stockAccountQueries";
import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { Holding, Portfolio, StockUserProfile } from "@/app/types/stock";

export default function TradingTopBar({ active, actions }: { active: MarketMode; actions?: ReactNode }) {
  const router = useRouter();
  const { authStatus, user } = useAuthSession();
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const token = getAccessTokenForAuthStatus(authStatus);
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token));
  const hasAccount = accountStatusQuery.data?.hasAccount === true;
  const profileQuery = useQuery(profileQueryOptions(token));
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasAccount));
  const profile = profileQuery.data ?? null;
  const portfolio = portfolioQuery.data ?? null;
  const holdings = holdingsQuery.data ?? portfolio?.holdings ?? [];

  useEffect(() => {
    if (!accountPanelOpen) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountPanelOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountPanelOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountPanelOpen]);

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="relative z-30 border-b border-stock-border bg-white/95 backdrop-blur lg:sticky lg:top-0">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[auto_minmax(480px,1fr)_auto] lg:items-center lg:px-8">
        <div className="flex items-center justify-between gap-3 lg:block">
          <StockBrandLink />
          {isAdminRole(user?.role) ? (
            <Link href="/admin" className="inline-flex h-11 items-center rounded-md bg-stock-accent-surface px-3 text-xs font-black text-stock-accent lg:hidden">
              운영 관리
            </Link>
          ) : null}
        </div>

        <div className="min-w-0">
          <MarketModeTabs active={active} />
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div ref={accountMenuRef} className="relative min-w-0 flex-1 lg:flex-none">
            <button
              type="button"
              aria-expanded={accountPanelOpen}
              aria-haspopup="dialog"
              aria-controls="trading-account-panel"
              onClick={() => setAccountPanelOpen((open) => !open)}
              className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border border-transparent bg-stock-surface-strong px-2.5 py-1.5 text-left hover:border-stock-border-strong hover:bg-white lg:w-auto"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-stock-accent shadow-[var(--shadow-panel)]">
                {initialOf(profile?.username ?? user?.username)}
              </div>
              <div className="min-w-0">
                <p className="max-w-[140px] truncate text-sm font-black text-stock-ink sm:max-w-[180px]">{profile?.username ?? user?.username ?? "사용자"}</p>
                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-bold text-stock-muted">
                  <span className="shrink-0">{profile?.role ?? user?.role ?? "USER"}</span>
                  <span className="text-stock-border-strong">/</span>
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

          {actions ? <div className="shrink-0">{actions}</div> : null}

          {isAdminRole(user?.role) ? (
            <Link href="/admin" className="hidden h-11 items-center rounded-md bg-stock-accent-surface px-3 text-sm font-black text-stock-accent lg:inline-flex">
              운영 관리
            </Link>
          ) : null}

          <button type="button" onClick={() => void signOut()} className="h-11 shrink-0 rounded-md bg-stock-ink px-3 text-sm font-bold text-white hover:bg-stock-text-secondary">
            로그아웃
          </button>
        </div>
      </div>
      <div className="border-t border-stock-divider bg-stock-surface-muted/80 px-4 sm:px-5 lg:px-8">
        <div className="mx-auto flex max-w-7xl justify-end">
          <SimulationTimeInline />
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
  const [userKeyCopied, setUserKeyCopied] = useState(false);

  const copyUserKey = async () => {
    if (!userKey || userKey === "-") {
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(userKey);
      copied = true;
    } catch {
      copied = copyTextWithFallback(userKey);
    }
    if (copied) {
      setUserKeyCopied(true);
      window.setTimeout(() => setUserKeyCopied(false), 1400);
    }
  };

  return (
    <div id="trading-account-panel" role="dialog" aria-label="내 계좌 요약" className="absolute left-0 top-[calc(100%+8px)] z-40 w-[min(calc(100vw-2rem),380px)] rounded-lg border border-stock-border-strong bg-white p-4 text-stock-ink shadow-[var(--shadow-float)] lg:left-auto lg:right-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.14em] text-stock-accent">MY ACCOUNT</p>
          <h2 className="mt-1 truncate text-lg font-black">{username}</h2>
        </div>
        <span className="shrink-0 rounded-sm bg-stock-surface-strong px-2 py-1 text-xs font-black text-stock-text-tertiary">{role}</span>
      </div>

      <div className="mt-3 grid gap-2 rounded-md bg-stock-surface-muted p-3 text-xs font-bold text-stock-muted">
        <div className="grid min-w-0 gap-1">
          <span>식별키</span>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
            <span className="min-w-0 break-all rounded-sm bg-white px-2 py-1 text-left font-black leading-5 text-stock-text-secondary">{userKey}</span>
            <button
              type="button"
              onClick={() => void copyUserKey()}
              disabled={!userKey || userKey === "-"}
              className="rounded-sm bg-stock-ink px-2 py-1 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-stock-border-strong"
            >
              {userKeyCopied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>
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
          <span className="text-xs font-bold text-stock-subtle">{loading ? "조회 중" : `${holdings.length}종목`}</span>
        </div>
        <div className="mt-2 space-y-2">
          {visibleHoldings.length ? visibleHoldings.map((holding) => (
            <div key={holding.symbol} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md bg-stock-surface-muted px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{holding.symbol}</p>
                <p className="mt-0.5 text-xs font-bold text-stock-subtle">가용 {formatNumber(holding.availableQuantity)}주 / 예약 {formatNumber(holding.reservedQuantity)}주</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black tabular-nums">{formatWon(holding.marketValue)}</p>
                <p className={holding.unrealizedProfit >= 0 ? "mt-0.5 text-xs font-bold text-stock-danger" : "mt-0.5 text-xs font-bold text-stock-accent"}>
                  {formatWon(holding.unrealizedProfit)}
                </p>
              </div>
            </div>
          )) : (
            <p className="rounded-md bg-stock-surface-muted px-3 py-4 text-sm font-bold text-stock-subtle">보유 종목이 없습니다.</p>
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
      <span className={wrap ? "min-w-0 break-all rounded-sm bg-white px-2 py-1 text-left font-black leading-5 text-stock-text-secondary" : "min-w-0 truncate text-right text-stock-text-secondary"}>
        {value}
      </span>
    </div>
  );
}

function AccountPanelMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  const toneClass = tone === "red" ? "text-stock-danger" : tone === "blue" ? "text-stock-accent" : "text-stock-ink";
  return (
    <div className="rounded-md bg-stock-surface-muted p-3">
      <p className="text-xs font-bold text-stock-subtle">{label}</p>
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

function copyTextWithFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}
