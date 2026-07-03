import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { normalizeStringList } from "@/app/lib/stringLists";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import type { OrderBookCandleInterval } from "@/app/types/stock";

type InvalidateOrderBookTradingQueriesOptions = {
  symbols?: Array<string | null | undefined>;
  candleInterval?: OrderBookCandleInterval;
  includeAutoMarketStatus?: boolean;
  includeInternalExecutions?: boolean;
  includeTradeSummary?: boolean;
  includeRecentExecutions?: boolean;
  includeCandles?: boolean;
};

type InvalidateOptions = {
  exact?: boolean;
};

function invalidateQuery(queryClient: QueryClient, queryKey: QueryKey, options: InvalidateOptions = {}) {
  if (options.exact === undefined) {
    return queryClient.invalidateQueries({ queryKey });
  }
  return queryClient.invalidateQueries({ queryKey, exact: options.exact });
}

function invalidateQueries(queryClient: QueryClient, queryKeys: QueryKey[], options: InvalidateOptions = {}) {
  return queryKeys.map((queryKey) => invalidateQuery(queryClient, queryKey, options));
}

async function invalidateQueryGroup(queryClient: QueryClient, queryKeys: QueryKey[], options: InvalidateOptions = {}) {
  await Promise.all(invalidateQueries(queryClient, queryKeys, options));
}

function removeAdminSymbolFlowQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: stockKeys.adminSymbolFlowsRoot() });
}

export function clearStockQueryCache(queryClient: QueryClient) {
  queryClient.clear();
}

async function invalidateAdminFlowImpactedQueries(
  queryClient: QueryClient,
  queryKeys: QueryKey[],
  options: {
    includeFundFlowSummary?: boolean;
  } = {},
) {
  removeAdminSymbolFlowQueries(queryClient);
  await invalidateQueryGroup(queryClient, [
    ...queryKeys,
    stockKeys.adminFlowOverviewRoot(),
    ...(options.includeFundFlowSummary ? [stockKeys.adminFundFlowSummary()] : []),
  ]);
}

export async function invalidateOrderBookTradingQueries(
  queryClient: QueryClient,
  options: InvalidateOrderBookTradingQueriesOptions = {},
) {
  const symbols = normalizeStringList(options.symbols);
  await Promise.all([
    ...invalidateQueries(queryClient, [
      stockKeys.orderBookMarketStatusRoot(),
      stockKeys.portfolio(),
      stockKeys.holdings(),
      stockKeys.ordersByMarketType("ORDER_BOOK"),
    ]),
    ...(options.includeAutoMarketStatus ? [invalidateQuery(queryClient, stockKeys.autoMarketStatus())] : []),
    ...(options.includeInternalExecutions ? [invalidateQuery(queryClient, stockKeys.executionsBySource("INTERNAL_ORDER_BOOK"))] : []),
    ...symbols.flatMap((symbol) => [
      invalidateQuery(queryClient, stockKeys.orderBook(symbol)),
      ...(options.includeTradeSummary ? [invalidateQuery(queryClient, stockKeys.orderBookTradeSummary(symbol))] : []),
      ...(options.includeRecentExecutions ? [invalidateQuery(queryClient, stockKeys.orderBookRecentExecutions(symbol))] : []),
      ...(options.includeCandles && options.candleInterval ? [invalidateQuery(queryClient, stockKeys.orderBookCandles(symbol, options.candleInterval))] : []),
    ]),
  ]);
}

export async function invalidateVirtualPriceTradingQueries(
  queryClient: QueryClient,
  symbol?: string | null,
) {
  const symbols = normalizeStringList([symbol]);
  await Promise.all([
    ...invalidateVirtualPriceAccountQueries(queryClient),
    invalidateQuery(queryClient, stockKeys.rankings(), { exact: true }),
    ...symbols.map((nextSymbol) => invalidateQuery(queryClient, stockKeys.orderBook(nextSymbol), { exact: true })),
  ]);
}

export async function invalidateVirtualPricePageQueries(
  queryClient: QueryClient,
  symbol?: string | null,
) {
  const symbols = normalizeStringList([symbol]);
  await Promise.all([
    ...invalidateQueries(queryClient, [
      stockKeys.instruments(),
      stockKeys.prices(),
      stockKeys.rankings(),
      stockKeys.accountStatus(),
      stockKeys.profile(),
    ], { exact: true }),
    ...invalidateVirtualPriceAccountQueries(queryClient),
    ...symbols.flatMap((nextSymbol) => [
      invalidateQuery(queryClient, stockKeys.priceTicks(nextSymbol), { exact: true }),
      invalidateQuery(queryClient, stockKeys.orderBook(nextSymbol), { exact: true }),
    ]),
  ]);
}

function invalidateVirtualPriceAccountQueries(queryClient: QueryClient) {
  return invalidateQueries(queryClient, [
    stockKeys.portfolio(),
    stockKeys.portfolioSnapshots(),
    stockKeys.profitSummary(),
    stockKeys.holdings(),
    stockKeys.corporateActionEntitlements(),
    stockKeys.ordersRoot(),
    stockKeys.executionsRoot(),
  ]);
}

