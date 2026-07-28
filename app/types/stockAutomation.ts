export type AutoMarketRegimePhase = "SLOT_0600" | "SLOT_0900" | "SLOT_1200" | "SLOT_1500";

export type AutoMarketDistributionBias = {
  pricePressure: number;
  assetPreferencePressure: number;
  volatilityPressure: number;
  liquidityPressure: number;
  executionAggressionPressure: number;
};

export type AutoMarketRegimeCountWeights = {
  oneTime: number;
  twoTimes: number;
  threeTimes: number;
  fourTimes: number;
};

export type AutoMarketRegimeModifier = {
  modifierWindowStartAt: string;
  pricePressure: number;
  assetPreferencePressure: number;
  volatilityPressure: number;
  liquidityPressure: number;
  executionAggressionPressure: number;
  seed: string;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketDailyRegime = {
  symbol: string;
  simulationTradeDate: string;
  regimePhase: AutoMarketRegimePhase;
  sourceRegimePhase: AutoMarketRegimePhase;
  dailyApplicationCount: number;
  preparedRegimeSlotCount: number;
  pricePressure: number;
  assetPreferencePressure: number;
  volatilityPressure: number;
  liquidityPressure: number;
  executionAggressionPressure: number;
  seed: string;
  currentModifier?: AutoMarketRegimeModifier | null;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketRegimeHistoryDailyRegime = AutoMarketDistributionBias & {
  regimePhase: AutoMarketRegimePhase;
  sourceRegimePhase: AutoMarketRegimePhase;
  seed: string;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketRegimeHistoryModifier = AutoMarketDistributionBias & {
  regimePhase: AutoMarketRegimePhase;
  modifierWindowStartAt: string;
  seed: string;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketRegimeHistorySourceStatus = "COMPLETE" | "PARTIAL" | "MISSING";

export type AutoMarketRegimeHistoryDay = {
  simulationTradeDate: string;
  dailyApplicationCount: number;
  preparedRegimeSlotCount: number;
  expectedWindowCount: number;
  availableWindowCount: number;
  sourceStatus: AutoMarketRegimeHistorySourceStatus;
  dailyRegimes: AutoMarketRegimeHistoryDailyRegime[];
  modifiers: AutoMarketRegimeHistoryModifier[];
};

export type AutoMarketRegimeHistoryRange = {
  symbol: string;
  rangeStartDate: string;
  rangeEndDate: string;
  currentSimulationDateTime: string;
  days: AutoMarketRegimeHistoryDay[];
};

export type AutoMarketConfig = {
  symbol: string;
  enabled: boolean;
  maxOrderQuantity: number;
  orderTtlSeconds: number;
  primaryRegimeCountWeights: AutoMarketRegimeCountWeights;
  primaryDistributionBias: AutoMarketDistributionBias;
  secondaryDistributionBias: AutoMarketDistributionBias;
  dailyRegime?: AutoMarketDailyRegime | null;
};

export type AutoParticipantProfileType =
  | "NEWS_REACTIVE"
  | "MOMENTUM_FOLLOWER"
  | "CONTRARIAN"
  | "LOSS_AVERSE"
  | "OVERCONFIDENT"
  | "HERD_FOLLOWER"
  | "PASSIVE_LIMIT_TRADER"
  | "NOISE_TRADER"
  | "VALUE_ANCHOR"
  | "SCALPER"
  | "DAY_TRADER"
  | "SWING_TRADER"
  | "LONG_TERM_HOLDER"
  | "PAYDAY_ACCUMULATOR"
  | "DIVIDEND_REINVESTOR"
  | "LIMIT_DOWN_TRAPPED"
  | "AVERAGE_DOWN_BUYER"
  | "STOP_LOSS_TRADER"
  | "FOMO_BUYER"
  | "PANIC_SELLER"
  | "DIP_BUYER"
  | "PROFIT_LOCKER"
  | "LIQUIDITY_AVOIDANT"
  | "CASH_DEFENSIVE"
  | "WHALE"
  | "SMALL_DIVERSIFIER"
  | "OBSERVER";

export type RecurringCashIntervalUnit = "SECOND" | "MINUTE" | "HOUR" | "DAY" | "MONTH" | "YEAR";
export type AutoParticipantBehaviorModelVersion = "V3";
export type AutoParticipantLifecycleScope = "CURRENT" | "WITHDRAWN";
export type AutoParticipantProfilePricingMode = "DIRECTIONAL";
export type AutoParticipantProfileExitMode = "SIGNAL_DRIVEN" | "TAKE_PROFIT_FIRST" | "HOLD_LOSSES";
export type AutoParticipantProfileInventoryMode = "SIGNAL_DRIVEN";

export type AutoParticipant = {
  userKey: string;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  behaviorModelVersion: AutoParticipantBehaviorModelVersion;
  behaviorSeed?: string | null;
  recurringCashAmount?: number | null;
  recurringCashIntervalValue?: number | null;
  recurringCashIntervalUnit?: RecurringCashIntervalUnit | null;
  accountId?: number | null;
  accountStatus?: string | null;
  cashBalance?: number | null;
  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string | null;
  paydayAvailableBudget: number;
  dividendAvailableBudget: number;
  fundingReservedAmount: number;
  fundingSpentAmount: number;
  activeFundingBudgetCount: number;
  trackedPositionCount: number;
  averageHoldingTradingDays: number;
  averageDownRoundCount: number;
  withdrawalReturnedCashAmount: number;
  withdrawalReturnedShareQuantity: number;
  withdrawalReturnedSymbolCount: number;
  accountClosedOnWithdrawal: boolean;
};

export type AutoParticipantShareTransfer = {
  symbol: string;
  receiverAccountId: number;
  receiverUserKey: string;
  receiverRole: "ISSUE_UNDERWRITER" | "SYSTEM_CUSTODY";
  transferReason: "ISSUE_UNDERWRITER_RETURN" | "AUTO_PARTICIPANT_WITHDRAWAL_CUSTODY";
  receiverAccountStatus: string;
  receiverSelfTradeGroupId?: string | null;
  quantity: number;
  sourceAveragePrice: number;
  receiverCurrentQuantity: number;
  receiverReservedQuantity: number;
  receiverAveragePrice: number;
  currentPrice: number;
  transferMarketValue: number;
  createdAt: string;
};

export type AutoParticipantWithdrawalAudit = {
  withdrawalId: number;
  participantUserKey: string;
  sourceAccountId: number;
  sourceAccountStatus: string;
  sourceRemainingCashAmount: number;
  sourceRemainingShareQuantity: number;
  sourceRemainingReservedShareQuantity: number;
  sourceOpenOrderCount: number;
  pendingCorporateActionRightCount: number;
  returnedCashAmount: number;
  returnedShareQuantity: number;
  returnedSymbolCount: number;
  createdBy: string;
  createdAt: string;
  shareTransfers: AutoParticipantShareTransfer[];
};

export type InstitutionDecisionAction = "BUY" | "SELL" | "HOLD";

export type InstitutionSymbolMandate = {
  mandateId: number;
  symbol: string;
  baseSymbolWeight: number;
  minPortfolioAllocationRate: number;
  maxPortfolioAllocationRate: number;
  pricePressureSensitivity: number;
  momentumSensitivity: number;
  valueSensitivity: number;
  reportSensitivity: number;
  referenceDailyVolume: number;
  dailyParticipationRate: number;
  enabled: boolean;
  currentPrice: number;
  actualQuantity: number;
  reservedQuantity: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  projectedQuantity: number;
  actualAllocationRate: number | null;
  projectedAllocationRate: number | null;
  targetAllocationRate: number | null;
  action: InstitutionDecisionAction | null;
  decisionReason: string | null;
  gateReason: string | null;
  gatedQuantity: number;
  gatedTradeAmount: number | null;
  blendedPricePressure: number | null;
  blendedAssetPreferencePressure: number | null;
  blendedVolatilityPressure: number | null;
  blendedLiquidityPressure: number | null;
  blendedExecutionAggressionPressure: number | null;
  return5Day: number | null;
  return20Day: number | null;
  reportPressure: number | null;
  dailyGrossQuantityLimit: number;
  dailyPlannedBuyQuantity: number;
  dailyPlannedSellQuantity: number;
  dailyGrossNotionalLimit: number;
  dailyPlannedBuyAmount: number;
  dailyPlannedSellAmount: number;
  dailySubmittedBuyAmount: number;
  dailySubmittedSellAmount: number;
  orderIntentStatus: "PENDING" | "SUBMITTED" | "REJECTED" | "FAILED" | null;
  orderIntentAttemptCount: number;
  orderIntentRequestedQuantity: number;
  orderIntentPlannedAmount: number;
  submittedOrderId: number | null;
  submittedPrice: number | null;
  submittedQuantity: number;
  orderSubmissionReason: string | null;
  submittedAt: string | null;
};

export type InstitutionSymbolPolicy = {
  symbol: string;
  baseSymbolWeight: number;
  minPortfolioAllocationRate: number;
  maxPortfolioAllocationRate: number;
  pricePressureSensitivity: number;
  momentumSensitivity: number;
  valueSensitivity: number;
  reportSensitivity: number;
  referenceDailyVolume: number;
  dailyParticipationRate: number;
};

export type InstitutionPortfolioScheduledPolicy = {
  policyVersion: number;
  effectiveBusinessDate: string;
  displayName: string;
  investmentStyle: InstitutionInvestmentStyle;
  baseStockAllocationRate: number;
  minStockAllocationRate: number;
  maxStockAllocationRate: number;
  primaryRegimeWeight: number;
  assetPreferenceSensitivity: number;
  volatilitySensitivity: number;
  entryThresholdRate: number;
  exitThresholdRate: number;
  dailyTurnoverLimitRate: number;
  maxDecisionTurnoverRate: number;
  decisionIntervalMinutes: number;
  mandates: InstitutionSymbolPolicy[];
  changeReason: string;
  changedBy: string;
  updatedAt: string;
};

export type InstitutionPortfolio = {
  portfolioId: number;
  portfolioCode: string;
  displayName: string;
  investmentStyle: InstitutionInvestmentStyle;
  executionMode: "LIVE";
  status: string;
  policyVersion: number;
  participantId: number;
  participantCode: string;
  participantStatus: string;
  participantSelfTradeGroupId: string;
  accountId: number;
  accountUserKey: string | null;
  accountStatus: string;
  accountSelfTradeGroupId: string | null;
  cashBalance: number;
  openBuyReservedCash: number;
  holdingMarketValue: number;
  totalAsset: number;
  currentStockAllocationRate: number;
  baseStockAllocationRate: number;
  minStockAllocationRate: number;
  maxStockAllocationRate: number;
  primaryRegimeWeight: number;
  assetPreferenceSensitivity: number;
  volatilitySensitivity: number;
  entryThresholdRate: number;
  exitThresholdRate: number;
  dailyTurnoverLimitRate: number;
  maxDecisionTurnoverRate: number;
  decisionIntervalMinutes: number;
  nextDecisionAt: string | null;
  latestDecisionRunId: number | null;
  latestDecisionSlot: string | null;
  latestDecisionStatus: string | null;
  latestDeterministicSeed: number | null;
  latestDecisionError: string | null;
  latestDecisionCompletedAt: string | null;
  budgetTradeDate: string;
  dailyPlannedBuyQuantity: number;
  dailyPlannedSellQuantity: number;
  dailyPlannedBuyAmount: number;
  dailyPlannedSellAmount: number;
  dailySubmittedBuyAmount: number;
  dailySubmittedSellAmount: number;
  institutionalOpenOrderCount: number;
  completedDecisionTradingDays: number;
  recentDecisionFailureCount: number;
  scheduledPolicy: InstitutionPortfolioScheduledPolicy | null;
  mandates: InstitutionSymbolMandate[];
};

export type InstitutionInvestmentStyle =
  | "BALANCED_LONG_TERM"
  | "VALUE_CONTRARIAN"
  | "MOMENTUM"
  | "ACTIVE_SHORT_TERM";

export type InstitutionPortfolioStylePreset = {
  investmentStyle: InstitutionInvestmentStyle;
  label: string;
  description: string;
  recommended: boolean;
  recommendedAumRateOfMarketCap: number;
  recommendedAumAmountPerPortfolio: number;
  baseStockAllocationRate: number;
  minStockAllocationRate: number;
  maxStockAllocationRate: number;
  primaryRegimeWeight: number;
  assetPreferenceSensitivity: number;
  volatilitySensitivity: number;
  entryThresholdRate: number;
  exitThresholdRate: number;
  dailyTurnoverLimitRate: number;
  maxDecisionTurnoverRate: number;
  decisionIntervalMinutes: number;
  pricePressureSensitivity: number;
  momentumSensitivity: number;
  valueSensitivity: number;
  reportSensitivity: number;
  dailyParticipationRate: number;
};

export type InstitutionPortfolioRecommendation = {
  activeSymbolCount: number;
  policyEligibleSymbolCount: number;
  currentPortfolioCount: number;
  recommendedPortfolioCount: number;
  recommendedRemainingCount: number;
  totalMarketCapitalization: number;
  recommendedAumRateOfMarketCap: number;
  minAumRateOfMarketCap: number;
  maxAumRateOfMarketCap: number;
  recommendedAumAmountPerPortfolio: number;
  styles: InstitutionPortfolioStylePreset[];
  symbols: {
    symbol: string;
    name: string;
    tradableShares: number;
    currentPrice: number;
    marketWeight: number;
    recommendedReferenceDailyVolume: number;
    recommendedReferenceDailyVolumeRate: number;
    referenceVolumeHistoryDays: number;
    referenceVolumeSource: "COMPLETED_20_DAY_ADV" | "FLOAT_FALLBACK";
    marketActivationStatus: "ACTIVE" | "PENDING_MARKET_ACTIVATION";
  }[];
};

export type LiquidityProviderExecutionMode = "LIVE";

export type LiquidityProviderAccount = {
  participantId: number;
  participantCode: string;
  participantType: string;
  participantStatus: string;
  participantSelfTradeGroupId: string;
  accountId: number;
  accountCode: string | null;
  accountStatus: string;
  participantCategory: string;
  accountSelfTradeGroupId: string | null;
  accountRole: string | null;
  roleMappingStatus: string | null;
  roleEffectiveFrom: string | null;
  roleEffectiveTo: string | null;
  availableCash: number;
  holdingQuantity: number;
  reservedSellQuantity: number;
  availableSellQuantity: number;
  averagePrice: number;
  currentPrice: number;
  holdingMarketValue: number;
  nonLiquidityOpenOrderCount: number;
  unmanagedHoldingCount: number;
};

export type LiquidityProviderPolicy = {
  targetSpreadTicks: number;
  maxSpreadTicks: number;
  maxOrderQuantity: number;
  referenceDailyVolume: number;
  targetOpenParticipationRate: number;
  maxOpenParticipationRate: number;
  maxSingleOrderParticipationRate: number;
  externalDepthLevels: number;
  maxExternalDepthParticipationRate: number;
  dailyExecutionParticipationRate: number;
  dailySubmissionMultiplier: number;
  targetInventoryQuantity: number;
  inventoryBandQuantity: number;
  inventorySkewTicks: number;
  primaryRegimeWeight: number;
  liquiditySizeSensitivity: number;
  volatilitySpreadMaxTicks: number;
  priceRegimeMaxSkewTicks: number;
  passiveOnly: boolean;
  minimumQuoteLifetimeSeconds: number;
  repriceThresholdTicks: number;
  orderTtlSeconds: number;
  quoteIntervalSeconds: number;
  dailyLossLimitAmount: number;
};

export type LiquidityProviderPolicyPreset = {
  presetCode: "STABLE" | "BALANCED" | "ACTIVE";
  recommended: boolean;
  referenceDailyVolumeFloatRate: number;
  oneSideQuoteFloatRate: number;
  dailyExecutionFloatRate: number;
  dailySubmissionFloatRate: number;
  inventoryBandFloatRate: number;
  dailyLossNetAssetRate: number;
  policy: LiquidityProviderPolicy;
};

export type LiquidityProviderDailyState = {
  simulationTradeDate: string;
  referenceDailyVolume: number;
  executionQuantityLimit: number;
  submissionQuantityLimit: number;
  submittedBuyQuantity: number;
  submittedSellQuantity: number;
  submittedBuyAmount: number;
  submittedSellAmount: number;
  cancelledBuyQuantity: number;
  cancelledSellQuantity: number;
  executedBuyQuantity: number;
  executedSellQuantity: number;
  executedBuyAmount: number;
  executedSellAmount: number;
  realizedProfit: number;
  unrealizedProfit: number;
  openingNetAssetValue: number;
  currentNetAssetValue: number;
  riskProfit: number;
  targetBuyOpenQuantity: number;
  targetSellOpenQuantity: number;
  lastOpenBuyQuantity: number;
  lastOpenSellQuantity: number;
  externalBuyDepthQuantity: number;
  externalSellDepthQuantity: number;
  lastBidPrice: number | null;
  lastAskPrice: number | null;
  lastInventoryQuantity: number;
  lastProjectedInventoryQuantity: number;
  blendedPricePressure: number;
  blendedVolatilityPressure: number;
  blendedLiquidityPressure: number;
  stateStatus: "QUOTING" | "EXEMPT" | "HALTED" | "ERROR";
  gateReason: string;
  quoteRunCount: number;
  limitBreached: boolean;
  policyVersion: number;
  version: number;
  updatedAt: string;
};

export type LiquidityProviderMandate = {
  mandateId: number;
  mandateCode: string;
  symbol: string;
  executionMode: LiquidityProviderExecutionMode;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  simulationTradeDate: string;
  contractStartDate: string;
  contractEndDate: string | null;
  nextQuoteAt: string | null;
  policyVersion: number;
  roleEligible: boolean;
  roleEligibilityIssue: string | null;
  account: LiquidityProviderAccount;
  policy: LiquidityProviderPolicy;
  policyPresets: LiquidityProviderPolicyPreset[];
  scheduledPolicy: {
    policyVersion: number;
    effectiveBusinessDate: string;
    activationAction: "POLICY_UPDATE" | "PROVISION" | "RESUME";
    targetStatus: "ACTIVE" | "SUSPENDED";
    policy: LiquidityProviderPolicy;
    changeReason: string;
    changedBy: string;
    updatedAt: string;
  } | null;
  dailyState: LiquidityProviderDailyState | null;
  transition: {
    transitionId: number;
    transitionKey: string;
    stage: "PENDING_ACTIVATION" | "LIVE_ACTIVE" | "SUSPENDED";
    sourceAccountId: number;
    legacyAccountId: number | null;
    referenceDailyVolume: number;
    seedInventoryQuantity: number;
    seedCashAmount: number;
    transferredInventoryQuantity: number;
    transferredCashAmount: number;
    effectiveBusinessDate: string;
    legacyDisabledAt: string | null;
    legacyRetiredAt: string | null;
    activatedAt: string | null;
    requestedBy: string;
    changeReason: string;
    policyVersion: number;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type LiquidityProviderPolicyUpdatePayload = Omit<
  LiquidityProviderPolicy,
  "primaryRegimeWeight" | "liquiditySizeSensitivity" | "passiveOnly"
> & {
  changeReason: string;
};

export type LiquidityProviderStatusChangePayload = {
  changeReason?: string;
};

export type LiquidityProviderRecommendation = {
  recommendedProviderCount: number;
  currentProviderCount: number;
  recommendedRemainingCount: number;
  recommendedReferenceDailyVolumeRate: number;
  minReferenceDailyVolumeRate: number;
  maxReferenceDailyVolumeRate: number;
  recommendedSeedInventoryRate: number;
  minSeedInventoryRate: number;
  maxSeedInventoryRate: number;
  recommendedInitialCashMultiplier: number;
  symbols: {
    symbol: string;
    tradableShares: number;
    currentPrice: number;
    marketEnabled: boolean;
    marketStatus: string;
    existingMandate: boolean;
    recommendedSourceAccountId: number | null;
    sourceAvailableQuantity: number;
    recommendedReferenceDailyVolume: number;
    recommendedReferenceDailyVolumeRate: number;
    referenceVolumeHistoryDays: number;
    referenceVolumeSource: "COMPLETED_20_DAY_ADV" | "FLOAT_FALLBACK";
    recommendedSeedInventoryQuantity: number;
    recommendedInitialCash: number;
    creationEligible: boolean;
    eligibilityReason: string;
  }[];
};

export type SecurityAllocation = {
  allocationId: number;
  idempotencyKey: string;
  eventType: string;
  corporateActionId: number | null;
  underwritingContractId: number | null;
  sourceAccountId: number | null;
  destinationAccountId: number;
  destinationAccountCode: string | null;
  destinationParticipantCategory: string;
  symbol: string;
  quantity: number;
  unitPrice: number;
  allocationReason: string;
  tradabilityStatus: "TRADABLE" | "LOCKED";
  effectiveBusinessDate: string;
  unlockBusinessDate: string | null;
  currentHoldingQuantity: number;
  currentReservedQuantity: number;
  currentAveragePrice: number;
  createdAt: string;
};

export type UnderwritingContract = {
  contractId: number;
  contractCode: string;
  corporateActionId: number | null;
  symbol: string;
  instrumentName: string;
  issuedShares: number;
  instrumentTradableShares: number;
  totalIssueQuantity: number;
  tradableAllocationQuantity: number;
  lockedAllocationQuantity: number;
  externalAllocationQuantity: number;
  underwrittenQuantity: number;
  tradableShareRate: number;
  issuePrice: number;
  underwritingType: "FIRM_COMMITMENT" | "BEST_EFFORTS";
  stabilizationStartDate: string | null;
  stabilizationEndDate: string | null;
  stabilizationQuantityLimit: number;
  stabilizationAmountLimit: number;
  status: "ALLOCATED" | "STABILIZING" | "COMPLETED" | "CANCELLED";
  policyVersion: number;
  account: {
    participantId: number;
    participantCode: string;
    participantDisplayName: string;
    participantType: string;
    participantStatus: string;
    participantSelfTradeGroupId: string;
    accountId: number;
    accountCode: string | null;
    accountStatus: string;
    participantCategory: string;
    accountSelfTradeGroupId: string | null;
    accountRole: string | null;
    deskCode: string | null;
    roleMappingStatus: string | null;
    roleEffectiveFrom: string | null;
    roleEffectiveTo: string | null;
    cashBalance: number;
    holdingQuantity: number;
    reservedSellQuantity: number;
    availableSellQuantity: number;
    averagePrice: number;
    currentPrice: number;
    holdingMarketValue: number;
    openUnderwritingOrderCount: number;
    openUnderwritingOrderQuantity: number;
    nonContractOpenOrderCount: number;
    unmanagedHoldingCount: number;
  };
  supply: {
    configuredSupplyRate: number;
    lifetimeSubmittedQuantity: number;
    lifetimeSubmittedAmount: number;
    lifetimeExecutedQuantity: number;
    lifetimeExecutedAmount: number;
    remainingSubmissionQuantity: number;
    remainingSubmissionAmount: number;
    generatedOrderCount: number;
    cancelledOrderCount: number;
    latestDailyState: {
      simulationTradeDate: string;
      referenceDailyVolume: number;
      submissionQuantityLimit: number;
      submissionAmountLimit: number;
      submittedQuantity: number;
      submittedAmount: number;
      generatedOrderCount: number;
      cancelledOrderCount: number;
      lastOrderPrice: number | null;
      stateStatus: "ACTIVE" | "GATED" | "COMPLETED" | "SUSPENDED";
      gateReason: string;
      policyVersion: number;
      updatedAt: string;
    } | null;
  };
  scheduledSupply: {
    policyVersion: number;
    effectiveBusinessDate: string;
    activationAction: "ACTIVATE_SUPPLY";
    targetStatus: "STABILIZING";
    supplyRate: number;
    durationDays: number;
    changeReason: string;
    changedBy: string;
    updatedAt: string;
  } | null;
  reconciliation: {
    initialAllocationLedgerQuantity: number;
    initialTradableLedgerQuantity: number;
    initialLockedLedgerQuantity: number;
    currentTotalHoldingQuantity: number;
    contractQuantityBalanced: boolean;
    instrumentQuantityCovered: boolean;
    allocationLedgerMatched: boolean;
    holdingSupplyMatched: boolean;
    roleEligible: boolean;
    issues: string[];
  };
  allocations: SecurityAllocation[];
  createdAt: string;
  updatedAt: string;
};

export type UnderwritingContractRecommendation = {
  recommendedUnderwriterOrganizationCount: number;
  currentUnderwriterOrganizationCount: number;
  recommendedAccountCountPerSymbol: number;
  currentContractCount: number;
  recommendedRemainingContractCount: number;
  recommendedSupplyRate: number;
  recommendedSupplyDurationDays: number;
  symbols: {
    symbol: string;
    instrumentName: string;
    issuedShares: number;
    tradableShares: number;
    lockedShares: number;
    issuePrice: number;
    corporateActionId: number | null;
    floatCustodyAccountId: number | null;
    floatCustodyAvailableQuantity: number;
    existingContract: boolean;
    creationEligible: boolean;
    eligibilityReason: string;
  }[];
};

export type SystemCustodyOverview = {
  recommendedWithdrawalCustodyAccountCount: number;
  currentWithdrawalCustodyAccountCount: number;
  recommendedIssuanceCustodyAccountsPerSymbol: number;
  roleSeparatedIssueSymbolCount: number;
  recommendedIssuanceCustodyAccountCount: number;
  currentIssuanceCustodyAccountCount: number;
  accounts: {
    accountId: number;
    accountCode: string | null;
    userKey: string | null;
    accountStatus: string;
    selfTradeGroupId: string | null;
    deskCode: string;
    mappingStatus: string;
    cashBalance: number;
    holdings: {
      symbol: string;
      quantity: number;
      reservedQuantity: number;
      averagePrice: number;
      currentPrice: number;
      marketValue: number;
    }[];
  }[];
};

export type AutoParticipantHolding = {
  symbol: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedProfit: number;
};

export type AutoParticipantOverview = {
  userKey: string;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  accountId?: number | null;
  accountStatus?: string | null;
  availableCash: number;
  reservedBuyCash: number;
  holdingMarketValue: number;
  estimatedTotalAsset: number;
  netCashFlow: number;
  totalProfit: number;
  returnRate: number | null;
  returnRateStatus: PortfolioReturnRateStatus;
  holdingCount: number;
  totalHoldingQuantity: number;
  reservedSellQuantity: number;
  holdings: AutoParticipantHolding[];
  openOrderCount: number;
  openBuyOrderCount: number;
  openSellOrderCount: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  todayExecutionCount: number;
  todayBuyQuantity: number;
  todaySellQuantity: number;
  todayGrossAmount: number;
  strategyCount: number;
  enabledStrategyCount: number;
  lastOrderAt?: string | null;
  lastExecutionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string | null;
};

export type AutoParticipantProfileSymbolHolding = {
  symbol: string;
  holderCount: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  marketValue: number;
  unrealizedProfit: number;
};

export type AutoParticipantProfileOverview = {
  profileType: AutoParticipantProfileType;
  totalCount: number;
  enabledCount: number;
  disabledCount: number;
  accountCount: number;
  availableCash: number;
  reservedBuyCash: number;
  holdingMarketValue: number;
  estimatedTotalAsset: number;
  netCashFlow: number;
  totalProfit: number;
  returnRate: number | null;
  returnRateStatus: PortfolioReturnRateStatus;
  holdingCount: number;
  totalHoldingQuantity: number;
  reservedSellQuantity: number;
  openOrderCount: number;
  openBuyOrderCount: number;
  openSellOrderCount: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  todayExecutionCount: number;
  todayBuyQuantity: number;
  todaySellQuantity: number;
  todayGrossAmount: number;
  strategyCount: number;
  enabledStrategyCount: number;
  lastOrderAt?: string | null;
  lastExecutionAt?: string | null;
  symbolHoldings: AutoParticipantProfileSymbolHolding[];
};

export type PortfolioReturnRateStatus =
  | "DEFINED"
  | "UNDEFINED_ZERO_CONTRIBUTION"
  | "UNDEFINED_NEGATIVE_CONTRIBUTION"
  | "LEGACY_UNVERIFIED";

export type AutoParticipantPerformanceBasis = "LIVE_ESTIMATE" | "LATEST_CLOSED";

export type AutoParticipantPerformanceMetric = {
  accountCount: number;
  eligibleAccountCount: number;
  undefinedAccountCount: number;
  totalAsset: number;
  netContribution: number;
  totalProfit: number;
  aggregateReturnRate: number | null;
  medianAccountReturnRate: number | null;
  profitableAccountCount: number;
  profitableAccountRate: number | null;
};

export type AutoParticipantPerformanceSummary = {
  basis: AutoParticipantPerformanceBasis;
  businessDate: string | null;
  calculatedAt: string | null;
  calculationMethod: "NET_CONTRIBUTION_RETURN";
  closeCycleId: number | null;
  total: AutoParticipantPerformanceMetric;
};

export type AutoParticipantCashAdjustment = {
  userKey: string;
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  amount: number;
  cashBalance: number;
  updatedAt: string;
};

export type BatchJobRuntimeStatus = {
  jobName: string;
  schedulerConfigured: boolean;
  runtimeEnabled: boolean;
  effectiveEnabled: boolean;
  updatedBy?: string | null;
  updatedAt?: string | null;
};

export type StockBatchJobRun = {
  job: string;
  status: string;
  executionMode: string;
  processedCount: number;
  message: string;
  startedAt: string;
  completedAt: string | null;
};

export type EodBusinessState = {
  activeBusinessDate: string;
  preparingBusinessDate?: string | null;
  rawSimulationDate: string;
  rawSimulationDateTime?: string | null;
  version: number;
  updatedAt: string;
};

export type EodMarketState = {
  enabledSymbolCount: number;
  openSymbolCount: number;
  orderEntryOpen: boolean;
};

export type EodCycle = {
  id: number;
  businessDate: string;
  cycleKind: "TRADING" | "SKIPPED";
  skipReason?: string | null;
  phase: string;
  status: string;
  phaseRevision: number;
  attemptCount: number;
  closeRunId?: number | null;
  settlementEligibleAt?: string | null;
  ownerId?: string | null;
  leaseUntil?: string | null;
  nextRetryAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  buildVersion?: string | null;
  schemaVersion?: string | null;
  eodContractVersion?: string | null;
  createdAt: string;
  updatedAt: string;
  closeRunStatus?: string | null;
  closedAt?: string | null;
  closeRunCompletedAt?: string | null;
};

export type EodCycleMetrics = {
  capturedOpenOrderCount: number;
  cancelledOrderCount: number;
  releasedBuyCash: number;
  releasedSellQuantity: number;
  settlementTargetAccountCount: number;
  accountSnapshotCount: number;
  holdingSnapshotCount: number;
  priceSnapshotCount: number;
  openOrderSummaryCount: number;
  reconciliationMismatchCount: number;
  settledAccountCount: number;
  settlementMissingAccountCount: number;
  updatedAt: string;
};

export type EodPhaseAttempt = {
  id: number;
  phase: string;
  attemptNo: number;
  batchJobExecutionId?: number | null;
  ownerId: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  buildVersion?: string | null;
  schemaVersion?: string | null;
  eodContractVersion?: string | null;
};

export type EodReadinessCheck = {
  checkCode: string;
  displayOrder: number;
  status: "PASSED" | "FAILED" | string;
  failureCount: number;
  message?: string | null;
  checkedAt: string;
};

export type EodSignal = {
  id: number;
  signalType: string;
  jobName: string;
  executionMode: string;
  status: string;
  requestedAt: string;
  eligibleAt?: string | null;
  nextAttemptAt: string;
  attemptCount: number;
  maxAttempts: number;
  processedCount?: number | null;
  message?: string | null;
  errorMessage?: string | null;
  completedAt?: string | null;
};

export type EodOperationsOverview = {
  generatedAt: string;
  businessState?: EodBusinessState | null;
  marketState: EodMarketState;
  cycle?: EodCycle | null;
  metrics?: EodCycleMetrics | null;
  readinessChecks: EodReadinessCheck[];
  latestAttempt?: EodPhaseAttempt | null;
  latestSignal?: EodSignal | null;
};

export type EodPhaseRetryResult = {
  cycleId: number;
  businessDate: string;
  phase: string;
  previousStatus: string;
  status: string;
  attemptCount: number;
  requestedBy: string;
  requestedAt: string;
};

export type AutoParticipantSymbolConfig = {
  userKey: string;
  symbol: string;
  enabled: boolean;
  intensity: number;
  updatedAt: string;
};

export type AutoParticipantProfileConfig = {
  profileType: AutoParticipantProfileType;
  behaviorModelVersion: AutoParticipantBehaviorModelVersion;
  newsWeight: number;
  momentumWeight: number;
  contrarianWeight: number;
  lossAversionWeight: number;
  herdingWeight: number;
  marketMakingWeight: number;
  overconfidenceWeight: number;
  noiseWeight: number;
  panicSellWeight: number;
  dipBuyWeight: number;
  orderMultiplier: number;
  decisionFrequencyMultiplier: number;
  ordersPerDecisionMultiplier: number;
  aggressionMultiplier: number;
  pricePressureSensitivity: number;
  orderTtlMultiplier: number;
  quantityMultiplier: number;
  holdingPatienceWeight: number;
  deepLossHoldWeight: number;
  profitTakingWeight: number;
  pricingMode: AutoParticipantProfilePricingMode;
  exitMode: AutoParticipantProfileExitMode;
  inventoryMode: AutoParticipantProfileInventoryMode;
  recurringDepositAmount: number;
  recurringDepositIntervalValue: number;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
  recurringDepositIntervalDays: number;
  fundingPolicy: {
    recurringDepositAmount: number;
    recurringDepositIntervalValue: number;
    recurringDepositIntervalUnit: RecurringCashIntervalUnit;
    recurringDepositIntervalDays: number;
  };
  customized: boolean;
  updatedAt?: string | null;
};

export type AutoParticipantV3Operations = {
  simulationTradeDate: string;
  policies: Array<{
    policyVersion: number;
    status: "ACTIVE" | "SCHEDULED";
    effectiveTradeDate: string;
    runtimeEnabled: boolean;
    policyJson: string;
    createdBy: string;
    createdAt: string;
    activatedAt?: string | null;
    retiredAt?: string | null;
    runtimeChangeReason?: string | null;
    runtimeChangedBy?: string | null;
    runtimeChangedAt?: string | null;
  }>;
  dailySummary: {
    accountCount: number;
    offlineAccountCount: number;
    submittedOrderCount: number;
    submittedNotional: number;
    observedExecutionCount: number;
    observedExecutionNotional: number;
    observedCancelCount: number;
    averageFatigueScore: number;
  };
  accountStates: Array<{
    accountId: number;
    userKey: string;
    profileType: AutoParticipantProfileType;
    policyVersion: number;
    activityState: "OFFLINE" | "LOW" | "NORMAL" | "HIGH";
    activitySession: string;
    eventSequence: number;
    fatigueScore: number;
    submittedOrderCount: number;
    submittedNotional: number;
    observedExecutionCount: number;
    observedExecutionNotional: number;
    observedCancelCount: number;
    lastResultReason?: string | null;
    lastHoldReason?: string | null;
    nextAttentionAt?: string | null;
    nextGuardAt?: string | null;
    nextRunAt?: string | null;
    updatedAt: string;
  }>;
  incompleteLiquidationPlanCount: number;
};

export type AutoMarketStatus = {
  enabled: boolean;
  configCount: number;
  participantCount: number;
  participantProfileConfigCount: number;
  enabledParticipantCount: number;
  salaryEligibleParticipantCount: number;
  openAutoOrderCount: number;
  todayAutoExecutionCount: number;
  configs: AutoMarketConfig[];
  participants: AutoParticipant[];
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  participantProfileConfigs: AutoParticipantProfileConfig[];
};
