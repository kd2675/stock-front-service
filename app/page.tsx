"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import StockBrandLink from "@/app/components/StockBrandLink";
import useAuthSession from "@/app/hooks/useAuthSession";
import { buildAccountRequiredPath } from "@/app/lib/accountRouting";
import { getAccessTokenForAuthStatus, isAdminRole } from "@/app/lib/auth";
import {
  autoParticipantProfileOverviewsQueryOptions,
} from "@/app/lib/react-query/stockAdminQueries";
import {
  formatCount,
  formatInteger,
  formatSignedPercent,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import type { AutoParticipantProfileOverview } from "@/app/types/stock";

const QUICK_LINKS = [
  {
    href: "/trade",
    eyebrow: "ORDER BOOK",
    title: "수요와 공급 주문 체결",
    description: "자동참여자와 사용자의 매수/매도 호가가 만나며 가격, 체결, 보유 수익률이 같이 움직입니다.",
    metrics: ["호가", "부분체결", "자동참여자"],
  },
  {
    href: "/portfolio",
    eyebrow: "MY STOCKS",
    title: "내 주식",
    description: "보유 수량, 매입 금액, 평가손익, 실현손익과 수익률을 계좌 기준으로 확인합니다.",
    metrics: ["보유", "평가손익", "수익률"],
  },
  {
    href: "/corporate-actions",
    eyebrow: "CORPORATE ACTION",
    title: "기업 이벤트",
    description: "주주배정과 일반공모 유상증자의 일정, 내 배정 권리, 남은 모집 수량과 청약 상태를 확인합니다.",
    metrics: ["주주배정", "일반공모", "청약"],
  },
  {
    href: "/admin/participants/overview",
    eyebrow: "PARTICIPANTS",
    title: "자동참여자",
    description: "15만 개 실제 자동참여자 계좌를 27개 프로필 파티션으로 운용하며, 프로필별 자산·주문·체결 성과를 확인합니다.",
    metrics: ["27개 프로필", "주문", "체결"],
  },
];
const EMPTY_PROFILE_OVERVIEWS: AutoParticipantProfileOverview[] = [];

export default function StockHomePage() {
  const { authStatus, isHydrated, user } = useAuthSession();
  const isLoggedIn = isHydrated && authStatus === "in";
  const isAdmin = isAdminRole(user?.role);
  const token = getAccessTokenForAuthStatus(authStatus);
  const profileOverviewsQuery = useQuery(autoParticipantProfileOverviewsQueryOptions(token, {
    activityScope: "RECENT_SIMULATION_DAY",
    enabled: isAdmin && isLoggedIn,
    refetchIntervalMs: false,
  }));
  const profiles = profileOverviewsQuery.data ?? EMPTY_PROFILE_OVERVIEWS;
  const rankedProfiles = rankProfiles(profiles);
  const summary = summarizeProfiles(profiles);

  return (
    <main className="min-h-screen bg-stock-canvas text-stock-ink">
      <section className="border-b border-stock-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <StockBrandLink />
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Link href="/admin" className="rounded-md bg-stock-ink px-3 py-2 text-sm font-bold text-white">
                운영 관리
              </Link>
            ) : null}
            {isLoggedIn ? (
              <>
                <Link href="/corporate-actions" className="rounded-md bg-stock-accent-surface px-3 py-2 text-sm font-black text-stock-accent">
                  기업 이벤트
                </Link>
                <Link href="/portfolio" className="rounded-md bg-stock-surface-strong px-3 py-2 text-sm font-black text-stock-text-secondary">
                  내 주식
                </Link>
              </>
            ) : null}
            <Link href={isLoggedIn ? "/trade" : "/login"} className="rounded-md bg-stock-accent px-3 py-2 text-sm font-black text-white">
              {isLoggedIn ? "주문장" : "로그인"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(460px,1.18fr)] lg:px-8 lg:py-12">
        <div className="min-w-0 self-center">
          <p className="text-xs font-black tracking-[0.22em] text-stock-accent">PARTICIPANT PERFORMANCE BOARD</p>
          <h1 className="mt-4 max-w-3xl break-keep text-4xl font-black leading-[1.05] tracking-normal sm:text-5xl lg:text-6xl">
            자동참여자 수익률로 보는 모의 주식시장
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-stock-text-tertiary">
            현재 화면은 수요와 공급 주문장, 기업 이벤트, 내 주식, 자동참여자 성과를 중심으로 구성합니다.
            자동참여자는 개별 계좌를 노출하지 않고 프로필별 총자산, 순입금, 손익, 수익률을 집계해 비교합니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HomeMetric label="자동참여자 계좌" value={formatCount(summary?.accountCount ?? 0, "명")} />
            <HomeMetric
              label="합산 순입금 대비 수익률"
              value={summary?.aggregateReturnRate == null ? "—" : formatSignedPercent(summary.aggregateReturnRate)}
              tone={summary?.aggregateReturnRate ?? 0}
            />
            <HomeMetric label="합산 손익" value={formatWon(summary?.totalProfit ?? 0)} tone={summary?.totalProfit ?? 0} />
          </div>
        </div>

        <ProfileRankingPanel
          isAdmin={isAdmin}
          isLoading={profileOverviewsQuery.isFetching}
          profiles={rankedProfiles}
          queryFailed={profileOverviewsQuery.isError}
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 sm:grid-cols-2 sm:px-6 lg:px-8 xl:grid-cols-4">
        {QUICK_LINKS.filter((link) => isAdmin || !link.href.includes("/admin")).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group min-w-0 rounded-lg border border-stock-border bg-white p-5 shadow-[var(--shadow-panel)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(25,31,40,0.08)]"
          >
            <p className="text-xs font-black tracking-[0.18em] text-stock-accent">{link.eyebrow}</p>
            <h2 className="mt-2 min-w-0 break-words text-2xl font-black">{link.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-stock-muted">{link.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {link.metrics.map((metric) => (
                <span key={metric} className="rounded-sm bg-stock-canvas px-2 py-1 text-xs font-bold text-stock-text-tertiary">
                  {metric}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-lg bg-stock-ink p-5 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.18em] text-stock-subtle">ACCOUNT GATE</p>
            <p className="mt-2 text-lg font-black">주문장, 기업 이벤트와 내 주식은 모의투자 계좌 확인 후 진입합니다.</p>
          </div>
          <Link href={buildAccountRequiredPath("/trade")} className="rounded-md bg-white px-4 py-3 text-center text-sm font-black text-stock-ink">
            계좌 확인
          </Link>
        </div>
      </section>
    </main>
  );
}

