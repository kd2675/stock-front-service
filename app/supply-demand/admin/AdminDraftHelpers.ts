import type { AutoMarketConfigDraftInput } from "@/app/supply-demand/admin/AdminMarketPayloadHelpers";
import type { ProfileConfigDraftWithType } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type {
  AutoMarketConfig,
  AutoParticipantProfileConfig,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";

export type ProfileConfigDraftValues = ProfileConfigDraftWithType;

export function resolveAutoMarketConfigDraft(config: AutoMarketConfig): AutoMarketConfigDraftInput {
  const regimeCountWeights = config.primaryRegimeCountWeights ?? {
    oneTime: 0,
    twoTimes: 0,
    threeTimes: 0,
    fourTimes: 100,
  };
  return {
    symbol: config.symbol,
    enabled: config.enabled,
    maxOrderQuantity: String(config.maxOrderQuantity),
    orderTtlSeconds: String(config.orderTtlSeconds),
    primaryRegimeCountWeights: {
      oneTime: String(regimeCountWeights.oneTime),
      twoTimes: String(regimeCountWeights.twoTimes),
      threeTimes: String(regimeCountWeights.threeTimes),
      fourTimes: String(regimeCountWeights.fourTimes),
    },
    primaryDistributionBias: mapDistributionBiasToDraft(config.primaryDistributionBias),
    secondaryDistributionBias: mapDistributionBiasToDraft(config.secondaryDistributionBias),
  };
}

export function resolveProfileConfigDraft(
  config: AutoParticipantProfileConfig,
  defaultRecurringCashIntervalUnit: RecurringCashIntervalUnit,
): ProfileConfigDraftValues {
  return {
    profileType: config.profileType,
    newsWeight: String(config.newsWeight),
    momentumWeight: String(config.momentumWeight),
    contrarianWeight: String(config.contrarianWeight),
    lossAversionWeight: String(config.lossAversionWeight),
    herdingWeight: String(config.herdingWeight),
    marketMakingWeight: String(config.marketMakingWeight),
    overconfidenceWeight: String(config.overconfidenceWeight),
    noiseWeight: String(config.noiseWeight),
    panicSellWeight: String(config.panicSellWeight),
    dipBuyWeight: String(config.dipBuyWeight),
    orderMultiplier: String(config.orderMultiplier),
    decisionFrequencyMultiplier: String(config.decisionFrequencyMultiplier),
    ordersPerDecisionMultiplier: String(config.ordersPerDecisionMultiplier),
    aggressionMultiplier: String(config.aggressionMultiplier),
    pricePressureSensitivity: String(config.pricePressureSensitivity),
    orderTtlMultiplier: String(config.orderTtlMultiplier),
    quantityMultiplier: String(config.quantityMultiplier),
    holdingPatienceWeight: String(config.holdingPatienceWeight),
    deepLossHoldWeight: String(config.deepLossHoldWeight),
    profitTakingWeight: String(config.profitTakingWeight),
    pricingMode: config.pricingMode,
    exitMode: config.exitMode,
    inventoryMode: config.inventoryMode,
    recurringDepositAmount: String(config.fundingPolicy.recurringDepositAmount),
    recurringDepositIntervalValue: String(
      config.fundingPolicy.recurringDepositIntervalValue
        ?? config.fundingPolicy.recurringDepositIntervalDays,
    ),
    recurringDepositIntervalUnit:
      config.fundingPolicy.recurringDepositIntervalUnit ?? defaultRecurringCashIntervalUnit,
  };
}

function mapDistributionBiasToDraft(bias: AutoMarketConfig["primaryDistributionBias"]) {
  return {
    pricePressure: String(bias.pricePressure),
    assetPreferencePressure: String(bias.assetPreferencePressure),
    volatilityPressure: String(bias.volatilityPressure),
    liquidityPressure: String(bias.liquidityPressure),
    executionAggressionPressure: String(bias.executionAggressionPressure),
    newsActivityPressure: String(bias.newsActivityPressure),
  };
}
