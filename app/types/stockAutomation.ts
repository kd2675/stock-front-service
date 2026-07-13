export type ListingAutoPosition = "SELL_ONLY" | "BUY_ONLY" | "TWO_SIDED";

export type ListingAutoPriceDirection = "UP" | "DOWN" | "RANDOM";

export type AutoMarketPriceDirection = "UP" | "DOWN" | "NEUTRAL";

export type AutoMarketAssetPreference = "STOCK" | "CASH" | "BALANCED";

export type AutoMarketRegimePhase = "OPENING" | "MIDDAY";

export type AutoMarketRegimeModifier = {
  modifierWindowStartAt: string;
  priceDirectionModifier: number;
  assetPreferenceModifier: number;
  directionIntensityModifier: number;
  volatilityModifier: number;
  liquidityModifier: number;
  executionAggressionModifier: number;
  seed: string;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketDailyRegime = {
  symbol: string;
  simulationTradeDate: string;
  regimePhase: AutoMarketRegimePhase;
  priceDirection: AutoMarketPriceDirection;
  assetPreference: AutoMarketAssetPreference;
  directionIntensity: number;
  volatilityLevel: number;
  liquidityLevel: number;
  executionAggressionLevel: number;
  seed: string;
  currentModifier?: AutoMarketRegimeModifier | null;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketConfig = {
  symbol: string;
  enabled: boolean;
  intensity: number;
  maxOrderQuantity: number;
  orderTtlSeconds: number;
  dailyRegime?: AutoMarketDailyRegime | null;
};

export type AutoParticipantProfileType =
  | "NEWS_REACTIVE"
  | "MOMENTUM_FOLLOWER"
  | "CONTRARIAN"
  | "LOSS_AVERSE"
  | "OVERCONFIDENT"
  | "HERD_FOLLOWER"
  | "MARKET_MAKER"
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

export type AutoParticipant = {
  userKey: string;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  recurringCashAmount?: number | null;
  recurringCashIntervalValue?: number | null;
  recurringCashIntervalUnit?: RecurringCashIntervalUnit | null;
  accountId?: number | null;
  accountStatus?: string | null;
  cashBalance?: number | null;
  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string | null;
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
  returnRate: number;
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
  returnRate: number;
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

export type AutoParticipantSymbolConfig = {
  userKey: string;
  symbol: string;
  enabled: boolean;
  intensity: number;
  updatedAt: string;
};

export type AutoParticipantProfileConfig = {
  profileType: AutoParticipantProfileType;
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
  aggressionMultiplier: number;
  orderTtlMultiplier: number;
  quantityMultiplier: number;
  holdingPatienceWeight: number;
  deepLossHoldWeight: number;
  profitTakingWeight: number;
  recurringDepositAmount: number;
  recurringDepositIntervalValue: number;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
  recurringDepositIntervalDays: number;
  customized: boolean;
  updatedAt?: string | null;
};

export type ListingAutoAccount = {
  symbol: string;
  userKey: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  issuedShares: number;
  accountId: number | null;
  cashBalance: number;
  holdingQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  maxOrderQuantity: number;
  orderTtlSeconds: number;
  priceOffsetTicks: number;
  targetBuyQuantity: number;
  targetSellQuantity: number;
  targetHoldingQuantity: number;
  inventoryBandQuantity: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  buyPriceOffsetDirection: ListingAutoPriceDirection;
  sellPriceOffsetDirection: ListingAutoPriceDirection;
  createdAt: string;
  updatedAt: string;
};

export type AutoMarketStatus = {
  enabled: boolean;
  configCount: number;
  participantCount: number;
  participantProfileConfigCount: number;
  listingAutoAccountCount: number;
  enabledParticipantCount: number;
  salaryEligibleParticipantCount: number;
  openAutoOrderCount: number;
  todayAutoExecutionCount: number;
  configs: AutoMarketConfig[];
  participants: AutoParticipant[];
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  participantProfileConfigs: AutoParticipantProfileConfig[];
  listingAutoAccounts: ListingAutoAccount[];
};
