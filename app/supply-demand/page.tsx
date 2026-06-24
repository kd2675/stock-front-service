"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import useAuthSession from "@/app/hooks/useAuthSession";
import { getAccessToken, isAdminRole } from "@/app/lib/auth";
import { cancelOrderMutationOptions, placeOrderMutationOptions } from "@/app/lib/react-query/stockMutations";
import { accountStatusQueryOptions, autoMarketStatusQueryOptions, executionsQueryOptions, orderBookInstrumentsQueryOptions, orderBookMarketStatusQueryOptions, orderBookQueryOptions, ordersQueryOptions } from "@/app/lib/react-query/stockQueries";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { parseOrderTicket } from "@/app/lib/validation/orderSchemas";
import { useStockUiStore } from "@/app/stores/stockUiStore";
import type { Execution, MarketSessionStatus, Order, OrderBookInstrument, OrderSide, OrderType } from "@/app/types/stock";

const ORDER_BOOK_VISIBLE_LEVELS = 8;
const EMPTY_ORDER_BOOK_INSTRUMENTS: OrderBookInstrument[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_EXECUTIONS: Execution[] = [];

export default function SupplyDemandPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
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
  const instruments = instrumentsQuery.data ?? EMPTY_ORDER_BOOK_INSTRUMENTS;
  const autoMarket = autoMarketQuery.data ?? null;
  const orderBookMarket = orderBookMarketQuery.data ?? null;
  const orderBook = orderBookQuery.data ?? null;
  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const executions = executionsQuery.data ?? EMPTY_EXECUTIONS;
  const updatedAtMs = Math.max(
    instrumentsQuery.dataUpdatedAt,
    autoMarketQuery.dataUpdatedAt,
    orderBookMarketQuery.dataUpdatedAt,
    orderBookQuery.dataUpdatedAt,
    ordersQuery.dataUpdatedAt,
    executionsQuery.dataUpdatedAt,
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
  const isSelectedMarketOpen = selectedOrderBookConfig?.enabled === true && selectedOrderBookConfig.marketStatus === "OPEN";
  const orderBookOrders = useMemo(
    () => orders.slice(0, 8),
    [orders],
  );
  const orderBookExecutions = useMemo(
    () => executions.slice(0, 6),
    [executions],
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
    if (!instruments.length) {
      return;
    }
    const nextSymbol = resolveOrderBookSymbol(selectedSymbol, instruments);
    if (nextSymbol !== selectedSymbol) {
      setOrderBookTicket({ selectedSymbol: nextSymbol });
    }
  }, [instruments, selectedSymbol, setOrderBookTicket]);

  const invalidateOrderBookTrading = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: stockKeys.autoMarketStatus() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatus() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.orders({ marketType: "ORDER_BOOK" }) }),
      queryClient.invalidateQueries({ queryKey: stockKeys.executions({ source: "INTERNAL_ORDER_BOOK" }) }),
      selectedInstrument?.symbol ? queryClient.invalidateQueries({ queryKey: stockKeys.orderBook(selectedInstrument.symbol) }) : Promise.resolve(),
    ]);
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
        actions={isAdmin ? (
          <button type="button" onClick={() => router.push("/supply-demand/admin")} className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
            설정 현황
          </button>
        ) : null}
      />

      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#3182f6]">LIVE ORDER BOOK</p>
              <h1 className="mt-1 text-2xl font-black">자동장</h1>
            </div>
          </div>
        </div>
      </section>

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
                onChange={(event) => setOrderBookTicket({ selectedSymbol: event.target.value })}
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
            <OrderBookSide title="매도" levels={orderBook?.asks ?? []} side="ask" />
            <OrderBookSide title="매수" levels={orderBook?.bids ?? []} side="bid" />
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
            selectedInstrument={selectedInstrument}
            side={side}
            onLimitPriceChange={(value) => setOrderBookTicket({ limitPrice: value })}
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
              {(autoMarket?.configs ?? []).map((config) => (
                <button
                  key={config.symbol}
                  type="button"
                  onClick={() => setOrderBookTicket({ selectedSymbol: config.symbol })}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-left"
                >
                  <span className="font-bold">{config.symbol}</span>
                  <span className={config.enabled ? "font-black text-[#3182f6]" : "font-bold text-[#8b95a1]"}>
                    {config.enabled ? `강도 ${config.intensity}` : "정지"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
            <h3 className="text-base font-black">내 주문</h3>
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
    </main>
  );
}

function OrderTicket({
  estimatedOrderAmount,
  isMarketOpen,
  limitPrice,
  orderType,
  placingOrder,
  quantity,
  selectedInstrument,
  side,
  onLimitPriceChange,
  onOrderTypeChange,
  onQuantityChange,
  onSideChange,
  onSubmit,
}: {
  estimatedOrderAmount?: number;
  isMarketOpen: boolean;
  limitPrice: string;
  orderType: OrderType;
  placingOrder: boolean;
  quantity: string;
  selectedInstrument?: OrderBookInstrument;
  side: OrderSide;
  onLimitPriceChange: (value: string) => void;
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
        <OrderTicketInput
          disabled={orderType === "MARKET"}
          label="주문가"
          placeholder={orderType === "MARKET" ? "시장가" : "가격"}
          suffix="원"
          value={limitPrice}
          onChange={onLimitPriceChange}
        />
        <OrderTicketInput
          label="수량"
          placeholder="수량"
          suffix="주"
          value={quantity}
          onChange={onQuantityChange}
        />
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
  title,
  levels,
  side,
}: {
  title: string;
  levels: { price: number; quantity: number; orderCount: number }[];
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
            level={level}
            maxQuantity={maxQuantity}
            side={side}
          />
        ))}
      </div>
    </div>
  );
}

