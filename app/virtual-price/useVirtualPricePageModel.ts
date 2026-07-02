import { useState } from "react";

import { useAccountRequiredRedirect } from "@/app/hooks/useAccountRequiredRedirect";
import useAuthSession from "@/app/hooks/useAuthSession";
import { useLoginRequiredRedirect } from "@/app/hooks/useLoginRequiredRedirect";
import { getAccessTokenForAuthStatus } from "@/app/lib/auth";
import { useVirtualOrderTicketState } from "@/app/stores/stockUiStore";
import type { VirtualPriceWorkspaceProps } from "@/app/virtual-price/VirtualPriceWorkspace";
import { useVirtualPriceLiveUpdates } from "@/app/virtual-price/useVirtualPriceLiveUpdates";
import { useVirtualPriceOrderActions, type VirtualPriceOrderDrafts } from "@/app/virtual-price/useVirtualPriceOrderActions";
import { useVirtualPriceOrderTicketActions } from "@/app/virtual-price/useVirtualPriceOrderTicketActions";
import { useVirtualPricePageDerivedState } from "@/app/virtual-price/useVirtualPricePageDerivedState";
import { useVirtualPricePageQueries } from "@/app/virtual-price/useVirtualPricePageQueries";

export type VirtualPricePageModel = {
  refreshAll: () => Promise<void>;
  refreshing: boolean;
  statusMessage: string | null;
  workspaceProps: VirtualPriceWorkspaceProps;
};

export function useVirtualPricePageModel(): VirtualPricePageModel {
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<VirtualPriceOrderDrafts>({});
  const { ticket: virtualOrderTicket, setTicket: setVirtualOrderTicket } = useVirtualOrderTicketState();
  const { limitPrice, orderType, quantity, selectedSymbol, side } = virtualOrderTicket;
  const token = getAccessTokenForAuthStatus(authStatus);
  const isLoggedIn = authStatus === "in";

  const {
    accountStatusQuery,
    corporateActionEntitlements,
    executions,
    hasTradingAccount,
    holdings,
    instruments,
    lastUpdatedAt,
    orderBook,
    orders,
    portfolio,
    portfolioSnapshots,
    prices,
    priceTicks,
    profitSummary,
    profile,
    rankings,
    refreshing,
  } = useVirtualPricePageQueries({ authStatus, selectedSymbol, token });
  const {
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
  } = useVirtualPricePageDerivedState({
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
  });
  const {
    priceStreamConnected,
    refreshAll,
    refreshError,
  } = useVirtualPriceLiveUpdates({
    authStatus,
    isHydrated,
    selectedSymbol,
    setMessage,
  });
  const {
    applyAssetPercentQuantity,
    selectPrice,
    updateLimitPrice,
    updateOrderType,
    updateQuantity,
    updateSelectedSymbol,
    updateSide,
  } = useVirtualPriceOrderTicketActions({
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
  });
  const {
    amend,
    amendingOrderId,
    cancel,
    cancelPartially,
    cancellingOrderId,
    partialCancellingOrderId,
    placingOrder,
    submitOrder,
    updateOrderDraft,
  } = useVirtualPriceOrderActions({
    orderDrafts,
    orderType,
    orderValidationMessage,
    parsedLimitPrice,
    parsedOrderQuantity,
    selectedSymbol,
    setMessage,
    setOrderDrafts,
    side,
  });

  useLoginRequiredRedirect({ authStatus, isHydrated, preserveExpiredRedirect: true });
  useAccountRequiredRedirect({
    accountStatusPending: accountStatusQuery.isPending,
    authStatus,
    hasTradingAccount,
    isHydrated,
    nextPath: "/virtual-price",
  });

  return {
    refreshAll,
    refreshing,
    statusMessage: virtualPriceStatusMessage({
      accountStatusPending: accountStatusQuery.isPending,
      hasTradingAccount,
      isHydrated,
      isLoggedIn,
      authStatus,
    }),
    workspaceProps: {
      amend: (order) => void amend(order),
      amendingOrderId,
      cancel: (orderId) => void cancel(orderId),
      cancelPartially: (order) => void cancelPartially(order),
      cancellingOrderId,
      chronologicalTicks,
      corporateActionEntitlements,
      estimatedOrderValue,
      executions: recentExecutions,
      instrumentMap,
      instruments,
      lastUpdatedAt,
      limitPrice,
      message,
      orderActionClassName,
      orderBook,
      orderDrafts,
      orderType,
      orderValidationMessage,
      partialCancellingOrderId,
      pendingOrderCount: pendingOrders.length,
      placingOrder,
      portfolio,
      portfolioSnapshots,
      priceStreamConnected,
      priceTicks,
      prices,
      profile,
      profitSummary,
      quantity,
      rankings,
      recentOrders,
      refreshError,
      refreshing,
      selectedHolding,
      selectedInstrument,
      selectedPrice,
      selectedSymbol,
      side,
      user,
      visibleHoldings,
      onApplyAssetPercent: applyAssetPercentQuantity,
      onLimitPriceChange: updateLimitPrice,
      onOrderTypeChange: updateOrderType,
      onQuantityChange: updateQuantity,
      onSelectPrice: selectPrice,
      onSelectSymbol: updateSelectedSymbol,
      onSideChange: updateSide,
      onSubmitOrder: () => void submitOrder(),
      updateOrderDraft,
    },
  };
}

function virtualPriceStatusMessage({
  accountStatusPending,
  authStatus,
  hasTradingAccount,
  isHydrated,
  isLoggedIn,
}: {
  accountStatusPending: boolean;
  authStatus: string;
  hasTradingAccount: boolean;
  isHydrated: boolean;
  isLoggedIn: boolean;
}) {
  if (!isHydrated || authStatus === "unknown" || !isLoggedIn) {
    return "세션 확인 중";
  }
  if (accountStatusPending) {
    return "계좌 확인 중";
  }
  if (!hasTradingAccount) {
    return "계좌 필요 화면으로 이동 중";
  }
  return null;
}
