import { useCallback, useEffect, useState } from "react";

import { isPositiveFiniteNumber } from "@/app/lib/numberParsing";
import { formatOrderInputPrice, resolveDefaultLimitPrice, resolveLimitPriceForInstrument, resolveSteppedLimitPrice } from "@/app/lib/orderBookPricing";
import { getAssetPercentQuantityErrorMessage, resolveAssetPercentQuantity } from "@/app/lib/orderSizing";
import type { OrderTicketState } from "@/app/stores/stockUiStore";
import type { FlashingOrderBookLevel, OrderBookSideType } from "@/app/supply-demand/OrderBookDepthModel";
import type { Holding, OrderBookInstrument, OrderSide, OrderType, Portfolio } from "@/app/types/stock";

type UseSupplyDemandOrderTicketActionsOptions = {
  instruments: OrderBookInstrument[];
  limitPrice: string;
  orderType: OrderType;
  portfolio: Portfolio | null;
  selectedHolding?: Holding;
  selectedInstrument?: OrderBookInstrument;
  selectedSymbol: string;
  setMessage: (message: string | null) => void;
  setOrderBookTicket: (patch: Partial<OrderTicketState>) => void;
  side: OrderSide;
};

export function useSupplyDemandOrderTicketActions({
  instruments,
  limitPrice,
  orderType,
  portfolio,
  selectedHolding,
  selectedInstrument,
  selectedSymbol,
  setMessage,
  setOrderBookTicket,
  side,
}: UseSupplyDemandOrderTicketActionsOptions) {
  const [flashingOrderBookLevel, setFlashingOrderBookLevel] = useState<FlashingOrderBookLevel>(null);

  useEffect(() => {
    setOrderBookTicket({ selectedSymbol: "" });
  }, [setOrderBookTicket]);

  useEffect(() => {
    if (!selectedSymbol || !instruments.length) {
      return;
    }
    if (!instruments.some((instrument) => instrument.symbol === selectedSymbol)) {
      setOrderBookTicket({ selectedSymbol: "" });
    }
  }, [instruments, selectedSymbol, setOrderBookTicket]);

  const selectInstrument = useCallback((symbol: string) => {
    const nextInstrument = instruments.find((instrument) => instrument.symbol === symbol);
    setOrderBookTicket({
      selectedSymbol: symbol,
      limitPrice: nextInstrument ? formatOrderInputPrice(resolveDefaultLimitPrice(nextInstrument)) : limitPrice,
    });
    setMessage(null);
  }, [instruments, limitPrice, setMessage, setOrderBookTicket]);

  const clearSelectedInstrument = useCallback(() => {
    setOrderBookTicket({ selectedSymbol: "" });
  }, [setOrderBookTicket]);

  const clearFlashingOrderBookLevel = useCallback(() => {
    setFlashingOrderBookLevel(null);
  }, []);

  const selectOrderBookPrice = useCallback((price: number, clickedSide: OrderBookSideType) => {
    if (!isPositiveFiniteNumber(price)) {
      return;
    }
    setFlashingOrderBookLevel(null);
    window.setTimeout(() => {
      setFlashingOrderBookLevel({ price, side: clickedSide, nonce: Date.now() });
    }, 0);
    setOrderBookTicket({
      orderType: "LIMIT",
      limitPrice: formatOrderInputPrice(selectedInstrument ? resolveLimitPriceForInstrument(price, selectedInstrument) : price),
    });
    setMessage(null);
  }, [selectedInstrument, setMessage, setOrderBookTicket]);

  const applyAssetPercentQuantity = useCallback((percent: number) => {
    const result = resolveAssetPercentQuantity({
      availableCash: portfolio?.account.cashBalance,
      availableSellQuantity: selectedHolding?.availableQuantity,
      currentPrice: selectedInstrument?.currentPrice,
      hasSelection: Boolean(selectedInstrument),
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
    setOrderBookTicket({
      quantity: String(result.quantity),
      ...(result.normalizedLimitPrice && selectedInstrument ? { limitPrice: formatOrderInputPrice(resolveDefaultLimitPrice(selectedInstrument)) } : {}),
    });
    setMessage(null);
  }, [limitPrice, orderType, portfolio, selectedHolding, selectedInstrument, setMessage, setOrderBookTicket, side]);

  const stepLimitPrice = useCallback((direction: -1 | 1) => {
    if (!selectedInstrument || orderType === "MARKET") {
      return;
    }
    const nextLimitPrice = resolveSteppedLimitPrice({
      currentValue: limitPrice,
      direction,
      instrument: selectedInstrument,
    });
    setOrderBookTicket({ limitPrice: formatOrderInputPrice(nextLimitPrice) });
    setMessage(null);
  }, [limitPrice, orderType, selectedInstrument, setMessage, setOrderBookTicket]);

  const updateLimitPrice = useCallback((value: string) => {
    setOrderBookTicket({ limitPrice: value });
  }, [setOrderBookTicket]);

  const updateOrderType = useCallback((value: OrderType) => {
    setOrderBookTicket({ orderType: value });
  }, [setOrderBookTicket]);

  const updateQuantity = useCallback((value: string) => {
    setOrderBookTicket({ quantity: value });
  }, [setOrderBookTicket]);

  const updateSide = useCallback((value: OrderSide) => {
    setOrderBookTicket({ side: value });
  }, [setOrderBookTicket]);

  return {
    applyAssetPercentQuantity,
    clearFlashingOrderBookLevel,
    clearSelectedInstrument,
    flashingOrderBookLevel,
    selectInstrument,
    selectOrderBookPrice,
    stepLimitPrice,
    updateLimitPrice,
    updateOrderType,
    updateQuantity,
    updateSide,
  };
}
