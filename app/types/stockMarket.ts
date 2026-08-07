export type Instrument = {
  symbol: string;
  name: string;
  market: string;
};

export type OrderBookInstrument = {
  symbol: string;
  name: string;
  market: string;
  initialPrice: number;
  issuedShares: number;
  tradableShares: number;
  tickSize: number;
  priceLimitRate: number;
  priceLimitBase: number;
  currentPrice: number;
  priceTime: string;
  priceProvider: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Price = {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  changeRate: number;
  priceTime: string;
  provider: string;
};

export type PriceStreamEvent = {
  symbol: string;
  currentPrice: number;
  priceTime: string;
  provider: string;
};

export type PriceTick = {
  symbol: string;
  price: number;
  provider: string;
  priceTime: string;
};

export type ScaledMarketObservedSymbol = {
  symbol: string;
  issuedShares: number;
  tradableShares: number;
  closePrice: number;
  previousClose: number;
  marketCapitalization: number;
  previousMarketCapitalization: number;
  dailyVolume: number;
  dailyTurnover: number;
};

export type ScaledMarketObservedMarket = {
  closeRunId?: number | null;
  businessDate?: string | null;
  completedAt?: string | null;
  symbolCount: number;
  issuedShares: number;
  tradableShares: number;
  marketCapitalization: number;
  dailyVolume: number;
  dailyTurnover: number;
  symbols: ScaledMarketObservedSymbol[];
};

export type ScaledMarketIndex = {
  name: string;
  calculationMethod: "CONTRACT_FIXED_SHARE_MARKET_CAP_WEIGHTED";
  contractVersion: number;
  referenceMarket: string;
  referenceDate: string;
  businessDate: string;
  constituentCount: number;
  expectedConstituentCount: number;
  complete: boolean;
  baseValue: number;
  previousCloseValue: number;
  currentValue: number;
  changeValue: number;
  changeRate: number;
  referenceMarketCapitalization: number;
  previousCloseMarketCapitalization: number;
  currentMarketCapitalization: number;
};

export type ScaledMarketSymbolTarget = {
  symbol: string;
  targetIssuedShareWeight: number;
  targetMarketCapWeight: number;
  targetIssuedShares: number;
  targetTradableShares: number;
  targetReferencePrice: number;
  targetMarketCapitalization: number;
  targetDailyVolume: number;
  preRebaseIssuedShares?: number | null;
  preRebaseTradableShares?: number | null;
  preRebaseReferencePrice?: number | null;
  distributedTradableShareRate: number;
  lifecycleStatus: "PREPARING" | "PRE_OPEN" | "MATURE" | "STRESS" | "RETIRED";
  activationBusinessDate?: string | null;
};

export type ScaledMarketContract = {
  contractVersion: number;
  referenceMarket: string;
  referenceDate: string;
  baselineCloseRunId?: number | null;
  baselineBusinessDate?: string | null;
  marketScaleRate: number;
  targetMatureSymbolCount: number;
  targetIssuedShares: number;
  targetMarketCapitalization: number;
  targetDailyVolume: number;
  targetDailyTurnoverLower: number;
  targetDailyTurnoverUpper: number;
  effectiveBusinessDate?: string | null;
  shareRebasePlanId?: number | null;
  priceCapitalRebasePlanId?: number | null;
  roleCapacityPlanId?: number | null;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "RETIRED";
  changeReason: string;
  createdBy: string;
  createdAt: string;
  scheduleReason?: string | null;
  scheduledBy?: string | null;
  scheduledAt?: string | null;
  activatedAt?: string | null;
  population?: {
    engineParticipantCount: number;
    targetAutoSubmittedOrderCount: number;
    targetAutoParticipantAum: number;
    targetAutoParticipantAumRate: number;
    capitalBasis: string;
  } | null;
  symbolTargets: ScaledMarketSymbolTarget[];
  reconciliation: {
    targetRowCount: number;
    matureSymbolCount: number;
    issuedShareWeightSum: number;
    marketCapWeightSum: number;
    symbolTargetIssuedShares: number;
    symbolTargetMarketCapitalization: number;
    symbolTargetDailyVolume: number;
    matureSymbolCountMatched: boolean;
    issuedShareWeightMatched: boolean;
    marketCapWeightMatched: boolean;
    issuedSharesMatched: boolean;
    marketCapitalizationMatched: boolean;
    dailyVolumeMatched: boolean;
    preRebaseSourceContractComplete: boolean;
    populationContractPresent: boolean;
    populationContractMatched: boolean;
    reconciled: boolean;
  };
};

export type ScaledMarketOverview = {
  activeBusinessDate: string;
  observedMarket: ScaledMarketObservedMarket;
  marketIndex?: ScaledMarketIndex | null;
  activeContract?: ScaledMarketContract | null;
  draftContracts: ScaledMarketContract[];
  scheduledContracts: ScaledMarketContract[];
};

export type ScaledMarketRebasePreview = {
  contractVersion: number;
  contractStatus: string;
  baselineCloseRunId?: number | null;
  baselineBusinessDate?: string | null;
  activeBusinessDate: string;
  aggregateGap: {
    baselineSymbolCount: number;
    currentInstrumentCount: number;
    targetSymbolCount: number;
    baselineIssuedShares: number;
    currentIssuedShares: number;
    targetIssuedShares: number;
    issuedShareGapFromBaseline: number;
    issuedShareGapFromCurrent: number;
    baselineTradableShares: number;
    currentTradableShares: number;
    targetTradableShares: number;
    tradableShareGapFromBaseline: number;
    tradableShareGapFromCurrent: number;
    baselineMarketCapitalization: number;
    currentMarketCapitalization: number;
    targetMarketCapitalization: number;
    marketCapitalizationGapFromBaseline: number;
    marketCapitalizationGapFromCurrent: number;
    baselineDailyVolume: number;
    targetDailyVolume: number;
    dailyVolumeGapFromBaseline: number;
    issuedShareMultiplier: number | null;
    currentIssuedShareMultiplier: number | null;
    weightedPriceMultiplier: number | null;
    currentWeightedPriceMultiplier: number | null;
    marketCapitalizationMultiplier: number | null;
    currentMarketCapitalizationMultiplier: number | null;
    dailyVolumeMultiplier: number | null;
  };
  preconditions: {
    draftContract: boolean;
    baselinePinned: boolean;
    baselineRunCompleted: boolean;
    baselineDateMatched: boolean;
    targetAggregateReconciled: boolean;
    allTargetInstrumentsPresent: boolean;
    preRebaseSourceContractComplete: boolean;
    currentStructureMatchesExpectedSource: boolean;
    currentHoldingsReconciled: boolean;
    underwriterFloatCleared: boolean;
    allTargetMarketsClosed: boolean;
    openOrderCount: number;
    activeIntentCount: number;
    pendingCorporateActionCount: number;
    reservedHoldingCount: number;
    underwriterResidualQuantity: number;
    shareRebaseReady: boolean;
  };
  symbols: Array<{
    symbol: string;
    baselinePresent: boolean;
    currentInstrumentPresent: boolean;
    preRebaseIssuedShares?: number | null;
    preRebaseTradableShares?: number | null;
    preRebaseReferencePrice?: number | null;
    baselineIssuedShares: number;
    currentIssuedShares: number;
    targetIssuedShares: number;
    issuedShareGapFromBaseline: number;
    issuedShareGapFromCurrent: number;
    baselineTradableShares: number;
    currentTradableShares: number;
    targetTradableShares: number;
    tradableShareGapFromBaseline: number;
    tradableShareGapFromCurrent: number;
    baselineClosePrice: number;
    currentInitialPrice: number;
    currentPrice: number;
    targetReferencePrice: number;
    baselineMarketCapitalization: number;
    currentMarketCapitalization: number;
    targetMarketCapitalization: number;
    baselineDailyVolume: number;
    targetDailyVolume: number;
    baselineHolderCount: number;
    currentHolderCount: number;
    currentHoldingQuantity: number;
    currentReservedQuantity: number;
    underwriterResidualQuantity: number;
    issuedShareMultiplier: number | null;
    currentIssuedShareMultiplier: number | null;
    priceMultiplier: number | null;
    currentPriceMultiplier: number | null;
    marketCapitalizationMultiplier: number | null;
    currentMarketCapitalizationMultiplier: number | null;
    dailyVolumeMultiplier: number | null;
    currentMatchesExpectedSourceStructure: boolean;
    currentMatchesTargetStructure: boolean;
    currentHoldingReconciled: boolean;
    underwriterFloatCleared: boolean;
    requiresNewListing: boolean;
  }>;
};

export type ScaledMarketShareRebasePlan = {
  planId: number;
  contractVersion: number;
  rebaseStage: "SHARE_STRUCTURE";
  status: "DRAFT" | "SCHEDULED" | "APPLYING" | "APPLIED" | "FAILED" | "CANCELLED";
  sourceCloseRunId: number;
  sourceBusinessDate: string;
  sourceStateVersion: number;
  targetNumericValue: number;
  targetNumericUnit: "SHARES";
  changeReason: string;
  createdBy: string;
  createdAt: string;
  effectiveBusinessDate?: string | null;
  scheduledAt?: string | null;
  scheduledBy?: string | null;
  appliedAt?: string | null;
  failedAt?: string | null;
  failureMessage?: string | null;
  symbolPlanCount: number;
  holdingPlanCount: number;
  sourceHoldingQuantity: number;
  targetHoldingQuantity: number;
  targetHoldingQuantityReconciled: boolean;
  capitalCapacityPlanCount: number;
  projectedTargetAum: number;
  projectedTargetHoldingMarketValue: number;
  projectedCashHeadroom: number;
  projectedCapitalCapacityReconciled: boolean;
  capitalCapacity: Array<{
    participantCategory: string;
    capitalBasis: string;
    currentAccountCount: number;
    baselineAccountCount: number;
    sourceCash: number;
    baselineAum: number;
    targetAumRate: number | null;
    targetAum: number;
    projectedTargetHoldingMarketValue: number;
    projectedCashHeadroom: number;
    cashDelta: number;
  }>;
  symbols: Array<{
    symbol: string;
    sourceIssuedShares: number;
    sourceTradableShares: number;
    sourceReferencePrice: number;
    sourceHoldingQuantity: number;
    sourceHolderCount: number;
    sourceReservedQuantity: number;
    sourceUnderwriterQuantity: number;
    targetIssuedShares: number;
    targetTradableShares: number;
    targetReferencePrice: number;
    targetMarketCapitalization: number;
    issuedShareDelta: number;
    tradableShareDelta: number;
    currentHoldingReconciled: boolean;
    currentStructureMatchesSource: boolean;
  }>;
};

export type ScaledMarketPriceCapitalRebasePlan = {
  planId: number;
  contractVersion: number;
  rebaseStage: "PRICE_CAPITAL";
  status: "DRAFT" | "SCHEDULED" | "APPLYING" | "APPLIED" | "FAILED" | "CANCELLED";
  sourceCloseRunId: number;
  sourceBusinessDate: string;
  sourceStateVersion: number;
  targetNumericValue: number;
  targetNumericUnit: "WEIGHTED_PRICE_KRW";
  changeReason: string;
  createdBy: string;
  createdAt: string;
  effectiveBusinessDate?: string | null;
  scheduledAt?: string | null;
  scheduledBy?: string | null;
  appliedAt?: string | null;
  failedAt?: string | null;
  failureMessage?: string | null;
  symbolPlanCount: number;
  holdingPlanCount: number;
  accountPlanCount: number;
  sourceMarketCapitalization: number;
  targetMarketCapitalization: number;
  sourceCash: number;
  targetCash: number;
  cashDelta: number;
  baselineAum: number;
  targetAum: number;
  targetMarketCapitalizationReconciled: boolean;
  targetCashReconciled: boolean;
};

export type ScaledMarketRoleCapacityPlan = {
  planId: number;
  contractVersion: number;
  priceCapitalRebasePlanId: number;
  status: "DRAFT" | "SCHEDULED" | "APPLYING" | "APPLIED" | "FAILED" | "CANCELLED";
  sourceCloseRunId: number;
  sourceBusinessDate: string;
  sourceStateVersion: number;
  effectiveBusinessDate?: string | null;
  targetDailyVolume: number;
  targetLiquidityMandateCount: number;
  targetAutoMarketConfigCount: number;
  targetInstitutionPortfolioCount: number;
  targetInstitutionMandateCount: number;
  targetInstitutionGrossParticipationRate: number;
  minimumInstitutionBuyParticipationRate: number;
  minimumInstitutionSellParticipationRate: number;
  changeReason: string;
  createdBy: string;
  createdAt: string;
  scheduledAt?: string | null;
  scheduledBy?: string | null;
  appliedAt?: string | null;
  failedAt?: string | null;
  failureMessage?: string | null;
  automaticMarketConfigs: Array<{
    symbol: string;
    sourceEnabled: boolean;
    sourceMaxOrderQuantity: number;
    targetMaxOrderQuantity: number;
    sourceOrderTtlSeconds: number;
    sourceTradableShares: number;
    targetTradableShares: number;
    maxOrderFloatRate: number;
    targetDailyVolume: number;
  }>;
  liquidityProviders: Array<{
    mandateId: number;
    accountId: number;
    symbol: string;
    sourcePolicyVersion: number;
    targetPolicyVersion: number;
    sourceReferenceDailyVolume: number;
    targetReferenceDailyVolume: number;
    sourceMaxOrderQuantity: number;
    targetMaxOrderQuantity: number;
    sourceTargetInventoryQuantity: number;
    targetTargetInventoryQuantity: number;
    sourceInventoryBandQuantity: number;
    targetInventoryBandQuantity: number;
    sourceDailyLossLimitAmount: number;
    targetDailyLossLimitAmount: number;
    sourceTradableShares: number;
    targetTradableShares: number;
    sourceAccountNav: number;
    targetAccountNav: number;
    inventoryBandFloatRate: number;
    dailyLossNavRate: number;
  }>;
  institutions: Array<{
    portfolioId: number;
    accountId: number;
    portfolioCode: string;
    investmentStyle: string;
    sourcePolicyVersion: number;
    targetPolicyVersion: number;
    symbol: string;
    sourceMandateId?: number | null;
    sourceBaseSymbolWeight?: number | null;
    targetBaseSymbolWeight: number;
    sourceMaxPortfolioAllocationRate?: number | null;
    targetMaxPortfolioAllocationRate: number;
    sourceReferenceDailyVolume?: number | null;
    targetReferenceDailyVolume: number;
    sourceDailyParticipationRate?: number | null;
    targetDailyParticipationRate: number;
    targetMinPortfolioAllocationRate: number;
    targetPricePressureSensitivity: number;
    targetMomentumSensitivity: number;
    targetValueSensitivity: number;
    targetReportSensitivity: number;
  }>;
};

export type ScaledMarketSymbolMaturityChange = {
  changeId: number;
  contractVersion: number;
  symbol: string;
  sourceLifecycleStatus: string;
  targetLifecycleStatus: "MATURE";
  sourceContractDistributedShareRate: number;
  observedDistributedShareRate: number;
  sourceIssuedShares: number;
  sourceTradableShares: number;
  sourceUnderwriterQuantity: number;
  sourceCloseRunId: number;
  sourceBusinessDate: string;
  effectiveBusinessDate: string;
  changeReason: string;
  changedBy: string;
  createdAt: string;
};

export type ScaledMarketContractSchedule = {
  contractVersion: number;
  status: "SCHEDULED";
  effectiveBusinessDate: string;
  shareRebasePlanId: number;
  shareRebasePlanStatus: string;
  priceCapitalRebasePlanId: number;
  priceCapitalRebasePlanStatus: string;
  roleCapacityPlanId: number;
  roleCapacityPlanStatus: string;
  targetSymbolCount: number;
  matureSymbolCount: number;
  targetIssuedShares: number;
  targetMarketCapitalization: number;
  targetDailyVolume: number;
  engineParticipantCount: number;
  targetAutoSubmittedOrderCount: number;
  scheduleReason: string;
  scheduledBy: string;
  scheduledAt: string;
};

export type SimulationClock = {
  simulationDate: string;
  simulationDateTime: string;
  simulationDayStart: string;
  marketSession: "PRE_OPEN" | "REGULAR" | "AFTER_CLOSE";
  marketOpenTime: string;
  marketCloseTime: string;
  preOpenTransformTime: string;
  autoMarketPreparationTime: string;
  activeBusinessDate: string;
  preparingBusinessDate?: string | null;
  postClosePhase?: string | null;
  postCloseStatus?: string | null;
  postCloseProcessingCompleted: boolean;
  marketOpenReady: boolean;
  availableJumpActions: SimulationClockJumpAction[];
  realSecondsPerSimulationDay: number;
  running: boolean;
  stale: boolean;
  accumulatedRealSeconds: number;
  lastStartedAt?: string | null;
  lastHeartbeatAt?: string | null;
};

export type SimulationClockJumpAction =
  | "TODAY_MARKET_CLOSE"
  | "NEXT_SIMULATION_DAY_START"
  | "NEXT_PREOPEN_TRANSFORM_START"
  | "NEXT_AUTO_MARKET_PREPARATION_START"
  | "NEXT_MARKET_OPEN";

export type OrderSide = "BUY" | "SELL";
export type MarketType = "VIRTUAL_PRICE" | "ORDER_BOOK";
export type MarketSessionStatus = "OPEN" | "CLOSED" | "HALTED" | "CIRCUIT_BREAKER";

export type OrderBookLevel = {
  price: number;
  quantity: number;
  orderCount: number;
};

export type OrderBook = {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
};

export type OrderBookTradeSummary = {
  symbol: string;
  todayExecutionCount: number;
  todayVolume: number;
  todayTurnover: number;
  vwap: number;
  highPrice: number;
  lowPrice: number;
  lastPrice: number;
  lastExecutedAt?: string | null;
};

export type OrderBookRecentExecution = {
  id: number;
  symbol: string;
  quantity: number;
  price: number;
  grossAmount: number;
  priceChange: number;
  executedAt: string;
};

export type OrderBookCandleInterval = "1M" | "5M" | "15M" | "1H" | "1D" | "1W";

export type OrderBookCandle = {
  symbol: string;
  interval: OrderBookCandleInterval;
  bucketStart: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  turnover: number;
  executionCount: number;
  hasExecution: boolean;
};

export type CorporateActionType = "INITIAL_ISSUE" | "PAID_IN_CAPITAL_INCREASE" | "STOCK_SPLIT" | "CASH_DIVIDEND" | "BONUS_ISSUE" | "STOCK_DIVIDEND" | "DELISTING";
export type CorporateActionStatus = "ANNOUNCED" | "EX_RIGHTS_APPLIED" | "PAID" | "LISTED" | "DELISTED";
export type CapitalIncreaseOfferingType = "SHAREHOLDER_ALLOCATION" | "PUBLIC_OFFERING";
export type CorporateActionEntitlementStatus = "ANNOUNCED" | "PARTIALLY_SUBSCRIBED" | "SUBSCRIBED" | "EXPIRED" | "PAID";

export type CorporateAction = {
  id: number;
  symbol: string;
  actionType: CorporateActionType;
  shareQuantity?: number | null;
  subscribedShareQuantity?: number | null;
  remainingShareQuantity?: number | null;
  issuePrice?: number | null;
  dividendAmount?: number | null;
  status: CorporateActionStatus;
  basePrice?: number | null;
  theoreticalExRightsPrice?: number | null;
  exRightsDate?: string | null;
  recordDate?: string | null;
  entitlementCloseCycleId?: number | null;
  entitlementCloseRunId?: number | null;
  paymentDate?: string | null;
  listingDate?: string | null;
  delistingDate?: string | null;
  delistingTreatment?: "ZERO_VALUE" | null;
  offeringType?: CapitalIncreaseOfferingType | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  appliedAt?: string | null;
  paidAt?: string | null;
  listedAt?: string | null;
  splitFrom?: number | null;
  splitTo?: number | null;
  description?: string | null;
  createdAt: string;
};

export type CashDividendGuidanceHistory = {
  actionId: number;
  status: CorporateActionStatus;
  originalDividendPerShare: number;
  splitAdjustedDividendPerShare: number;
  basePrice?: number | null;
  dividendYield?: number | null;
  actualPaidCash: number;
  eligibleShareQuantity: number;
  exRightsDate?: string | null;
  paymentDate?: string | null;
};

export type CashDividendGuidance = {
  symbol: string;
  referencePrice: number;
  referencePriceBasis: "PREVIOUS_CLOSE" | "CURRENT_PRICE";
  issuedShares: number;
  tradableShares: number;
  recentHoldingQuantity?: number | null;
  holdingReferenceCloseRunId?: number | null;
  holdingReferenceBusinessDate?: string | null;
  completedDividendCount: number;
  history: CashDividendGuidanceHistory[];
};

export type CorporateActionEntitlement = {
  id: number;
  accountId: number;
  actionId: number;
  symbol: string;
  actionType?: CorporateActionType | null;
  quantity: number;
  shareQuantity?: number | null;
  cashAmount?: number | null;
  subscribedShareQuantity?: number | null;
  subscribedCashAmount?: number | null;
  forfeitedShareQuantity?: number | null;
  status: CorporateActionEntitlementStatus;
  createdAt: string;
  subscribedAt?: string | null;
  paidAt?: string | null;
};

export type InstrumentReportEventType = "PUBLISH" | "UPDATE" | "DELETE";

export type InstrumentReport = {
  id: number;
  symbol: string;
  eventType: InstrumentReportEventType;
  title?: string | null;
  summary?: string | null;
  score?: number | null;
  riseReason?: string | null;
  fallReason?: string | null;
  deleteReason?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

export type InstrumentDailyMarketSnapshot = {
  tradeCount: number;
  volume: number;
  turnover: number;
  turnoverRate: number;
  vwap: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  lastPrice: number;
  lastExecutedAt?: string | null;
};

export type InstrumentDailyHistoryPoint = {
  tradeDate: string;
  closePrice: number;
  volume: number;
  turnover: number;
  issuedShares: number;
  tradableShares: number;
  reportDate: boolean;
};

export type InstrumentPerformanceAnalytics = {
  availableTradingDays: number;
  return5Days?: number | null;
  return20Days?: number | null;
  return60Days?: number | null;
  highPrice20Days: number;
  lowPrice20Days: number;
  drawdownFrom20DayHigh: number;
  dailyVolatility20Days?: number | null;
  averageVolume20Days?: number | null;
  volumeVsAverage20Days?: number | null;
  averageTurnover20Days?: number | null;
  turnoverVsAverage20Days?: number | null;
  averageTurnoverRate20Days?: number | null;
  closeTrend20Days: "UP" | "DOWN" | "FLAT" | "INSUFFICIENT_DATA";
  consecutiveUpDays: number;
  consecutiveDownDays: number;
  dailyHistory: InstrumentDailyHistoryPoint[];
};

export type InstrumentTradingActivityAnalytics = {
  executionCount20Days: number;
  executionQuantity20Days: number;
  averageExecutionQuantity20Days?: number | null;
  averageSecondsBetweenTrades20Days?: number | null;
};

export type InstrumentInvestorCategoryFlow = {
  category:
    | "MANUAL_PARTICIPANT"
    | "AUTO_PARTICIPANT"
    | "INSTITUTIONAL_INVESTOR"
    | "LIQUIDITY_PROVIDER"
    | "ISSUE_UNDERWRITER"
    | "SYSTEM_CUSTODY";
  buyQuantity: number;
  sellQuantity: number;
  netQuantity: number;
  buyAmount: number;
  sellAmount: number;
  netCashFlow: number;
  buySellRatio?: number | null;
  executionShareRate: number;
};

export type InstrumentInvestorFlowWindow = {
  window: "1D" | "5D" | "20D";
  tradingDays: number;
  startDate: string;
  endDate: string;
  categories: InstrumentInvestorCategoryFlow[];
};

export type InstrumentInvestorFlowAnalytics = {
  windows: InstrumentInvestorFlowWindow[];
  autoParticipantExecutionShareRateLatestTradingDay: number;
  topAccountExecutionShareRate20Days: number;
};

export type InstrumentShareHistoryPoint = {
  tradeDate: string;
  issuedShares: number;
  tradableShares: number;
  issuedShareChange: number;
  tradableShareChange: number;
};

export type InstrumentOwnershipAnalytics = {
  holderCount: number;
  accountedHoldingQuantity: number;
  holdingCoverageRate: number;
  topHolderQuantity: number;
  topHolderRate: number;
  topFiveHolderQuantity: number;
  topFiveHolderRate: number;
  issuedShareChange60Days: number;
  tradableShareChange60Days: number;
  shareHistory: InstrumentShareHistoryPoint[];
};

export type InstrumentCorporateActionMetric = {
  id: number;
  actionType: CorporateActionType;
  status: CorporateActionStatus;
  offeringType?: CapitalIncreaseOfferingType | null;
  shareQuantity: number;
  issuePrice?: number | null;
  basePrice?: number | null;
  theoreticalExRightsPrice?: number | null;
  issueDiscountRate?: number | null;
  newShareRate?: number | null;
  estimatedDilutionRate?: number | null;
  dividendPerShare?: number | null;
  dividendYield?: number | null;
  splitRatio?: number | null;
  exRightsDate?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  paymentDate?: string | null;
  listingDate?: string | null;
  delistingDate?: string | null;
  beforePrice?: number | null;
  afterPrice?: number | null;
  beforeIssuedShares?: number | null;
  afterIssuedShares?: number | null;
  beforeMarketCapitalization?: number | null;
  afterMarketCapitalization?: number | null;
  description?: string | null;
  createdAt: string;
};

export type InstrumentCorporateActionAnalytics = {
  announcedCount: number;
  completedCount: number;
  cumulativePaidDividendPerShare: number;
  cumulativePaidDividendCash: number;
  events: InstrumentCorporateActionMetric[];
};

export type InstrumentMetricRank = {
  rank: number;
  total: number;
  value?: number | null;
  lowerIsBetter: boolean;
};

export type InstrumentMarketPeer = {
  symbol: string;
  name: string;
  closePrice: number;
  marketCapitalization: number;
  changeRate: number;
};

export type InstrumentRankingAnalytics = {
  instrumentCount: number;
  marketCapitalization: InstrumentMetricRank;
  turnover: InstrumentMetricRank;
  volume: InstrumentMetricRank;
  returnRate: InstrumentMetricRank;
  turnoverRate: InstrumentMetricRank;
  volatility: InstrumentMetricRank;
  marketAverageReturnRate: number;
  relativeReturnRate: number;
  similarMarketCapitalizationPeers: InstrumentMarketPeer[];
};

export type InstrumentDataQuality = {
  level: "FULL" | "PARTIAL" | "LIMITED";
  notes: string[];
  limitations: string[];
  reportDate?: string | null;
  simulationDateTime: string;
  closePriceAsOf?: string | null;
  lastExecutionAt?: string | null;
  priceProvider?: string | null;
  executionSource: string;
  historicalTradingDays: number;
  historyStartDate?: string | null;
  historyEndDate?: string | null;
  hasReportDateTrades: boolean;
  reportDateMarketCloseCompleted: boolean;
  latestCompletedMarketCloseDate?: string | null;
  latestCompletedMarketCloseAt?: string | null;
};

export type InstrumentMarketAnalytics = {
  performance: InstrumentPerformanceAnalytics;
  tradingActivity: InstrumentTradingActivityAnalytics;
  investorFlow: InstrumentInvestorFlowAnalytics;
  ownership: InstrumentOwnershipAnalytics;
  corporateActions: InstrumentCorporateActionAnalytics;
  rankings: InstrumentRankingAnalytics;
  dataQuality: InstrumentDataQuality;
};

export type InstrumentMarketReport = {
  symbol: string;
  name: string;
  market: string;
  closePrice: number;
  previousClose: number;
  changeAmount: number;
  changeRate: number;
  initialPrice: number;
  returnSinceListing: number;
  issuedShares: number;
  tradableShares: number;
  tradableShareRate: number;
  marketCapitalization: number;
  tradableMarketCapitalization: number;
  priceLimitRate: number;
  lowerLimitPrice: number;
  upperLimitPrice: number;
  closePriceTime?: string | null;
  closePriceProvider?: string | null;
  closeRunId?: number | null;
  closeRunCompletedAt?: string | null;
  reportDate?: string | null;
  simulationDateTime: string;
  daily: InstrumentDailyMarketSnapshot;
  latestEvaluation?: InstrumentReport | null;
  analytics: InstrumentMarketAnalytics;
};

export type SymbolMarketConfig = {
  symbol: string;
  enabled: boolean;
  marketStatus: MarketSessionStatus;
};

export type OrderBookMarketStatus = {
  enabled: boolean;
  configCount: number;
  openConfigCount: number;
  instrumentCount: number;
  openOrderCount: number;
  todayExecutionCount: number;
  configs: SymbolMarketConfig[];
};
