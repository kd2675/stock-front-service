"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import { formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { bootstrapAccessToken, getUserFromToken, isAdminRole } from "@/app/lib/auth";
import { autoParticipantOverviewsQueryOptions } from "@/app/lib/react-query/stockQueries";
import type { AutoParticipantOverview, AutoParticipantProfileType } from "@/app/types/stock";

type AdminStatus = "checking" | "allowed" | "denied";

const EMPTY_PARTICIPANTS: AutoParticipantOverview[] = [];

export default function AutoParticipantOverviewPage() {
  const router = useRouter();
  const [adminStatus, setAdminStatus] = useState<AdminStatus>("checking");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await bootstrapAccessToken();
      if (cancelled) {
        return;
      }
      if (!token) {
        router.replace("/login");
        return;
      }
      const user = getUserFromToken(token);
      if (!isAdminRole(user?.role)) {
        setAdminStatus("denied");
        return;
      }
      setAccessToken(token);
      setAdminStatus("allowed");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const overviewQuery = useQuery(autoParticipantOverviewsQueryOptions(accessToken));
  const participants = overviewQuery.data ?? EMPTY_PARTICIPANTS;
  const summary = useMemo(() => summarizeParticipants(participants), [participants]);
  const profileSummaries = useMemo(() => summarizeParticipantsByProfile(participants), [participants]);

  if (adminStatus === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101418] px-4 text-white">
        <p className="text-sm font-bold text-[#b8c2cc]">관리자 권한을 확인하고 있습니다.</p>
      </main>
    );
  }

  if (adminStatus === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101418] px-4 text-white">
        <div className="max-w-sm text-center">
          <p className="text-sm font-bold text-[#ffb4a8]">관리자 권한이 필요합니다.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-md bg-white px-3 py-2 text-sm font-black text-[#101418]">
            로그인
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101418] text-white">
      <TradingTopBar
        active="order-book"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/supply-demand/admin" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
              설정
            </Link>
            <Link href="/supply-demand" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
              자동장
            </Link>
          </div>
        )}
      />

      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold text-[#64a8ff]">AUTO PARTICIPANT OVERVIEW</p>
            <h1 className="mt-1 text-2xl font-black">자동 참여자 현황</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-[#b8c2cc]">
            <span className="rounded-md border border-white/10 px-2.5 py-1.5">실시간 자동 갱신</span>
            <span className="rounded-md border border-white/10 px-2.5 py-1.5">계좌 원장 기준</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {overviewQuery.isError ? (
          <p className="mb-4 rounded-md bg-[#3a1f1b] px-3 py-2 text-sm font-bold text-[#ffb4a8]">
            {overviewQuery.error instanceof Error ? overviewQuery.error.message : "자동 참여자 현황을 조회하지 못했습니다."}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryTile label="등록 참여자" value={`${summary.totalParticipants}명`} subValue={`가동 ${summary.enabledParticipants}명`} />
          <SummaryTile label="총 추정 자산" value={formatWon(summary.estimatedTotalAsset)} subValue={`현금 ${formatWon(summary.availableCash)}`} />
          <SummaryTile label="총 손익률" value={formatRate(summary.returnRate)} subValue={formatSignedWon(summary.totalProfit)} tone={summary.returnRate < 0 ? "blue" : "red"} />
          <SummaryTile label="매수 예약금" value={formatWon(summary.reservedBuyCash)} subValue={`매도 예약 ${formatNumber(summary.reservedSellQuantity)}주`} />
          <SummaryTile label="미체결 주문" value={`${formatNumber(summary.openOrderCount)}건`} subValue={`매수 ${formatNumber(summary.openBuyQuantity)}주 / 매도 ${formatNumber(summary.openSellQuantity)}주`} />
          <SummaryTile label="당일 체결" value={`${formatNumber(summary.todayExecutionCount)}건`} subValue={formatWon(summary.todayGrossAmount)} />
        </div>

        <section className="mt-5 rounded-md border border-white/10 bg-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-base font-black">프로필별 행동/활동 요약</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">심리 프로필 설명과 실제 계좌, 주문, 체결 흐름을 같은 기준으로 확인합니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">{profileSummaries.length.toLocaleString("ko-KR")}개 프로필 활동 중</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full table-fixed text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black text-[#8b95a1]">
                <tr>
                  <th className="w-[300px] px-4 py-3">프로필</th>
                  <th className="w-[120px] px-3 py-3 text-right">참여자</th>
                  <th className="w-[180px] px-3 py-3 text-right">자산/손익</th>
                  <th className="w-[180px] px-3 py-3 text-right">현금/예약</th>
                  <th className="w-[180px] px-3 py-3 text-right">보유</th>
                  <th className="w-[170px] px-3 py-3 text-right">미체결 방향</th>
                  <th className="w-[170px] px-3 py-3 text-right">당일 체결 방향</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {profileSummaries.map((profileSummary) => (
                  <tr key={profileSummary.profileType} className="align-top hover:bg-white/[0.04]">
                    <td className="px-4 py-3">
                      <p className="font-black text-white">{formatAutoParticipantProfile(profileSummary.profileType)}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#8b95a1]">{formatAutoParticipantProfileDescription(profileSummary.profileType)}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#b8c2cc]">{formatAutoParticipantProfileBehavior(profileSummary.profileType)}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MetricStack primary={`${formatNumber(profileSummary.totalParticipants)}명`} secondary={`가동 ${formatNumber(profileSummary.enabledParticipants)}명`} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MetricStack
                        primary={formatWon(profileSummary.estimatedTotalAsset)}
                        secondary={`${formatRate(profileSummary.returnRate)} · ${formatSignedWon(profileSummary.totalProfit)}`}
                        tone={profileSummary.returnRate < 0 ? "blue" : "red"}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MetricStack primary={formatWon(profileSummary.availableCash)} secondary={`매수 예약 ${formatWon(profileSummary.reservedBuyCash)}`} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MetricStack primary={`${formatNumber(profileSummary.totalHoldingQuantity)}주`} secondary={`${formatNumber(profileSummary.holdingCount)}종목 · 매도 예약 ${formatNumber(profileSummary.reservedSellQuantity)}주`} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MetricStack
                        primary={formatActivityBias(profileSummary.openBuyQuantity, profileSummary.openSellQuantity)}
                        secondary={`${formatNumber(profileSummary.openOrderCount)}건 · 매수 ${formatNumber(profileSummary.openBuyQuantity)}주 / 매도 ${formatNumber(profileSummary.openSellQuantity)}주`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MetricStack
                        primary={formatActivityBias(profileSummary.todayBuyQuantity, profileSummary.todaySellQuantity)}
                        secondary={`${formatNumber(profileSummary.todayExecutionCount)}건 · ${formatWon(profileSummary.todayGrossAmount)}`}
                      />
                    </td>
                  </tr>
                ))}
                {!overviewQuery.isLoading && profileSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-[#8b95a1]">프로필별 활동을 집계할 자동 참여자가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-md border border-white/10 bg-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-base font-black">참여자별 계좌/주문 상태</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동장 배치가 실제로 보는 현금, 보유, 주문, 체결 현황입니다.</p>
            </div>
            <button
              type="button"
              onClick={() => void overviewQuery.refetch()}
              className="h-10 rounded-md bg-white px-3 text-sm font-black text-[#101418] disabled:opacity-50"
              disabled={overviewQuery.isFetching}
            >
              {overviewQuery.isFetching ? "새로고침 중" : "새로고침"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1480px] w-full table-fixed text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black text-[#8b95a1]">
                <tr>
                  <th className="w-[220px] px-4 py-3">참여자</th>
                  <th className="w-[110px] px-3 py-3">상태</th>
                  <th className="w-[170px] px-3 py-3 text-right">자산</th>
                  <th className="w-[160px] px-3 py-3 text-right">손익률</th>
                  <th className="w-[170px] px-3 py-3 text-right">현금/예약금</th>
                  <th className="w-[300px] px-3 py-3 text-right">보유 종목</th>
                  <th className="w-[170px] px-3 py-3 text-right">미체결</th>
                  <th className="w-[150px] px-3 py-3 text-right">당일 체결</th>
                  <th className="w-[130px] px-3 py-3 text-right">전략</th>
                  <th className="w-[150px] px-4 py-3">최근 활동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {overviewQuery.isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm font-bold text-[#8b95a1]">자동 참여자 현황을 불러오고 있습니다.</td>
                  </tr>
                ) : null}
                {!overviewQuery.isLoading && participants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm font-bold text-[#8b95a1]">등록된 자동 참여자가 없습니다.</td>
                  </tr>
                ) : null}
                {participants.map((participant) => (
                  <ParticipantRow key={participant.userKey} participant={participant} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function ParticipantRow({ participant }: { participant: AutoParticipantOverview }) {
  const accountLabel = participant.accountId ? `계좌 ${participant.accountId}` : "계좌 없음";
  const holdings = participant.holdings ?? [];
  const visibleHoldings = holdings.slice(0, 4);
  const hiddenHoldingCount = Math.max(0, holdings.length - visibleHoldings.length);
  return (
    <tr className="align-top hover:bg-white/[0.04]">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-black text-white">{participant.displayName}</p>
          <p className="mt-1 truncate text-xs font-bold text-[#8b95a1]">{participant.userKey}</p>
          <p className="mt-2 text-xs font-black text-[#64a8ff]">{formatAutoParticipantProfile(participant.profileType)}</p>
          <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-5 text-[#8b95a1]">{formatAutoParticipantProfileDescription(participant.profileType)}</p>
        </div>
      </td>
      <td className="px-3 py-3">
        <StatusBadge participant={participant} />
        <ActivityBadge participant={participant} />
        <p className="mt-2 text-xs font-bold text-[#8b95a1]">{accountLabel}</p>
        <p className="mt-1 text-xs font-bold text-[#8b95a1]">{participant.accountStatus ?? "-"}</p>
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack primary={formatWon(participant.estimatedTotalAsset)} secondary={`평가 ${formatWon(participant.holdingMarketValue)}`} />
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack
          primary={formatRate(participant.returnRate)}
          secondary={`${formatSignedWon(participant.totalProfit)} · 원금 ${formatWon(participant.netCashFlow)}`}
          tone={participant.returnRate < 0 ? "blue" : "red"}
        />
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack primary={formatWon(participant.availableCash)} secondary={`예약 ${formatWon(participant.reservedBuyCash)}`} />
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack primary={`${formatNumber(participant.totalHoldingQuantity)}주`} secondary={`${formatNumber(participant.holdingCount)}종목 · 예약 ${formatNumber(participant.reservedSellQuantity)}주`} />
        {visibleHoldings.length > 0 ? (
          <div className="mt-2 space-y-1">
            {visibleHoldings.map((holding) => (
              <div key={holding.symbol} className="rounded-md bg-black/20 px-2 py-1 text-xs font-bold text-[#b8c2cc]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-white">{holding.symbol}</span>
                  <span className="tabular-nums">{formatNumber(holding.quantity)}주</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[#8b95a1]">
                  <span>가용 {formatNumber(holding.availableQuantity)}주 · 예약 {formatNumber(holding.reservedQuantity)}주</span>
                  <span className={metricToneClass(safeNumber(holding.unrealizedProfit) < 0 ? "blue" : "red")}>{formatSignedWon(holding.unrealizedProfit)}</span>
                </div>
              </div>
            ))}
            {hiddenHoldingCount > 0 ? (
              <p className="text-xs font-bold text-[#8b95a1]">외 {hiddenHoldingCount.toLocaleString("ko-KR")}종목 더 보유</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-xs font-bold text-[#8b95a1]">보유 종목 없음</p>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack
          primary={`${formatNumber(participant.openOrderCount)}건`}
          secondary={`매수 ${formatNumber(participant.openBuyQuantity)}주 · 매도 ${formatNumber(participant.openSellQuantity)}주`}
        />
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack
          primary={`${formatNumber(participant.todayExecutionCount)}건`}
          secondary={`매수 ${formatNumber(participant.todayBuyQuantity)}주 · 매도 ${formatNumber(participant.todaySellQuantity)}주`}
        />
      </td>
      <td className="px-3 py-3 text-right">
        <MetricStack primary={`${formatNumber(participant.enabledStrategyCount)}개`} secondary={`전체 ${formatNumber(participant.strategyCount)}개`} />
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-bold text-[#8b95a1]">주문</p>
        <p className="mt-0.5 text-sm font-black text-white">{formatDateTime(participant.lastOrderAt)}</p>
        <p className="mt-2 text-xs font-bold text-[#8b95a1]">체결</p>
        <p className="mt-0.5 text-sm font-black text-white">{formatDateTime(participant.lastExecutionAt)}</p>
      </td>
    </tr>
  );
}

function SummaryTile({
  label,
  value,
  subValue,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subValue: string;
  tone?: "red" | "blue" | "neutral";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className={`mt-2 truncate text-xl font-black ${metricToneClass(tone)}`}>{value}</p>
      <p className="mt-1 truncate text-xs font-bold text-[#b8c2cc]">{subValue}</p>
    </div>
  );
}

function StatusBadge({ participant }: { participant: AutoParticipantOverview }) {
  if (!participant.accountId) {
    return <span className="inline-flex rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8]">계좌 없음</span>;
  }
  if (!participant.enabled) {
    return <span className="inline-flex rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#b8c2cc]">정지</span>;
  }
  if (participant.openOrderCount > 0) {
    return <span className="inline-flex rounded-md bg-[#183b2d] px-2 py-1 text-xs font-black text-[#6ee7b7]">주문 대기</span>;
  }
  return <span className="inline-flex rounded-md bg-[#112f55] px-2 py-1 text-xs font-black text-[#64a8ff]">가동</span>;
}

function ActivityBadge({ participant }: { participant: AutoParticipantOverview }) {
  const buyQuantity = safeNumber(participant.todayBuyQuantity) || safeNumber(participant.openBuyQuantity);
  const sellQuantity = safeNumber(participant.todaySellQuantity) || safeNumber(participant.openSellQuantity);
  const tone = buyQuantity > sellQuantity ? "red" : sellQuantity > buyQuantity ? "blue" : "neutral";
  return (
    <span className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-black ${activityToneClass(tone)}`}>
      {formatActivityBias(buyQuantity, sellQuantity)}
    </span>
  );
}

function MetricStack({
  primary,
  secondary,
  tone = "neutral",
}: {
  primary: string;
  secondary: string;
  tone?: "red" | "blue" | "neutral";
}) {
  return (
    <div>
      <p className={`font-black tabular-nums ${metricToneClass(tone)}`}>{primary}</p>
      <p className="mt-1 text-xs font-bold tabular-nums text-[#8b95a1]">{secondary}</p>
    </div>
  );
}

function summarizeParticipants(participants: AutoParticipantOverview[]) {
  const summary = participants.reduce(
    (summary, participant) => ({
      totalParticipants: summary.totalParticipants + 1,
      enabledParticipants: summary.enabledParticipants + (participant.enabled ? 1 : 0),
      estimatedTotalAsset: summary.estimatedTotalAsset + safeNumber(participant.estimatedTotalAsset),
      netCashFlow: summary.netCashFlow + safeNumber(participant.netCashFlow),
      totalProfit: summary.totalProfit + safeNumber(participant.totalProfit),
      availableCash: summary.availableCash + safeNumber(participant.availableCash),
      reservedBuyCash: summary.reservedBuyCash + safeNumber(participant.reservedBuyCash),
      reservedSellQuantity: summary.reservedSellQuantity + safeNumber(participant.reservedSellQuantity),
      openOrderCount: summary.openOrderCount + safeNumber(participant.openOrderCount),
      openBuyQuantity: summary.openBuyQuantity + safeNumber(participant.openBuyQuantity),
      openSellQuantity: summary.openSellQuantity + safeNumber(participant.openSellQuantity),
      todayExecutionCount: summary.todayExecutionCount + safeNumber(participant.todayExecutionCount),
      todayGrossAmount: summary.todayGrossAmount + safeNumber(participant.todayGrossAmount),
    }),
    {
      totalParticipants: 0,
      enabledParticipants: 0,
      estimatedTotalAsset: 0,
      netCashFlow: 0,
      totalProfit: 0,
      availableCash: 0,
      reservedBuyCash: 0,
      reservedSellQuantity: 0,
      openOrderCount: 0,
      openBuyQuantity: 0,
      openSellQuantity: 0,
      todayExecutionCount: 0,
      todayGrossAmount: 0,
    },
  );

  return {
    ...summary,
    returnRate: summary.netCashFlow > 0 ? (summary.totalProfit * 100) / summary.netCashFlow : 0,
  };
}

function summarizeParticipantsByProfile(participants: AutoParticipantOverview[]) {
  const summaries = new Map<AutoParticipantProfileType, ReturnType<typeof createEmptyProfileSummary>>();
  participants.forEach((participant) => {
    const current = summaries.get(participant.profileType) ?? createEmptyProfileSummary(participant.profileType);
    current.totalParticipants += 1;
    current.enabledParticipants += participant.enabled ? 1 : 0;
    current.estimatedTotalAsset += safeNumber(participant.estimatedTotalAsset);
    current.netCashFlow += safeNumber(participant.netCashFlow);
    current.totalProfit += safeNumber(participant.totalProfit);
    current.availableCash += safeNumber(participant.availableCash);
    current.reservedBuyCash += safeNumber(participant.reservedBuyCash);
    current.holdingCount += safeNumber(participant.holdingCount);
    current.totalHoldingQuantity += safeNumber(participant.totalHoldingQuantity);
    current.reservedSellQuantity += safeNumber(participant.reservedSellQuantity);
    current.openOrderCount += safeNumber(participant.openOrderCount);
    current.openBuyQuantity += safeNumber(participant.openBuyQuantity);
    current.openSellQuantity += safeNumber(participant.openSellQuantity);
    current.todayExecutionCount += safeNumber(participant.todayExecutionCount);
    current.todayBuyQuantity += safeNumber(participant.todayBuyQuantity);
    current.todaySellQuantity += safeNumber(participant.todaySellQuantity);
    current.todayGrossAmount += safeNumber(participant.todayGrossAmount);
    summaries.set(participant.profileType, current);
  });

  return Array.from(summaries.values())
    .map((summary) => ({
      ...summary,
      returnRate: summary.netCashFlow > 0 ? (summary.totalProfit * 100) / summary.netCashFlow : 0,
    }))
    .sort((left, right) => right.totalParticipants - left.totalParticipants || left.profileType.localeCompare(right.profileType));
}

function createEmptyProfileSummary(profileType: AutoParticipantProfileType) {
  return {
    profileType,
    totalParticipants: 0,
    enabledParticipants: 0,
    estimatedTotalAsset: 0,
    netCashFlow: 0,
    totalProfit: 0,
    availableCash: 0,
    reservedBuyCash: 0,
    holdingCount: 0,
    totalHoldingQuantity: 0,
    reservedSellQuantity: 0,
    openOrderCount: 0,
    openBuyQuantity: 0,
    openSellQuantity: 0,
    todayExecutionCount: 0,
    todayBuyQuantity: 0,
    todaySellQuantity: 0,
    todayGrossAmount: 0,
  };
}

function formatActivityBias(buyQuantity: number, sellQuantity: number) {
  if (buyQuantity > sellQuantity) {
    return "매수 우위";
  }
  if (sellQuantity > buyQuantity) {
    return "매도 우위";
  }
  if (buyQuantity > 0 || sellQuantity > 0) {
    return "균형";
  }
  return "활동 없음";
}

function safeNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function formatWon(value?: number | null) {
  return `${Math.round(safeNumber(value)).toLocaleString("ko-KR")}원`;
}

function formatSignedWon(value?: number | null) {
  const rounded = Math.round(safeNumber(value));
  if (rounded > 0) {
    return `+${rounded.toLocaleString("ko-KR")}원`;
  }
  if (rounded < 0) {
    return `${rounded.toLocaleString("ko-KR")}원`;
  }
  return "0원";
}

function formatRate(value?: number | null) {
  const normalized = safeNumber(value);
  return `${normalized > 0 ? "+" : ""}${normalized.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function metricToneClass(tone: "red" | "blue" | "neutral" = "neutral") {
  if (tone === "red") {
    return "text-[#f04452]";
  }
  if (tone === "blue") {
    return "text-[#3182f6]";
  }
  return "text-white";
}

function activityToneClass(tone: "red" | "blue" | "neutral") {
  if (tone === "red") {
    return "bg-[#3a1f1b] text-[#ffb4a8]";
  }
  if (tone === "blue") {
    return "bg-[#112f55] text-[#64a8ff]";
  }
  return "bg-white/10 text-[#b8c2cc]";
}

function formatNumber(value?: number | null) {
  return Math.round(safeNumber(value)).toLocaleString("ko-KR");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