function OrderBookRow({
  level,
  maxQuantity,
  side,
}: {
  level: { price: number; quantity: number; orderCount: number } | null;
  maxQuantity: number;
  side: "bid" | "ask";
}) {
  const barColor = side === "bid" ? "bg-[#fff0f1]" : "bg-[#eff6ff]";
  const textColor = side === "bid" ? "text-[#f04452]" : "text-[#3182f6]";
  const quantityRate = level ? Math.max(8, Math.min(100, Math.round(level.quantity / maxQuantity * 100))) : 0;

  return (
    <div
      data-order-book-row={side}
      className="relative grid h-10 min-w-0 grid-cols-[minmax(78px,1fr)_minmax(68px,1fr)_48px] items-center gap-2 overflow-hidden rounded-md bg-[#f7f8fa] px-3 text-xs sm:grid-cols-[108px_minmax(0,1fr)_64px] sm:text-sm"
    >
      {level ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 right-0 ${barColor}`}
          style={{ width: `${quantityRate}%` }}
        />
      ) : null}
      <span className={`relative min-w-0 truncate font-black tabular-nums ${level ? textColor : "text-[#b0b8c1]"}`} title={level ? formatWon(level.price) : undefined}>
        {level ? formatPrice(level.price) : "-"}
      </span>
      <span className={`relative min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-[#333d4b]" : "text-[#b0b8c1]"}`} title={level ? `${formatNumber(level.quantity)}주` : undefined}>
        {level ? formatNumber(level.quantity) : "-"}
      </span>
      <span className={`relative min-w-0 truncate text-right font-bold tabular-nums ${level ? "text-[#8b95a1]" : "text-[#b0b8c1]"}`} title={level ? `${formatNumber(level.orderCount)}건` : undefined}>
        {level ? formatNumber(level.orderCount) : "-"}
      </span>
    </div>
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

function resolveOrderBookSymbol(currentSymbol: string, instruments: OrderBookInstrument[]) {
  if (currentSymbol && instruments.some((instrument) => instrument.symbol === currentSymbol)) {
    return currentSymbol;
  }
  return instruments[0]?.symbol ?? "";
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

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
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
