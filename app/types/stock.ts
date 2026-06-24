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

export type Account = {
  accountId: number;
  userKey?: string | null;
  accountCode?: string | null;
  status?: "ACTIVE" | "DETACHED" | "CLOSED";
  cashBalance: number;
  detachedAt?: string | null;
  reconnectedAt?: string | null;
  recoveryExpiresAt?: string | null;
  purgeAfter?: string | null;
  recoveryCode?: string | null;
};

export type AccountStatus = {
  hasAccount: boolean;
  account?: Account | null;
};

export type Holding = {
  symbol: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedProfit: number;
};

export type Portfolio = {
  account: Account;
  marketValue: number;
  reservedBuyCash: number;
  totalAsset: number;
  returnRate: number;
  pendingOrderCount: number;
  holdings: Holding[];
};

export type PortfolioSnapshot = {
  snapshotDate: string;
  totalAsset: number;
  cashBalance: number;
  marketValue: number;
  returnRate: number;
};

export type ProfitSummary = {
  realizedProfit: number;
  unrealizedProfit: number;
  totalProfit: number;
  totalFeeAmount: number;
  totalTaxAmount: number;
  buyGrossAmount: number;
  sellGrossAmount: number;
  buyNetAmount: number;
  sellNetAmount: number;
  netCashFlow: number;
  executionCount: number;
};

export type StockUserProfile = {
  userKey: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  account?: Account | null;
};

export type OrderSide = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";
export type OrderStatus = "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
export type MarketType = "VIRTUAL_PRICE" | "ORDER_BOOK";
export type MarketSessionStatus = "OPEN" | "CLOSED" | "HALTED";
export type CorporateActionType = "INITIAL_ISSUE" | "PAID_IN_CAPITAL_INCREASE" | "ADDITIONAL_ISSUE" | "STOCK_SPLIT" | "CASH_DIVIDEND" | "BONUS_ISSUE" | "STOCK_DIVIDEND" | "DELISTING";
export type CorporateActionStatus = "ANNOUNCED" | "EX_RIGHTS_APPLIED" | "PAID" | "LISTED" | "DELISTED";
export type CorporateActionEntitlementStatus = "ANNOUNCED" | "PAID";
export type ListingAutoPosition = "SELL_ONLY" | "BUY_ONLY";

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

export type Order = {
  id: number;
  accountId: number;
  clientOrderId: string;
  symbol: string;
  marketType: MarketType;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  limitPrice?: number | null;
  quantity: number;
  filledQuantity: number;
  averageFillPrice?: number | null;
  reservedCash: number;
  createdAt: string;
};

export type Execution = {
  id: number;
  accountId: number;
  orderId: number;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  grossAmount: number;
  feeAmount: number;
  taxAmount: number;
  netAmount: number;
  realizedProfit?: number | null;
  source: "VIRTUAL_MARKET_PRICE" | "INTERNAL_ORDER_BOOK";
  executedAt: string;
};

export type Ranking = {
  rank: number;
  accountId: number;
  userKey: string;
  displayName: string;
  totalAsset: number;
  returnRate: number;
  snapshotDate: string;
};

export type AutoMarketConfig = {
  symbol: string;
  enabled: boolean;
  intensity: number;
  maxOrderQuantity: number;
  orderTtlSeconds: number;
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
  | "PANIC_SELLER"
  | "DIP_BUYER"
  | "LIQUIDITY_AVOIDANT"
  | "WHALE"
  | "SMALL_DIVERSIFIER"
  | "OBSERVER";

export type AutoParticipant = {
  userKey: string;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  cashBalance?: number | null;
  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string | null;
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

export type AutoParticipantCashAdjustment = {
  userKey: string;
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  amount: number;
  cashBalance: number;
  updatedAt: string;
};

export type AutoParticipantSymbolConfig = {
  userKey: string;
  symbol: string;
  enabled: boolean;
  intensity: number;
  updatedAt: string;
};

export type ListingAutoAccount = {
  symbol: string;
  userKey: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
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
  createdAt: string;
  updatedAt: string;
};

export type SymbolMarketConfig = {
  symbol: string;
  enabled: boolean;
  marketStatus: MarketSessionStatus;
};

export type VirtualMarketStatus = {
  enabled: boolean;
  openOrderCount: number;
  todayExecutionCount: number;
  configs: SymbolMarketConfig[];
};

export type OrderBookMarketStatus = {
  enabled: boolean;
  openOrderCount: number;
  todayExecutionCount: number;
  configs: SymbolMarketConfig[];
};

export type AutoMarketStatus = {
  enabled: boolean;
  enabledParticipantCount: number;
  openAutoOrderCount: number;
  todayAutoExecutionCount: number;
  configs: AutoMarketConfig[];
  participants: AutoParticipant[];
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  listingAutoAccounts: ListingAutoAccount[];
};
