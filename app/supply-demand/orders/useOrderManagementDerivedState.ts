import { useMemo } from "react";

import type { Order, OrderBookInstrument } from "@/app/types/stock";

import { compareOrderCreatedDesc, isOpenOrder } from "./OrderManagementTable";

type UseOrderManagementDerivedStateOptions = {
  instruments: OrderBookInstrument[];
  orders: Order[];
};

export function useOrderManagementDerivedState({
  instruments,
  orders,
}: UseOrderManagementDerivedStateOptions) {
  const instrumentBySymbol = useMemo(
    () => new Map(instruments.map((instrument) => [instrument.symbol, instrument])),
    [instruments],
  );
  const openOrders = useMemo(() => orders.filter(isOpenOrder), [orders]);
  const partialOrders = useMemo(
    () => openOrders.filter((order) => order.status === "PARTIALLY_FILLED"),
    [openOrders],
  );
  const completedOrders = useMemo(
    () => orders.filter((order) => !isOpenOrder(order)),
    [orders],
  );
  const sortedOpenOrders = useMemo(
    () => [...openOrders].sort(compareOrderCreatedDesc),
    [openOrders],
  );
  const sortedOrders = useMemo(
    () => [...orders].sort(compareOrderCreatedDesc),
    [orders],
  );

  return {
    completedOrders,
    instrumentBySymbol,
    openOrders,
    partialOrders,
    sortedOpenOrders,
    sortedOrders,
  };
}
