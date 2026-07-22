import type { CashDividendGuidance } from "@/app/types/stock";

export type CashDividendSuggestion = {
  id: "LATEST_AMOUNT" | "RECENT_MEDIAN" | "LATEST_YIELD" | "YIELD_1" | "YIELD_2" | "YIELD_3";
  label: string;
  amount: number;
  detail: string;
};

export type CashDividendComparisonTone = "accent" | "warning" | "danger";

export type CashDividendComparison = {
  id: "PER_SHARE" | "YIELD" | "TOTAL_PAYOUT";
  label: string;
  currentValue: number;
  baselineValue: number;
  ratioPercent: number;
  positionPercent: number;
  tone: CashDividendComparisonTone;
};

export type CashDividendGuidanceModel = {
  amount: number | null;
  dividendYield: number | null;
  estimatedEligiblePayout: number | null;
  issuedSharePayoutCeiling: number | null;
  primarySuggestion: CashDividendSuggestion;
  suggestions: CashDividendSuggestion[];
  comparisons: CashDividendComparison[];
  warning: string | null;
};

export function buildCashDividendGuidanceModel(
  guidance: CashDividendGuidance,
  rawAmount: string,
): CashDividendGuidanceModel {
  const suggestions = buildCashDividendSuggestions(guidance);
  const amount = parsePositiveFiniteNumber(rawAmount);
  const dividendYield = amount === null || guidance.referencePrice <= 0
    ? null
    : (amount / guidance.referencePrice) * 100;
  const estimatedEligiblePayout = amount === null || !guidance.recentHoldingQuantity || guidance.recentHoldingQuantity <= 0
    ? null
    : safeMultiply(amount, guidance.recentHoldingQuantity);
  const issuedSharePayoutCeiling = amount === null || guidance.issuedShares <= 0
    ? null
    : safeMultiply(amount, guidance.issuedShares);
  const comparisons = buildComparisons(guidance, amount, dividendYield, estimatedEligiblePayout);
  const highestRatio = comparisons.reduce((highest, comparison) => Math.max(highest, comparison.ratioPercent), 0);
  return {
    amount,
    dividendYield,
    estimatedEligiblePayout,
    issuedSharePayoutCeiling,
    primarySuggestion: primarySuggestion(guidance, suggestions),
    suggestions,
    comparisons,
    warning: highestRatio > 500
      ? "입력값이 직전 배당의 주요 기준 중 하나를 5배 넘었습니다. 지급 규모와 입력 단위를 다시 확인해 주세요."
      : highestRatio > 200
        ? "입력값이 직전 배당의 주요 기준 중 하나를 2배 넘었습니다. 의도한 확대인지 확인해 주세요."
        : null,
  };
}

export function comparisonPositionPercent(ratioPercent: number) {
  const normalizedRatio = Math.max(0, Math.min(ratioPercent, 500));
  if (normalizedRatio <= 100) {
    return normalizedRatio * 0.5;
  }
  if (normalizedRatio <= 200) {
    return 50 + (normalizedRatio - 100) * 0.25;
  }
  return 75 + ((normalizedRatio - 200) / 300) * 25;
}

function buildCashDividendSuggestions(guidance: CashDividendGuidance) {
  const suggestions: CashDividendSuggestion[] = [];
  const latest = guidance.history[0];
  if (latest) {
    suggestions.push({
      id: "LATEST_AMOUNT",
      label: "직전 금액 유지",
      amount: latest.splitAdjustedDividendPerShare,
      detail: "액면분할을 현재 주식 기준으로 보정한 직전 주당 배당금",
    });
  }
  if (guidance.history.length >= 3) {
    const medianAmount = median(
      guidance.history.slice(0, 3).map((history) => history.splitAdjustedDividendPerShare),
    );
    if (medianAmount !== null) {
      suggestions.push({
        id: "RECENT_MEDIAN",
        label: "최근 3회 중앙값",
        amount: medianAmount,
        detail: "최근 완료 배당 3회의 일시적인 고점과 저점을 완화한 기준",
      });
    }
  }
  if (latest?.dividendYield != null && latest.dividendYield > 0) {
    const latestYieldAmount = roundScenarioAmount(
      guidance.referencePrice * latest.dividendYield / 100,
    );
    suggestions.push({
      id: "LATEST_YIELD",
      label: "직전 수익률 유지",
      amount: latestYieldAmount,
      detail: `직전 배당수익률 ${formatCompactPercent(latest.dividendYield)}를 기준가격에 적용`,
    });
  }
  ([1, 2, 3] as const).forEach((targetYield) => {
    suggestions.push({
      id: `YIELD_${targetYield}`,
      label: `수익률 ${targetYield}%`,
      amount: roundScenarioAmount(guidance.referencePrice * targetYield / 100),
      detail: `기준가격 대비 연 ${targetYield}% 단순 시나리오`,
    });
  });
  return suggestions;
}

function primarySuggestion(
  guidance: CashDividendGuidance,
  suggestions: CashDividendSuggestion[],
) {
  const preferredId = guidance.history.length >= 3 ? "RECENT_MEDIAN" : "LATEST_AMOUNT";
  return suggestions.find((suggestion) => suggestion.id === preferredId)
    ?? suggestions.find((suggestion) => suggestion.id === "LATEST_AMOUNT")
    ?? suggestions.find((suggestion) => suggestion.id === "YIELD_2")
    ?? suggestions[0];
}

function buildComparisons(
  guidance: CashDividendGuidance,
  amount: number | null,
  dividendYield: number | null,
  estimatedEligiblePayout: number | null,
) {
  const latest = guidance.history[0];
  if (!latest || amount === null) {
    return [];
  }
  const comparisons: CashDividendComparison[] = [];
  pushComparison(
    comparisons,
    "PER_SHARE",
    "주당 배당금",
    amount,
    latest.splitAdjustedDividendPerShare,
  );
  if (dividendYield !== null && latest.dividendYield != null) {
    pushComparison(comparisons, "YIELD", "배당수익률", dividendYield, latest.dividendYield);
  }
  if (estimatedEligiblePayout !== null && latest.actualPaidCash > 0) {
    pushComparison(comparisons, "TOTAL_PAYOUT", "보유기준 지급 규모", estimatedEligiblePayout, latest.actualPaidCash);
  }
  return comparisons;
}

function pushComparison(
  comparisons: CashDividendComparison[],
  id: CashDividendComparison["id"],
  label: string,
  currentValue: number,
  baselineValue: number,
) {
  if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue) || baselineValue <= 0) {
    return;
  }
  const ratioPercent = (currentValue / baselineValue) * 100;
  comparisons.push({
    id,
    label,
    currentValue,
    baselineValue,
    ratioPercent,
    positionPercent: comparisonPositionPercent(ratioPercent),
    tone: ratioPercent > 500 ? "danger" : ratioPercent > 200 ? "warning" : "accent",
  });
}

function parsePositiveFiniteNumber(value: string) {
  const normalized = value.trim().replaceAll(",", "");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeMultiply(left: number, right: number) {
  const result = left * right;
  return Number.isFinite(result) ? result : null;
}

function roundScenarioAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  const step = value >= 1_000 ? 100 : value >= 100 ? 10 : 1;
  return Math.max(1, Math.round(value / step) * step);
}

function median(values: number[]) {
  const normalized = values.filter((value) => Number.isFinite(value) && value > 0).sort((left, right) => left - right);
  if (normalized.length === 0) {
    return null;
  }
  return normalized[Math.floor(normalized.length / 2)];
}

function formatCompactPercent(value: number) {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value)}%`;
}
