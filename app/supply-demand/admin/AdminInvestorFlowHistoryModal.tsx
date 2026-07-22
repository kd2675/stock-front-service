import DataTableViewport from "@/app/components/DataTableViewport";
import useModalDialog from "@/app/hooks/useModalDialog";
import {
  ADMIN_INVESTOR_FLOW_SOURCE_META,
  ADMIN_PARTICIPANT_CATEGORIES,
  ADMIN_PARTICIPANT_CATEGORY_META,
  emptyParticipantCategory,
  formatParticipationRate,
  isInvestorFlowIncludedInAggregate,
  presentNetBuyAmount,
  presentNetQuantity,
  resolveParticipantCategories,
  resolveInvestorFlowSourceStatus,
  summarizeInvestorFlowAmounts,
  type AdminParticipantAmountFlow,
} from "@/app/supply-demand/admin/adminInvestorFlowPresentation";
import { formatCompactWon, formatDateTime, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminInvestorFlowHistory, AdminInvestorFlowSummary } from "@/app/types/stock";

export function AdminInvestorFlowHistoryModal({
  error,
  history,
  loading,
  open,
  onClose,
  onRefresh,
}: {
  error: boolean;
  history: AdminInvestorFlowHistory | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const dialogRef = useModalDialog<HTMLDivElement>(open, onClose);

  if (!open) {
    return null;
  }

  const dailyFlows = history?.dailyFlows ?? [];
  const periodFlow = aggregateInvestorFlows(dailyFlows, history?.rangeEnd ?? "");
  const rangeLabel = history ? `${history.rangeStart} - ${history.rangeEnd}` : "최근 7일";

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="investor-flow-history-title" className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="investor-flow-history-title" className="text-base font-black text-white">참여자별 체결 흐름 · 최근 7일</h3>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
              시뮬레이션 거래일별 유저·자동 참여자·상장주관사의 순매수 금액과 금액 참여율을 우선 비교합니다. 수량은 보조 지표이며 세 역할의 순매수 금액 합계는 정상 반영 시 0원입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-xs font-black text-admin-accent">{rangeLabel}</span>
            {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">조회 중</span> : null}
            {error ? <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-xs font-black text-admin-danger">조회 실패</span> : null}
            <button type="button" onClick={onRefresh} disabled={loading} className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
              다시 조회
            </button>
            <button type="button" onClick={onClose} className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-admin-canvas">
              닫기
            </button>
          </div>
        </div>

        {history ? (
          <>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {periodFlow.categories.map((category) => (
                <PeriodCategoryCard key={category.category} category={category} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-stock-subtle">
              <span>기간 합계 · 집계 사용 {periodFlow.includedDayCount}/{dailyFlows.length}일</span>
              <span className="tabular-nums text-white">
                {periodFlow.balanced ? `실제 체결대금 ${formatCompactWon(periodFlow.totalBuyAmount)}` : "매수·매도 요약 반영 중"} · 거래수량 {formatNumber(periodFlow.totalBuyQuantity)}주
              </span>
            </div>

            {periodFlow.excludedDayCount > 0 ? (
              <div className="mt-3 rounded-md border border-admin-warning/25 bg-admin-warning/[0.06] px-3 py-2 text-xs font-bold leading-5 text-admin-warning">
                대기·실패·누락 {periodFlow.excludedDayCount}일은 기간 합계에서 제외했습니다. 정상 무거래일은 0건으로 포함합니다.
              </div>
            ) : null}

            <InvestorFlowHistoryTable dailyFlows={dailyFlows} currentSimulationDate={history.rangeEnd} />
          </>
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-10 text-center text-sm font-bold text-stock-subtle">
            {loading ? "최근 7일 참여자 체결 흐름을 조회하고 있습니다." : error ? "최근 7일 참여자 체결 흐름을 조회하지 못했습니다. 다시 조회해 주세요." : "최근 7일 참여자 체결 흐름을 불러와 주세요."}
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodCategoryCard({ category }: { category: AdminParticipantAmountFlow }) {
  const meta = ADMIN_PARTICIPANT_CATEGORY_META[category.category];
  const netBuyAmount = presentNetBuyAmount(category.netBuyAmount);
  const netQuantity = presentNetQuantity(category.netQuantity);

  return (
    <article className={`min-w-0 rounded-md border p-3 ${meta.surfaceClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-stock-subtle">{meta.label} · 7일 합계</p>
          <p className="mt-1 text-[11px] font-bold text-admin-muted">{netBuyAmount.label}</p>
          <p className={`mt-0.5 truncate text-lg font-black tabular-nums ${netBuyAmount.valueClassName}`}>{netBuyAmount.value}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold tabular-nums text-stock-subtle">{netBuyAmount.exactValue}</p>
        </div>
        <span className="shrink-0 rounded-md bg-black/25 px-2 py-1 text-xs font-black tabular-nums text-white">금액 참여 {formatParticipationRate(category.amountShareRate)}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-xs">
        <HistoryMetric label={`매수금액 · ${formatParticipationRate(category.buyAmountShareRate)}`} value={formatCompactWon(category.buyAmount)} detail={`${formatWon(category.buyAmount)} · ${formatNumber(category.buyQuantity)}주`} />
        <HistoryMetric label={`매도금액 · ${formatParticipationRate(category.sellAmountShareRate)}`} value={formatCompactWon(category.sellAmount)} detail={`${formatWon(category.sellAmount)} · ${formatNumber(category.sellQuantity)}주`} align="right" />
        <HistoryMetric label="양방향 참여금액" value={formatCompactWon(category.participationAmount)} detail={formatWon(category.participationAmount)} />
        <HistoryMetric label={netQuantity.label} value={netQuantity.value} valueClassName={netQuantity.valueClassName} align="right" />
      </dl>
    </article>
  );
}

function InvestorFlowHistoryTable({
  currentSimulationDate,
  dailyFlows,
}: {
  currentSimulationDate: string;
  dailyFlows: AdminInvestorFlowSummary[];
}) {
  return (
    <>
      <DataTableViewport label="최근 7일 참여자별 체결 흐름" tone="dark" className="mt-4 hidden md:block">
        <table className="min-w-[1100px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">거래일</th>
              <th className="px-3 py-2 text-right">실제 체결대금</th>
              {ADMIN_PARTICIPANT_CATEGORIES.map((category) => (
                <th key={category} className="px-3 py-2 text-right">{ADMIN_PARTICIPANT_CATEGORY_META[category].label}</th>
              ))}
              <th className="px-3 py-2 text-right">금액·수량 대사</th>
              <th className="px-3 py-2 text-right">요약 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {dailyFlows.map((flow) => {
              const sourceStatus = resolveInvestorFlowSourceStatus(flow, currentSimulationDate);
              const available = isInvestorFlowIncludedInAggregate(sourceStatus);
              const amountSummary = summarizeInvestorFlowAmounts(resolveParticipantCategories(flow));
              const balanced = flow.totalBuyQuantity === flow.totalSellQuantity && amountSummary.balanced;
              return (
                <tr key={flow.simulationTradeDate} className={available ? undefined : "bg-admin-danger/[0.035]"}>
                  <td className="px-3 py-3 align-top">
                    <p className="font-black text-white">{flow.simulationTradeDate}</p>
                    <p className="mt-1 text-[11px] font-bold text-stock-subtle">{flow.simulationTradeDate === currentSimulationDate ? "시뮬레이션 오늘" : ADMIN_INVESTOR_FLOW_SOURCE_META[sourceStatus].label}</p>
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <p className="font-black tabular-nums text-white">{available ? balanced ? formatCompactWon(amountSummary.totalBuyAmount) : "반영 중" : "—"}</p>
                    <p className="mt-1 text-[11px] font-bold tabular-nums text-stock-subtle">{available ? `${formatWon(amountSummary.totalBuyAmount)} · ${formatNumber(flow.totalBuyQuantity)}주` : "합계 제외"}</p>
                  </td>
                  {amountSummary.categories.map((category) => (
                    <DailyCategoryCell key={category.category} category={category} available={available} />
                  ))}
                  <td className="px-3 py-3 text-right align-top">
                    <BalanceStatus flow={flow} available={available} />
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <FlowSourceStatus flow={flow} currentSimulationDate={currentSimulationDate} align="right" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTableViewport>

      <div className="mt-4 space-y-3 md:hidden">
        {dailyFlows.map((flow) => (
          <DailyFlowCard key={flow.simulationTradeDate} flow={flow} currentSimulationDate={currentSimulationDate} />
        ))}
      </div>
    </>
  );
}

function DailyCategoryCell({
  available,
  category,
}: {
  available: boolean;
  category: AdminParticipantAmountFlow;
}) {
  if (!available) {
    return <td className="px-3 py-3 text-right align-top text-xs font-bold text-admin-muted">—</td>;
  }
  const netBuyAmount = presentNetBuyAmount(category.netBuyAmount);
  return (
    <td className="px-3 py-3 text-right align-top">
      <p className={`font-black tabular-nums ${netBuyAmount.valueClassName}`}>{netBuyAmount.label} {netBuyAmount.value}</p>
      <p className="mt-1 text-[11px] font-bold tabular-nums text-stock-subtle">매수 {formatCompactWon(category.buyAmount)} · 매도 {formatCompactWon(category.sellAmount)}</p>
      <p className="mt-1 text-[11px] font-bold tabular-nums text-admin-muted">수량 {formatNumber(category.buyQuantity)}주 / {formatNumber(category.sellQuantity)}주</p>
      <p className="mt-1 text-[11px] font-bold tabular-nums text-admin-muted">금액 참여 {formatParticipationRate(category.amountShareRate)}</p>
    </td>
  );
}

function DailyFlowCard({ flow, currentSimulationDate }: { flow: AdminInvestorFlowSummary; currentSimulationDate: string }) {
  const sourceStatus = resolveInvestorFlowSourceStatus(flow, currentSimulationDate);
  const available = isInvestorFlowIncludedInAggregate(sourceStatus);
  const amountSummary = summarizeInvestorFlowAmounts(resolveParticipantCategories(flow));
  const balanced = flow.totalBuyQuantity === flow.totalSellQuantity && amountSummary.balanced;
  return (
    <article className={`rounded-md border p-3 ${available ? "border-white/10 bg-black/20" : "border-admin-danger/20 bg-admin-danger/[0.035]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{flow.simulationTradeDate}</p>
          <FlowSourceStatus flow={flow} currentSimulationDate={currentSimulationDate} />
        </div>
        <div className="text-right">
          <p className="text-sm font-black tabular-nums text-white">{available ? balanced ? `체결대금 ${formatCompactWon(amountSummary.totalBuyAmount)}` : "요약 반영 중" : "합계 제외"}</p>
          {available ? <p className="mt-0.5 text-[11px] font-bold tabular-nums text-stock-subtle">{formatNumber(flow.totalBuyQuantity)}주</p> : null}
          <BalanceStatus flow={flow} available={available} />
        </div>
      </div>
      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        {available ? amountSummary.categories.map((category) => {
          const meta = ADMIN_PARTICIPANT_CATEGORY_META[category.category];
          const netBuyAmount = presentNetBuyAmount(category.netBuyAmount);
          return (
            <div key={category.category} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stock-subtle">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.colorClassName}`} />
                {meta.label}
              </span>
              <div className="text-right">
                <p className={`text-xs font-black tabular-nums ${netBuyAmount.valueClassName}`}>{netBuyAmount.label} {netBuyAmount.value}</p>
                <p className="mt-0.5 text-[11px] font-bold tabular-nums text-stock-subtle">매수 {formatCompactWon(category.buyAmount)} · 매도 {formatCompactWon(category.sellAmount)}</p>
                <p className="mt-0.5 text-[11px] font-bold tabular-nums text-admin-muted">수량 {formatNumber(category.buyQuantity)}주 / {formatNumber(category.sellQuantity)}주 · 금액 참여 {formatParticipationRate(category.amountShareRate)}</p>
              </div>
            </div>
          );
        }) : (
          <p className="text-xs font-bold leading-5 text-admin-muted">{ADMIN_INVESTOR_FLOW_SOURCE_META[sourceStatus].description}</p>
        )}
      </div>
    </article>
  );
}

function FlowSourceStatus({
  align = "left",
  currentSimulationDate,
  flow,
}: {
  align?: "left" | "right";
  currentSimulationDate: string;
  flow: AdminInvestorFlowSummary;
}) {
  const sourceStatus = resolveInvestorFlowSourceStatus(flow, currentSimulationDate);
  const meta = ADMIN_INVESTOR_FLOW_SOURCE_META[sourceStatus];
  const sourceDetail = flow.sourceUpdatedAt
    ? formatDateTime(flow.sourceUpdatedAt)
    : flow.closeRunId
      ? `close run #${flow.closeRunId}`
      : null;
  return (
    <div className={`mt-1 flex flex-wrap items-center gap-1.5 text-[11px] ${align === "right" ? "justify-end" : ""}`}>
      <span className={`rounded-md px-2 py-1 font-black ${meta.badgeClassName}`}>{meta.label}</span>
      {sourceDetail ? <span className="font-bold text-stock-subtle">{sourceDetail}</span> : null}
    </div>
  );
}

function BalanceStatus({ flow, available = true }: { flow: AdminInvestorFlowSummary; available?: boolean }) {
  if (!available) {
    return <p className="text-[11px] font-black text-admin-muted">대사 전</p>;
  }
  const amountSummary = summarizeInvestorFlowAmounts(resolveParticipantCategories(flow));
  const quantityImbalance = flow.totalBuyQuantity - flow.totalSellQuantity;
  const amountImbalance = amountSummary.totalBuyAmount - amountSummary.totalSellAmount;
  if (quantityImbalance === 0 && amountImbalance === 0) {
    return <p className="text-[11px] font-black text-admin-success">금액·수량 일치</p>;
  }
  return <p className="text-[11px] font-black tabular-nums text-admin-warning">{formatCompactWon(Math.abs(amountImbalance))} / {formatNumber(Math.abs(quantityImbalance))}주 차이</p>;
}

function HistoryMetric({
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

function aggregateInvestorFlows(dailyFlows: AdminInvestorFlowSummary[], currentSimulationDate: string) {
  const aggregateByCategory = new Map(
    ADMIN_PARTICIPANT_CATEGORIES.map((category) => [category, emptyParticipantCategory(category)]),
  );

  const includedFlows = dailyFlows.filter((flow) => isInvestorFlowIncludedInAggregate(
    resolveInvestorFlowSourceStatus(flow, currentSimulationDate),
  ));

  includedFlows.forEach((flow) => {
    resolveParticipantCategories(flow).forEach((category) => {
      const aggregate = aggregateByCategory.get(category.category) ?? emptyParticipantCategory(category.category);
      aggregateByCategory.set(category.category, {
        ...aggregate,
        buyQuantity: aggregate.buyQuantity + category.buyQuantity,
        sellQuantity: aggregate.sellQuantity + category.sellQuantity,
        buyAmount: aggregate.buyAmount + category.buyAmount,
        sellAmount: aggregate.sellAmount + category.sellAmount,
        netCashFlow: aggregate.netCashFlow + category.netCashFlow,
      });
    });
  });

  const totalBuyQuantity = [...aggregateByCategory.values()].reduce((sum, category) => sum + category.buyQuantity, 0);
  const totalSellQuantity = [...aggregateByCategory.values()].reduce((sum, category) => sum + category.sellQuantity, 0);
  const categories = ADMIN_PARTICIPANT_CATEGORIES.map((categoryKey) => {
    const category = aggregateByCategory.get(categoryKey) ?? emptyParticipantCategory(categoryKey);
    return {
      ...category,
      netQuantity: category.buyQuantity - category.sellQuantity,
      participationQuantity: category.buyQuantity + category.sellQuantity,
    };
  });
  const amountSummary = summarizeInvestorFlowAmounts(categories);

  return {
    balanced: totalBuyQuantity === totalSellQuantity && amountSummary.balanced,
    categories: amountSummary.categories,
    totalBuyQuantity,
    totalBuyAmount: amountSummary.totalBuyAmount,
    includedDayCount: includedFlows.length,
    excludedDayCount: dailyFlows.length - includedFlows.length,
  };
}
