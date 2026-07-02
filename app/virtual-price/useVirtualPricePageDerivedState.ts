import { useMemo } from "react";

import { parsePositiveIntegerInput, parsePositiveNumberInput } from "@/app/lib/numberParsing";
import { isWithinPriceLimit, matchesTickSize } from "@/app/lib/orderBookPricing";
import { formatWon } from "@/app/lib/stockFormatters";
import type { Execution, Holding, Instrument, Order, OrderSide, OrderType, Portfolio, Price, PriceTick } from "@/app/types/stock";

type UseVirtualPricePageDerivedStateOptions = {
  executions: Execution[];
  holdings: Holding[] | null;
  instruments: Instrument[];
  limitPrice: string;
  orderType: OrderType;
  orders: Order[];
  portfolio: Portfolio | null;
  prices: Price[];
  priceTicks: PriceTick[];
  quantity: string;
  selectedSymbol: string;
  side: OrderSide;
};

export function useVirtualPricePageDerivedState({
  executions,
  holdings,
  instruments,
  limitPrice,
  orderType,
  orders,
  portfolio,
  prices,
  priceTicks,
  quantity,
  selectedSymbol,
  side,
}: UseVirtualPricePageDerivedStateOptions) {
  const selectedPrice = useMemo(
    () => prices.find((price) => price.symbol === selectedSymbol),
    [prices, selectedSymbol],
  );
  const instrumentMap = useMemo(
    () => new Map(instruments.map((item) => [item.symbol, item])),
    [instruments],
  );
  const selectedInstrument = useMemo(
    () => instrumentMap.get(selectedSymbol),
    [instrumentMap, selectedSymbol],
  );
  const visibleHoldings = useMemo(
    () => holdings ?? portfolio?.holdings ?? [],
    [holdings, portfolio?.holdings],
  );
  const selectedHolding = useMemo(
    () => visibleHoldings.find((holding) => holding.symbol === selectedSymbol),
    [selectedSymbol, visibleHoldings],
  );
  const parsedOrderQuantity = useMemo(
    () => parsePositiveIntegerInput(quantity),
    [quantity],
  );
  const parsedLimitPrice = useMemo(
    () => parsePositiveNumberInput(limitPrice),
    [limitPrice],
  );
  const estimatedOrderValue = useMemo(() => {
    const orderPriceForEstimate = orderType === "MARKET" ? selectedPrice?.currentPrice ?? null : parsedLimitPrice;
    return parsedOrderQuantity && orderPriceForEstimate
      ? parsedOrderQuantity * orderPriceForEstimate
      : null;
  }, [orderType, parsedLimitPrice, parsedOrderQuantity, selectedPrice?.currentPrice]);
  const orderValidationMessage = useMemo(() => {
    if (!selectedSymbol) {
      return "종목을 선택해 주세요.";
    }
    if (!parsedOrderQuantity) {
      return "수량은 1주 이상 정수로 입력해 주세요.";
    }
    if (orderType === "LIMIT" && !parsedLimitPrice) {
      return "주문가는 0보다 큰 숫자로 입력해 주세요.";
    }
    if (orderType === "LIMIT" && parsedLimitPrice && !matchesTickSize(parsedLimitPrice, 1)) {
      return "주문가는 1원 단위로 입력해 주세요.";
    }
    if (orderType === "LIMIT" && parsedLimitPrice && selectedPrice && !isWithinPriceLimit(parsedLimitPrice, selectedPrice.previousClose, 30)) {
      const lowerLimit = selectedPrice.previousClose * 0.7;
      const upperLimit = selectedPrice.previousClose * 1.3;
      return `주문가는 ${formatWon(lowerLimit)} 이상 ${formatWon(upperLimit)} 이하로 입력해 주세요.`;
    }
    if (side === "BUY" && portfolio && estimatedOrderValue && portfolio.account.cashBalance < estimatedOrderValue) {
      return "현금 잔고가 부족합니다.";
    }
    if (side === "SELL" && portfolio && (!selectedHolding || selectedHolding.availableQuantity < parsedOrderQuantity)) {
      return "매도 가능 수량이 부족합니다.";
    }
    return null;
  }, [estimatedOrderValue, orderType, parsedLimitPrice, parsedOrderQuantity, portfolio, selectedHolding, selectedPrice, selectedSymbol, side]);
  const chronologicalTicks = useMemo(() => [...priceTicks].reverse(), [priceTicks]);
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "PENDING" || order.status === "PARTIALLY_FILLED"),
    [orders],
  );
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const recentExecutions = useMemo(() => executions.slice(0, 5), [executions]);
  const orderActionClassName = side === "BUY" ? "bg-[#f04452]" : "bg-[#3182f6]";

  return {
    chronologicalTicks,
    estimatedOrderValue,
    instrumentMap,
    orderActionClassName,
    orderValidationMessage,
    parsedLimitPrice,
    parsedOrderQuantity,
    pendingOrders,
    recentExecutions,
    recentOrders,
    selectedHolding,
    selectedInstrument,
    selectedPrice,
    visibleHoldings,
  };
}
