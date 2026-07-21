import { formatDateTime, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminInvestorCategory, AdminInvestorCategoryFlow, AdminInvestorFlowSummary } from "@/app/types/stock";

const CATEGORY_META: Record<AdminInvestorCategory, { label: string; colorClassName: string; surfaceClassName: string }> = {
  MANUAL_PARTICIPANT: {
    label: "일반 유저",
    colorClassName: "bg-admin-accent",
    surfaceClassName: "border-admin-accent/25 bg-admin-accent-surface/30",
  },
  AUTO_PARTICIPANT: {
    label: "자동참여자",
    colorClassName: "bg-admin-success",
    surfaceClassName: "border-admin-success/25 bg-admin-success-surface/25",
  },
  LISTING_UNDERWRITER: {
    label: "상장주관사",
    colorClassName: "bg-admin-warning",
    surfaceClassName: "border-admin-warning/25 bg-admin-warning/[0.06]",
  },
};

export function AdminInvestorFlowPanel({ investorFlow }: { investorFlow: AdminInvestorFlowSummary | null | undefined }) {
  if (!investorFlow) {
    return null;
  }

  const categoryByKey = new Map(investorFlow.categories.map((category) => [category.category, category]));
  const categories = (Object.keys(CATEGORY_META) as AdminInvestorCategory[]).map(
    (category) => categoryByKey.get(category) ?? emptyCategory(category),
  );
  const compositionLabel = categories
    .map((category) => `${CATEGORY_META[category.category].label} ${formatRate(category.executionShareRate)}`)
    .join(", ");

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3 sm:p-4" aria-labelledby="admin-investor-flow-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="admin-investor-flow-title" className="text-sm font-black text-white">투자자 유형별 체결 흐름</h3>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
            일반 유저·자동참여자·상장주관사의 당일 매수·매도 참여량과 비중입니다. 참여량은 양쪽 체결 원장의 매수+매도 합계이며, 실제 거래량의 두 배가 될 수 있습니다.
          </p>
        </div>
        <div className="shrink-0 text-right text-[11px] font-bold leading-5 text-admin-muted">
          <p>기준일 {investorFlow.simulationTradeDate}</p>
          <p>{investorFlow.sourceUpdatedAt ? `요약 반영 ${formatDateTime(investorFlow.sourceUpdatedAt)}` : "당일 체결 없음"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {categories.map((category) => (
          <InvestorCategoryCard key={category.category} category={category} />
        ))}
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-admin-canvas/45 px-3 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-stock-subtle">
          <span>전체 체결 참여 구성</span>
          <span className="tabular-nums">
            매수 {formatNumber(investorFlow.totalBuyQuantity)}주 · 매도 {formatNumber(investorFlow.totalSellQuantity)}주 · 참여 {formatNumber(investorFlow.totalParticipationQuantity)}주
          </span>
        </div>
        {investorFlow.totalParticipationQuantity > 0 ? (
          <>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`투자자 유형별 체결 참여 비중: ${compositionLabel}`}>
              {categories.map((category) => (
                <span
                  key={category.category}
                  className={CATEGORY_META[category.category].colorClassName}
                  style={{ width: `${clampRate(category.executionShareRate)}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {categories.map((category) => {
                const meta = CATEGORY_META[category.category];
                return (
                  <span key={category.category} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stock-subtle">
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.colorClassName}`} />
                    {meta.label} <strong className="font-black tabular-nums text-white">{formatRate(category.executionShareRate)}</strong>
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs font-bold text-admin-muted">집계된 체결 참여량이 없습니다.</p>
        )}
      </div>

      <p className="mt-3 text-[11px] font-bold leading-5 text-admin-muted">
        주문·체결 경로와 분리된 계좌별 당일 요약을 사용합니다. 장중에는 통상 수 초 지연될 수 있고, 장마감 후 원본 대사로 확정됩니다.
      </p>
    </section>
  );
}

function InvestorCategoryCard({ category }: { category: AdminInvestorCategoryFlow }) {
  const meta = CATEGORY_META[category.category];
  const netQuantityClassName = category.netQuantity > 0
    ? "text-admin-success"
    : category.netQuantity < 0
      ? "text-admin-danger"
      : "text-white";

  return (
    <article className={`min-w-0 rounded-md border p-3 ${meta.surfaceClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-stock-subtle">{meta.label}</p>
          <p className="mt-1 text-xl font-black tabular-nums text-white">{formatNumber(category.participationQuantity)}주</p>
        </div>
        <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black tabular-nums text-white">
          {formatRate(category.executionShareRate)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-xs">
        <FlowMetric label="매수" value={`${formatNumber(category.buyQuantity)}주`} detail={formatRate(category.buyShareRate)} />
        <FlowMetric label="매도" value={`${formatNumber(category.sellQuantity)}주`} detail={formatRate(category.sellShareRate)} align="right" />
        <FlowMetric label="순매수" value={`${category.netQuantity > 0 ? "+" : ""}${formatNumber(category.netQuantity)}주`} valueClassName={netQuantityClassName} />
        <FlowMetric label="순현금" value={`${category.netCashFlow > 0 ? "+" : ""}${formatWon(category.netCashFlow)}`} align="right" />
      </dl>
    </article>
  );
}

function FlowMetric({
  label,
  value,
  detail,
  align = "left",
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  detail?: string;
  align?: "left" | "right";
  valueClassName?: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <dt className="font-bold text-admin-muted">{label}{detail ? ` 비중 ${detail}` : ""}</dt>
      <dd className={`mt-1 font-black tabular-nums ${valueClassName}`}>{value}</dd>
    </div>
  );
}

function formatRate(value: number) {
  return `${formatNumber(value)}%`;
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

function emptyCategory(category: AdminInvestorCategory): AdminInvestorCategoryFlow {
  return {
    category,
    buyQuantity: 0,
    sellQuantity: 0,
    netQuantity: 0,
    participationQuantity: 0,
    buyAmount: 0,
    sellAmount: 0,
    netCashFlow: 0,
    buyShareRate: 0,
    sellShareRate: 0,
    executionShareRate: 0,
  };
}
