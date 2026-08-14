"use client";

import { useQuery } from "@tanstack/react-query";

import { autoProfileCohortsQueryOptions, autoProfilePopulationContractQueryOptions } from "@/app/lib/react-query/stockAdminQueries";

type Props = {
  accessToken: string | null;
};

export function AdminAutoProfileCohortPanel({ accessToken }: Props) {
  const cohortQuery = useQuery(autoProfileCohortsQueryOptions(accessToken, {
    enabled: Boolean(accessToken),
  }));
  const contractQuery = useQuery(autoProfilePopulationContractQueryOptions(accessToken, {
    enabled: Boolean(accessToken),
  }));
  const contract = contractQuery.data;
  const cohorts = cohortQuery.data ?? [];
  const accountCount = cohorts.reduce((sum, cohort) => sum + cohort.activeAccountCount, 0);
  const representedCount = cohorts.reduce((sum, cohort) => sum + cohort.representedPopulationCount, 0);
  const configuredAccountCount = cohorts.reduce((sum, cohort) => sum + cohort.executionAccountCount, 0);
  const targetAum = cohorts.reduce((sum, cohort) => sum + cohort.targetAum, 0);
  const actualAum = cohorts.reduce((sum, cohort) => sum + cohort.actualAum, 0);
  const partitionCount = cohorts.reduce((sum, cohort) => sum + cohort.targetPartitionCount, 0);
  const populationMatches = contract != null
    && accountCount === configuredAccountCount
    && representedCount === contract.representedPopulationCount
    && configuredAccountCount === contract.executionAccountCount
    && cohorts.length === 27;

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-admin-accent">Profile partitions</p>
            <h2 className="mt-1 text-lg font-black text-white">15만 실제 계좌 · 프로필 파티션 계약</h2>
            <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
              15만 계좌가 각각 현금·보유·주문 원장을 가지며 프로필 파티션 워커가 도래 계좌만 처리합니다. 한 계좌는 한 사람이고 인구 배율은 사용하지 않습니다.
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${populationMatches ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
            {cohortQuery.isLoading ? "계약 확인 중" : populationMatches ? "인구·샤드 계약 일치" : "인구·샤드 계약 확인 필요"}
          </span>
        </div>

        {cohortQuery.isError ? (
          <p className="mt-4 text-sm font-bold text-admin-danger">프로필 계좌군을 불러오지 못했습니다.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            <Metric label="활성 프로필" value={`${formatNumber(cohorts.filter((cohort) => cohort.enabled).length)} / 27`} />
            <Metric label="실제 투자자" value={formatNumber(representedCount)} />
            <Metric label="활성계좌 실제 / 계약" value={`${formatNumber(accountCount)} / ${formatNumber(configuredAccountCount)}`} />
            <Metric label="실행 파티션" value={formatNumber(partitionCount)} />
            <Metric label="1/100 가계 거주자 지분 AUM" value={formatWon(contract?.targetScaledHouseholdEquityAum ?? 0)} />
            <Metric label="수동 개인 AUM" value={formatWon(contract?.manualParticipantAumSnapshot ?? 0)} />
            <Metric label="목표 자산" value={formatWon(targetAum)} />
            <Metric label="현재 자산" value={formatWon(actualAum)} />
          </div>
        )}
      </div>

      {cohorts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-stock-subtle">
              <tr>
                <th className="px-4 py-3">프로필</th>
                <th className="px-3 py-3 text-right">실제 투자자</th>
                <th className="px-3 py-3 text-right">활성계좌 실제 / 계약</th>
                <th className="px-3 py-3 text-right">파티션</th>
                <th className="px-3 py-3 text-right">현금</th>
                <th className="px-3 py-3 text-right">보유 평가액</th>
                <th className="px-3 py-3 text-right">현재 / 목표 AUM</th>
                <th className="px-3 py-3 text-right">정책</th>
                <th className="px-3 py-3 text-right">최근 동적 선택</th>
                <th className="px-3 py-3 text-right">라우터 근거</th>
                <th className="px-4 py-3 text-right">상태</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => {
                const matches = cohort.activeAccountCount === cohort.executionAccountCount;
                return (
                  <tr key={cohort.profileType} className="border-t border-white/5 font-bold text-white">
                    <td className="px-4 py-3">{cohort.profileType}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(cohort.representedPopulationCount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(cohort.activeAccountCount)} / {formatNumber(cohort.executionAccountCount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(cohort.targetPartitionCount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatWon(cohort.cashAmount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatWon(cohort.holdingMarketValue)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatWon(cohort.actualAum)} / {formatWon(cohort.targetAum)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">v{cohort.policyVersion} · ×{cohort.attentionScale.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <div>{formatDateTime(cohort.lastSelectedAt)}</div>
                      <div className="mt-1 text-[10px] text-stock-subtle">누적 {formatNumber(cohort.activationCount)}회</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div>{formatActivation(cohort.lastActivationReason, cohort.lastActivationScore)}</div>
                      <div className="mt-1 font-mono text-[10px] text-stock-subtle">{cohort.lastMarketFingerprint ?? "-"}</div>
                    </td>
                    <td className={`px-4 py-3 text-right ${cohort.enabled && matches ? "text-emerald-200" : "text-amber-200"}`}>
                      {cohort.enabled && matches ? "정상" : "확인 필요"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-white/10 bg-black/10 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-stock-subtle">{label}</p>
      <p className="mt-1 text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value);
}

function formatWon(value: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  if (Math.abs(value) >= 100_000_000_000_000) {
    return `${(value / 100_000_000_000_000).toFixed(2)}백조원`;
  }
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}조원`;
  }
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억원`;
  }
  return `${formatNumber(value)}원`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function formatActivation(reason?: string | null, score?: number | null) {
  if (!reason || score == null || !Number.isFinite(score)) {
    return "-";
  }
  return `${reason} · ${(score * 100).toFixed(1)}%`;
}
