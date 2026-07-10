"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import { useAccountRequiredRedirect } from "@/app/hooks/useAccountRequiredRedirect";
import useAuthSession from "@/app/hooks/useAuthSession";
import { useLoginRequiredRedirect } from "@/app/hooks/useLoginRequiredRedirect";
import { getAccessTokenForAuthStatus, isAdminRole } from "@/app/lib/auth";
import { invalidateCorporateActionSubscriptionQueries } from "@/app/lib/react-query/stockInvalidations";
import { subscribeCorporateActionMutationOptions } from "@/app/lib/react-query/stockMutations";
import { createStockErrorMessageHandler } from "@/app/lib/react-query/stockResult";
import { useOrderBookTicketState } from "@/app/stores/stockUiStore";
import { InstrumentSelectionPanel } from "@/app/supply-demand/InstrumentSelectionPanel";
import { SupplyDemandPageChrome } from "@/app/supply-demand/SupplyDemandPageChrome";
import { SupplyDemandTradingWorkspace } from "@/app/supply-demand/SupplyDemandTradingWorkspace";
import { useSupplyDemandOrderActions } from "@/app/supply-demand/useSupplyDemandOrderActions";
import { useSupplyDemandOrderTicketActions } from "@/app/supply-demand/useSupplyDemandOrderTicketActions";
import { useSupplyDemandPageDerivedState } from "@/app/supply-demand/useSupplyDemandPageDerivedState";
import { useSupplyDemandPageQueries } from "@/app/supply-demand/useSupplyDemandPageQueries";
import type { OrderBookCandleInterval } from "@/app/types/stock";

