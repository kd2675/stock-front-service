import DataTableViewport from "@/app/components/DataTableViewport";
import useModalDialog from "@/app/hooks/useModalDialog";
import {
  ADMIN_PARTICIPANT_CATEGORIES,
  ADMIN_PARTICIPANT_CATEGORY_META,
  emptyParticipantCategory,
  formatParticipationRate,
  presentNetCashFlow,
  presentNetQuantity,
  resolveParticipantCategories,
} from "@/app/supply-demand/admin/adminInvestorFlowPresentation";
import { formatDateTime, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminInvestorFlowHistory, AdminInvestorFlowSummary, AdminParticipantCategoryFlow } from "@/app/types/stock";

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
  const periodFlow = aggregateInvestorFlows(dailyFlows);
  const rangeLabel = history ? `${history.rangeStart} - ${history.rangeEnd}` : "최근 7일";

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="investor-flow-history-title" className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="investor-flow-history-title" className="text-base font-black text-white">참여자별 체결 흐름 · 최근 7일</h3>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
              시뮬레이션 거래일별 유저·자동 참여자·상장주관사의 매수·매도 수량과 체결금액을 비교합니다. 세 역할의 순수량 합계는 정상 반영 시 0주입니다.
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
              <span>7일 합계</span>
              <span className="tabular-nums text-white">
                {periodFlow.balanced ? `실제 체결 ${formatNumber(periodFlow.totalBuyQuantity)}주` : "매수·매도 요약 반영 중"} · 양방향 참여 {formatNumber(periodFlow.totalParticipationQuantity)}주
              </span>
            </div>

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

