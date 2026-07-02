import { useCallback, useEffect } from "react";

import { getAssetPercentQuantityErrorMessage, resolveAssetPercentQuantity } from "@/app/lib/orderSizing";
import type { OrderTicketState } from "@/app/stores/stockUiStore";
import type { Holding, Instrument, OrderSide, OrderType, Portfolio, Price } from "@/app/types/stock";

import { resolveSelectedSymbol } from "./VirtualPriceFormatters";

type UseVirtualPriceOrderTicketActionsOptions = {
  instruments: Instrument[];
  limitPrice: string;
  orderType: OrderType;
  portfolio: Portfolio | null;
  prices: Price[];
  selectedHolding?: Holding;
  selectedPrice?: Price;
  selectedSymbol: string;
  setMessage: (message: string | null) => void;
  setVirtualOrderTicket: (patch: Partial<OrderTicketState>) => void;
  side: OrderSide;
};

export function useVirtualPriceOrderTicketActions({
  instruments,
  limitPrice,
  orderType,
  portfolio,
  prices,
  selectedHolding,
  selectedPrice,
  selectedSymbol,
  setMessage,
  setVirtualOrderTicket,
  side,
}: UseVirtualPriceOrderTicketActionsOptions) {
  useEffect(() => {
    const nextSelectedSymbol = resolveSelectedSymbol(selectedSymbol, instruments, prices);
    if (!nextSelectedSymbol || nextSelectedSymbol === selectedSymbol) {
      return;
    }
    const nextSelectedPrice = prices.find((price) => price.symbol === nextSelectedSymbol);
    setVirtualOrderTicket({
      selectedSymbol: nextSelectedSymbol,
      ...(nextSelectedPrice ? { limitPrice: String(Math.round(nextSelectedPrice.currentPrice)) } : {}),
    });
  }, [instruments, prices, selectedSymbol, setVirtualOrderTicket]);

  const applyAssetPercentQuantity = useCallback((percent: number) => {
    const result = resolveAssetPercentQuantity({
      availableCash: portfolio?.account.cashBalance,
      availableSellQuantity: selectedHolding?.availableQuantity,
      currentPrice: selectedPrice?.currentPrice,
      hasSelection: Boolean(selectedSymbol),
      limitPrice,
      orderType,
      percent,
      side,
      totalAsset: portfolio?.totalAsset,
    });
    if (!result.ok) {
      setMessage(getAssetPercentQuantityErrorMessage(result.reason));
      return;
    }
    setVirtualOrderTicket({
      quantity: String(result.quantity),
      ...(result.normalizedLimitPrice ? { limitPrice: result.normalizedLimitPrice } : {}),
    });
    setMessage(null);
  }, [limitPrice, orderType, portfolio, selectedHolding, selectedPrice, selectedSymbol, setMessage, setVirtualOrderTicket, side]);

  const selectPrice = useCallback((item: Price) => {
    setVirtualOrderTicket({
      selectedSymbol: item.symbol,
      limitPrice: String(Math.round(item.currentPrice)),
    });
    setMessage(null);
  }, [setMessage, setVirtualOrderTicket]);

  const updateLimitPrice = useCallback((value: string) => {
    setVirtualOrderTicket({ limitPrice: value });
    setMessage(null);
  }, [setMessage, setVirtualOrderTicket]);

  const updateOrderType = useCallback((value: OrderType) => {
    setVirtualOrderTicket({ orderType: value });
    setMessage(null);
  }, [setMessage, setVirtualOrderTicket]);

  const updateQuantity = useCallback((value: string) => {
    setVirtualOrderTicket({ quantity: value });
    setMessage(null);
  }, [setMessage, setVirtualOrderTicket]);

  const updateSelectedSymbol = useCallback((value: string) => {
    setVirtualOrderTicket({ selectedSymbol: value });
    setMessage(null);
  }, [setMessage, setVirtualOrderTicket]);

  const updateSide = useCallback((value: OrderSide) => {
    setVirtualOrderTicket({ side: value });
    setMessage(null);
  }, [setMessage, setVirtualOrderTicket]);

  return {
    applyAssetPercentQuantity,
    selectPrice,
    updateLimitPrice,
    updateOrderType,
    updateQuantity,
    updateSelectedSymbol,
    updateSide,
  };
}
