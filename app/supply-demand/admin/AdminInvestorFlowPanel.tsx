import { useState } from "react";

import {
  ADMIN_PARTICIPANT_CATEGORY_META,
  ADMIN_INVESTOR_FLOW_SOURCE_META,
  clampParticipationRate,
  formatParticipationRate,
  presentNetBuyAmount,
  presentNetQuantity,
  resolveParticipantCategories,
  resolveInvestorFlowSourceStatus,
  summarizeInvestorFlowAmounts,
  type AdminParticipantAmountFlow,
} from "@/app/supply-demand/admin/adminInvestorFlowPresentation";
import { formatCompactWon, formatDateTime, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { AdminInvestorFlowHistoryModal } from "@/app/supply-demand/admin/AdminInvestorFlowHistoryModal";
import type { AdminInvestorFlowHistory, AdminInvestorFlowSummary } from "@/app/types/stock";

export function AdminInvestorFlowPanel({
  error,
  history,
  historyError,
  historyLoading,
  investorFlow,
  refreshing,
  onLoadHistory,
}: {
  error: boolean;
  history: AdminInvestorFlowHistory | null;
  historyError: boolean;
  historyLoading: boolean;
  investorFlow: AdminInvestorFlowSummary | null | undefined;
  refreshing: boolean;
  onLoadHistory: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const openHistory = () => {
    setShowHistory(true);
    onLoadHistory();
  };

  if (!investorFlow) {
    return (
      <>
        <section className="mt-5 rounded-lg border border-white/10 bg-black/20 px-4 py-8 text-center" aria-labelledby="admin-investor-flow-title">
          <h3 id="admin-investor-flow-title" className="text-sm font-black text-white">참여자별 체결 흐름</h3>
          <p className="mt-2 text-xs font-bold text-stock-subtle">
            {refreshing ? "시뮬레이션 당일 참여자 체결 흐름을 조회하고 있습니다." : error ? "참여자 체결 흐름을 조회하지 못했습니다. 흐름 새로고침을 다시 눌러 주세요." : "시뮬레이션 당일 참여자 체결 흐름이 없습니다."}
          </p>
          <button type="button" onClick={openHistory} className="mt-4 min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white">
            최근 7일 변화
          </button>
        </section>
        <AdminInvestorFlowHistoryModal error={historyError} history={history} loading={historyLoading} open={showHistory} onClose={() => setShowHistory(false)} onRefresh={onLoadHistory} />
      </>
    );
  }

  const categories = resolveParticipantCategories(investorFlow);
  const amountSummary = summarizeInvestorFlowAmounts(categories);
  const sourceStatus = resolveInvestorFlowSourceStatus(investorFlow, investorFlow.simulationTradeDate);
  const sourceMeta = ADMIN_INVESTOR_FLOW_SOURCE_META[sourceStatus];
  const quantityBalanced = investorFlow.totalBuyQuantity === investorFlow.totalSellQuantity;
  const balanced = quantityBalanced && amountSummary.balanced;
  const quantityImbalance = investorFlow.totalBuyQuantity - investorFlow.totalSellQuantity;
  const amountImbalance = amountSummary.totalBuyAmount - amountSummary.totalSellAmount;
  const compositionLabel = amountSummary.categories
    .map((category) => `${ADMIN_PARTICIPANT_CATEGORY_META[category.category].label} ${formatParticipationRate(category.amountShareRate)}`)
    .join(", ");

  return (
    <>
      <section className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3 sm:p-4" aria-labelledby="admin-investor-flow-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="admin-investor-flow-title" className="text-sm font-black text-white">참여자별 체결 흐름</h3>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-black ${sourceMeta.badgeClassName}`}>
                {sourceMeta.label}
              </span>
              <span className="text-[11px] font-bold text-admin-muted">10초 자동 갱신</span>
              {refreshing ? <span className="text-[11px] font-bold text-admin-muted">확인 중</span> : null}
            </div>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
              시뮬레이션 오늘의 활동 계정 역할별 매수와 매도입니다. 체결금액을 대표값으로 비교하고 수량은 보조 지표로 제공합니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
            <div className="text-right text-[11px] font-bold leading-5 text-admin-muted">
              <p>기준일 {investorFlow.simulationTradeDate}</p>
              <p>{investorFlow.sourceUpdatedAt ? `요약 기준 ${formatDateTime(investorFlow.sourceUpdatedAt)}` : "아직 반영된 장중 요약 없음"}</p>
              {error ? <p className="text-admin-danger">자동 갱신 실패</p> : null}
            </div>
            <button type="button" onClick={openHistory} className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white">
              최근 7일 변화
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {amountSummary.categories.map((category) => (
            <ParticipantCategoryCard key={category.category} category={category} />
          ))}
        </div>

        <div className="mt-4 rounded-md border border-white/10 bg-admin-canvas/45 px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-stock-subtle">
            <span>전체 체결금액 구성</span>
            <span className="tabular-nums">
              {balanced ? `실제 체결대금 ${formatCompactWon(amountSummary.totalBuyAmount)} · ` : "매수·매도 요약 반영 중 · "}
              거래수량 {formatNumber(investorFlow.totalBuyQuantity)}주
            </span>
          </div>
          {amountSummary.totalParticipationAmount > 0 ? (
            <>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`참여자별 체결금액 비중: ${compositionLabel}`}>
                {amountSummary.categories.map((category) => (
                  <span
                    key={category.category}
                    className={ADMIN_PARTICIPANT_CATEGORY_META[category.category].colorClassName}
                    style={{ width: `${clampParticipationRate(category.amountShareRate)}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {amountSummary.categories.map((category) => {
                    const meta = ADMIN_PARTICIPANT_CATEGORY_META[category.category];
                    return (
                      <span key={category.category} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stock-subtle">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.colorClassName}`} />
                        {meta.label} <strong className="font-black tabular-nums text-white">{formatParticipationRate(category.amountShareRate)}</strong>
                      </span>
                    );
                  })}
                </div>
                {balanced ? (
                  <span className="text-[11px] font-black text-admin-success">매수·매도 금액·수량 대사 일치</span>
                ) : (
                  <span className="text-[11px] font-black tabular-nums text-admin-warning">
                    요약 반영 중 · {formatCompactWon(Math.abs(amountImbalance))} / {formatNumber(Math.abs(quantityImbalance))}주 차이
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs font-bold text-admin-muted">집계된 체결금액이 없습니다.</p>
          )}
        </div>

        <p className="mt-3 text-[11px] font-bold leading-5 text-admin-muted">
          화면은 10초마다 갱신하며, 계좌별 당일 요약은 기본 30초 주기로 반영되어 장중에는 최대 약 40초 늦을 수 있습니다. 참여자 구분은 계좌의 시스템 역할을 기준으로 집계합니다.
        </p>
      </section>

      <AdminInvestorFlowHistoryModal
        error={historyError}
        history={history}
        loading={historyLoading}
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onRefresh={onLoadHistory}
      />
    </>
  );
}

function ParticipantCategoryCard({ category }: { category: AdminParticipantAmountFlow }) {
  const meta = ADMIN_PARTICIPANT_CATEGORY_META[category.category];
  const netBuyAmount = presentNetBuyAmount(category.netBuyAmount);
  const netQuantity = presentNetQuantity(category.netQuantity);

  return (
    <article className={`min-w-0 rounded-md border p-3 ${meta.surfaceClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-stock-subtle">{meta.label}</p>
          <p className="mt-1 text-[11px] font-bold text-admin-muted">{netBuyAmount.label}</p>
          <p className={`mt-0.5 truncate text-xl font-black tabular-nums ${netBuyAmount.valueClassName}`}>{netBuyAmount.value}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold tabular-nums text-stock-subtle">{netBuyAmount.exactValue}</p>
        </div>
        <span className="shrink-0 rounded-md bg-black/25 px-2 py-1 text-xs font-black tabular-nums text-white">
          금액 참여 {formatParticipationRate(category.amountShareRate)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-xs">
        <FlowMetric label={`매수금액 · 전체의 ${formatParticipationRate(category.buyAmountShareRate)}`} value={formatCompactWon(category.buyAmount)} detail={`${formatWon(category.buyAmount)} · ${formatNumber(category.buyQuantity)}주`} />
        <FlowMetric label={`매도금액 · 전체의 ${formatParticipationRate(category.sellAmountShareRate)}`} value={formatCompactWon(category.sellAmount)} detail={`${formatWon(category.sellAmount)} · ${formatNumber(category.sellQuantity)}주`} align="right" />
        <FlowMetric label="양방향 참여금액" value={formatCompactWon(category.participationAmount)} detail={formatWon(category.participationAmount)} />
        <FlowMetric label={netQuantity.label} value={netQuantity.value} valueClassName={netQuantity.valueClassName} align="right" />
      </dl>
    </article>
  );
}

function FlowMetric({
  align = "left",
  detail,
  label,
  value,
  valueClassName = "text-white",
}: {
  align?: "left" | "right";
  detail?: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <dt className="font-bold text-admin-muted">{label}</dt>
      <dd className={`mt-1 font-black tabular-nums ${valueClassName}`}>{value}</dd>
      {detail ? <dd className="mt-0.5 break-words text-[11px] font-bold leading-4 tabular-nums text-stock-subtle">{detail}</dd> : null}
    </div>
  );
}