export default function SupplyDemandPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [orderBookLayout, setOrderBookLayout] = useState<"split" | "stacked">("split");
  const [candleInterval, setCandleInterval] = useState<OrderBookCandleInterval>("1M");
  const [chartExpanded, setChartExpanded] = useState(false);
  const { ticket: orderBookTicket, setTicket: setOrderBookTicket } = useOrderBookTicketState();
  const { limitPrice, orderType, quantity, selectedSymbol, side } = orderBookTicket;
  const token = getAccessTokenForAuthStatus(authStatus);
  const isAdmin = isAdminRole(user?.role);
  const {
    accountStatusQuery,
    autoMarket,
    corporateActionEntitlements,
    corporateActionEntitlementsQuery,
    corporateActions,
    corporateActionsQuery,
    executions,
    hasTradingAccount,
    holdings,
    instruments,
    loading,
    orderBook,
    orderBookCandles,
    orderBookCandlesQuery,
    orderBookMarket,
    orderBookRecentExecutions,
    orderBookRecentExecutionsQuery,
    orderBookTradeSummary,
    orders,
    portfolio,
    updatedAt,
  } = useSupplyDemandPageQueries({
    authStatus,
    candleInterval,
    isHydrated,
    selectedSymbol,
    token,
  });
  const setCorporateActionErrorMessage = createStockErrorMessageHandler(setMessage, "기업 이벤트 청약에 실패했습니다.");
  const {
    isPending: subscribingCorporateAction,
    mutate: subscribeCorporateAction,
    variables: subscribingCorporateActionVariables,
  } = useMutation({
    ...subscribeCorporateActionMutationOptions(),
    onSuccess: async () => {
      setMessage("기업 이벤트 청약이 접수되었습니다.");
      await invalidateCorporateActionSubscriptionQueries(queryClient, selectedSymbol);
    },
    onError: setCorporateActionErrorMessage,
  });

  const {
    estimatedOrderAmount,
    instrumentSummaries,
    isSelectedMarketOpen,
    orderBookExecutions,
    orderBookOrders,
    selectedConfig,
    selectedHolding,
    selectedInstrument,
    selectedOrderBookConfig,
  } = useSupplyDemandPageDerivedState({
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
  });

  useLoginRequiredRedirect({ authStatus, isHydrated });

  useAccountRequiredRedirect({
    accountStatusPending: accountStatusQuery.isPending,
    authStatus,
    hasTradingAccount,
    isHydrated,
    nextPath: "/supply-demand",
  });

  const {
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
  } = useSupplyDemandOrderTicketActions({
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
  });

  const {
    cancelOpenOrder,
    cancellingOrderId,
    placingOrder,
    submitOrderBookOrder,
  } = useSupplyDemandOrderActions({
    candleInterval,
    hasTradingAccount,
    isSelectedMarketOpen,
    limitPrice,
    orderType,
    quantity,
    selectedInstrument,
    setMessage,
    side,
  });

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return <TradingStatusScreen>세션 확인 중</TradingStatusScreen>;
  }

  if (accountStatusQuery.isPending) {
    return <TradingStatusScreen>계좌 확인 중</TradingStatusScreen>;
  }

  if (!hasTradingAccount) {
    return <TradingStatusScreen>계좌 필요 화면으로 이동 중</TradingStatusScreen>;
  }

  return (
    <SupplyDemandPageChrome
      isAdmin={isAdmin}
      selectedInstrument={selectedInstrument}
      onAdminClick={() => router.push("/supply-demand/admin")}
      onClearSelectedInstrument={clearSelectedInstrument}
    >
      {!selectedInstrument ? (
        <InstrumentSelectionPanel
          isLoading={loading}
          isAdmin={isAdmin}
          isMarketOpen={orderBookMarket?.enabled === true}
          summaries={instrumentSummaries}
          updatedAt={updatedAt}
          onAdminClick={() => router.push("/supply-demand/admin")}
          onSelect={selectInstrument}
        />
      ) : (
        <SupplyDemandTradingWorkspace
          autoMarket={autoMarket}
          cancellingOrderId={cancellingOrderId}
          candles={orderBookCandles}
          candleInterval={candleInterval}
          chartExpanded={chartExpanded}
          corporateActionEntitlements={corporateActionEntitlements.filter((entitlement) => entitlement.symbol === selectedSymbol)}
          corporateActions={corporateActions}
          estimatedOrderAmount={estimatedOrderAmount}
          flashingOrderBookLevel={flashingOrderBookLevel}
          instruments={instruments}
          isCandlesLoading={orderBookCandlesQuery.isLoading}
          isCorporateActionsLoading={corporateActionsQuery.isLoading || corporateActionEntitlementsQuery.isLoading}
          isLoading={loading}
          isRecentExecutionsLoading={orderBookRecentExecutionsQuery.isLoading}
          isSelectedMarketOpen={isSelectedMarketOpen}
          limitPrice={limitPrice}
          message={message}
          orderBook={orderBook}
          orderBookExecutions={orderBookExecutions}
          orderBookLayout={orderBookLayout}
          orderBookMarket={orderBookMarket}
          orderBookOrders={orderBookOrders}
          orderBookRecentExecutions={orderBookRecentExecutions}
          orderBookTradeSummary={orderBookTradeSummary}
          orderType={orderType}
          placingOrder={placingOrder}
          portfolio={portfolio}
          quantity={quantity}
          selectedConfig={selectedConfig}
          selectedHolding={selectedHolding}
          selectedInstrument={selectedInstrument}
          selectedOrderBookConfig={selectedOrderBookConfig}
          selectedSymbol={selectedSymbol}
          side={side}
          subscribingCorporateActionId={subscribingCorporateAction ? subscribingCorporateActionVariables?.actionId ?? null : null}
          updatedAt={updatedAt}
          onAssetPercentSelect={applyAssetPercentQuantity}
          onCancelOrder={cancelOpenOrder}
          onChartExpandedChange={setChartExpanded}
          onCandleIntervalChange={setCandleInterval}
          onFlashEnd={clearFlashingOrderBookLevel}
          onLayoutChange={setOrderBookLayout}
          onLimitPriceChange={updateLimitPrice}
          onLimitPriceStep={stepLimitPrice}
          onOrderTypeChange={updateOrderType}
          onPriceSelect={selectOrderBookPrice}
          onQuantityChange={updateQuantity}
          onSelectInstrument={selectInstrument}
          onSideChange={updateSide}
          onSubscribeCorporateAction={(actionId, shareQuantity) => subscribeCorporateAction({
            actionId,
            payload: { shareQuantity },
          })}
          onSubmitOrder={submitOrderBookOrder}
        />
      )}
    </SupplyDemandPageChrome>
  );
}
