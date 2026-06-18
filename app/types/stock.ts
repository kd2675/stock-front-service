export type Instrument = {
  symbol: string;
  name: string;
  market: string;
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
  userKey: string;
  cashBalance: number;
  initialCash: number;
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

export type StockUserProfile = {
  userKey: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  account: Account;
};

export type OrderSide = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";
export type OrderStatus = "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";

export type Order = {
  id: number;
  clientOrderId: string;
  symbol: string;
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
  orderId: number;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  source: "VIRTUAL_MARKET_PRICE" | "INTERNAL_ORDER_BOOK";
  executedAt: string;
};

export type Ranking = {
  rank: number;
  userKey: string;
  displayName: string;
  totalAsset: number;
  returnRate: number;
  snapshotDate: string;
};
