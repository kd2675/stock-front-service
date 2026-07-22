import type { ReactNode } from "react";

import {
  formatCompactWon,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import {
  buildCashDividendGuidanceModel,
  type CashDividendComparison,
  type CashDividendComparisonTone,
} from "@/app/supply-demand/admin/cashDividendGuidance";
import type { CashDividendGuidance } from "@/app/types/stock";

type AdminCashDividendGuidanceProps = {
  guidance?: CashDividendGuidance;
  loading: boolean;
  errorMessage: string | null;
  rawAmount: string;
  symbol: string;
  onApplyAmount: (value: string) => void;
  onRetry: () => void;
};

export function AdminCashDividendGuidance({
  guidance,
  loading,
  errorMessage,
  rawAmount,
  symbol,
  onApplyAmount,
  onRetry,
}: AdminCashDividendGuidanceProps) {
  if (!symbol) {
    return (
      <GuidanceShell>
        <p className="text-xs font-bold leading-5 text-admin-muted">종목을 선택하면 이전 배당과 최근 장마감 가격을 비교해 권유값을 계산합니다.</p>
      </GuidanceShell>
    );
  }
  if (loading) {
    return (
      <GuidanceShell>
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-admin-muted">
          <span>배당 이력과 기준가격을 확인하고 있습니다.</span>
          <span className="rounded-sm bg-white/[0.06] px-2 py-1 text-admin-accent">조회 중</span>
        </div>
      </GuidanceShell>
    );
  }
  if (errorMessage || !guidance) {
    return (
      <GuidanceShell tone="danger">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold leading-5 text-admin-danger">{errorMessage ?? "현금배당 권유 기준을 확인하지 못했습니다."}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-9 rounded-md border border-admin-danger/30 px-3 py-2 text-xs font-black text-admin-danger transition hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          >
            다시 조회
          </button>
        </div>
      </GuidanceShell>
    );
  }

  const model = buildCashDividendGuidanceModel(guidance, rawAmount);
  const latestHistory = guidance.history[0];
  const historyLabel = guidance.completedDividendCount > 0
    ? `완료 이력 ${guidance.completedDividendCount}회`
    : "과거 배당 없음";

  return (
    <GuidanceShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-white">과거 기준 권유값</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-admin-muted">
            {guidance.referencePriceBasis === "PREVIOUS_CLOSE" ? "최근 장마감 종가" : "현재가 대체값"} {formatWon(guidance.referencePrice)} · 발행 {formatNumber(guidance.issuedShares)}주
          </p>
          <p className="text-[10px] font-bold leading-4 text-admin-placeholder">순이익·현금 여력을 반영한 적정성 판단이 아닌 이력·가격 참고치입니다.</p>
        </div>
        <span className="rounded-sm bg-admin-accent-surface px-2 py-1 text-[11px] font-black text-admin-accent-label">{historyLabel}</span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <p className="text-[10px] font-black tracking-[0.08em] text-admin-muted">기준 권유</p>
          <p className="mt-1 text-xl font-black tabular-nums text-admin-accent">{formatWon(model.primarySuggestion.amount)}<span className="ml-1 text-xs text-admin-muted">/주</span></p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-admin-muted">{model.primarySuggestion.detail}</p>
        </div>
        <button
          type="button"
          onClick={() => onApplyAmount(String(model.primarySuggestion.amount))}
          className="min-h-10 rounded-md bg-admin-accent px-3 py-2 text-xs font-black text-admin-canvas transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
        >
          권유값 적용
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" aria-label="현금배당 권유값 선택">
        {model.suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            title={suggestion.detail}
            onClick={() => onApplyAmount(String(suggestion.amount))}
            className="min-h-9 rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-2 text-left text-[11px] font-black text-admin-accent-soft transition hover:border-admin-accent/45 hover:bg-admin-accent-surface/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          >
            {suggestion.label} <span className="ml-1 tabular-nums text-white">{formatWon(suggestion.amount)}</span>
          </button>
        ))}
      </div>

      {model.amount !== null ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <GuidanceMetric label="입력 배당수익률" value={model.dividendYield === null ? "-" : `${formatNumber(model.dividendYield)}%`} />
            <GuidanceMetric
              label="최근 보유기준 예상 지급액"
              value={model.estimatedEligiblePayout === null ? "스냅샷 없음" : formatCompactWon(model.estimatedEligiblePayout)}
            />
            <GuidanceMetric
              label="발행주식 전량 상한"
              value={model.issuedSharePayoutCeiling === null ? "-" : formatCompactWon(model.issuedSharePayoutCeiling)}
            />
            <GuidanceMetric
              label="직전 주당 배당"
              value={latestHistory ? `${formatWon(latestHistory.splitAdjustedDividendPerShare)}/주` : "이력 없음"}
            />
          </div>

          {guidance.recentHoldingQuantity && guidance.holdingReferenceBusinessDate ? (
            <p className="mt-2 text-[10px] font-bold leading-4 text-admin-muted">
              보유기준은 {guidance.holdingReferenceBusinessDate} 완료 장마감의 {formatNumber(guidance.recentHoldingQuantity)}주입니다. 실제 지급액은 배당락 기준 보유량에 따라 달라질 수 있습니다.
            </p>
          ) : (
            <p className="mt-2 text-[10px] font-bold leading-4 text-admin-muted">완료된 장마감 보유 스냅샷이 없어 발행주식 전량 기준 상한만 표시합니다.</p>
          )}

          {model.comparisons.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {model.comparisons.map((comparison) => (
                <DividendComparisonBar key={comparison.id} comparison={comparison} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[11px] font-bold leading-5 text-admin-muted">완료된 이전 배당이 없어 수익률 시나리오만 제공합니다.</p>
          )}

          {model.warning ? (
            <p role="alert" className="mt-4 rounded-md border border-admin-warning/30 bg-admin-warning/10 px-3 py-2 text-xs font-bold leading-5 text-admin-warning-soft">
              {model.warning}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 border-t border-white/10 pt-3 text-[11px] font-bold leading-5 text-admin-muted">권유값을 선택하거나 직접 입력하면 직전 대비 100%·200%·500% 구간을 비교합니다.</p>
      )}
    </GuidanceShell>
  );
}

function GuidanceShell({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className={[
      "min-w-0 rounded-md border p-3",
      tone === "danger" ? "border-admin-danger/30 bg-admin-danger-surface/70" : "border-admin-accent/20 bg-admin-canvas/55",
    ].join(" ")}>
      {children}
    </div>
  );
}

function GuidanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-white/[0.035] px-3 py-2">
      <p className="text-[10px] font-bold text-admin-muted">{label}</p>
      <p className="mt-1 text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function DividendComparisonBar({ comparison }: { comparison: CashDividendComparison }) {
  const toneClasses = comparisonToneClasses(comparison.tone);
  const ratioLabel = comparison.ratioPercent > 500
    ? `${formatNumber(comparison.ratioPercent)}% · 5배 초과`
    : `${formatNumber(comparison.ratioPercent)}%`;
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-[11px] font-black text-white">{comparison.label}</p>
        <p className={`text-[11px] font-black tabular-nums ${toneClasses.text}`}>{ratioLabel}</p>
      </div>
      <div
        role="meter"
        aria-label={`${comparison.label} 직전 대비`}
        aria-valuemin={0}
        aria-valuemax={500}
        aria-valuenow={Math.min(comparison.ratioPercent, 500)}
        className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/10"
      >
        <span className={`block h-full rounded-full transition-[width] duration-200 ${toneClasses.fill}`} style={{ width: `${comparison.positionPercent}%` }} />
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-white/50" />
        <span aria-hidden="true" className="absolute inset-y-0 left-3/4 w-px bg-white/35" />
      </div>
      <div className="relative mt-1 h-3 text-[9px] font-bold tabular-nums text-admin-placeholder">
        <span className="absolute left-0">0%</span>
        <span className="absolute left-1/2 -translate-x-1/2">100%</span>
        <span className="absolute left-3/4 -translate-x-1/2">200%</span>
        <span className="absolute right-0">500%+</span>
      </div>
      <p className="mt-1 text-[10px] font-bold tabular-nums text-admin-muted">
        현재 {formatComparisonValue(comparison, comparison.currentValue)} · 직전 {formatComparisonValue(comparison, comparison.baselineValue)}
      </p>
    </div>
  );
}

function comparisonToneClasses(tone: CashDividendComparisonTone) {
  if (tone === "danger") {
    return { fill: "bg-admin-danger", text: "text-admin-danger" };
  }
  if (tone === "warning") {
    return { fill: "bg-admin-warning", text: "text-admin-warning-soft" };
  }
  return { fill: "bg-admin-accent", text: "text-admin-accent-label" };
}

function formatComparisonValue(comparison: CashDividendComparison, value: number) {
  if (comparison.id === "YIELD") {
    return `${formatNumber(value)}%`;
  }
  if (comparison.id === "TOTAL_PAYOUT") {
    return formatCompactWon(value);
  }
  return formatWon(value);
}
