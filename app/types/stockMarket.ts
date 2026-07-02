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
  realSecondsPerSimulationDay: number;
  running: boolean;
  stale: boolean;
  accumulatedRealSeconds: number;
  lastStartedAt?: string | null;
  lastHeartbeatAt?: string | null;
};

export type OrderSide = "BUY" | "SELL";
export type MarketType = "VIRTUAL_PRICE" | "ORDER_BOOK";
export type MarketSessionStatus = "OPEN" | "CLOSED" | "HALTED";

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

export type CorporateActionType = "INITIAL_ISSUE" | "PAID_IN_CAPITAL_INCREASE" | "ADDITIONAL_ISSUE" | "STOCK_SPLIT" | "CASH_DIVIDEND" | "BONUS_ISSUE" | "STOCK_DIVIDEND" | "DELISTING";
export type CorporateActionStatus = "ANNOUNCED" | "EX_RIGHTS_APPLIED" | "PAID" | "LISTED" | "DELISTED";
export type CorporateActionEntitlementStatus = "ANNOUNCED" | "PAID";

export type CorporateAction = {
  id: number;
  symbol: string;
  actionType: CorporateActionType;
  shareQuantity?: number | null;
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
  status: CorporateActionEntitlementStatus;
  createdAt: string;
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
