import { memo, useMemo, useState } from "react";

import useModalDialog from "@/app/hooks/useModalDialog";
import {
  AdminEntitySelector,
  type AdminEntitySelectorItem,
} from "@/app/supply-demand/admin/AdminEntitySelector";
import { formatCount, formatDateTime, formatInteger, formatNumber, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric, ProfileOverviewInfoItem } from "@/app/supply-demand/admin/AdminMetricCards";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import { resolveParticipantProfileOverviewTotal } from "@/app/supply-demand/admin/AdminParticipantOverviewTotals";
import type { AutoParticipantPerformanceBasis, AutoParticipantPerformanceSummary } from "@/app/types/stock";

export function ParticipantProfileOverviewPanel({
  summaries,
  loading,
  error,
  onRefresh,
  allSummaries,
  loadingAll,
  allError,
  onLoadAll,
  livePerformanceSummary,
  closedPerformanceSummary,
}: {
  summaries: ParticipantProfileOverviewSummary[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
  allSummaries: ParticipantProfileOverviewSummary[];
  loadingAll: boolean;
  allError: boolean;
  onLoadAll: () => void;
  livePerformanceSummary: AutoParticipantPerformanceSummary | null;
  closedPerformanceSummary: AutoParticipantPerformanceSummary | null;
}) {
  const total = useMemo(() => resolveParticipantProfileOverviewTotal(summaries), [summaries]);
  const allTotal = useMemo(() => resolveParticipantProfileOverviewTotal(allSummaries), [allSummaries]);
  const [performanceBasis, setPerformanceBasis] = useState<AutoParticipantPerformanceBasis>("LIVE_ESTIMATE");
  const performanceSummary = performanceBasis === "LATEST_CLOSED"
    ? closedPerformanceSummary
    : livePerformanceSummary;
  const performance = performanceSummary?.total ?? null;
  const [showAllModal, setShowAllModal] = useState(false);
  const [selectedProfileType, setSelectedProfileType] = useState("");
  const [selectedAllProfileType, setSelectedAllProfileType] = useState("");
  const allHistoryDialogRef = useModalDialog<HTMLDivElement>(showAllModal, () => setShowAllModal(false));
  const selectedSummary = summaries.find((summary) => summary.profileType === selectedProfileType)
    ?? summaries[0]
    ?? null;
  const selectedAllSummary = allSummaries.find((summary) => summary.profileType === selectedAllProfileType)
    ?? allSummaries[0]
    ?? null;
  const summarySelectorItems = useMemo(() => buildProfileSelectorItems(summaries), [summaries]);
  const allSummarySelectorItems = useMemo(() => buildProfileSelectorItems(allSummaries), [allSummaries]);

  const openAllModal = () => {
    setShowAllModal(true);
    if (allSummaries.length === 0 && !loadingAll) {
      onLoadAll();
    }
  };

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">프로필별 자동 참여자 현황</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            기본 조회는 요청 시점의 시뮬레이션 시간부터 최근 1일만 반영합니다. 전체 이력은 별도 조회로 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-admin-accent-soft">갱신 중</span> : null}
          {error ? <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-admin-danger">현황 조회 실패</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-9 rounded-md bg-stock-surface-strong px-3 py-1.5 text-xs font-black text-stock-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "조회 중" : "새로고침"}
          </button>
          <button
            type="button"
            onClick={openAllModal}
            className="min-h-9 rounded-md border border-white/10 px-3 py-1.5 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent/60"
          >
            전체 이력
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric label="전체 자동 참여자" value={formatCount(total.totalCount, "명")} tone="blue" />
        <ProfileMiniMetric label="가동 참여자" value={formatCount(total.enabledCount, "명")} tone="green" />
        <ProfileMiniMetric label="가용 현금" value={formatWon(total.availableCash)} tone="blue" />
        <ProfileMiniMetric label="보유 평가액" value={formatWon(total.holdingMarketValue)} tone="muted" />
        <ProfileMiniMetric label="2시간 거래대금" value={formatWon(total.todayGrossAmount)} tone="muted" />
        <ProfileMiniMetric label="대기 주문" value={formatCount(total.openOrderCount, "건")} tone="muted" />
        <ProfileMiniMetric label="대기 매수/매도" value={`${formatInteger(total.openBuyQuantity)} / ${formatInteger(total.openSellQuantity)}주`} tone="muted" />
        <ProfileMiniMetric label="전략" value={`${formatInteger(total.enabledStrategyCount)} / ${formatInteger(total.strategyCount)}`} tone="blue" />
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-white">자동 참여자 성과</p>
            <p className="mt-1 text-[11px] font-bold text-stock-subtle">
              합산 성과와 계좌 분포를 분리합니다. 계좌 수익률의 단순 평균은 대표값으로 사용하지 않습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["LIVE_ESTIMATE", "LATEST_CLOSED"] as const).map((basis) => (
              <button
                key={basis}
                type="button"
                onClick={() => setPerformanceBasis(basis)}
                className={[
                  "min-h-8 rounded-md border px-3 py-1 text-[11px] font-black transition",
                  performanceBasis === basis
                    ? "border-admin-accent/70 bg-admin-accent/15 text-admin-accent-soft"
                    : "border-white/10 text-stock-subtle hover:border-white/30",
                ].join(" ")}
              >
                {basis === "LIVE_ESTIMATE" ? "장중 추정" : "최근 장마감 확정"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11px] font-bold text-stock-subtle">
          {performanceSummary
            ? `${performanceSummary.basis === "LIVE_ESTIMATE" ? "장중 추정" : "장마감 확정"} · ${performanceSummary.businessDate ?? "기준일 없음"}${performanceSummary.calculatedAt ? ` · ${formatDateTime(performanceSummary.calculatedAt)}` : ""}`
            : "성과 기준 데이터를 조회하지 못했습니다."}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <ProfileMiniMetric
            label="합산 손익"
            value={performance ? formatWon(performance.totalProfit) : "—"}
            tone={profitTone(performance?.totalProfit)}
          />
          <ProfileMiniMetric
            label="합산 순입금 대비 수익률"
            value={formatOptionalPercent(performance?.aggregateReturnRate)}
            tone={profitTone(performance?.aggregateReturnRate)}
          />
          <ProfileMiniMetric
            label="계좌 중앙 수익률"
            value={formatOptionalPercent(performance?.medianAccountReturnRate)}
            tone={profitTone(performance?.medianAccountReturnRate)}
          />
          <ProfileMiniMetric
            label="수익 계좌"
            value={performance && performance.profitableAccountRate !== null
              ? `${formatInteger(performance.profitableAccountCount)} / ${formatInteger(performance.eligibleAccountCount)}명 · ${formatNumber(performance.profitableAccountRate)}%`
              : "—"}
            tone="green"
          />
          <ProfileMiniMetric
            label="산출 제외"
            value={performance ? formatCount(performance.undefinedAccountCount, "명") : "—"}
            tone={performance?.undefinedAccountCount ? "red" : "muted"}
          />
        </div>
        <p className="mt-2 text-[11px] font-bold text-stock-subtle">
          합산 순입금 대비 수익률 = 합산 손익 ÷ 합산 외부 순입금. 중앙값과 수익 계좌 비율은 순입금이 양수인 계좌만 사용합니다.
        </p>
      </div>

      {selectedSummary ? (
        <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <AdminEntitySelector
            ariaLabel="자동 참여자 프로필 선택"
            heading="프로필 선택"
            hint={`${formatCount(summaries.length, "개")} 프로필`}
            mobileLabel="확인할 자동 참여자 프로필"
            items={summarySelectorItems}
            selectedKey={selectedSummary.profileType}
            onSelect={setSelectedProfileType}
          />
          <div className="min-w-0">
            <ParticipantProfileOverviewCard summary={selectedSummary} />
          </div>
        </div>
      ) : null}
      {showAllModal ? (
        <div className="modal-scroll fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8">
          <div ref={allHistoryDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="participant-history-title" className="w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="participant-history-title" className="text-base font-black text-white">프로필별 전체 이력</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
                  요청 시점의 시뮬레이션 시간 이전 전체 주문/체결 이력을 기준으로 최근 활동을 다시 계산합니다. 장중에는 조회가 오래 걸릴 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                {loadingAll ? <span className="rounded-md bg-white/10 px-2 py-1 text-admin-accent-soft">전체 조회 중</span> : null}
                {allError ? <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-admin-danger">전체 조회 실패</span> : null}
                <button
                  type="button"
                  onClick={onLoadAll}
                  disabled={loadingAll}
                  className="min-h-9 rounded-md bg-stock-surface-strong px-3 py-1.5 text-xs font-black text-stock-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다시 조회
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  className="min-h-9 rounded-md border border-white/10 px-3 py-1.5 text-xs font-black text-admin-accent-soft transition hover:border-white/30"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <ProfileMiniMetric label="전체 자동 참여자" value={formatCount(allTotal.totalCount, "명")} tone="blue" />
              <ProfileMiniMetric label="가동 참여자" value={formatCount(allTotal.enabledCount, "명")} tone="green" />
              <ProfileMiniMetric label="가용 현금" value={formatWon(allTotal.availableCash)} tone="blue" />
              <ProfileMiniMetric label="보유 평가액" value={formatWon(allTotal.holdingMarketValue)} tone="muted" />
              <ProfileMiniMetric label="합산 손익" value={performance ? formatWon(performance.totalProfit) : "—"} tone={profitTone(performance?.totalProfit)} />
              <ProfileMiniMetric label="합산 순입금 대비 수익률" value={formatOptionalPercent(performance?.aggregateReturnRate)} tone={profitTone(performance?.aggregateReturnRate)} />
            </div>
            {selectedAllSummary ? (
              <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                <AdminEntitySelector
                  ariaLabel="전체 이력 자동 참여자 프로필 선택"
                  heading="프로필 선택"
                  hint={`${formatCount(allSummaries.length, "개")} 프로필`}
                  mobileLabel="전체 이력에서 확인할 프로필"
                  items={allSummarySelectorItems}
                  selectedKey={selectedAllSummary.profileType}
                  onSelect={setSelectedAllProfileType}
                />
                <div className="min-w-0">
                  <ParticipantProfileOverviewCard summary={selectedAllSummary} />
                </div>
              </div>
            ) : allSummaries.length === 0 && !loadingAll ? (
              <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-4 text-sm font-bold text-stock-subtle">
                전체 이력 조회 결과가 없습니다.
              </div>
            ) : null}
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
          <p className="mt-1 max-w-3xl break-words text-xs font-bold leading-5 text-stock-subtle">{summary.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-md bg-white/10 px-2 py-1 text-admin-accent">{formatCount(summary.totalCount, "명")}</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-admin-success">가동 {formatInteger(summary.enabledCount)}</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-stock-subtle">정지 {formatInteger(summary.disabledCount)}</span>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <ProfileOverviewInfoItem label="현금">
          <p className="font-black tabular-nums text-white">{formatWon(summary.availableCash)}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">예약 매수금 {formatWon(summary.reservedBuyCash)}</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="자산">
          <p className="font-black tabular-nums text-white">{formatWon(summary.estimatedTotalAsset)}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">보유 평가액 {formatWon(summary.holdingMarketValue)}</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="순입금">
          <p className="font-black tabular-nums text-white">{formatWon(summary.netCashFlow)}</p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">외부 현금 흐름 기준</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="손익/프로필 합산 수익률">
          <p className={["font-black tabular-nums", summary.totalProfit > 0 ? "text-admin-success" : summary.totalProfit < 0 ? "text-admin-danger" : "text-white"].join(" ")}>{formatWon(summary.totalProfit)}</p>
          <p className={["mt-1 text-xs font-black tabular-nums", profitTextClass(summary.returnRate)].join(" ")}>{formatOptionalPercent(summary.returnRate)}</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="보유">
          <p className="font-black tabular-nums text-white">{formatCount(summary.holdingCount, "종목")}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">{formatNumber(summary.totalHoldingQuantity)}주</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">예약 {formatNumber(summary.reservedSellQuantity)}주</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="주문/체결">
          <p className="font-black tabular-nums text-white">대기 {formatCount(summary.openOrderCount, "건")}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">매수/매도 {formatInteger(summary.openBuyOrderCount)} / {formatCount(summary.openSellOrderCount, "건")}</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">대기 수량 {formatNumber(summary.openBuyQuantity)} / {formatNumber(summary.openSellQuantity)}주</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">2시간 {formatInteger(summary.todayExecutionCount)}체결</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">2시간 매수/매도 {formatNumber(summary.todayBuyQuantity)} / {formatNumber(summary.todaySellQuantity)}주</p>
          <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">2시간 거래대금 {formatWon(summary.todayGrossAmount)}</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="전략">
          <p className="font-black tabular-nums text-white">{formatInteger(summary.enabledStrategyCount)} / {formatInteger(summary.strategyCount)}</p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">가동 / 전체</p>
        </ProfileOverviewInfoItem>
        <ProfileOverviewInfoItem label="최근 활동">
          <p className="text-xs font-bold leading-5 text-stock-subtle">주문 {formatDateTime(summary.lastOrderAt)}</p>
          <p className="text-xs font-bold leading-5 text-stock-subtle">체결 {formatDateTime(summary.lastExecutionAt)}</p>
        </ProfileOverviewInfoItem>
      </div>

      <div className="mt-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
        <p className="text-[11px] font-black text-stock-subtle">주요 보유종목</p>
        <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSymbolHoldings.map((holding) => (
            <div key={holding.symbol} className="min-w-0 rounded-md bg-black/20 px-3 py-2">
              <p className="break-all text-xs font-black text-white">{holding.symbol}</p>
              <p className="mt-1 text-xs font-bold tabular-nums text-stock-subtle">{formatNumber(holding.quantity)}주</p>
              <p className="mt-1 text-xs font-bold tabular-nums text-admin-muted">{formatWon(holding.marketValue)}</p>
            </div>
          ))}
          {summary.symbolHoldings.length === 0 ? (
            <p className="text-xs font-bold text-stock-subtle">보유 없음</p>
          ) : null}
        </div>
      </div>
    </article>
  );
});

function buildProfileSelectorItems(
  summaries: ParticipantProfileOverviewSummary[],
): AdminEntitySelectorItem[] {
  return summaries.map((summary) => ({
    key: summary.profileType,
    title: summary.label,
    subtitle: summary.profileType,
    statusLabel: summary.enabledCount > 0
      ? `가동 ${formatInteger(summary.enabledCount)}명`
      : "가동 없음",
    statusTone: summary.enabledCount > 0 ? "success" : "muted",
    metricLabel: "총자산 · 손익",
    metricValue: `${formatWon(summary.estimatedTotalAsset)} · ${formatWon(summary.totalProfit)}`,
  }));
}

function formatOptionalPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : formatSignedPercent(value);
}

function profitTone(value: number | null | undefined): "green" | "red" | "muted" {
  if (value === null || value === undefined || value === 0) {
    return "muted";
  }
  return value > 0 ? "green" : "red";
}

function profitTextClass(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return "text-stock-subtle";
  }
  return value > 0 ? "text-admin-success" : "text-admin-danger";
}
