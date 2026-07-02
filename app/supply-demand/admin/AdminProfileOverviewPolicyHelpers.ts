import { AUTO_PARTICIPANT_PROFILE_OPTIONS } from "@/app/lib/autoParticipantProfiles";
import type {
  AutoParticipantProfileOverview,
  AutoParticipantProfileType,
} from "@/app/types/stock";

export type ParticipantProfileOverviewSummary = AutoParticipantProfileOverview & {
  profileType: AutoParticipantProfileType;
  label: string;
  description: string;
  behavior: string;
};

export function resolveParticipantProfileOverviewSummaries(
  overviews: AutoParticipantProfileOverview[],
): ParticipantProfileOverviewSummary[] {
  const overviewByProfile = new Map(overviews.map((overview) => [overview.profileType, overview]));
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => {
    const overview = overviewByProfile.get(profile.value);
    return {
      profileType: profile.value,
      label: profile.label,
      description: profile.description,
      behavior: profile.behavior,
      totalCount: overview?.totalCount ?? 0,
      enabledCount: overview?.enabledCount ?? 0,
      disabledCount: overview?.disabledCount ?? 0,
      accountCount: overview?.accountCount ?? 0,
      availableCash: overview?.availableCash ?? 0,
      reservedBuyCash: overview?.reservedBuyCash ?? 0,
      holdingMarketValue: overview?.holdingMarketValue ?? 0,
      estimatedTotalAsset: overview?.estimatedTotalAsset ?? 0,
      netCashFlow: overview?.netCashFlow ?? 0,
      totalProfit: overview?.totalProfit ?? 0,
      returnRate: overview?.returnRate ?? 0,
      holdingCount: overview?.holdingCount ?? 0,
      totalHoldingQuantity: overview?.totalHoldingQuantity ?? 0,
      reservedSellQuantity: overview?.reservedSellQuantity ?? 0,
      openOrderCount: overview?.openOrderCount ?? 0,
      openBuyOrderCount: overview?.openBuyOrderCount ?? 0,
      openSellOrderCount: overview?.openSellOrderCount ?? 0,
      openBuyQuantity: overview?.openBuyQuantity ?? 0,
      openSellQuantity: overview?.openSellQuantity ?? 0,
      todayExecutionCount: overview?.todayExecutionCount ?? 0,
      todayBuyQuantity: overview?.todayBuyQuantity ?? 0,
      todaySellQuantity: overview?.todaySellQuantity ?? 0,
      todayGrossAmount: overview?.todayGrossAmount ?? 0,
      strategyCount: overview?.strategyCount ?? 0,
      enabledStrategyCount: overview?.enabledStrategyCount ?? 0,
      lastOrderAt: overview?.lastOrderAt ?? null,
      lastExecutionAt: overview?.lastExecutionAt ?? null,
      symbolHoldings: overview?.symbolHoldings ?? [],
    };
  });
}