function PeriodCategoryCard({ category }: { category: AdminParticipantCategoryFlow }) {
  const meta = ADMIN_PARTICIPANT_CATEGORY_META[category.category];
  const netQuantity = presentNetQuantity(category.netQuantity);
  const netCash = presentNetCashFlow(category.netCashFlow);

  return (
    <article className={`min-w-0 rounded-md border p-3 ${meta.surfaceClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-stock-subtle">{meta.label} · 7일 합계</p>
          <p className="mt-1 text-lg font-black tabular-nums text-white">{formatNumber(category.participationQuantity)}주</p>
        </div>
        <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black tabular-nums text-white">전체 참여 중 {formatParticipationRate(category.executionShareRate)}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-xs">
        <HistoryMetric label={netQuantity.label} value={netQuantity.value} valueClassName={netQuantity.valueClassName} />
        <HistoryMetric label={netCash.label} value={netCash.value} valueClassName={netCash.valueClassName} align="right" />
        <HistoryMetric label="매수" value={`${formatNumber(category.buyQuantity)}주`} />
        <HistoryMetric label="매도" value={`${formatNumber(category.sellQuantity)}주`} align="right" />
        <HistoryMetric label="매수 금액" value={formatWon(category.buyAmount)} />
        <HistoryMetric label="매도 금액" value={formatWon(category.sellAmount)} align="right" />
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
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">거래일</th>
              <th className="px-3 py-2 text-right">실제 체결량</th>
              {ADMIN_PARTICIPANT_CATEGORIES.map((category) => (
                <th key={category} className="px-3 py-2 text-right">{ADMIN_PARTICIPANT_CATEGORY_META[category].label}</th>
              ))}
              <th className="px-3 py-2 text-right">수량 대사</th>
              <th className="px-3 py-2 text-right">요약 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {dailyFlows.map((flow) => {
              const balanced = flow.totalBuyQuantity === flow.totalSellQuantity;
              return (
                <tr key={flow.simulationTradeDate}>
                  <td className="px-3 py-3 align-top">
                    <p className="font-black text-white">{flow.simulationTradeDate}</p>
                    <p className="mt-1 text-[11px] font-bold text-stock-subtle">{flow.simulationTradeDate === currentSimulationDate ? "시뮬레이션 오늘" : "장마감 완료일"}</p>
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <p className="font-black tabular-nums text-white">{balanced ? `${formatNumber(flow.totalBuyQuantity)}주` : "반영 중"}</p>
                    <p className="mt-1 text-[11px] font-bold tabular-nums text-stock-subtle">참여 {formatNumber(flow.totalParticipationQuantity)}주</p>
                  </td>
                  {resolveParticipantCategories(flow).map((category) => (
                    <DailyCategoryCell key={category.category} category={category} />
                  ))}
                  <td className="px-3 py-3 text-right align-top">
                    <BalanceStatus flow={flow} />
                  </td>
                  <td className="px-3 py-3 text-right align-top text-[11px] font-bold text-stock-subtle">
                    {flow.simulationTradeDate === currentSimulationDate
                      ? flow.sourceUpdatedAt ? `장중 요약 ${formatDateTime(flow.sourceUpdatedAt)}` : "당일 체결 없음"
                      : "장마감 원본 대사"}
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

function DailyCategoryCell({ category }: { category: AdminParticipantCategoryFlow }) {
  const netQuantity = presentNetQuantity(category.netQuantity);
  return (
    <td className="px-3 py-3 text-right align-top">
      <p className={`font-black tabular-nums ${netQuantity.valueClassName}`}>{netQuantity.label} {netQuantity.value}</p>
      <p className="mt-1 text-[11px] font-bold tabular-nums text-stock-subtle">매수 {formatNumber(category.buyQuantity)} · 매도 {formatNumber(category.sellQuantity)}</p>
      <p className="mt-1 text-[11px] font-bold tabular-nums text-admin-muted">매수 {formatWon(category.buyAmount)} · 매도 {formatWon(category.sellAmount)}</p>
      <p className="mt-1 text-[11px] font-bold tabular-nums text-admin-muted">참여 {formatParticipationRate(category.executionShareRate)}</p>
    </td>
  );
}

function DailyFlowCard({ flow, currentSimulationDate }: { flow: AdminInvestorFlowSummary; currentSimulationDate: string }) {
  const balanced = flow.totalBuyQuantity === flow.totalSellQuantity;
  return (
    <article className="rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{flow.simulationTradeDate}</p>
          <p className="mt-1 text-[11px] font-bold text-stock-subtle">{flow.simulationTradeDate === currentSimulationDate ? "시뮬레이션 오늘" : "장마감 원본 대사"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black tabular-nums text-white">{balanced ? `체결 ${formatNumber(flow.totalBuyQuantity)}주` : "요약 반영 중"}</p>
          <BalanceStatus flow={flow} />
        </div>
      </div>
      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        {resolveParticipantCategories(flow).map((category) => {
          const meta = ADMIN_PARTICIPANT_CATEGORY_META[category.category];
          const netQuantity = presentNetQuantity(category.netQuantity);
          return (
            <div key={category.category} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stock-subtle">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.colorClassName}`} />
                {meta.label}
              </span>
              <div className="text-right">
                <p className={`text-xs font-black tabular-nums ${netQuantity.valueClassName}`}>{netQuantity.label} {netQuantity.value}</p>
                <p className="mt-0.5 text-[11px] font-bold tabular-nums text-admin-muted">매수 {formatNumber(category.buyQuantity)} · 매도 {formatNumber(category.sellQuantity)}</p>
                <p className="mt-0.5 text-[11px] font-bold tabular-nums text-stock-subtle">매수 {formatWon(category.buyAmount)} · 매도 {formatWon(category.sellAmount)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function BalanceStatus({ flow }: { flow: AdminInvestorFlowSummary }) {
  const imbalance = flow.totalBuyQuantity - flow.totalSellQuantity;
  if (imbalance === 0) {
    return <p className="text-[11px] font-black text-admin-success">매수·매도 일치</p>;
  }
  return <p className="text-[11px] font-black tabular-nums text-admin-warning">{formatNumber(Math.abs(imbalance))}주 반영 차이</p>;
}

function HistoryMetric({
  align = "left",
  label,
  value,
  valueClassName = "text-white",
}: {
  align?: "left" | "right";
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <dt className="font-bold text-admin-muted">{label}</dt>
      <dd className={`mt-1 font-black tabular-nums ${valueClassName}`}>{value}</dd>
    </div>
  );
}

function aggregateInvestorFlows(dailyFlows: AdminInvestorFlowSummary[]) {
  const aggregateByCategory = new Map(
    ADMIN_PARTICIPANT_CATEGORIES.map((category) => [category, emptyParticipantCategory(category)]),
  );

  dailyFlows.forEach((flow) => {
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
  const totalParticipationQuantity = totalBuyQuantity + totalSellQuantity;
  const categories = ADMIN_PARTICIPANT_CATEGORIES.map((categoryKey) => {
    const category = aggregateByCategory.get(categoryKey) ?? emptyParticipantCategory(categoryKey);
    const participationQuantity = category.buyQuantity + category.sellQuantity;
    return {
      ...category,
      netQuantity: category.buyQuantity - category.sellQuantity,
      participationQuantity,
      buyShareRate: percentageOf(category.buyQuantity, totalBuyQuantity),
      sellShareRate: percentageOf(category.sellQuantity, totalSellQuantity),
      executionShareRate: percentageOf(participationQuantity, totalParticipationQuantity),
    };
  });

  return {
    balanced: totalBuyQuantity === totalSellQuantity,
    categories,
    totalBuyQuantity,
    totalParticipationQuantity,
  };
}

function percentageOf(value: number, total: number) {
  return total > 0 ? (value * 100) / total : 0;
}
