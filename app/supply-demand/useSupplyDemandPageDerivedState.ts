import { useMemo } from "react";

import { calculateEstimatedOrderAmount } from "@/app/lib/orderSizing";
import type { InstrumentSummary } from "@/app/supply-demand/InstrumentSelectionPanel";
import type {
  AutoMarketStatus,
  Execution,
  Holding,
  Order,
  OrderBookMarketStatus,
  OrderBookInstrument,
  OrderType,
} from "@/app/types/stock";

type UseSupplyDemandPageDerivedStateOptions = {
  autoMarket: AutoMarketStatus | null;
  executions: Execution[];
  holdings: Holding[];
  instruments: OrderBookInstrument[];
  limitPrice: string;
  orderBookMarket: OrderBookMarketStatus | null;
  orderType: OrderType;
  orders: Order[];
  quantity: string;
  selectedSymbol: string;
};

export function useSupplyDemandPageDerivedState({
  autoMarket,
  executions,
  holdings,
  instruments,
  limitPrice,
  orderBookMarket,
  orderType,
  orders,
  quantity,
  selectedSymbol,
}: UseSupplyDemandPageDerivedStateOptions) {
  const selectedInstrument = useMemo(
    () => instruments.find((instrument) => instrument.symbol === selectedSymbol),
    [instruments, selectedSymbol],
  );
  const autoConfigBySymbol = useMemo(
    () => new Map((autoMarket?.configs ?? []).map((config) => [config.symbol, config])),
    [autoMarket?.configs],
  );
  const orderBookMarketConfigBySymbol = useMemo(
    () => new Map((orderBookMarket?.configs ?? []).map((config) => [config.symbol, config])),
    [orderBookMarket?.configs],
  );
  const selectedConfig = useMemo(
    () => autoConfigBySymbol.get(selectedInstrument?.symbol ?? ""),
    [autoConfigBySymbol, selectedInstrument?.symbol],
  );
  const selectedOrderBookConfig = useMemo(
    () => orderBookMarketConfigBySymbol.get(selectedInstrument?.symbol ?? ""),
    [orderBookMarketConfigBySymbol, selectedInstrument?.symbol],
  );
  const selectedHolding = useMemo(
    () => holdings.find((holding) => holding.symbol === selectedInstrument?.symbol),
    [holdings, selectedInstrument?.symbol],
  );
  const instrumentSummaries = useMemo<InstrumentSummary[]>(
    () => instruments.map((instrument) => ({
      instrument,
      autoConfig: autoConfigBySymbol.get(instrument.symbol),
      marketConfig: orderBookMarketConfigBySymbol.get(instrument.symbol),
    })),
    [autoConfigBySymbol, instruments, orderBookMarketConfigBySymbol],
  );
  const isSelectedMarketOpen = orderBookMarket?.enabled === true
    && selectedOrderBookConfig?.enabled === true
    && selectedOrderBookConfig.marketStatus === "OPEN";
  const orderBookOrders = orders;
  const orderBookExecutions = executions;
  const estimatedOrderAmount = useMemo(() => calculateEstimatedOrderAmount({
    currentPrice: selectedInstrument?.currentPrice,
    limitPrice,
    orderType,
    quantity,
  }) ?? undefined, [limitPrice, orderType, quantity, selectedInstrument?.currentPrice]);

  return {
    estimatedOrderAmount,
    instrumentSummaries,
    isSelectedMarketOpen,
    orderBookExecutions,
    orderBookOrders,
    selectedConfig,
    selectedHolding,
    selectedInstrument,
    selectedOrderBookConfig,
  };
}
