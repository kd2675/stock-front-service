import type { MarketSessionStatus } from "@/app/types/stockMarket";

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

export type AccountCashAdjustment = {
  accountId: number;
  userKey: string;
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  amount: number;
  cashBalance: number;
  updatedAt: string;
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
  pendingSubscriptionAsset: number;
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

export type AccountCashFlow = {
  id: number;
  flowType: "DEPOSIT" | "WITHDRAW";
  amount: number;
  reason:
    | "OPENING_GRANT"
    | "ADMIN_DEPOSIT"
    | "ADMIN_WITHDRAW"
    | "CAPITAL_INCREASE_SUBSCRIPTION"
    | "DIVIDEND_PAYMENT"
    | "AUTO_PROFILE_RECURRING_DEPOSIT"
    | "AUTO_PARTICIPANT_RECURRING_DEPOSIT";
  createdBy?: string | null;
  createdAt: string;
};

export type FundFlow = {
  cashBalance: number;
  reservedBuyCash: number;
  marketValue: number;
  totalAsset: number;
  externalDepositAmount: number;
  externalWithdrawAmount: number;
  netExternalCashFlow: number;
  dividendIncomeAmount: number;
  buyNetAmount: number;
  sellNetAmount: number;
  tradeNetCashFlow: number;
  totalFeeAmount: number;
  totalTaxAmount: number;
  realizedProfit: number;
  unrealizedProfit: number;
  totalProfit: number;
  executionCount: number;
  recentCashFlows: AccountCashFlow[];
};

export type AdminFundFlowSummary = {
  activeAccountCount: number;
  totalCashBalance: number;
  totalReservedBuyCash: number;
  totalHoldingMarketValue: number;
  totalHoldingQuantity: number;
  totalReservedSellQuantity: number;
  totalAvailableHoldingQuantity: number;
  holdingPositionCount: number;
  totalAsset: number;
  externalDepositAmount: number;
  externalWithdrawAmount: number;
  netExternalCashFlow: number;
  dividendIncomeAmount: number;
  buyNetAmount: number;
  sellNetAmount: number;
  tradeNetCashFlow: number;
  totalFeeAmount: number;
  totalTaxAmount: number;
  realizedProfit: number;
  executionCount: number;
};

export type AdminFundFlowScope = "RECENT_SIMULATION_DAY" | "ALL";

export type AdminTotalAssetHistoryPoint = {
  snapshotDate: string;
  accountCount: number;
  totalAsset: number;
  cashBalance: number;
  marketValue: number;
  pendingSubscriptionAsset: number;
  holdingQuantity: number | null;
  reservedSellQuantity: number | null;
  availableHoldingQuantity: number | null;
  holdingPositionCount: number | null;
  changeAmount: number | null;
  changeRate: number | null;
};

export type AdminTotalAssetPeriodSummary = {
  rangeStart: string;
  rangeEnd: string;
  startTotalAsset: number;
  endTotalAsset: number;
  changeAmount: number;
  changeRate: number | null;
  averageTotalAsset: number;
  highestTotalAsset: number;
  lowestTotalAsset: number;
};

export type AdminTotalAssetHistoryPage = {
  content: AdminTotalAssetHistoryPoint[];
  summary: AdminTotalAssetPeriodSummary | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminOrderFlowSummary = {
  openOrderCount: number;
  openBuyOrderCount: number;
  openSellOrderCount: number;
  partiallyFilledOrderCount: number;
  reservedBuyCash: number;
  reservedSellQuantity: number;
  todayOrderCount: number;
  todayFilledOrderCount: number;
  todayCancelledOrderCount: number;
  todayRejectedOrderCount: number;
};

export type AdminCorporateActionFlowSummary = {
  announcedCount: number;
  exRightsAppliedCount: number;
  paidCount: number;
  listedCount: number;
  delistedCount: number;
  pendingCount: number;
  todayCreatedCount: number;
};

export type AdminSymbolFlow = {
  symbol: string;
  name: string;
  enabled: boolean;
  marketStatus: MarketSessionStatus | string;
  issuedShares: number;
  tradableShares: number;
  currentPrice: number | null;
  previousClose: number | null;
  changeRate: number | null;
  executionCount: number;
  executionQuantity: number;
  turnoverAmount: number;
  buyQuantity: number;
  sellQuantity: number;
  buyNetAmount: number;
  sellNetAmount: number;
  openOrderCount: number;
  openBuyOrderCount: number;
  openSellOrderCount: number;
  reservedBuyCash: number;
  holderCount: number;
  holdingQuantity: number;
  pendingCorporateActionCount: number;
  lastExecutedAt?: string | null;
};

export type AdminSymbolFlowDailyCumulative = {
  simulationTradeDate: string;
  rangeStart: string;
  rangeEnd: string;
  totalCount: number;
  symbolFlows: AdminSymbolFlow[];
};

export type AdminRecentCashFlow = AccountCashFlow & {
  accountId: number;
  userKey?: string | null;
};

export type AdminCashFlowPage = {
  content: AdminRecentCashFlow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AdminFlowOverview = {
  fundFlow?: AdminFundFlowSummary | null;
  orderFlow: AdminOrderFlowSummary;
  corporateActionFlow: AdminCorporateActionFlowSummary;
  symbolFlowTotalCount: number;
  symbolFlows: AdminSymbolFlow[];
  recentCashFlows: AdminRecentCashFlow[];
  generatedAt: string;
};

export type AdminSymbolFlowList = {
  totalCount: number;
  symbolFlows: AdminSymbolFlow[];
  dailyCumulativeFlows?: AdminSymbolFlowDailyCumulative[];
};

export type StockUserProfile = {
  userKey: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  account?: Account | null;
};
