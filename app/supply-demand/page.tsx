"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import useAuthSession from "@/app/hooks/useAuthSession";
import { getAccessToken, isAdminRole } from "@/app/lib/auth";
import { ASSET_PERCENT_OPTIONS, calculateAssetPercentQuantity, resolveOrderSizingPrice } from "@/app/lib/orderSizing";
import { cancelOrderMutationOptions, placeOrderMutationOptions } from "@/app/lib/react-query/stockMutations";
import { accountStatusQueryOptions, autoMarketStatusQueryOptions, executionsQueryOptions, holdingsQueryOptions, orderBookInstrumentsQueryOptions, orderBookMarketStatusQueryOptions, orderBookQueryOptions, ordersQueryOptions, portfolioQueryOptions } from "@/app/lib/react-query/stockQueries";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { parseOrderTicket } from "@/app/lib/validation/orderSchemas";
import { useStockUiStore } from "@/app/stores/stockUiStore";
import type { AutoMarketConfig, Execution, MarketSessionStatus, Order, OrderBookInstrument, OrderSide, OrderType, SymbolMarketConfig } from "@/app/types/stock";

const ORDER_BOOK_VISIBLE_LEVELS = 8;
const EMPTY_ORDER_BOOK_INSTRUMENTS: OrderBookInstrument[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_EXECUTIONS: Execution[] = [];

type InstrumentSummary = {
  instrument: OrderBookInstrument;
  autoConfig?: AutoMarketConfig;
  marketConfig?: SymbolMarketConfig;
};

export default function SupplyDemandPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [flashingOrderBookLevel, setFlashingOrderBookLevel] = useState<{ price: number; side: "bid" | "ask"; nonce: number } | null>(null);
  const orderBookTicket = useStockUiStore((state) => state.orderBookTicket);
  const setOrderBookTicket = useStockUiStore((state) => state.setOrderBookTicket);
  const { limitPrice, orderType, quantity, selectedSymbol, side } = orderBookTicket;
  const token = authStatus === "in" ? getAccessToken() : null;
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const accountStatusQuery = useQuery({
    ...accountStatusQueryOptions(token),
    enabled: isHydrated && authStatus === "in" && Boolean(token),
  });
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true;
  const instrumentsQuery = useQuery({
    ...orderBookInstrumentsQueryOptions(),
    enabled: hasTradingAccount,
  });
  const autoMarketQuery = useQuery({
    ...autoMarketStatusQueryOptions(),
    enabled: hasTradingAccount,
  });
  const orderBookMarketQuery = useQuery({
    ...orderBookMarketStatusQueryOptions(),
    enabled: hasTradingAccount,
  });
  const orderBookQuery = useQuery({
    ...orderBookQueryOptions(selectedSymbol),
    enabled: hasTradingAccount && Boolean(selectedSymbol),
  });
  const ordersQuery = useQuery(ordersQueryOptions(token, { marketType: "ORDER_BOOK", enabled: hasTradingAccount }));
  const executionsQuery = useQuery(executionsQueryOptions(token, { source: "INTERNAL_ORDER_BOOK", enabled: hasTradingAccount }));
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasTradingAccount));
  const instruments = instrumentsQuery.data ?? EMPTY_ORDER_BOOK_INSTRUMENTS;
  const autoMarket = autoMarketQuery.data ?? null;
  const orderBookMarket = orderBookMarketQuery.data ?? null;
  const orderBook = orderBookQuery.data ?? null;
  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const executions = executionsQuery.data ?? EMPTY_EXECUTIONS;
  const portfolio = portfolioQuery.data ?? null;
  const holdings = useMemo(
    () => holdingsQuery.data ?? portfolio?.holdings ?? [],
    [holdingsQuery.data, portfolio?.holdings],
  );
  const updatedAtMs = Math.max(
    instrumentsQuery.dataUpdatedAt,
    autoMarketQuery.dataUpdatedAt,
    orderBookMarketQuery.dataUpdatedAt,
    orderBookQuery.dataUpdatedAt,
    ordersQuery.dataUpdatedAt,
    executionsQuery.dataUpdatedAt,
    portfolioQuery.dataUpdatedAt,
    holdingsQuery.dataUpdatedAt,
  );
  const updatedAt = updatedAtMs > 0 ? new Date(updatedAtMs) : null;
  const loading = instrumentsQuery.isLoading || autoMarketQuery.isLoading || orderBookMarketQuery.isLoading;

  const selectedInstrument = useMemo(
    () => instruments.find((instrument) => instrument.symbol === selectedSymbol),
    [instruments, selectedSymbol],
  );
  const selectedConfig = useMemo(
    () => autoMarket?.configs.find((config) => config.symbol === selectedInstrument?.symbol),
    [autoMarket?.configs, selectedInstrument?.symbol],
  );
  const selectedOrderBookConfig = useMemo(
    () => orderBookMarket?.configs.find((config) => config.symbol === selectedInstrument?.symbol),
    [orderBookMarket?.configs, selectedInstrument?.symbol],
  );
  const selectedHolding = useMemo(
    () => holdings.find((holding) => holding.symbol === selectedInstrument?.symbol),
    [holdings, selectedInstrument?.symbol],
  );
  const instrumentSummaries = useMemo(
    () => instruments.map((instrument) => ({
      instrument,
      autoConfig: autoMarket?.configs.find((config) => config.symbol === instrument.symbol),
      marketConfig: orderBookMarket?.configs.find((config) => config.symbol === instrument.symbol),
    })),
    [autoMarket?.configs, instruments, orderBookMarket?.configs],
  );
  const isSelectedMarketOpen = selectedOrderBookConfig?.enabled === true && selectedOrderBookConfig.marketStatus === "OPEN";
  const orderBookOrders = useMemo(
    () => orders.filter((order) => order.symbol === selectedSymbol).slice(0, 5),
    [orders, selectedSymbol],
  );
  const orderBookExecutions = useMemo(
    () => executions.filter((execution) => execution.symbol === selectedSymbol).slice(0, 5),
    [executions, selectedSymbol],
  );
  const estimatedOrderAmount = useMemo(() => {
    const parsedQuantity = Number.parseInt(quantity, 10);
    const parsedPrice = orderType === "LIMIT" ? Number.parseFloat(limitPrice) : selectedInstrument?.currentPrice;
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0 || parsedPrice === undefined || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return undefined;
    }
    return parsedQuantity * parsedPrice;
  }, [limitPrice, orderType, quantity, selectedInstrument?.currentPrice]);

  useEffect(() => {
    setOrderBookTicket({ selectedSymbol: "" });
  }, [setOrderBookTicket]);

  useEffect(() => {
    if (!isHydrated || authStatus === "unknown") {
      return;
    }
    if (authStatus === "out") {
      router.replace("/login");
    }
  }, [authStatus, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || authStatus !== "in" || accountStatusQuery.isPending || hasTradingAccount) {
      return;
    }
    router.replace("/account-required?next=/supply-demand");
  }, [accountStatusQuery.isPending, authStatus, hasTradingAccount, isHydrated, router]);

  useEffect(() => {
    if (!selectedSymbol || !instruments.length) {
      return;
    }
    if (!instruments.some((instrument) => instrument.symbol === selectedSymbol)) {
      setOrderBookTicket({ selectedSymbol: "" });
    }
  }, [instruments, selectedSymbol, setOrderBookTicket]);

  const selectInstrument = (symbol: string) => {
    const nextInstrument = instruments.find((instrument) => instrument.symbol === symbol);
    setOrderBookTicket({
      selectedSymbol: symbol,
      limitPrice: nextInstrument ? formatOrderInputPrice(resolveDefaultLimitPrice(nextInstrument)) : limitPrice,
    });
    setMessage(null);
  };

  const selectOrderBookPrice = (price: number, clickedSide: "bid" | "ask") => {
    if (!Number.isFinite(price) || price <= 0) {
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
  };

  const invalidateOrderBookTrading = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: stockKeys.autoMarketStatus() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatus() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.portfolio() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.holdings() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.orders({ marketType: "ORDER_BOOK" }) }),
      queryClient.invalidateQueries({ queryKey: stockKeys.executions({ source: "INTERNAL_ORDER_BOOK" }) }),
      selectedInstrument?.symbol ? queryClient.invalidateQueries({ queryKey: stockKeys.orderBook(selectedInstrument.symbol) }) : Promise.resolve(),
    ]);
  };

  const applyAssetPercentQuantity = (percent: number) => {
    if (!selectedInstrument) {
      setMessage("종목을 선택해 주세요.");
      return;
    }
    const resolvedPrice = resolveOrderSizingPrice({
      currentPrice: selectedInstrument.currentPrice,
      limitPrice,
      orderType,
    });
    if (!resolvedPrice) {
      setMessage("현재가 또는 주문가를 확인해 주세요.");
      return;
    }
    const nextQuantity = calculateAssetPercentQuantity({
      availableCash: portfolio?.account.cashBalance,
      availableSellQuantity: selectedHolding?.availableQuantity,
      percent,
      price: resolvedPrice.price,
      side,
      totalAsset: portfolio?.totalAsset,
    });
    if (nextQuantity === null) {
      setMessage("자산 정보를 불러온 뒤 다시 선택해 주세요.");
      return;
    }
    setOrderBookTicket({
      quantity: String(nextQuantity),
      ...(resolvedPrice.normalizedLimitPrice && selectedInstrument ? { limitPrice: formatOrderInputPrice(resolveDefaultLimitPrice(selectedInstrument)) } : {}),
    });
    setMessage(null);
  };

  const stepLimitPrice = (direction: -1 | 1) => {
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
  };

  const placeOrderMutation = useMutation({
    ...placeOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문장 주문이 접수되었습니다.");
      await invalidateOrderBookTrading();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문 접수에 실패했습니다.");
    },
  });
  const cancelOrderMutation = useMutation({
    ...cancelOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 취소했습니다.");
      await invalidateOrderBookTrading();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문 취소에 실패했습니다.");
    },
  });
  const cancellingOrderId = cancelOrderMutation.isPending ? cancelOrderMutation.variables ?? null : null;

  const submitOrderBookOrder = async () => {
    if (!selectedInstrument?.symbol || placeOrderMutation.isPending) {
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
    placeOrderMutation.mutate({
      symbol: selectedInstrument.symbol,
      marketType: "ORDER_BOOK",
      side,
      orderType,
      limitPrice: orderType === "LIMIT" ? parsed.data.limitPrice : undefined,
      quantity: parsed.data.quantity,
      clientOrderId: `orderbook-${Date.now()}`,
    });
  };

  const cancelOpenOrder = async (orderId: number) => {
    if (cancellingOrderId) {
      return;
    }
    cancelOrderMutation.mutate(orderId);
  };

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          세션 확인 중
        </div>
      </main>
    );
  }

  if (accountStatusQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          계좌 확인 중
        </div>
      </main>
    );
  }

  if (!hasTradingAccount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          계좌 필요 화면으로 이동 중
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#191f28]">
      <TradingTopBar
        active="order-book"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/supply-demand/orders" className="inline-flex h-11 items-center rounded-md bg-[#191f28] px-3 text-sm font-bold text-white">
              내 주문
            </Link>
            {isAdmin ? (
              <button type="button" onClick={() => router.push("/supply-demand/admin")} className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
                설정 현황
              </button>
            ) : null}
          </div>
        )}
      />

      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#3182f6]">LIVE ORDER BOOK</p>
              <h1 className="mt-1 text-2xl font-black">{selectedInstrument ? "자동장 주문" : "자동장 종목 선택"}</h1>
            </div>
            {selectedInstrument ? (
              <button
                type="button"
                onClick={() => setOrderBookTicket({ selectedSymbol: "" })}
                className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]"
              >
                종목 목록
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {!selectedInstrument ? (
        <InstrumentSelection
          isLoading={loading}
          isAdmin={isAdmin}
          summaries={instrumentSummaries}
          updatedAt={updatedAt}
          onAdminClick={() => router.push("/supply-demand/admin")}
          onSelect={selectInstrument}
        />
      ) : (
        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="space-y-5">
          <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#6b7684]">종목</p>
                <h2 className="mt-1 text-xl font-black">{selectedInstrument ? `${selectedInstrument.name} ${selectedInstrument.symbol}` : "종목 없음"}</h2>
              </div>
              <select
                value={selectedSymbol}
                onChange={(event) => selectInstrument(event.target.value)}
                className="rounded-md border border-[#d1d6db] bg-white px-3 py-2 text-sm font-bold"
              >
                <option value="" disabled>등록된 종목 없음</option>
                {instruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Metric label="현재가" value={formatWon(selectedInstrument?.currentPrice)} />
              <Metric label="제한 기준가" value={formatWon(selectedInstrument?.priceLimitBase)} />
              <Metric label="장 상태" value={formatMarketSessionStatus(selectedOrderBookConfig?.marketStatus)} tone={isSelectedMarketOpen ? "blue" : "red"} />
              <Metric label="주문장 주문" value={orderBookMarket ? `${orderBookMarket.openOrderCount}건` : "-"} />
            </div>

            {message ? <p className="mt-4 rounded-md bg-[#fff3f0] px-3 py-2 text-sm font-bold text-[#d34b36]">{message}</p> : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <OrderBookSide title="매도" flashingLevel={flashingOrderBookLevel} levels={orderBook?.asks ?? []} side="ask" onFlashEnd={() => setFlashingOrderBookLevel(null)} onPriceSelect={selectOrderBookPrice} />
            <OrderBookSide title="매수" flashingLevel={flashingOrderBookLevel} levels={orderBook?.bids ?? []} side="bid" onFlashEnd={() => setFlashingOrderBookLevel(null)} onPriceSelect={selectOrderBookPrice} />
          </div>
        </div>

        <aside className="space-y-5">
          <OrderTicket
            estimatedOrderAmount={estimatedOrderAmount}
            isMarketOpen={isSelectedMarketOpen}
            limitPrice={limitPrice}
            orderType={orderType}
            placingOrder={placeOrderMutation.isPending}
            quantity={quantity}
            totalAsset={portfolio?.totalAsset}
            availableCash={portfolio?.account.cashBalance}
            availableSellQuantity={selectedHolding?.availableQuantity}
            selectedInstrument={selectedInstrument}
            side={side}
            onAssetPercentSelect={applyAssetPercentQuantity}
            onLimitPriceChange={(value) => setOrderBookTicket({ limitPrice: value })}
            onLimitPriceStep={stepLimitPrice}
            onOrderTypeChange={(value) => setOrderBookTicket({ orderType: value })}
            onQuantityChange={(value) => setOrderBookTicket({ quantity: value })}
            onSideChange={(value) => setOrderBookTicket({ side: value })}
            onSubmit={submitOrderBookOrder}
          />

          <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
            <h3 className="text-base font-black">자동장 상태</h3>
            <div className="mt-4 space-y-3">
              <StatusRow label="상태" value={autoMarket?.enabled ? "가동" : "정지"} />
              <StatusRow label="주문장 시장" value={orderBookMarket?.enabled ? "가동" : "정지"} />
              <StatusRow label="선택 종목 장" value={formatMarketSessionStatus(selectedOrderBookConfig?.marketStatus)} />
              <StatusRow label="자동 강도" value={selectedConfig ? `${selectedConfig.intensity}/10` : "-"} />
              <StatusRow label="자동 참여자" value={autoMarket ? `${autoMarket.enabledParticipantCount}명` : "-"} />
              <StatusRow label="오늘 자동 체결" value={autoMarket ? `${autoMarket.todayAutoExecutionCount}건` : "-"} />
              <StatusRow label="마지막 갱신" value={updatedAt ? updatedAt.toLocaleTimeString("ko-KR") : loading ? "조회 중" : "-"} />
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
            <h3 className="text-base font-black">종목별 자동장</h3>
            <div className="mt-3 divide-y divide-[#eef0f2]">
              {(autoMarket?.configs ?? []).length ? (autoMarket?.configs ?? []).map((config) => (
                <button
                  key={config.symbol}
                  type="button"
                  onClick={() => selectInstrument(config.symbol)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-left"
                >
                  <span className="font-bold">{config.symbol}</span>
                  <span className={config.enabled ? "font-black text-[#3182f6]" : "font-bold text-[#8b95a1]"}>
                    {config.enabled ? `강도 ${config.intensity}` : "정지"}
                  </span>
                </button>
              )) : (
                <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">관리자 설정에서 자동장 대상 종목을 먼저 등록하세요.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black">내 주문</h3>
                <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">선택 종목 최근 5건</p>
              </div>
              <Link href="/supply-demand/orders" className="rounded-md bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-black text-[#333d4b]">
                전체 보기
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {orderBookOrders.length ? orderBookOrders.map((order) => {
                const isOpenOrder = order.status === "PENDING" || order.status === "PARTIALLY_FILLED";
                return (
                  <article key={order.id} className="rounded-md bg-[#f7f8fa] p-3">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-black">{order.side === "BUY" ? "매수" : "매도"} {order.symbol}</p>
                      <span className="shrink-0 rounded-sm bg-white px-2 py-1 text-xs font-bold text-[#4e5968]">
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs font-bold text-[#6b7684]">
                      <span>{order.filledQuantity}/{order.quantity}주</span>
                      <span className="tabular-nums">{formatOrderPrice(order)}</span>
                    </div>
                    {isOpenOrder ? (
                      <button
                        type="button"
                        onClick={() => void cancelOpenOrder(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className="mt-3 w-full rounded-md bg-white px-3 py-2 text-xs font-black text-[#333d4b] ring-1 ring-[#d1d6db] disabled:opacity-50"
                      >
                        {cancellingOrderId === order.id ? "취소 중" : "취소"}
                      </button>
                    ) : null}
                  </article>
                );
              }) : (
                <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">주문장 주문 내역이 없습니다.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
            <h3 className="text-base font-black">최근 체결</h3>
            <div className="mt-3 space-y-3">
              {orderBookExecutions.length ? orderBookExecutions.map((execution) => (
                <article key={execution.id} className="rounded-md bg-[#f7f8fa] p-3">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-black">{execution.side === "BUY" ? "매수" : "매도"} {execution.symbol}</p>
                    <span className="shrink-0 text-xs font-bold text-[#6b7684]">{execution.quantity}주</span>
                  </div>
                  <p className="mt-2 text-sm font-black tabular-nums">{formatWon(execution.price)}</p>
                  <p className="mt-1 text-xs font-bold text-[#6b7684]">순금액 {formatWon(execution.netAmount)}</p>
                </article>
              )) : (
                <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">주문장 체결 내역이 없습니다.</p>
              )}
            </div>
          </div>
        </aside>
        </section>
      )}
    </main>
  );
}

function InstrumentSelection({
  isLoading,
  isAdmin,
  summaries,
  updatedAt,
  onAdminClick,
  onSelect,
}: {
  isLoading: boolean;
  isAdmin: boolean;
  summaries: InstrumentSummary[];
  updatedAt: Date | null;
  onAdminClick: () => void;
  onSelect: (symbol: string) => void;
}) {
  const openCount = summaries.filter((summary) => summary.marketConfig?.enabled === true && summary.marketConfig.marketStatus === "OPEN").length;
  const autoEnabledCount = summaries.filter((summary) => summary.autoConfig?.enabled === true).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#6b7684]">주문할 종목을 먼저 선택하세요.</p>
            <h2 className="mt-1 text-xl font-black">수요와 공급 주문 체결 종목</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummaryPill label="등록" value={`${summaries.length}종목`} />
            <SummaryPill label="정규장" value={`${openCount}종목`} tone="blue" />
            <SummaryPill label="자동장" value={`${autoEnabledCount}종목`} />
            {isAdmin ? (
              <button type="button" onClick={onAdminClick} className="h-10 rounded-md bg-[#191f28] px-3 text-sm font-black text-white">
                설정 현황
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="마지막 갱신" value={updatedAt ? updatedAt.toLocaleTimeString("ko-KR") : isLoading ? "조회 중" : "-"} />
          <Metric label="전체 유통주식" value={`${formatNumber(summaries.reduce((total, summary) => total + summary.instrument.tradableShares, 0))}주`} />
          <Metric label="자동장 대상" value={`${autoEnabledCount}/${summaries.length}`} />
        </div>
      </div>

      {isLoading && !summaries.length ? (
        <div className="mt-5 rounded-lg border border-[#e5e8eb] bg-white px-5 py-10 text-center">
          <p className="text-base font-black text-[#191f28]">종목을 불러오는 중입니다.</p>
          <p className="mt-2 text-sm font-bold text-[#8b95a1]">주문장 종목, 장 상태, 자동장 설정을 함께 확인하고 있습니다.</p>
        </div>
      ) : summaries.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map(({ autoConfig, instrument, marketConfig }) => {
            const isOpen = marketConfig?.enabled === true && marketConfig.marketStatus === "OPEN";
            const changeRate = calculateChangeRate(instrument.currentPrice, instrument.priceLimitBase);
            return (
              <button
                key={instrument.symbol}
                type="button"
                onClick={() => onSelect(instrument.symbol)}
                className="rounded-lg border border-[#e5e8eb] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-[#3182f6] hover:shadow-[0_8px_24px_rgba(49,130,246,0.10)] focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">{instrument.name}</p>
                    <p className="mt-1 text-xs font-bold text-[#8b95a1]">{instrument.symbol} · {instrument.market}</p>
                  </div>
                  <span className={isOpen ? "shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]" : "shrink-0 rounded-sm bg-[#fff3f0] px-2 py-1 text-xs font-black text-[#d34b36]"}>
                    {formatMarketSessionStatus(marketConfig?.marketStatus)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#8b95a1]">현재가</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">{formatWon(instrument.currentPrice)}</p>
                  </div>
                  <p className={changeRate >= 0 ? "text-right text-sm font-black tabular-nums text-[#f04452]" : "text-right text-sm font-black tabular-nums text-[#3182f6]"}>
                    {formatSignedPercent(changeRate)}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 text-xs font-bold text-[#6b7684]">
                  <SelectionInfoRow label="발행 / 유통" value={`${formatNumber(instrument.issuedShares)}주 / ${formatNumber(instrument.tradableShares)}주`} />
                  <SelectionInfoRow label="호가 / 제한폭" value={`${formatNumber(instrument.tickSize)}원 / ${formatNumber(instrument.priceLimitRate)}%`} />
                  <SelectionInfoRow label="자동장" value={autoConfig?.enabled ? `강도 ${autoConfig.intensity}, 최대 ${formatNumber(autoConfig.maxOrderQuantity)}주` : "정지"} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-[#e5e8eb] bg-white px-5 py-10 text-center">
          <p className="text-base font-black text-[#191f28]">등록된 수요와 공급 종목이 없습니다.</p>
          <p className="mt-2 text-sm font-bold text-[#8b95a1]">관리자 화면에서 주문장 종목을 만든 뒤 자동장과 거래를 시작할 수 있습니다.</p>
          {isAdmin ? (
            <button type="button" onClick={onAdminClick} className="mt-5 h-11 rounded-md bg-[#191f28] px-4 text-sm font-black text-white">
              관리자 설정으로 이동
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SummaryPill({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "blue" }) {
  const valueClass = tone === "blue" ? "text-[#3182f6]" : "text-[#191f28]";
  return (
    <span className="grid h-10 grid-cols-[auto_auto] items-center gap-2 rounded-md bg-[#f2f4f6] px-3 text-xs font-bold text-[#6b7684]">
      {label}
      <strong className={`text-sm font-black ${valueClass}`}>{value}</strong>
    </span>
  );
}

function SelectionInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-2 rounded-md bg-[#f7f8fa] px-3 py-2">
      <span className="text-[#8b95a1]">{label}</span>
      <span className="min-w-0 truncate text-right text-[#333d4b]">{value}</span>
    </div>
  );
}

function OrderTicket({
  availableCash,
  availableSellQuantity,
  estimatedOrderAmount,
  isMarketOpen,
  limitPrice,
  orderType,
  placingOrder,
  quantity,
  selectedInstrument,
  side,
  totalAsset,
  onAssetPercentSelect,
  onLimitPriceChange,
  onLimitPriceStep,
  onOrderTypeChange,
  onQuantityChange,
  onSideChange,
  onSubmit,
}: {
  availableCash?: number;
  availableSellQuantity?: number;
  estimatedOrderAmount?: number;
  isMarketOpen: boolean;
  limitPrice: string;
  orderType: OrderType;
  placingOrder: boolean;
  quantity: string;
  selectedInstrument?: OrderBookInstrument;
  side: OrderSide;
  totalAsset?: number;
  onAssetPercentSelect: (percent: number) => void;
  onLimitPriceChange: (value: string) => void;
  onLimitPriceStep: (direction: -1 | 1) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onQuantityChange: (value: string) => void;
  onSideChange: (value: OrderSide) => void;
  onSubmit: () => void;
}) {
  const actionColor = side === "BUY" ? "bg-[#f04452]" : "bg-[#3182f6]";
  const actionLabel = side === "BUY" ? "매수 주문" : "매도 주문";

  return (
    <div data-order-ticket className="rounded-lg border border-[#d1d6db] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#8b95a1]">ORDER TICKET</p>
          <h3 className="mt-1 truncate text-lg font-black">주문장 주문</h3>
        </div>
        <span className={isMarketOpen ? "shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]" : "shrink-0 rounded-sm bg-[#fff3f0] px-2 py-1 text-xs font-black text-[#d34b36]"}>
          {isMarketOpen ? "주문 가능" : "주문 불가"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-[#f2f4f6] p-1">
        <SideButton active={side === "BUY"} side="BUY" onClick={() => onSideChange("BUY")} />
        <SideButton active={side === "SELL"} side="SELL" onClick={() => onSideChange("SELL")} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <OrderTypeButton active={orderType === "LIMIT"} label="지정가" onClick={() => onOrderTypeChange("LIMIT")} />
        <OrderTypeButton active={orderType === "MARKET"} label="시장가" onClick={() => onOrderTypeChange("MARKET")} />
      </div>

      <div className="mt-4 space-y-3">
        <OrderTicketField label="종목">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-black">{selectedInstrument?.name ?? "-"}</p>
            <p className="mt-0.5 truncate text-xs font-bold text-[#8b95a1]">{selectedInstrument?.symbol ?? "-"}</p>
          </div>
        </OrderTicketField>
        <OrderTicketField label="현재가">
          <span className="min-w-0 truncate text-right text-sm font-black tabular-nums">{formatWon(selectedInstrument?.currentPrice)}</span>
        </OrderTicketField>
        <OrderPriceInput
          disabled={orderType === "MARKET"}
          placeholder={orderType === "MARKET" ? "시장가" : "가격"}
          tickSize={selectedInstrument?.tickSize}
          value={limitPrice}
          onChange={onLimitPriceChange}
          onStep={onLimitPriceStep}
        />
        <OrderTicketInput
          label="수량"
          placeholder="수량"
          suffix="주"
          value={quantity}
          onChange={onQuantityChange}
        />
      </div>

      <div className="mt-4 rounded-md border border-[#e5e8eb] p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#6b7684]">
          <span>{side === "SELL" ? "보유 비중 주문" : "자산 비중 주문"}</span>
          <span className="min-w-0 truncate text-right tabular-nums">
            {side === "SELL" ? `매도가능 ${formatNumber(availableSellQuantity ?? 0)}주` : `총자산 ${formatWon(totalAsset)}`}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ASSET_PERCENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => onAssetPercentSelect(percent)}
              className="h-9 rounded-md bg-[#f2f4f6] text-xs font-black text-[#333d4b] hover:bg-[#e5e8eb]"
            >
              {percent}%
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-[#8b95a1]">
          <span>{side === "SELL" ? "매도 가능" : "현금 잔고"}</span>
          <span className="min-w-0 truncate text-right tabular-nums">
            {side === "SELL" ? `${formatNumber(availableSellQuantity ?? 0)}주` : formatWon(availableCash)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-[#f7f8fa] p-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-[#6b7684]">예상 주문금액</span>
          <span className="min-w-0 truncate text-right font-black tabular-nums">{formatWon(estimatedOrderAmount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-[#8b95a1]">
          <span>호가단위</span>
          <span className="tabular-nums">{selectedInstrument ? `${formatNumber(selectedInstrument.tickSize)}원` : "-"}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={placingOrder || !isMarketOpen || !selectedInstrument}
        className={`mt-4 h-12 w-full rounded-md px-3 text-sm font-black text-white ${actionColor} disabled:bg-[#b0b8c1] disabled:opacity-70`}
      >
        {placingOrder ? "접수 중" : actionLabel}
      </button>
    </div>
  );
}

function SideButton({
  active,
  side,
  onClick,
}: {
  active: boolean;
  side: OrderSide;
  onClick: () => void;
}) {
  const activeClass = side === "BUY" ? "bg-[#f04452] text-white" : "bg-[#3182f6] text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? `h-10 rounded-md text-sm font-black ${activeClass}` : "h-10 rounded-md text-sm font-black text-[#6b7684]"}
    >
      {side === "BUY" ? "매수" : "매도"}
    </button>
  );
}

function OrderTypeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "h-10 rounded-md bg-[#191f28] text-sm font-black text-white" : "h-10 rounded-md bg-[#f2f4f6] text-sm font-black text-[#6b7684]"}
    >
      {label}
    </button>
  );
}

function OrderTicketField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="grid min-h-11 grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
      <span className="text-sm font-bold text-[#6b7684]">{label}</span>
      {children}
    </div>
  );
}

function OrderTicketInput({
  disabled = false,
  label,
  placeholder,
  suffix,
  value,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  placeholder: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-h-11 grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
      <span className="text-sm font-bold text-[#6b7684]">{label}</span>
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_24px] items-center rounded-md border border-[#d1d6db] bg-white px-3 focus-within:border-[#3182f6]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          inputMode="decimal"
          className="h-11 min-w-0 bg-transparent text-right text-sm font-black tabular-nums outline-none placeholder:text-[#b0b8c1] disabled:text-[#8b95a1]"
        />
        <span className="text-right text-xs font-bold text-[#8b95a1]">{suffix}</span>
      </span>
    </label>
  );
}

function OrderPriceInput({
  disabled,
  placeholder,
  tickSize,
  value,
  onChange,
  onStep,
}: {
  disabled: boolean;
  placeholder: string;
  tickSize?: number;
  value: string;
  onChange: (value: string) => void;
  onStep: (direction: -1 | 1) => void;
}) {
  const stepLabel = tickSize && Number.isFinite(tickSize) && tickSize > 0 ? `${formatNumber(tickSize)}원` : "호가";
  return (
    <OrderTicketField label="주문가">
      <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_24px_36px] items-center rounded-md border border-[#d1d6db] bg-white px-1 focus-within:border-[#3182f6]">
        <PriceStepButton
          disabled={disabled}
          label={`${stepLabel} 낮추기`}
          onClick={() => onStep(-1)}
        >
          -
        </PriceStepButton>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          inputMode="decimal"
          aria-label="주문가"
          className="h-11 min-w-0 bg-transparent px-2 text-right text-sm font-black tabular-nums outline-none placeholder:text-[#b0b8c1] disabled:text-[#8b95a1]"
        />
        <span className="text-right text-xs font-bold text-[#8b95a1]">원</span>
        <PriceStepButton
          disabled={disabled}
          label={`${stepLabel} 높이기`}
          onClick={() => onStep(1)}
        >
          +
        </PriceStepButton>
      </div>
    </OrderTicketField>
  );
}

function PriceStepButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-sm text-base font-black text-[#333d4b] transition hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:text-[#b0b8c1] disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  const toneClass = tone === "red" ? "text-[#f04452]" : tone === "blue" ? "text-[#3182f6]" : "text-[#191f28]";
  return (
    <div className="rounded-md bg-[#f7f8fa] p-3">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className={`mt-1 text-lg font-black tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function OrderBookSide({
  flashingLevel,
  title,
  levels,
  onFlashEnd,
  onPriceSelect,
  side,
}: {
  flashingLevel: { price: number; side: "bid" | "ask"; nonce: number } | null;
  title: string;
  levels: { price: number; quantity: number; orderCount: number }[];
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: "bid" | "ask") => void;
  side: "bid" | "ask";
}) {
  const color = side === "bid" ? "text-[#f04452]" : "text-[#3182f6]";
  const depthLevels = toFixedOrderBookLevels(levels);
  const maxQuantity = Math.max(1, ...levels.map((level) => level.quantity));
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-base font-black ${color}`}>{title}</h3>
        <span className="shrink-0 text-xs font-bold text-[#8b95a1]">고정 {ORDER_BOOK_VISIBLE_LEVELS}호가</span>
      </div>
      <div className="mt-3 grid h-[376px] grid-rows-[24px_repeat(8,40px)] gap-1 overflow-hidden">
        <div className="grid grid-cols-[minmax(78px,1fr)_minmax(68px,1fr)_48px] items-center gap-2 px-3 text-[11px] font-bold text-[#8b95a1] sm:grid-cols-[108px_minmax(0,1fr)_64px]">
          <span>가격</span>
          <span className="text-right">잔량</span>
          <span className="text-right">주문</span>
        </div>
        {depthLevels.map((level, index) => (
          <OrderBookRow
            key={`${side}-slot-${index}`}
            flashNonce={level && flashingLevel?.side === side && flashingLevel.price === level.price ? flashingLevel.nonce : null}
            level={level}
            maxQuantity={maxQuantity}
            onFlashEnd={onFlashEnd}
            onPriceSelect={onPriceSelect}
            side={side}
          />
        ))}
      </div>
    </div>
  );
}

function OrderBookRow({
  flashNonce,
  level,
  maxQuantity,
  onFlashEnd,
  onPriceSelect,
  side,
}: {
  flashNonce: number | null;
  level: { price: number; quantity: number; orderCount: number } | null;
  maxQuantity: number;
  onFlashEnd: () => void;
  onPriceSelect: (price: number, side: "bid" | "ask") => void;
  side: "bid" | "ask";
}) {
  const barColor = side === "bid" ? "bg-[#fff0f1]" : "bg-[#eff6ff]";
  const textColor = side === "bid" ? "text-[#f04452]" : "text-[#3182f6]";
  const quantityRate = level ? Math.max(8, Math.min(100, Math.round(level.quantity / maxQuantity * 100))) : 0;

  return (
    <button
      type="button"
      data-order-book-row={side}
      disabled={!level}
      aria-label={level ? `${side === "bid" ? "매수" : "매도"} 호가 ${formatWon(level.price)} 주문가로 선택` : undefined}
      onClick={() => {
        if (level) {
          onPriceSelect(level.price, side);
        }
      }}
      className="relative grid h-10 min-w-0 grid-cols-[minmax(78px,1fr)_minmax(68px,1fr)_48px] items-center gap-2 overflow-hidden rounded-md bg-[#f7f8fa] px-3 text-left text-xs transition enabled:cursor-pointer enabled:hover:bg-[#eef6ff] enabled:focus:outline-none enabled:focus-visible:bg-[#eef6ff] disabled:cursor-default sm:grid-cols-[108px_minmax(0,1fr)_64px] sm:text-sm"
    >
      {level ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 right-0 z-0 ${barColor}`}
          style={{ width: `${quantityRate}%` }}
        />
      ) : null}
      {flashNonce !== null ? (
        <span
          aria-hidden="true"
          className="order-book-flash-overlay absolute inset-0 z-10"
          onAnimationEnd={onFlashEnd}
        />
      ) : null}
      <span className={`relative z-20 min-w-0 truncate font-black tabular-nums ${level ? textColor : "text-[#b0b8c1]"}`} title={level ? formatWon(level.price) : undefined}>
        {level ? formatPrice(level.price) : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-[#333d4b]" : "text-[#b0b8c1]"}`} title={level ? `${formatNumber(level.quantity)}주` : undefined}>
        {level ? formatNumber(level.quantity) : "-"}
      </span>
      <span className={`relative z-20 min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-[#8b95a1]" : "text-[#b0b8c1]"}`} title={level ? `${formatNumber(level.orderCount)}건` : undefined}>
        {level ? formatNumber(level.orderCount) : "-"}
      </span>
    </button>
  );
}

function toFixedOrderBookLevels(levels: { price: number; quantity: number; orderCount: number }[]) {
  return Array.from({ length: ORDER_BOOK_VISIBLE_LEVELS }, (_, index) => levels[index] ?? null);
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-bold text-[#6b7684]">{label}</span>
      <span className="font-black text-[#191f28]">{value}</span>
    </div>
  );
}

function formatWon(value?: number) {
  if (value === undefined || value === null) {
    return "-";
  }
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPrice(value: number) {
  return Math.round(value).toLocaleString("ko-KR");
}

function formatOrderInputPrice(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function resolveDefaultLimitPrice(instrument: Pick<OrderBookInstrument, "currentPrice" | "priceLimitBase" | "priceLimitRate" | "tickSize">) {
  const fallbackPrice = resolvePositivePrice(instrument.currentPrice) ?? resolvePositivePrice(instrument.priceLimitBase) ?? resolvePositivePriceUnit(instrument.tickSize);
  return resolveLimitPriceForInstrument(fallbackPrice, instrument);
}

function resolveLimitPriceForInstrument(
  price: number,
  instrument: Pick<OrderBookInstrument, "priceLimitBase" | "priceLimitRate" | "tickSize">,
) {
  const tickSize = resolvePositivePriceUnit(instrument.tickSize);
  return clampLimitPriceToInstrument(alignPriceToNearestTick(price, tickSize), instrument, tickSize);
}

function resolveSteppedLimitPrice({
  currentValue,
  direction,
  instrument,
}: {
  currentValue: string;
  direction: -1 | 1;
  instrument: Pick<OrderBookInstrument, "currentPrice" | "priceLimitBase" | "priceLimitRate" | "tickSize">;
}) {
  const tickSize = resolvePositivePriceUnit(instrument.tickSize);
  const parsedCurrent = parseOrderPriceInput(currentValue);
  const fallbackPrice = resolvePositivePrice(instrument.currentPrice) ?? resolvePositivePrice(instrument.priceLimitBase) ?? tickSize;
  const basePrice = parsedCurrent ?? fallbackPrice;
  const nextRawPrice = parsedCurrent === null
    ? alignPriceToTick(basePrice, tickSize, direction)
    : isAlignedToTick(basePrice, tickSize)
      ? basePrice + direction * tickSize
      : alignPriceToTick(basePrice, tickSize, direction);
  return clampLimitPriceToInstrument(nextRawPrice, instrument, tickSize);
}

function parseOrderPriceInput(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolvePositivePrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function resolvePositivePriceUnit(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function isAlignedToTick(price: number, tickSize: number) {
  return Math.abs(price / tickSize - Math.round(price / tickSize)) < 0.000001;
}

function alignPriceToTick(price: number, tickSize: number, direction: -1 | 1) {
  const quotient = price / tickSize;
  const tickCount = direction > 0 ? Math.ceil(quotient - 0.000001) : Math.floor(quotient + 0.000001);
  return Math.max(tickSize, tickCount * tickSize);
}

function alignPriceToNearestTick(price: number, tickSize: number) {
  return Math.max(tickSize, Math.round(price / tickSize) * tickSize);
}

function clampLimitPriceToInstrument(
  price: number,
  instrument: Pick<OrderBookInstrument, "priceLimitBase" | "priceLimitRate">,
  tickSize: number,
) {
  const lowerRaw = instrument.priceLimitBase * (100 - instrument.priceLimitRate) / 100;
  const upperRaw = instrument.priceLimitBase * (100 + instrument.priceLimitRate) / 100;
  const lowerLimit = resolvePositivePrice(lowerRaw) ? alignPriceToTick(lowerRaw, tickSize, 1) : tickSize;
  const upperLimit = resolvePositivePrice(upperRaw) ? alignPriceToTick(upperRaw, tickSize, -1) : Number.POSITIVE_INFINITY;
  if (lowerLimit > upperLimit) {
    return Math.max(tickSize, price);
  }
  return Math.min(Math.max(price, lowerLimit), upperLimit);
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function calculateChangeRate(currentPrice: number, basePrice: number) {
  if (!Number.isFinite(currentPrice) || !Number.isFinite(basePrice) || basePrice <= 0) {
    return 0;
  }
  return (currentPrice - basePrice) / basePrice * 100;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}%`;
}

function formatMarketSessionStatus(status?: MarketSessionStatus) {
  if (status === "OPEN") {
    return "정규장";
  }
  if (status === "CLOSED") {
    return "마감";
  }
  if (status === "HALTED") {
    return "거래정지";
  }
  return "-";
}

function formatOrderStatus(status: Order["status"]) {
  switch (status) {
    case "PENDING":
      return "대기";
    case "PARTIALLY_FILLED":
      return "부분 체결";
    case "FILLED":
      return "체결";
    case "CANCELLED":
      return "취소";
    case "REJECTED":
      return "거절";
  }
}

function formatOrderPrice(order: Order) {
  if (order.limitPrice !== undefined && order.limitPrice !== null) {
    return formatWon(order.limitPrice);
  }
  if (order.averageFillPrice !== undefined && order.averageFillPrice !== null) {
    return formatWon(order.averageFillPrice);
  }
  return "시장가";
}
