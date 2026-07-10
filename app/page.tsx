"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import useAuthSession from "@/app/hooks/useAuthSession";
import { buildAccountRequiredPath } from "@/app/lib/accountRouting";
import { getAccessTokenForAuthStatus, isAdminRole } from "@/app/lib/auth";
import { autoParticipantOverviewsQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import {
  formatCount,
  formatInteger,
  formatSignedPercent,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import type { AutoParticipantOverview } from "@/app/types/stock";

const QUICK_LINKS = [
  {
    href: "/supply-demand",
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
    href: "/supply-demand/admin/accounts/participants",
    eyebrow: "PARTICIPANTS",
    title: "자동참여자",
    description: "각 자동참여자의 현금, 보유 주식, 전략 수, 체결 활동과 성과 순위를 관리합니다.",
    metrics: ["프로필", "전략", "순위"],
  },
];
const EMPTY_PARTICIPANT_OVERVIEWS: AutoParticipantOverview[] = [];

export default function StockHomePage() {
  const { authStatus, isHydrated, user } = useAuthSession();
  const isLoggedIn = isHydrated && authStatus === "in";
  const isAdmin = isAdminRole(user?.role);
  const token = getAccessTokenForAuthStatus(authStatus);
  const participantOverviewsQuery = useQuery(autoParticipantOverviewsQueryOptions(token, {
    activityScope: "ALL",
    enabled: isAdmin && isLoggedIn,
    includeHoldings: false,
    refetchIntervalMs: false,
  }));
  const participantOverviews = participantOverviewsQuery.data ?? EMPTY_PARTICIPANT_OVERVIEWS;
  const rankedParticipants = useMemo(() => rankParticipants(participantOverviews), [participantOverviews]);
  const summary = useMemo(() => summarizeParticipants(participantOverviews), [participantOverviews]);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#191f28]">
      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-black tracking-tight">
            Stock Mock Trading
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Link href="/supply-demand/admin" className="rounded-md bg-[#191f28] px-3 py-2 text-sm font-bold text-white">
                관리자 설정
              </Link>
            ) : null}
            {isLoggedIn ? (
              <Link href="/portfolio" className="rounded-md bg-[#f2f4f6] px-3 py-2 text-sm font-black text-[#333d4b]">
                내 주식
              </Link>
            ) : null}
            <Link href={isLoggedIn ? "/supply-demand" : "/login"} className="rounded-md bg-[#3182f6] px-3 py-2 text-sm font-black text-white">
              {isLoggedIn ? "주문장" : "로그인"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(460px,1.18fr)] lg:px-8 lg:py-12">
        <div className="min-w-0 self-center">
          <p className="text-xs font-black tracking-[0.22em] text-[#3182f6]">PARTICIPANT PERFORMANCE BOARD</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-normal sm:text-5xl lg:text-6xl">
            자동참여자 수익률로 보는 모의 주식시장
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#4e5968]">
            현재 화면은 수요와 공급 주문장, 내 주식, 자동참여자 성과를 중심으로 구성합니다.
            자동참여자는 계좌별 총자산, 순입금, 손익, 수익률을 기준으로 비교합니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <HomeMetric label="자동참여자" value={formatCount(summary.participantCount, "명")} />
            <HomeMetric label="평균 수익률" value={formatSignedPercent(summary.averageReturnRate)} tone={summary.averageReturnRate} />
            <HomeMetric label="총 손익" value={formatWon(summary.totalProfit)} tone={summary.totalProfit} />
          </div>
        </div>

        <ParticipantRankingPanel
          isAdmin={isAdmin}
          isLoading={participantOverviewsQuery.isFetching}
          participants={rankedParticipants}
          queryFailed={participantOverviewsQuery.isError}
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {QUICK_LINKS.filter((link) => isAdmin || !link.href.includes("/admin")).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group min-w-0 rounded-lg border border-[#e5e8eb] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(25,31,40,0.08)]"
          >
            <p className="text-xs font-black tracking-[0.18em] text-[#3182f6]">{link.eyebrow}</p>
            <h2 className="mt-2 min-w-0 break-words text-2xl font-black">{link.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#6b7684]">{link.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {link.metrics.map((metric) => (
                <span key={metric} className="rounded-sm bg-[#f6f7f9] px-2 py-1 text-xs font-bold text-[#4e5968]">
                  {metric}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-lg bg-[#191f28] p-5 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.18em] text-[#8b95a1]">ACCOUNT GATE</p>
            <p className="mt-2 text-lg font-black">주문장과 내 주식은 모의투자 계좌 확인 후 진입합니다.</p>
          </div>
          <Link href={buildAccountRequiredPath("/supply-demand")} className="rounded-md bg-white px-4 py-3 text-center text-sm font-black text-[#191f28]">
            계좌 확인
          </Link>
        </div>
      </section>
    </main>
  );
}

function ParticipantRankingPanel({
  isAdmin,
  isLoading,
  participants,
  queryFailed,
}: {
  isAdmin: boolean;
  isLoading: boolean;
  participants: AutoParticipantOverview[];
  queryFailed: boolean;
}) {
  return (
    <section className="min-w-0 rounded-lg bg-[#11161d] p-5 text-white shadow-[0_20px_48px_rgba(25,31,40,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.18em] text-[#64a8ff]">RETURN RANKING</p>
          <h2 className="mt-2 text-2xl font-black">자동참여자 수익률 순위</h2>
        </div>
        {isAdmin ? (
          <Link href="/supply-demand/admin/accounts/participants" className="rounded-md bg-white px-3 py-2 text-sm font-black text-[#191f28]">
            전체 보기
          </Link>
        ) : null}
      </div>

      {!isAdmin ? (
        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-bold leading-6 text-[#b8c2cc]">
            자동참여자 성과 순위는 관리자 권한에서 확인합니다. 일반 사용자는 주문장과 내 주식 화면에서 자신의 계좌 성과를 확인할 수 있습니다.
          </p>
        </div>
      ) : null}

      {isAdmin && queryFailed ? (
        <div className="mt-5 rounded-md border border-[#ffb4a8]/30 bg-[#3a1f1b] p-4 text-sm font-bold text-[#ffb4a8]">
          자동참여자 성과를 불러오지 못했습니다.
        </div>
      ) : null}

      {isAdmin ? (
        <div className="mt-5 grid gap-2">
          {participants.slice(0, 8).map((participant, index) => (
            <ParticipantRankRow key={participant.userKey} participant={participant} rank={index + 1} />
          ))}
          {participants.length === 0 && !isLoading && !queryFailed ? (
            <div className="rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-[#8b95a1]">
              아직 자동참여자 성과 데이터가 없습니다.
            </div>
          ) : null}
          {isLoading ? (
            <div className="rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-[#b8c2cc]">
              수익률 순위를 불러오는 중입니다.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ParticipantRankRow({ participant, rank }: { participant: AutoParticipantOverview; rank: number }) {
  return (
    <article className="grid min-w-0 gap-3 rounded-md border border-white/10 bg-white/[0.06] p-3 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-black text-[#191f28]">
        {rank}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-sm font-black">{participant.displayName}</p>
          <span className="rounded-sm bg-white/10 px-2 py-1 text-[11px] font-bold text-[#8b95a1]">
            {participant.profileType}
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-[#8b95a1]">
          자산 {formatWon(participant.estimatedTotalAsset)} · 손익 {formatWon(participant.totalProfit)} · 체결 {formatInteger(participant.todayExecutionCount)}건
        </p>
      </div>
      <p className={["text-right text-xl font-black tabular-nums", profitClass(participant.returnRate)].join(" ")}>
        {formatSignedPercent(participant.returnRate)}
      </p>
    </article>
  );
}

function HomeMetric({ label, value, tone = 0 }: { label: string; value: string; tone?: number }) {
  return (
    <div className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <p className="text-xs font-bold text-[#6b7684]">{label}</p>
      <p className={["mt-2 min-w-0 break-words text-sm font-black tabular-nums", profitClass(tone, "text-[#191f28]")].join(" ")}>{value}</p>
    </div>
  );
}

function rankParticipants(participants: AutoParticipantOverview[]) {
  return [...participants].sort((left, right) => {
    if (right.returnRate !== left.returnRate) {
      return right.returnRate - left.returnRate;
    }
    return right.totalProfit - left.totalProfit;
  });
}

function summarizeParticipants(participants: AutoParticipantOverview[]) {
  const participantCount = participants.length;
  const totalProfit = participants.reduce((sum, participant) => sum + participant.totalProfit, 0);
  const averageReturnRate = participantCount
    ? participants.reduce((sum, participant) => sum + participant.returnRate, 0) / participantCount
    : 0;

  return {
    averageReturnRate,
    participantCount,
    totalProfit,
  };
}

function profitClass(value: number, neutralClassName = "text-white") {
  if (value > 0) {
    return "text-[#f04452]";
  }
  if (value < 0) {
    return "text-[#3182f6]";
  }
  return neutralClassName;
}
