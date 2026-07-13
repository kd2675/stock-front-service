import {
  getAutoMarketStatus,
  getCorporateActionFeed,
  getCorporateActions,
  getInstrumentReports,
  getInstrumentMarketReport,
  getInstruments,
  getOrderBook,
  getOrderBookCandles,
  getOrderBookInstruments,
  getOrderBookMarketStatus,
  getOrderBookTradeSummary,
  getPrices,
  getPriceTicks,
  getRankings,
  getRecentOrderBookExecutions,
  getSimulationClock,
} from "@/app/lib/stock";
import type { StockCorporateActionFeedOptions } from "@/app/lib/stock";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import {
  FAST_MARKET_REFETCH_MS,
  USER_ACTIVITY_REFETCH_MS,
  stockQueryOptions,
  type StockQueryOptionsConfig,
} from "@/app/lib/react-query/stockQueryCore";
import type {
  CorporateAction,
  InstrumentReport,
  InstrumentMarketReport,
  OrderBook,
  OrderBookCandle,
  OrderBookCandleInterval,
  OrderBookRecentExecution,
  OrderBookTradeSummary,
  PriceTick,
} from "@/app/types/stock";

type MarketQueryToggleOptions = {
  enabled?: boolean;
  refetchIntervalMs?: number | false;
};

function candleRefetchInterval(interval: OrderBookCandleInterval) {
  if (interval === "1M") {
    return FAST_MARKET_REFETCH_MS;
  }
  if (interval === "5M") {
    return USER_ACTIVITY_REFETCH_MS;
  }
  if (interval === "15M" || interval === "1H") {
    return 15_000;
  }
  return 60_000;
}

type AutoMarketStatusIncludeOptions = {
  includeConfigs?: boolean;
  includeParticipants?: boolean;
  includeParticipantSymbolConfigs?: boolean;
  includeParticipantProfileConfigs?: boolean;
  includeListingAutoAccounts?: boolean;
  includeRuntimeMetrics?: boolean;
  includeSalaryEligibility?: boolean;
};

function resolveAutoMarketStatusIncludeOptions(options: AutoMarketStatusIncludeOptions = {}) {
  return {
    includeConfigs: options.includeConfigs ?? true,
    includeParticipants: options.includeParticipants ?? false,
    includeParticipantSymbolConfigs: options.includeParticipantSymbolConfigs ?? false,
    includeParticipantProfileConfigs: options.includeParticipantProfileConfigs ?? false,
    includeListingAutoAccounts: options.includeListingAutoAccounts ?? false,
    includeRuntimeMetrics: options.includeRuntimeMetrics ?? true,
    includeSalaryEligibility: options.includeSalaryEligibility ?? false,
  };
}

type SymbolMarketQueryOptionsConfig<TData> = Omit<StockQueryOptionsConfig<TData>, "request"> & {
  request: (symbol: string) => ReturnType<StockQueryOptionsConfig<TData>["request"]>;
  symbol: string;
};

function symbolMarketQueryOptions<TData>({
  enabled = true,
  fallbackMessage,
  queryKey,
  refetchInterval,
  request,
  symbol,
}: SymbolMarketQueryOptionsConfig<TData>) {
  return stockQueryOptions({
    queryKey,
    request: () => request(symbol),
    fallbackMessage,
    enabled: enabled && Boolean(symbol),
    refetchInterval,
  });
}

export function instrumentsQueryOptions() {
  return stockQueryOptions({
    queryKey: stockKeys.instruments(),
    request: getInstruments,
    fallbackMessage: "종목을 조회하지 못했습니다.",
  });
}

export function simulationClockQueryOptions() {
  return stockQueryOptions({
    queryKey: stockKeys.simulationClock(),
    request: getSimulationClock,
    fallbackMessage: "시뮬레이션 시간을 조회하지 못했습니다.",
    refetchInterval: 1000,
  });
}

export function orderBookInstrumentsQueryOptions(options: MarketQueryToggleOptions = {}) {
  return stockQueryOptions({
    queryKey: stockKeys.orderBookInstruments(),
    request: getOrderBookInstruments,
    fallbackMessage: "주문장 종목을 조회하지 못했습니다.",
    enabled: options.enabled,
  });
}

export function pricesQueryOptions() {
  return stockQueryOptions({
    queryKey: stockKeys.prices(),
    request: getPrices,
    fallbackMessage: "시세를 조회하지 못했습니다.",
    refetchInterval: FAST_MARKET_REFETCH_MS,
  });
}

export function priceTicksQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<PriceTick[]>({
    enabled: options.enabled,
    queryKey: stockKeys.priceTicks(symbol),
    request: getPriceTicks,
    fallbackMessage: "시세 이력을 조회하지 못했습니다.",
    symbol,
  });
}

export function orderBookQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<OrderBook>({
    enabled: options.enabled,
    queryKey: stockKeys.orderBook(symbol),
    request: getOrderBook,
    fallbackMessage: "호가를 조회하지 못했습니다.",
    refetchInterval: FAST_MARKET_REFETCH_MS,
    symbol,
  });
}

export function orderBookTradeSummaryQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<OrderBookTradeSummary>({
    enabled: options.enabled,
    queryKey: stockKeys.orderBookTradeSummary(symbol),
    request: getOrderBookTradeSummary,
    fallbackMessage: "거래 요약을 조회하지 못했습니다.",
    refetchInterval: FAST_MARKET_REFETCH_MS,
    symbol,
  });
}

export function orderBookRecentExecutionsQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<OrderBookRecentExecution[]>({
    enabled: options.enabled,
    queryKey: stockKeys.orderBookRecentExecutions(symbol),
    request: getRecentOrderBookExecutions,
    fallbackMessage: "최근 체결을 조회하지 못했습니다.",
    refetchInterval: FAST_MARKET_REFETCH_MS,
    symbol,
  });
}

export function orderBookCandlesQueryOptions(symbol: string, interval: OrderBookCandleInterval, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<OrderBookCandle[]>({
    enabled: options.enabled,
    queryKey: stockKeys.orderBookCandles(symbol, interval),
    request: (nextSymbol) => getOrderBookCandles(nextSymbol, interval),
    fallbackMessage: "차트 데이터를 조회하지 못했습니다.",
    refetchInterval: candleRefetchInterval(interval),
    symbol,
  });
}

export function rankingsQueryOptions() {
  return stockQueryOptions({
    queryKey: stockKeys.rankings(),
    request: getRankings,
    fallbackMessage: "랭킹을 조회하지 못했습니다.",
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
  });
}

export function orderBookMarketStatusQueryOptions(options: {
  enabled?: boolean;
  includeConfigs?: boolean;
  includeTodayExecution?: boolean;
  refetchIntervalMs?: number | false;
} = {}) {
  const includeConfigs = options.includeConfigs ?? true;
  const includeTodayExecution = options.includeTodayExecution ?? true;
  return stockQueryOptions({
    queryKey: stockKeys.orderBookMarketStatus({ includeConfigs, includeTodayExecution }),
    request: () => getOrderBookMarketStatus({ includeConfigs, includeTodayExecution }),
    fallbackMessage: "주문장 상태를 조회하지 못했습니다.",
    enabled: options.enabled,
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
  });
}

export function autoMarketStatusQueryOptions(options: {
  enabled?: boolean;
  participantSymbolConfigUserKey?: string;
  refetchIntervalMs?: number | false;
} & AutoMarketStatusIncludeOptions = {}) {
  const includeOptions = resolveAutoMarketStatusIncludeOptions(options);
  const participantSymbolConfigUserKey = options.participantSymbolConfigUserKey?.trim() || undefined;
  return stockQueryOptions({
    queryKey: stockKeys.autoMarketStatusDetails({
      ...includeOptions,
      participantSymbolConfigUserKey,
    }),
    request: () => getAutoMarketStatus({
      ...includeOptions,
      participantSymbolConfigUserKey,
    }),
    fallbackMessage: "자동장 상태를 조회하지 못했습니다.",
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
  });
}

export function autoMarketSummaryStatusQueryOptions(options: {
  enabled?: boolean;
  includeRuntimeMetrics?: boolean;
  includeSalaryEligibility?: boolean;
  refetchIntervalMs?: number | false;
} = {}) {
  const includeOptions = resolveAutoMarketStatusIncludeOptions({
    includeConfigs: false,
    includeParticipants: false,
    includeParticipantSymbolConfigs: false,
    includeParticipantProfileConfigs: false,
    includeListingAutoAccounts: false,
    includeRuntimeMetrics: options.includeRuntimeMetrics,
    includeSalaryEligibility: options.includeSalaryEligibility,
  });
  return stockQueryOptions({
    queryKey: stockKeys.autoMarketSummaryStatus({
      includeRuntimeMetrics: includeOptions.includeRuntimeMetrics,
      includeSalaryEligibility: includeOptions.includeSalaryEligibility,
    }),
    request: () => getAutoMarketStatus(includeOptions),
    fallbackMessage: "자동장 요약을 조회하지 못했습니다.",
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
  });
}

export function corporateActionsQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<CorporateAction[]>({
    enabled: options.enabled,
    queryKey: stockKeys.corporateActions(symbol),
    request: getCorporateActions,
    fallbackMessage: "주식 이벤트를 조회하지 못했습니다.",
    refetchInterval: options.refetchIntervalMs ?? USER_ACTIVITY_REFETCH_MS,
    symbol,
  });
}

export function corporateActionFeedQueryOptions(options: MarketQueryToggleOptions & StockCorporateActionFeedOptions = {}) {
  const feedOptions = {
    actionType: options.actionType,
    limit: options.limit,
  };
  return stockQueryOptions({
    queryKey: stockKeys.corporateActionFeed(feedOptions),
    request: () => getCorporateActionFeed(feedOptions),
    fallbackMessage: "기업 이벤트 목록을 조회하지 못했습니다.",
    enabled: options.enabled,
    refetchInterval: options.refetchIntervalMs ?? USER_ACTIVITY_REFETCH_MS,
  });
}

export function instrumentReportsQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<InstrumentReport[]>({
    enabled: options.enabled,
    queryKey: stockKeys.instrumentReports(symbol),
    request: getInstrumentReports,
    fallbackMessage: "종목 보고서를 조회하지 못했습니다.",
    symbol,
  });
}

export function instrumentMarketReportQueryOptions(symbol: string, options: MarketQueryToggleOptions = {}) {
  return symbolMarketQueryOptions<InstrumentMarketReport>({
    enabled: options.enabled,
    queryKey: stockKeys.instrumentMarketReport(symbol),
    request: getInstrumentMarketReport,
    fallbackMessage: "종목 시장 보고서를 조회하지 못했습니다.",
    refetchInterval: options.refetchIntervalMs ?? FAST_MARKET_REFETCH_MS,
    symbol,
  });
}
