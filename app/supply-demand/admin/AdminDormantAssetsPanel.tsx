"use client";

import { useMemo, useState } from "react";

import DataTableViewport from "@/app/components/DataTableViewport";
import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { AutoParticipantOverviewDetail } from "@/app/supply-demand/admin/AdminAutoParticipantOverviewDetail";
import { AdminDormantWithdrawalAudit } from "@/app/supply-demand/admin/AdminDormantWithdrawalAudit";
import {
  formatCount,
  formatDateTime,
  formatInteger,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import {
  ParticipantInfoItem,
  ProfileMiniMetric,
} from "@/app/supply-demand/admin/AdminMetricCards";
import { formatParticipantRecurringCash } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import type {
  AutoParticipant,
  AutoParticipantOverview,
  AutoParticipantSymbolConfig,
  AutoParticipantWithdrawalAudit,
} from "@/app/types/stock";

const DORMANT_PAGE_SIZE = 8;

type DormantAssetFilter = "ALL" | "HAS_ASSETS" | "HAS_HOLDINGS" | "NEEDS_REVIEW";

type DormantParticipantRow = {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  symbolConfigs: AutoParticipantSymbolConfig[];
  withdrawalAudit: AutoParticipantWithdrawalAudit | null;
  reviewReasons: string[];
};

export function AdminDormantAssetsPanel({
  participants,
  overviews,
  symbolConfigs,
  withdrawalAudits,
  loading,
  error,
  onRefresh,
}: {
  participants: AutoParticipant[];
  overviews: AutoParticipantOverview[];
  symbolConfigs: AutoParticipantSymbolConfig[];
  withdrawalAudits: AutoParticipantWithdrawalAudit[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState<DormantAssetFilter>("ALL");
  const [page, setPage] = useState(0);
  const rows = useMemo(
    () => buildDormantParticipantRows(participants, overviews, symbolConfigs, withdrawalAudits),
    [overviews, participants, symbolConfigs, withdrawalAudits],
  );
  const summary = useMemo(() => summarizeDormantRows(rows), [rows]);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRows = useMemo(
    () => rows.filter((row) => matchesDormantSearch(row, normalizedSearchTerm)
      && matchesDormantFilter(row, assetFilter)),
    [assetFilter, normalizedSearchTerm, rows],
  );
  const totalPages = Math.ceil(filteredRows.length / DORMANT_PAGE_SIZE);
  const boundedPage = Math.min(page, Math.max(totalPages - 1, 0));
  const pageStart = boundedPage * DORMANT_PAGE_SIZE;
  const visibleRows = filteredRows.slice(pageStart, pageStart + DORMANT_PAGE_SIZE);

  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };
  const updateAssetFilter = (value: DormantAssetFilter) => {
    setAssetFilter(value);
    setPage(0);
  };

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">탈퇴 자동 참여자 휴면 원장</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
            탈퇴 시 시스템 보관계정으로 이전한 주식·회수한 현금과 종료 계좌, 보존된 전략·주문·체결 이력을 읽기 전용으로 조회합니다.
          </p>
          <p className="mt-1 max-w-3xl text-[11px] font-bold leading-5 text-admin-quiet">
            신규 탈퇴는 잔여 자산과 예약이 0이고 계좌가 CLOSED여야 정상입니다. 기존 소프트 탈퇴 데이터처럼 값이 남아 있으면 점검 대상으로 표시합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-admin-accent-soft">원장 조회 중</span> : null}
          {error ? <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-admin-danger">일부 원장 조회 실패</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-9 rounded-md bg-stock-surface-strong px-3 py-1.5 text-xs font-black text-stock-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "조회 중" : "새로고침"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric label="휴면 참여자" value={formatCount(summary.participantCount, "명")} tone="blue" />
        <ProfileMiniMetric label="잔여 자산 계좌" value={formatCount(summary.assetAccountCount, "개")} tone={summary.assetAccountCount > 0 ? "red" : "green"} />
        <ProfileMiniMetric label="잔여 총자산" value={formatWon(summary.estimatedTotalAsset)} tone={summary.estimatedTotalAsset > 0 ? "red" : "green"} />
        <ProfileMiniMetric label="잔여 현금" value={formatWon(summary.availableCash)} tone="muted" />
        <ProfileMiniMetric label="잔여 주식 평가액" value={formatWon(summary.holdingMarketValue)} tone="muted" />
        <ProfileMiniMetric label="점검 필요" value={formatCount(summary.reviewCount, "명")} tone={summary.reviewCount > 0 ? "red" : "green"} />
      </div>

      <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-black/20 p-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          참여자·계좌·종목 검색
          <input
            value={searchTerm}
            onChange={(event) => updateSearchTerm(event.target.value)}
            placeholder="표시명, 사용자 키, 계좌 ID, 종목"
            className="admin-control w-full px-3 text-sm font-bold"
          />
        </label>
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          자산 상태
          <select
            value={assetFilter}
            onChange={(event) => updateAssetFilter(event.target.value as DormantAssetFilter)}
            className="admin-control w-full px-3 text-sm font-bold"
          >
            <option value="ALL">전체 휴면 참여자</option>
            <option value="HAS_ASSETS">현금 또는 주식 보유</option>
            <option value="HAS_HOLDINGS">주식 보유</option>
            <option value="NEEDS_REVIEW">점검 필요</option>
          </select>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md border border-admin-danger/25 bg-admin-danger-surface px-3 py-3 text-xs font-bold leading-5 text-admin-danger">
          기본 정보·자산·종목 전략 중 일부 조회가 실패했습니다. 표시된 값만으로 탈퇴 원장이 완전하다고 판단하지 말고 새로고침 후 다시 확인해 주세요.
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/15 px-4 py-8 text-center text-sm font-bold text-stock-subtle">
          탈퇴 참여자와 연결 자산 원장을 조회하고 있습니다.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {visibleRows.map((row) => (
          <DormantParticipantCard key={row.participant.userKey} row={row} />
        ))}
      </div>

      {!loading && !error && filteredRows.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-white/15 bg-black/15 px-4 py-8 text-center">
          <p className="text-sm font-black text-white">
            {rows.length === 0 ? "탈퇴한 자동 참여자가 없습니다." : "검색 조건에 맞는 휴면 원장이 없습니다."}
          </p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            휴면 기준은 자동 참여자 원장의 탈퇴 시각이 기록된 경우입니다.
          </p>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs font-black">
          <p className="text-stock-subtle">
            {formatInteger(pageStart + 1)}–{formatInteger(Math.min(pageStart + DORMANT_PAGE_SIZE, filteredRows.length))}
            {" / "}{formatCount(filteredRows.length, "명")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, boundedPage - 1))}
              disabled={boundedPage === 0}
              className="min-h-9 rounded-md border border-white/10 px-3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <span className="min-w-16 text-center text-admin-muted">{boundedPage + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages - 1, boundedPage + 1))}
              disabled={boundedPage >= totalPages - 1}
              className="min-h-9 rounded-md border border-white/10 px-3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DormantParticipantCard({ row }: { row: DormantParticipantRow }) {
  const {
    participant,
    overview,
    reviewReasons,
    symbolConfigs,
    withdrawalAudit,
  } = row;
  const enabledSymbolConfigCount = symbolConfigs.filter((config) => config.enabled).length;

  return (
    <article className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-black text-white">{participant.displayName}</h3>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-admin-muted">휴면</span>
            {reviewReasons.length > 0 ? (
              <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-[10px] font-black text-admin-danger">
                점검 {formatCount(reviewReasons.length, "건")}
              </span>
            ) : (
              <span className="rounded-md bg-admin-success-surface px-2 py-1 text-[10px] font-black text-admin-success">정산 완료</span>
            )}
          </div>
          <p className="mt-1 break-all text-xs font-bold text-stock-subtle">{participant.userKey}</p>
          <p className="mt-1 text-[11px] font-bold text-admin-quiet">탈퇴 {formatDateTime(participant.withdrawnAt)}</p>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-2 sm:grid-cols-4">
          <DormantHeaderMetric label="총자산" value={overview ? formatWon(overview.estimatedTotalAsset) : "—"} />
          <DormantHeaderMetric label="현금" value={formatWon(overview?.availableCash ?? participant.cashBalance ?? 0)} />
          <DormantHeaderMetric label="주식" value={overview ? formatWon(overview.holdingMarketValue) : "—"} />
          <DormantHeaderMetric label="보유" value={overview ? `${formatNumber(overview.totalHoldingQuantity)}주` : "—"} />
        </div>
      </div>

      {reviewReasons.length > 0 ? (
        <div className="mt-3 rounded-md border border-admin-danger/20 bg-admin-danger-surface/60 px-3 py-2">
          <p className="text-[11px] font-black text-admin-danger">탈퇴 후 잔존 상태 점검</p>
          <ul className="mt-1 grid gap-1 text-xs font-bold leading-5 text-admin-danger">
            {reviewReasons.map((reason) => <li key={reason}>· {reason}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <DormantHeaderMetric label="탈퇴 시 회수 현금" value={formatWon(participant.withdrawalReturnedCashAmount)} />
        <DormantHeaderMetric label="탈퇴 시 보관 이전" value={`${formatNumber(participant.withdrawalReturnedShareQuantity)}주 · ${formatCount(participant.withdrawalReturnedSymbolCount, "종목")}`} />
        <DormantHeaderMetric label="계좌 종료" value={participant.accountClosedOnWithdrawal ? "CLOSED 완료" : "감사 원장 없음"} />
      </div>

      <details className="group mt-3 rounded-md border border-white/10 bg-white/[0.025]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-black text-admin-accent-soft marker:hidden">
          <span>참여자 설정과 자산 원장 전체 보기</span>
          <span aria-hidden="true" className="text-admin-accent transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-white/10 p-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <ParticipantInfoItem label="생명주기 원장">
              <p className="font-black text-white">탈퇴 시각 {formatDateTime(participant.withdrawnAt)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">등록 {formatDateTime(participant.createdAt)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">마지막 수정 {formatDateTime(participant.updatedAt)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">자동매매 {participant.enabled ? "활성" : "정지"}</p>
            </ParticipantInfoItem>
            <ParticipantInfoItem label="프로필과 정기 자금">
              <p className="font-black text-white">{formatAutoParticipantProfile(participant.profileType)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">행동 모델 {participant.behaviorModelVersion}</p>
              <p className="mt-1 break-all text-xs font-bold text-stock-subtle">행동 시드 {participant.behaviorSeed ?? "자동 생성"}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">{formatParticipantRecurringCash(participant)}</p>
            </ParticipantInfoItem>
            <ParticipantInfoItem label="전용 자금 예산">
              <p className="font-black text-white">월급 가용 {formatWon(participant.paydayAvailableBudget)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">배당 가용 {formatWon(participant.dividendAvailableBudget)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">예약 {formatWon(participant.fundingReservedAmount)}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">사용 {formatWon(participant.fundingSpentAmount)} · 활성 {formatCount(participant.activeFundingBudgetCount, "건")}</p>
            </ParticipantInfoItem>
            <ParticipantInfoItem label="계좌·상태 추적">
              <p className="font-black text-white">계좌 {participant.accountStatus ?? "없음"} · ID {participant.accountId ?? "—"}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">추적 종목 {formatCount(participant.trackedPositionCount, "개")}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">평균 보유 {formatNumber(participant.averageHoldingTradingDays)} 거래일</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">누적 물타기 {formatCount(participant.averageDownRoundCount, "회")}</p>
            </ParticipantInfoItem>
          </div>

          {overview ? (
            <AutoParticipantOverviewDetail overview={overview} />
          ) : (
            <div className="mt-3 rounded-md border border-dashed border-white/15 px-3 py-4 text-xs font-bold text-stock-subtle">
              연결된 계좌·자산 요약이 없습니다. 계좌 미개설 참여자이거나 조회 결과가 누락되었는지 확인해 주세요.
            </div>
          )}

          <AdminDormantWithdrawalAudit audit={withdrawalAudit} />

          <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">저장된 종목별 전략</p>
                <p className="mt-1 text-xs font-bold text-stock-subtle">
                  프로필 기본값이 아닌, DB에 명시적으로 저장된 종목별 설정입니다. 설정이 활성이어도 참여자가 휴면이면 주문은 생성되지 않습니다.
                </p>
              </div>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent">
                설정 활성 {enabledSymbolConfigCount} / 저장 {symbolConfigs.length}
              </span>
            </div>
            <DataTableViewport label={`${participant.displayName} 저장 전략`} tone="dark" className="mt-3">
              <table className="min-w-[620px] w-full border-collapse text-sm">
                <thead className="bg-white/10 text-left text-admin-muted">
                  <tr>
                    <th className="px-3 py-2">종목</th>
                    <th className="px-3 py-2">상태</th>
                    <th className="px-3 py-2 text-right">강도</th>
                    <th className="px-3 py-2 text-right">수정 시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {symbolConfigs.map((config) => (
                    <tr key={`${config.userKey}:${config.symbol}`}>
                      <td className="px-3 py-2 font-black text-white">{config.symbol}</td>
                      <td className={["px-3 py-2 font-black", config.enabled ? "text-admin-success" : "text-admin-muted"].join(" ")}>
                        {config.enabled ? "설정 활성" : "설정 정지"}
                      </td>
                      <td className="px-3 py-2 text-right font-black tabular-nums">{formatInteger(config.intensity)} / 10</td>
                      <td className="px-3 py-2 text-right text-admin-muted">{formatDateTime(config.updatedAt)}</td>
                    </tr>
                  ))}
                  {symbolConfigs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-stock-subtle">
                        저장된 개별 전략이 없습니다. 이 참여자는 프로필과 시장 기본값만 사용했습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </DataTableViewport>
          </div>
        </div>
      </details>
    </article>
  );
}

function DormantHeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-2 py-2 text-right">
      <p className="text-[10px] font-bold text-admin-quiet">{label}</p>
      <p className="mt-1 truncate text-xs font-black tabular-nums text-white" title={value}>{value}</p>
    </div>
  );
}

function buildDormantParticipantRows(
  participants: AutoParticipant[],
  overviews: AutoParticipantOverview[],
  symbolConfigs: AutoParticipantSymbolConfig[],
  withdrawalAudits: AutoParticipantWithdrawalAudit[],
): DormantParticipantRow[] {
  const overviewByUserKey = new Map(overviews.map((overview) => [overview.userKey, overview]));
  const withdrawalAuditByUserKey = new Map(
    withdrawalAudits.map((audit) => [audit.participantUserKey, audit]),
  );
  const symbolConfigsByUserKey = new Map<string, AutoParticipantSymbolConfig[]>();
  symbolConfigs.forEach((config) => {
    const participantConfigs = symbolConfigsByUserKey.get(config.userKey) ?? [];
    participantConfigs.push(config);
    symbolConfigsByUserKey.set(config.userKey, participantConfigs);
  });
  return participants
    .map((participant) => {
      const overview = overviewByUserKey.get(participant.userKey) ?? null;
      const withdrawalAudit = withdrawalAuditByUserKey.get(participant.userKey) ?? null;
      return {
        participant,
        overview,
        symbolConfigs: symbolConfigsByUserKey.get(participant.userKey) ?? [],
        withdrawalAudit,
        reviewReasons: resolveDormantReviewReasons(participant, overview, withdrawalAudit),
      };
    })
    .sort((left, right) => {
      const rightWithdrawnAt = Date.parse(right.participant.withdrawnAt ?? "");
      const leftWithdrawnAt = Date.parse(left.participant.withdrawnAt ?? "");
      if (Number.isFinite(rightWithdrawnAt) && Number.isFinite(leftWithdrawnAt) && rightWithdrawnAt !== leftWithdrawnAt) {
        return rightWithdrawnAt - leftWithdrawnAt;
      }
      return left.participant.userKey.localeCompare(right.participant.userKey);
    });
}

function resolveDormantReviewReasons(
  participant: AutoParticipant,
  overview: AutoParticipantOverview | null,
  withdrawalAudit: AutoParticipantWithdrawalAudit | null,
) {
  const reasons: string[] = [];
  if (!participant.withdrawnAt) {
    reasons.push("휴면 조회에 포함됐지만 탈퇴 시각이 없습니다.");
  }
  if (participant.enabled) {
    reasons.push("탈퇴 참여자의 자동매매 활성 플래그가 남아 있습니다.");
  }
  if (participant.accountId != null && participant.accountStatus !== "CLOSED") {
    reasons.push(`탈퇴 계좌 상태가 CLOSED가 아닙니다: ${participant.accountStatus ?? "상태 없음"}`);
  }
  if (participant.accountId != null && !participant.accountClosedOnWithdrawal) {
    reasons.push("자산 반환·계좌 종료 감사 원장이 없습니다.");
  }
  if (participant.activeFundingBudgetCount > 0) {
    reasons.push(`활성 전용 자금 예산 ${formatCount(participant.activeFundingBudgetCount, "건")}이 남아 있습니다.`);
  }
  if (participant.fundingReservedAmount > 0) {
    reasons.push(`전용 자금 예약 ${formatWon(participant.fundingReservedAmount)}이 남아 있습니다.`);
  }
  if (participant.accountId != null && overview === null) {
    reasons.push("연결 계좌는 있지만 자산 요약이 조회되지 않았습니다.");
  }
  if (overview?.openOrderCount) {
    reasons.push(`미체결 주문 ${formatCount(overview.openOrderCount, "건")}이 남아 있습니다.`);
  }
  if (overview?.reservedSellQuantity) {
    reasons.push(`매도 예약수량 ${formatNumber(overview.reservedSellQuantity)}주가 남아 있습니다.`);
  }
  const remainingCash = overview?.availableCash ?? participant.cashBalance ?? 0;
  if (remainingCash > 0) {
    reasons.push(`탈퇴 계좌 현금 ${formatWon(remainingCash)}이 남아 있습니다.`);
  }
  if ((overview?.totalHoldingQuantity ?? 0) > 0) {
    reasons.push(`탈퇴 계좌 보유주식 ${formatNumber(overview?.totalHoldingQuantity ?? 0)}주가 남아 있습니다.`);
  }
  if (withdrawalAudit?.pendingCorporateActionRightCount) {
    reasons.push(`미완료 기업행사 권리 ${formatCount(withdrawalAudit.pendingCorporateActionRightCount, "건")}이 남아 있습니다.`);
  }
  if (withdrawalAudit) {
    const transferredQuantity = withdrawalAudit.shareTransfers.reduce(
      (quantity, transfer) => quantity + transfer.quantity,
      0,
    );
    if (transferredQuantity !== withdrawalAudit.returnedShareQuantity) {
      reasons.push(
        `이전 상세 합계 ${formatNumber(transferredQuantity)}주와 정산 합계 ${formatNumber(withdrawalAudit.returnedShareQuantity)}주가 다릅니다.`,
      );
    }
    if (withdrawalAudit.shareTransfers.length !== withdrawalAudit.returnedSymbolCount) {
      reasons.push("이전 상세 종목 수와 정산 종목 수가 다릅니다.");
    }
    if (withdrawalAudit.shareTransfers.some((transfer) => transfer.receiverReservedQuantity > 0)) {
      reasons.push("비거래 보관계정에 예약 주식이 존재합니다.");
    }
  }
  return reasons;
}

function summarizeDormantRows(rows: DormantParticipantRow[]) {
  return rows.reduce(
    (summary, row) => {
      const availableCash = row.overview?.availableCash ?? row.participant.cashBalance ?? 0;
      const estimatedTotalAsset = row.overview?.estimatedTotalAsset ?? availableCash;
      const holdingMarketValue = row.overview?.holdingMarketValue ?? 0;
      return {
        participantCount: summary.participantCount + 1,
        assetAccountCount: summary.assetAccountCount + (estimatedTotalAsset > 0 ? 1 : 0),
        estimatedTotalAsset: summary.estimatedTotalAsset + estimatedTotalAsset,
        availableCash: summary.availableCash + availableCash,
        holdingMarketValue: summary.holdingMarketValue + holdingMarketValue,
        reviewCount: summary.reviewCount + (row.reviewReasons.length > 0 ? 1 : 0),
      };
    },
    {
      participantCount: 0,
      assetAccountCount: 0,
      estimatedTotalAsset: 0,
      availableCash: 0,
      holdingMarketValue: 0,
      reviewCount: 0,
    },
  );
}

function matchesDormantSearch(row: DormantParticipantRow, normalizedSearchTerm: string) {
  if (!normalizedSearchTerm) {
    return true;
  }
  return [
    row.participant.displayName,
    row.participant.userKey,
    row.participant.profileType,
    row.participant.accountId?.toString() ?? "",
    ...(row.overview?.holdings.map((holding) => holding.symbol) ?? []),
    ...row.symbolConfigs.map((config) => config.symbol),
    ...(row.withdrawalAudit?.shareTransfers.flatMap((transfer) => [
      transfer.symbol,
      transfer.receiverUserKey,
      transfer.receiverRole,
      transfer.transferReason,
    ]) ?? []),
  ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

function matchesDormantFilter(row: DormantParticipantRow, assetFilter: DormantAssetFilter) {
  if (assetFilter === "HAS_ASSETS") {
    return (row.overview?.estimatedTotalAsset ?? row.participant.cashBalance ?? 0) > 0;
  }
  if (assetFilter === "HAS_HOLDINGS") {
    return (row.overview?.totalHoldingQuantity ?? 0) > 0;
  }
  if (assetFilter === "NEEDS_REVIEW") {
    return row.reviewReasons.length > 0;
  }
  return true;
}