export async function invalidateAccountStatusQueries(queryClient: QueryClient) {
  await invalidateQuery(queryClient, stockKeys.accountStatus(), { exact: true });
}

export async function invalidateAccountQueries(queryClient: QueryClient) {
  await invalidateQuery(queryClient, stockKeys.account());
}

export async function invalidateAdminInitialIssueQueries(
  queryClient: QueryClient,
  symbol: string,
) {
  await invalidateAdminFlowImpactedQueries(queryClient, [
    stockKeys.orderBookInstruments(),
    stockKeys.orderBook(symbol),
    stockKeys.autoMarketStatus(),
    stockKeys.orderBookMarketStatusRoot(),
  ]);
}

export async function invalidateAdminCorporateActionQueries(
  queryClient: QueryClient,
  symbol: string,
) {
  await invalidateAdminFlowImpactedQueries(queryClient, [
    stockKeys.corporateActions(symbol),
    stockKeys.orderBookInstruments(),
    stockKeys.orderBookMarketStatusRoot(),
  ]);
}

export async function invalidateAutoParticipantAdminQueries(queryClient: QueryClient) {
  await invalidateAutoParticipantStateQueries(queryClient, {
    includeParticipants: true,
    includeSummary: true,
  });
}

export async function invalidateAutoParticipantStrategyQueries(queryClient: QueryClient) {
  await invalidateAutoParticipantStateQueries(queryClient);
}

async function invalidateAutoParticipantStateQueries(
  queryClient: QueryClient,
  options: {
    includeParticipants?: boolean;
    includeSummary?: boolean;
  } = {},
) {
  await invalidateQueryGroup(queryClient, [
    stockKeys.autoMarketStatusDetailsRoot(),
    ...(options.includeSummary ? [stockKeys.autoMarketSummaryStatusRoot()] : []),
    ...(options.includeParticipants ? [stockKeys.autoParticipants()] : []),
    stockKeys.autoParticipantOverviewsRoot(),
    stockKeys.autoParticipantProfileOverviews(),
  ]);
}

export async function invalidateAutoMarketConfigurationQueries(queryClient: QueryClient) {
  await invalidateQueryGroup(queryClient, [
    stockKeys.autoMarketStatusDetailsRoot(),
    stockKeys.autoMarketSummaryStatusRoot(),
  ]);
}

export async function invalidateAutoMarketDetailsQueries(queryClient: QueryClient) {
  await invalidateQuery(queryClient, stockKeys.autoMarketStatusDetailsRoot());
}

export async function invalidateAdminCashFlowQueries(queryClient: QueryClient) {
  await invalidateQueryGroup(queryClient, [
    stockKeys.adminCashFlowsRoot(),
    stockKeys.adminFundFlowSummary(),
    stockKeys.adminFlowOverviewRoot(),
  ]);
}

export async function invalidateAdminUserCashAdjustmentQueries(
  queryClient: QueryClient,
  userKey?: string | null,
) {
  const userKeys = normalizeStringList([userKey]);
  await Promise.all([
    ...invalidateQueries(queryClient, [
      stockKeys.account(),
      stockKeys.portfolio(),
      stockKeys.adminCashFlowsRoot(),
      stockKeys.adminFundFlowSummary(),
      stockKeys.adminFlowOverviewRoot(),
    ]),
    ...userKeys.map((nextUserKey) => invalidateQuery(queryClient, stockKeys.adminUserFundFlow(nextUserKey))),
  ]);
}

export async function invalidateAdminMarketFlowQueries(queryClient: QueryClient) {
  await invalidateAdminFlowImpactedQueries(queryClient, [], {
    includeFundFlowSummary: true,
  });
}

export async function invalidateSimulationClockQueries(queryClient: QueryClient) {
  await invalidateQueryGroup(queryClient, [
    stockKeys.simulationClock(),
    stockKeys.orderBookMarketStatusRoot(),
    stockKeys.adminFlowOverviewRoot(),
    stockKeys.adminFundFlowSummary(),
  ]);
}

export async function invalidateOrderBookMarketAdminQueries(queryClient: QueryClient) {
  await invalidateAdminFlowImpactedQueries(queryClient, [
    stockKeys.orderBookMarketStatusRoot(),
    stockKeys.orderBookInstruments(),
  ]);
}

export async function invalidateInstrumentReportQueries(
  queryClient: QueryClient,
  symbol: string,
) {
  const symbols = normalizeStringList([symbol]);
  await Promise.all(symbols.map((nextSymbol) =>
    invalidateQuery(queryClient, stockKeys.instrumentReports(nextSymbol)),
  ));
}

export async function invalidateBatchRuntimeControlQueries(queryClient: QueryClient) {
  await invalidateQuery(queryClient, stockKeys.batchJobRuntimeControls());
}
