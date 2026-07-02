import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { parsePositiveIntegerInput, parsePositiveNumberInput } from "@/app/lib/numberParsing";
import { invalidateVirtualPriceTradingQueries } from "@/app/lib/react-query/stockInvalidations";
import { amendOrderMutationOptions, cancelOrderMutationOptions, cancelOrderPartiallyMutationOptions, placeOrderMutationOptions } from "@/app/lib/react-query/stockMutations";
import { createStockErrorMessageHandler } from "@/app/lib/react-query/stockResult";
import type { Order, OrderSide, OrderType } from "@/app/types/stock";

import { generateClientOrderId } from "./VirtualPriceFormatters";

export type VirtualPriceOrderDrafts = Record<number, {
  quantity: string;
  limitPrice: string;
  cancelQuantity: string;
}>;

type UseVirtualPriceOrderActionsOptions = {
  orderDrafts: VirtualPriceOrderDrafts;
  orderType: OrderType;
  orderValidationMessage: string | null;
  parsedLimitPrice: number | null;
  parsedOrderQuantity: number | null;
  selectedSymbol: string;
  setMessage: (message: string | null) => void;
  setOrderDrafts: Dispatch<SetStateAction<VirtualPriceOrderDrafts>>;
  side: OrderSide;
};

export function useVirtualPriceOrderActions({
  orderDrafts,
  orderType,
  orderValidationMessage,
  parsedLimitPrice,
  parsedOrderQuantity,
  selectedSymbol,
  setMessage,
  setOrderDrafts,
  side,
}: UseVirtualPriceOrderActionsOptions) {
  const queryClient = useQueryClient();
  const setPlaceOrderErrorMessage = createStockErrorMessageHandler(setMessage, "주문 접수에 실패했습니다.");
  const setCancelOrderErrorMessage = createStockErrorMessageHandler(setMessage, "주문 취소에 실패했습니다.");
  const setAmendOrderErrorMessage = createStockErrorMessageHandler(setMessage, "주문 정정에 실패했습니다.");
  const setPartialCancelErrorMessage = createStockErrorMessageHandler(setMessage, "부분 취소에 실패했습니다.");

  const invalidateTradingQueries = useCallback(async () => {
    await invalidateVirtualPriceTradingQueries(queryClient, selectedSymbol);
  }, [queryClient, selectedSymbol]);

  const {
    isPending: placingOrder,
    mutate: placeOrder,
  } = useMutation({
    ...placeOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문이 접수되었습니다. batch 서버가 체결 조건을 검사합니다.");
      await invalidateTradingQueries();
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
      await invalidateTradingQueries();
    },
    onError: setCancelOrderErrorMessage,
  });
  const {
    isPending: amendingOrder,
    mutate: amendOrder,
    variables: amendOrderVariables,
  } = useMutation({
    ...amendOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 정정했습니다.");
      await invalidateTradingQueries();
    },
    onError: setAmendOrderErrorMessage,
  });
  const {
    isPending: partiallyCancellingOrder,
    mutate: cancelOrderPartially,
    variables: cancelOrderPartiallyVariables,
  } = useMutation({
    ...cancelOrderPartiallyMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 부분 취소했습니다.");
      await invalidateTradingQueries();
    },
    onError: setPartialCancelErrorMessage,
  });

  const submitOrder = useCallback(() => {
    if (placingOrder) {
      return;
    }
    if (orderValidationMessage) {
      setMessage(orderValidationMessage);
      return;
    }
    if (!parsedOrderQuantity) {
      return;
    }
    placeOrder({
      symbol: selectedSymbol,
      marketType: "VIRTUAL_PRICE",
      side,
      orderType,
      limitPrice: orderType === "LIMIT" ? parsedLimitPrice ?? undefined : undefined,
      quantity: parsedOrderQuantity,
      clientOrderId: generateClientOrderId(),
    });
  }, [orderType, orderValidationMessage, parsedLimitPrice, parsedOrderQuantity, placeOrder, placingOrder, selectedSymbol, setMessage, side]);

  const cancel = useCallback((orderId: number) => {
    if (cancellingOrder) {
      return;
    }
    cancelOrder(orderId);
  }, [cancelOrder, cancellingOrder]);

  const updateOrderDraft = useCallback((
    order: Order,
    patch: Partial<{ quantity: string; limitPrice: string; cancelQuantity: string }>,
  ) => {
    const remainingQuantity = Math.max(0, order.quantity - order.filledQuantity);
    setOrderDrafts((current) => ({
      ...current,
      [order.id]: {
        quantity: current[order.id]?.quantity ?? String(order.quantity),
        limitPrice: current[order.id]?.limitPrice ?? (order.limitPrice?.toString() ?? ""),
        cancelQuantity: current[order.id]?.cancelQuantity ?? String(Math.max(1, remainingQuantity)),
        ...patch,
      },
    }));
  }, [setOrderDrafts]);

  const amend = useCallback((order: Order) => {
    const draft = orderDrafts[order.id] ?? {
      quantity: String(order.quantity),
      limitPrice: order.limitPrice?.toString() ?? "",
      cancelQuantity: String(Math.max(1, order.quantity - order.filledQuantity)),
    };
    const amendedQuantity = parsePositiveIntegerInput(draft.quantity);
    const amendedLimitPrice = parsePositiveNumberInput(draft.limitPrice);
    if (!amendedQuantity || !amendedLimitPrice) {
      setMessage("정정 수량과 지정가는 0보다 큰 숫자로 입력해 주세요.");
      return;
    }
    if (amendedQuantity <= order.filledQuantity) {
      setMessage("정정 수량은 이미 체결된 수량보다 커야 합니다.");
      return;
    }

    if (amendingOrder) {
      return;
    }
    amendOrder({
      orderId: order.id,
      quantity: amendedQuantity,
      limitPrice: amendedLimitPrice,
    });
  }, [amendOrder, amendingOrder, orderDrafts, setMessage]);

  const cancelPartially = useCallback((order: Order) => {
    const draft = orderDrafts[order.id] ?? {
      quantity: String(order.quantity),
      limitPrice: order.limitPrice?.toString() ?? "",
      cancelQuantity: String(Math.max(1, order.quantity - order.filledQuantity)),
    };
    const cancelQuantity = parsePositiveIntegerInput(draft.cancelQuantity);
    const remainingQuantity = order.quantity - order.filledQuantity;
    if (!cancelQuantity || cancelQuantity > remainingQuantity) {
      setMessage(`부분 취소 수량은 1주 이상 ${remainingQuantity}주 이하로 입력해 주세요.`);
      return;
    }

    if (partiallyCancellingOrder) {
      return;
    }
    cancelOrderPartially({ orderId: order.id, quantity: cancelQuantity });
  }, [cancelOrderPartially, orderDrafts, partiallyCancellingOrder, setMessage]);

  return {
    amend,
    amendingOrderId: amendingOrder ? amendOrderVariables?.orderId ?? null : null,
    cancel,
    cancelPartially,
    cancellingOrderId: cancellingOrder ? cancellingOrderVariable ?? null : null,
    partialCancellingOrderId: partiallyCancellingOrder ? cancelOrderPartiallyVariables?.orderId ?? null : null,
    placingOrder,
    submitOrder,
    updateOrderDraft,
  };
}
