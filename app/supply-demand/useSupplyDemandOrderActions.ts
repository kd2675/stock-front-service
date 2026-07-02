import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateOrderBookTradingQueries } from "@/app/lib/react-query/stockInvalidations";
import { cancelOrderMutationOptions, placeOrderMutationOptions } from "@/app/lib/react-query/stockMutations";
import { createStockErrorMessageHandler } from "@/app/lib/react-query/stockResult";
import { parseOrderTicket } from "@/app/lib/validation/orderSchemas";
import type { OrderBookCandleInterval, OrderBookInstrument, OrderSide, OrderType } from "@/app/types/stock";

type UseSupplyDemandOrderActionsOptions = {
  candleInterval: OrderBookCandleInterval;
  hasTradingAccount: boolean;
  isSelectedMarketOpen: boolean;
  limitPrice: string;
  orderType: OrderType;
  quantity: string;
  selectedInstrument?: OrderBookInstrument;
  setMessage: (message: string | null) => void;
  side: OrderSide;
};

export function useSupplyDemandOrderActions({
  candleInterval,
  hasTradingAccount,
  isSelectedMarketOpen,
  limitPrice,
  orderType,
  quantity,
  selectedInstrument,
  setMessage,
  side,
}: UseSupplyDemandOrderActionsOptions) {
  const queryClient = useQueryClient();
  const selectedSymbol = selectedInstrument?.symbol;
  const setPlaceOrderErrorMessage = createStockErrorMessageHandler(setMessage, "주문 접수에 실패했습니다.");
  const setCancelOrderErrorMessage = createStockErrorMessageHandler(setMessage, "주문 취소에 실패했습니다.");

  const invalidateOrderBookTrading = useCallback(async () => {
    await invalidateOrderBookTradingQueries(queryClient, {
      candleInterval,
      includeAutoMarketStatus: true,
      includeCandles: true,
      includeInternalExecutions: true,
      includeRecentExecutions: true,
      includeTradeSummary: true,
      symbols: [selectedSymbol],
    });
  }, [candleInterval, queryClient, selectedSymbol]);

  const {
    isPending: placingOrder,
    mutate: placeOrder,
  } = useMutation({
    ...placeOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문장 주문이 접수되었습니다.");
      await invalidateOrderBookTrading();
    },
    onError: setPlaceOrderErrorMessage,
  });
  const {
    isPending: cancellingOrder,
    mutate: cancelOrder,
    variables: cancellingOrderVariable,
  } = useMutation({
    ...cancelOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 취소했습니다.");
      await invalidateOrderBookTrading();
    },
    onError: setCancelOrderErrorMessage,
  });

  const submitOrderBookOrder = useCallback(() => {
    if (!selectedSymbol || !selectedInstrument || placingOrder) {
      return;
    }
    if (!isSelectedMarketOpen) {
      setMessage("현재 장 상태에서는 신규 주문을 접수할 수 없습니다.");
      return;
    }
    const parsed = parseOrderTicket({ orderType, quantity, limitPrice, instrument: selectedInstrument });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    if (!hasTradingAccount) {
      setMessage("모의투자 계좌를 만든 뒤 주문할 수 있습니다.");
      return;
    }
    placeOrder({
      symbol: selectedSymbol,
      marketType: "ORDER_BOOK",
      side,
      orderType,
      limitPrice: orderType === "LIMIT" ? parsed.data.limitPrice : undefined,
      quantity: parsed.data.quantity,
      clientOrderId: `orderbook-${Date.now()}`,
    });
  }, [hasTradingAccount, isSelectedMarketOpen, limitPrice, orderType, placeOrder, placingOrder, quantity, selectedInstrument, selectedSymbol, setMessage, side]);

  const cancelOpenOrder = useCallback((orderId: number) => {
    if (cancellingOrder) {
      return;
    }
    cancelOrder(orderId);
  }, [cancelOrder, cancellingOrder]);

  return {
    cancelOpenOrder,
    cancellingOrderId: cancellingOrder ? cancellingOrderVariable ?? null : null,
    placingOrder,
    submitOrderBookOrder,
  };
}
