import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { applyPriceStreamEventQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { invalidateVirtualPricePageQueries } from "@/app/lib/react-query/stockInvalidations";
import { createStockErrorMessageHandler } from "@/app/lib/react-query/stockResult";
import { getPriceStreamUrl } from "@/app/lib/stock";
import type { AuthStatus } from "@/app/types/auth";
import type { PriceStreamEvent } from "@/app/types/stock";

import { parsePriceStreamEvent } from "./VirtualPricePriceStreamHelpers";

type UseVirtualPriceLiveUpdatesOptions = {
  authStatus: AuthStatus;
  isHydrated: boolean;
  selectedSymbol: string;
  setMessage: (message: string | null) => void;
};

export function useVirtualPriceLiveUpdates({
  authStatus,
  isHydrated,
  selectedSymbol,
  setMessage,
}: UseVirtualPriceLiveUpdatesOptions) {
  const queryClient = useQueryClient();
  const [priceStreamConnected, setPriceStreamConnected] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const setRefreshFailureMessage = useMemo(
    () => createStockErrorMessageHandler(setRefreshError, "시세 갱신에 실패했습니다."),
    [],
  );

  const applyPriceStreamEvent = useCallback((event: PriceStreamEvent) => {
    applyPriceStreamEventQueryData(queryClient, event, { selectedSymbol });
  }, [queryClient, selectedSymbol]);

  const refreshAll = useCallback(async (preserveMessage = false) => {
    setRefreshError(null);
    if (!preserveMessage) {
      setMessage(null);
    }
    try {
      await invalidateVirtualPricePageQueries(queryClient, selectedSymbol);
    } catch (error) {
      setRefreshFailureMessage(error);
    }
  }, [queryClient, selectedSymbol, setMessage, setRefreshFailureMessage]);

  useEffect(() => {
    if (!isHydrated || authStatus !== "in" || typeof EventSource === "undefined") {
      return;
    }
    const source = new EventSource(getPriceStreamUrl(), { withCredentials: true });
    source.onopen = () => {
      setPriceStreamConnected(true);
    };
    source.onerror = () => {
      setPriceStreamConnected(false);
    };
    const handlePrice = (message: MessageEvent<string>) => {
      const event = parsePriceStreamEvent(message.data);
      if (event) {
        applyPriceStreamEvent(event);
      }
    };
    source.addEventListener("price", handlePrice);
    source.addEventListener("connected", () => {
      setPriceStreamConnected(true);
    });
    return () => {
      source.close();
      setPriceStreamConnected(false);
    };
  }, [applyPriceStreamEvent, authStatus, isHydrated]);

  useEffect(() => {
    if (!isHydrated || authStatus !== "in") {
      return;
    }
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshAll(true);
      }
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [authStatus, isHydrated, refreshAll]);

  return {
    priceStreamConnected,
    refreshAll,
    refreshError,
  };
}
