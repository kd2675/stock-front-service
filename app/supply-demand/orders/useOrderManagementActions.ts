import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { parsePositiveIntegerInput } from "@/app/lib/numberParsing";
import { invalidateOrderBookTradingQueries } from "@/app/lib/react-query/stockInvalidations";
import { cancelOrderMutationOptions, cancelOrderPartiallyMutationOptions } from "@/app/lib/react-query/stockMutations";
import { createStockErrorMessageHandler } from "@/app/lib/react-query/stockResult";
import { formatNumber } from "@/app/lib/stockFormatters";
import type { Order } from "@/app/types/stock";

import { getRemainingQuantity } from "./OrderManagementTable";

type UseOrderManagementActionsOptions = {
  setMessage: (message: string | null) => void;
};

export function useOrderManagementActions({
  setMessage,
}: UseOrderManagementActionsOptions) {
  const queryClient = useQueryClient();
  const [partialCancelQuantityByOrderId, setPartialCancelQuantityByOrderId] = useState<Record<number, string>>({});
  const setCancelOrderErrorMessage = createStockErrorMessageHandler(setMessage, "주문 취소에 실패했습니다.");
  const setPartialCancelErrorMessage = createStockErrorMessageHandler(setMessage, "부분 취소에 실패했습니다.");

  const updatePartialCancelQuantity = useCallback((orderId: number, value: string) => {
    setPartialCancelQuantityByOrderId((current) => ({ ...current, [orderId]: value }));
  }, []);

  const invalidateOrderState = async (targetOrders: Order[]) => {
    await invalidateOrderBookTradingQueries(queryClient, {
      symbols: targetOrders.map((order) => order.symbol),
    });
  };

  const cancelOrderMutation = useMutation({
    ...cancelOrderMutationOptions(),
    onSuccess: async (order) => {
      setMessage("주문 잔량을 취소했습니다.");
      await invalidateOrderState([order]);
    },
    onError: setCancelOrderErrorMessage,
  });
  const partialCancelMutation = useMutation({
    ...cancelOrderPartiallyMutationOptions(),
    onSuccess: async (order) => {
      setPartialCancelQuantityByOrderId((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      setMessage("주문을 부분 취소했습니다.");
      await invalidateOrderState([order]);
    },
    onError: setPartialCancelErrorMessage,
  });

  const cancelRemainingOrder = (order: Order) => {
    if (cancelOrderMutation.isPending || partialCancelMutation.isPending) {
      return;
    }
    cancelOrderMutation.mutate(order.id);
  };

  const cancelPartialOrder = (order: Order) => {
    if (cancelOrderMutation.isPending || partialCancelMutation.isPending) {
      return;
    }
    const rawQuantity = partialCancelQuantityByOrderId[order.id]?.trim() ?? "";
    const quantity = parsePositiveIntegerInput(rawQuantity);
    const remainingQuantity = getRemainingQuantity(order);
    if (quantity === null || quantity > remainingQuantity) {
      setMessage(`부분 취소 수량은 1주 이상 ${formatNumber(remainingQuantity)}주 이하로 입력해 주세요.`);
      return;
    }
    partialCancelMutation.mutate({ orderId: order.id, quantity });
  };

  return {
    cancelPartialOrder,
    cancelRemainingOrder,
    cancellingOrderId: cancelOrderMutation.isPending ? cancelOrderMutation.variables ?? null : null,
    partialCancellingOrderId: partialCancelMutation.isPending ? partialCancelMutation.variables?.orderId ?? null : null,
    partialCancelQuantityByOrderId,
    updatePartialCancelQuantity,
  };
}
