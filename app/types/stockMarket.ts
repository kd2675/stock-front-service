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
  buyVolume: number;
  sellVolume: number;
  buyTurnover: number;
  sellTurnover: number;
  executionStrength: number;
  lastPrice: number;
  lastExecutedAt?: string | null;
};

export type OrderBookRecentExecution = {
  id: number;
  symbol: string;
  side: OrderSide;
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
export type CorporateActionEntitlementStatus = "ANNOUNCED" | "SUBSCRIBED" | "EXPIRED" | "PAID";

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
  category: "MANUAL_PARTICIPANT" | "AUTO_PARTICIPANT" | "LISTING_UNDERWRITER";
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
