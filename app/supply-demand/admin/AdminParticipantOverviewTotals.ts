import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";

export type ParticipantProfileOverviewTotal = {
  totalCount: number;
  enabledCount: number;
  availableCash: number;
  holdingMarketValue: number;
  estimatedTotalAsset: number;
  totalProfit: number;
  openOrderCount: number;
  openBuyOrderCount: number;
  openSellOrderCount: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  todayExecutionCount: number;
  todayGrossAmount: number;
  strategyCount: number;
  enabledStrategyCount: number;
};

export function resolveParticipantProfileOverviewTotal(
  summaries: ParticipantProfileOverviewSummary[],
): ParticipantProfileOverviewTotal {
  return summaries.reduce(
    (acc, summary) => ({
      totalCount: acc.totalCount + summary.totalCount,
      enabledCount: acc.enabledCount + summary.enabledCount,
      availableCash: acc.availableCash + summary.availableCash,
      holdingMarketValue: acc.holdingMarketValue + summary.holdingMarketValue,
      estimatedTotalAsset: acc.estimatedTotalAsset + summary.estimatedTotalAsset,
      totalProfit: acc.totalProfit + summary.totalProfit,
      openOrderCount: acc.openOrderCount + summary.openOrderCount,
      openBuyOrderCount: acc.openBuyOrderCount + summary.openBuyOrderCount,
      openSellOrderCount: acc.openSellOrderCount + summary.openSellOrderCount,
      openBuyQuantity: acc.openBuyQuantity + summary.openBuyQuantity,
      openSellQuantity: acc.openSellQuantity + summary.openSellQuantity,
      todayExecutionCount: acc.todayExecutionCount + summary.todayExecutionCount,
      todayGrossAmount: acc.todayGrossAmount + summary.todayGrossAmount,
      strategyCount: acc.strategyCount + summary.strategyCount,
      enabledStrategyCount: acc.enabledStrategyCount + summary.enabledStrategyCount,
    }),
    {
      totalCount: 0,
      enabledCount: 0,
      availableCash: 0,
      holdingMarketValue: 0,
      estimatedTotalAsset: 0,
      totalProfit: 0,
      openOrderCount: 0,
      openBuyOrderCount: 0,
      openSellOrderCount: 0,
      openBuyQuantity: 0,
      openSellQuantity: 0,
      todayExecutionCount: 0,
      todayGrossAmount: 0,
      strategyCount: 0,
      enabledStrategyCount: 0,
    },
  );
}

export function resolveParticipantProfileOverviewReturnRate(total: ParticipantProfileOverviewTotal) {
  const principal = total.estimatedTotalAsset - total.totalProfit;
  return principal === 0 ? 0 : (total.totalProfit / principal) * 100;
}