function ProfileRankingPanel({
  isAdmin,
  isLoading,
  profiles,
  queryFailed,
}: {
  isAdmin: boolean;
  isLoading: boolean;
  profiles: AutoParticipantProfileOverview[];
  queryFailed: boolean;
}) {
  return (
    <section className="min-w-0 rounded-lg bg-admin-modal p-5 text-white shadow-[0_20px_48px_rgba(25,31,40,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.18em] text-admin-accent">RETURN RANKING</p>
          <h2 className="mt-2 text-2xl font-black">자동매매 프로필 성과</h2>
        </div>
        {isAdmin ? (
          <Link href="/admin/participants/overview" className="rounded-md bg-white px-3 py-2 text-sm font-black text-stock-ink">
            전체 보기
          </Link>
        ) : null}
      </div>

      {!isAdmin ? (
        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-bold leading-6 text-admin-muted">
            자동매매 프로필 성과는 관리자 권한에서 확인합니다. 일반 사용자는 주문장과 내 주식 화면에서 자신의 계좌 성과를 확인할 수 있습니다.
          </p>
        </div>
      ) : null}

      {isAdmin && queryFailed ? (
        <div className="mt-5 rounded-md border border-admin-danger/30 bg-admin-danger-surface p-4 text-sm font-bold text-admin-danger">
          자동참여자 성과를 불러오지 못했습니다.
        </div>
      ) : null}

      {isAdmin ? (
        <div className="mt-5 grid gap-2">
          {profiles.slice(0, 8).map((profile, index) => (
            <ProfileRankRow key={profile.profileType} profile={profile} rank={index + 1} />
          ))}
          {profiles.length === 0 && !isLoading && !queryFailed ? (
            <div className="rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-stock-subtle">
              아직 자동참여자 성과 데이터가 없습니다.
            </div>
          ) : null}
          {isLoading ? (
            <div className="rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-admin-muted">
              수익률 순위를 불러오는 중입니다.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ProfileRankRow({ profile, rank }: { profile: AutoParticipantProfileOverview; rank: number }) {
  return (
    <article className="grid min-w-0 gap-3 rounded-md border border-white/10 bg-white/[0.06] p-3 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-black text-stock-ink">
        {rank}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-sm font-black">{profile.profileType}</p>
          <span className="rounded-sm bg-white/10 px-2 py-1 text-[11px] font-bold text-stock-subtle">
            {formatInteger(profile.accountCount)}개 계좌
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-stock-subtle">
          자산 {formatWon(profile.estimatedTotalAsset)} · 손익 {formatWon(profile.totalProfit)} · 체결 {formatInteger(profile.todayExecutionCount)}건
        </p>
      </div>
      <p className={["text-right text-xl font-black tabular-nums", profitClass(profile.returnRate ?? 0)].join(" ")}>
        {profile.returnRate === null ? "—" : formatSignedPercent(profile.returnRate)}
      </p>
    </article>
  );
}

function HomeMetric({ label, value, tone = 0 }: { label: string; value: string; tone?: number }) {
  return (
    <div className="min-w-0 rounded-lg bg-white p-4 shadow-[var(--shadow-panel)] ring-1 ring-stock-divider">
      <p className="text-xs font-bold text-stock-muted">{label}</p>
      <p className={["mt-2 min-w-0 break-words text-sm font-black tabular-nums", profitClass(tone, "text-stock-ink")].join(" ")}>{value}</p>
    </div>
  );
}

function rankProfiles(profiles: AutoParticipantProfileOverview[]) {
  return [...profiles].sort((left, right) => {
    if (right.returnRate !== left.returnRate) {
      return (right.returnRate ?? Number.NEGATIVE_INFINITY) - (left.returnRate ?? Number.NEGATIVE_INFINITY);
    }
    return right.totalProfit - left.totalProfit;
  });
}

function summarizeProfiles(profiles: AutoParticipantProfileOverview[]) {
  const accountCount = profiles.reduce((sum, profile) => sum + profile.accountCount, 0);
  const netCashFlow = profiles.reduce((sum, profile) => sum + profile.netCashFlow, 0);
  const totalProfit = profiles.reduce((sum, profile) => sum + profile.totalProfit, 0);
  return {
    accountCount,
    aggregateReturnRate: netCashFlow > 0 ? (totalProfit * 100) / netCashFlow : null,
    totalProfit,
  };
}

function profitClass(value: number, neutralClassName = "text-white") {
  if (value > 0) {
    return "text-stock-danger";
  }
  if (value < 0) {
    return "text-stock-accent";
  }
  return neutralClassName;
}
