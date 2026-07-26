import type { AutoMarketConfigDraftInput } from "@/app/supply-demand/admin/AdminMarketPayloadHelpers";
import type { ProfileConfigDraftWithType } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type {
  AutoMarketConfig,
  AutoParticipant,
  AutoParticipantProfileConfig,
  AutoParticipantProfileType,
  AutoParticipantSymbolConfig,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";

export type ProfileConfigDraftValues = ProfileConfigDraftWithType;

export type AutoParticipantEditValues = {
  userKey: string;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  behaviorSeed: string;
  recurringCashAmount: string;
  recurringCashIntervalValue: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  cashAdjustmentAmount: string;
};

export type AutoParticipantStrategyDraftValues = {
  editingKey: string | null;
  userKey: string;
  symbol: string;
  enabled: boolean;
  intensity: string;
};

export type AutoParticipantSelectionDraft = {
  participant: AutoParticipantEditValues;
  strategy: AutoParticipantStrategyDraftValues;
};

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
    behaviorModelVersion: config.behaviorModelVersion ?? "V2",
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

export function resolveAutoParticipantSelectionDraft(options: {
  participant: AutoParticipant;
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  autoMarketConfigs: AutoMarketConfig[];
  defaultRecurringCashIntervalUnit: RecurringCashIntervalUnit;
  defaultStrategyIntensity: string;
}): AutoParticipantSelectionDraft {
  const firstParticipantStrategy = options.participantSymbolConfigs.find((config) => config.userKey === options.participant.userKey) ?? null;
  const firstAutoConfig = options.autoMarketConfigs[0] ?? null;
  const strategy = firstParticipantStrategy
    ? toStrategyDraft(firstParticipantStrategy)
    : {
        editingKey: null,
        userKey: options.participant.userKey,
        symbol: firstAutoConfig?.symbol ?? "",
        enabled: true,
        intensity: options.defaultStrategyIntensity,
      };

  return {
    participant: {
      userKey: options.participant.userKey,
      displayName: options.participant.displayName,
      enabled: options.participant.enabled,
      profileType: options.participant.profileType,
      behaviorSeed: options.participant.behaviorSeed ?? "",
      recurringCashAmount: options.participant.recurringCashAmount == null ? "" : String(options.participant.recurringCashAmount),
      recurringCashIntervalValue: options.participant.recurringCashIntervalValue == null ? "" : String(options.participant.recurringCashIntervalValue),
      recurringCashIntervalUnit: options.participant.recurringCashIntervalUnit ?? options.defaultRecurringCashIntervalUnit,
      cashAdjustmentAmount: "",
    },
    strategy,
  };
}

export function resolveParticipantStrategySymbolDraft(options: {
  userKey: string;
  symbol: string;
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  autoMarketConfigs: AutoMarketConfig[];
  defaultStrategyIntensity: string;
}): AutoParticipantStrategyDraftValues {
  const existingConfig = options.participantSymbolConfigs.find((config) => config.userKey === options.userKey && config.symbol === options.symbol) ?? null;
  if (existingConfig) {
    return toStrategyDraft(existingConfig);
  }
  return {
    editingKey: null,
    userKey: options.userKey,
    symbol: options.symbol,
    enabled: true,
    intensity: options.defaultStrategyIntensity,
  };
}

function mapDistributionBiasToDraft(bias: AutoMarketConfig["primaryDistributionBias"]) {
  return {
    pricePressure: String(bias.pricePressure),
    assetPreferencePressure: String(bias.assetPreferencePressure),
    volatilityPressure: String(bias.volatilityPressure),
    liquidityPressure: String(bias.liquidityPressure),
    executionAggressionPressure: String(bias.executionAggressionPressure),
  };
}

export function toStrategyDraft(config: AutoParticipantSymbolConfig): AutoParticipantStrategyDraftValues {
  return {
    editingKey: `${config.userKey}:${config.symbol}`,
    userKey: config.userKey,
    symbol: config.symbol,
    enabled: config.enabled,
    intensity: String(config.intensity),
  };
}
