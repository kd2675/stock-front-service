"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AssetLineChart from "@/app/components/AssetLineChart";
import TradingTopBar from "@/app/components/TradingTopBar";
import useAuthSession from "@/app/hooks/useAuthSession";
import { getAccessToken } from "@/app/lib/auth";
import { AUTH_EXPIRED_REDIRECT_KEY } from "@/app/lib/authEvents";
import { amendOrderMutationOptions, cancelOrderMutationOptions, cancelOrderPartiallyMutationOptions, placeOrderMutationOptions } from "@/app/lib/react-query/stockMutations";
import { accountStatusQueryOptions, corporateActionEntitlementsQueryOptions, executionsQueryOptions, holdingsQueryOptions, instrumentsQueryOptions, orderBookQueryOptions, ordersQueryOptions, portfolioQueryOptions, portfolioSnapshotsQueryOptions, priceTicksQueryOptions, pricesQueryOptions, profitSummaryQueryOptions, profileQueryOptions, rankingsQueryOptions } from "@/app/lib/react-query/stockQueries";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { getPriceStreamUrl } from "@/app/lib/stock";
import { useStockUiStore } from "@/app/stores/stockUiStore";
import type { CorporateActionEntitlement, CorporateActionType, Execution, Instrument, Order, OrderBook, OrderBookLevel, PortfolioSnapshot, Price, PriceStreamEvent, PriceTick } from "@/app/types/stock";

const EMPTY_PRICES: Price[] = [];
const EMPTY_PRICE_TICKS: PriceTick[] = [];
const EMPTY_INSTRUMENTS: Instrument[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_EXECUTIONS: Execution[] = [];
const EMPTY_PORTFOLIO_SNAPSHOTS: PortfolioSnapshot[] = [];

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<Record<number, { quantity: string; limitPrice: string; cancelQuantity: string }>>({});
  const [priceStreamConnected, setPriceStreamConnected] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const virtualOrderTicket = useStockUiStore((state) => state.virtualOrderTicket);
  const setVirtualOrderTicket = useStockUiStore((state) => state.setVirtualOrderTicket);
  const { limitPrice, orderType, quantity, selectedSymbol, side } = virtualOrderTicket;
  const token = authStatus === "in" ? getAccessToken() : null;

  const isLoggedIn = authStatus === "in";
  const instrumentsQuery = useQuery(instrumentsQueryOptions());
  const pricesQuery = useQuery(pricesQueryOptions());
  const rankingsQuery = useQuery(rankingsQueryOptions());
  const priceTicksQuery = useQuery({
    ...priceTicksQueryOptions(selectedSymbol),
    enabled: Boolean(selectedSymbol),
  });
  const orderBookQuery = useQuery({
    ...orderBookQueryOptions(selectedSymbol),
    enabled: Boolean(selectedSymbol),
  });
  const profileQuery = useQuery({
    ...profileQueryOptions(token),
    enabled: isLoggedIn && Boolean(token),
  });
  const accountStatusQuery = useQuery({
    ...accountStatusQueryOptions(token),
    enabled: isLoggedIn && Boolean(token),
  });
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true || Boolean(profileQuery.data?.account);
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasTradingAccount));
  const portfolioSnapshotsQuery = useQuery(portfolioSnapshotsQueryOptions(token, hasTradingAccount));
  const profitSummaryQuery = useQuery(profitSummaryQueryOptions(token, hasTradingAccount));
  const corporateActionEntitlementsQuery = useQuery(corporateActionEntitlementsQueryOptions(token, hasTradingAccount));
  const ordersQuery = useQuery(ordersQueryOptions(token, { enabled: hasTradingAccount }));
  const executionsQuery = useQuery(executionsQueryOptions(token, { enabled: hasTradingAccount }));
  const prices = pricesQuery.data ?? EMPTY_PRICES;
  const priceTicks = priceTicksQuery.data ?? EMPTY_PRICE_TICKS;
  const orderBook = orderBookQuery.data ?? null;
  const instruments = instrumentsQuery.data ?? EMPTY_INSTRUMENTS;
  const portfolio = portfolioQuery.data ?? null;
  const holdings = holdingsQuery.data ?? null;
  const portfolioSnapshots = portfolioSnapshotsQuery.data ?? EMPTY_PORTFOLIO_SNAPSHOTS;
  const profitSummary = profitSummaryQuery.data ?? null;
  const corporateActionEntitlements = corporateActionEntitlementsQuery.data ?? [];
  const profile = profileQuery.data ?? null;
  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const executions = executionsQuery.data ?? EMPTY_EXECUTIONS;
  const rankings = rankingsQuery.data ?? [];
  const lastUpdatedAtMs = Math.max(
    instrumentsQuery.dataUpdatedAt,
    pricesQuery.dataUpdatedAt,
    rankingsQuery.dataUpdatedAt,
    priceTicksQuery.dataUpdatedAt,
    orderBookQuery.dataUpdatedAt,
    portfolioQuery.dataUpdatedAt,
    holdingsQuery.dataUpdatedAt,
    ordersQuery.dataUpdatedAt,
    executionsQuery.dataUpdatedAt,
  );
  const lastUpdatedAt = lastUpdatedAtMs > 0 ? new Date(lastUpdatedAtMs) : null;
  const refreshing = pricesQuery.isFetching || instrumentsQuery.isFetching || rankingsQuery.isFetching || portfolioQuery.isFetching || ordersQuery.isFetching || executionsQuery.isFetching;
  const selectedPrice = prices.find((price) => price.symbol === selectedSymbol);
  const instrumentMap = useMemo(() => new Map(instruments.map((item) => [item.symbol, item])), [instruments]);
  const selectedInstrument = instrumentMap.get(selectedSymbol);
  const visibleHoldings = holdings ?? portfolio?.holdings ?? [];
  const selectedHolding = visibleHoldings.find((holding) => holding.symbol === selectedSymbol);
  const parsedOrderQuantity = useMemo(() => parsePositiveInteger(quantity), [quantity]);
  const parsedLimitPrice = useMemo(() => parsePositiveNumber(limitPrice), [limitPrice]);
  const orderPriceForEstimate = orderType === "MARKET" ? selectedPrice?.currentPrice ?? null : parsedLimitPrice;
  const estimatedOrderValue = parsedOrderQuantity && orderPriceForEstimate
    ? parsedOrderQuantity * orderPriceForEstimate
    : null;
  const orderValidationMessage = useMemo(() => {
    if (!selectedSymbol) {
      return "종목을 선택해 주세요.";
    }
    if (!parsedOrderQuantity) {
      return "수량은 1주 이상 정수로 입력해 주세요.";
    }
    if (orderType === "LIMIT" && !parsedLimitPrice) {
      return "주문가는 0보다 큰 숫자로 입력해 주세요.";
    }
    if (orderType === "LIMIT" && parsedLimitPrice && !matchesTickSize(parsedLimitPrice, 1)) {
      return "주문가는 1원 단위로 입력해 주세요.";
    }
    if (orderType === "LIMIT" && parsedLimitPrice && selectedPrice && !isWithinPriceLimit(parsedLimitPrice, selectedPrice.previousClose, 30)) {
      const lowerLimit = selectedPrice.previousClose * 0.7;
      const upperLimit = selectedPrice.previousClose * 1.3;
      return `주문가는 ${formatWon(lowerLimit)} 이상 ${formatWon(upperLimit)} 이하로 입력해 주세요.`;
    }
    if (side === "BUY" && portfolio && estimatedOrderValue && portfolio.account.cashBalance < estimatedOrderValue) {
      return "현금 잔고가 부족합니다.";
    }
    if (side === "SELL" && portfolio && (!selectedHolding || selectedHolding.availableQuantity < parsedOrderQuantity)) {
      return "매도 가능 수량이 부족합니다.";
    }
    return null;
  }, [estimatedOrderValue, orderType, parsedLimitPrice, parsedOrderQuantity, portfolio, selectedHolding, selectedPrice, selectedSymbol, side]);
  const chronologicalTicks = useMemo(() => [...priceTicks].reverse(), [priceTicks]);
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "PENDING" || order.status === "PARTIALLY_FILLED"),
    [orders],
  );
  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);
  const orderActionClassName = side === "BUY" ? "bg-[#f04452]" : "bg-[#3182f6]";

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

  const applyPriceStreamEvent = useCallback((event: PriceStreamEvent) => {
    queryClient.setQueryData<Price[]>(stockKeys.prices(), (currentPrices) => mergePriceStreamEvent(currentPrices ?? [], event));
    if (selectedSymbol === event.symbol) {
      queryClient.setQueryData<PriceTick[]>(stockKeys.priceTicks(event.symbol), (currentTicks) => [
        {
          symbol: event.symbol,
          price: event.currentPrice,
          provider: event.provider,
          priceTime: event.priceTime,
        },
        ...(currentTicks ?? []).filter((tick) => tick.priceTime !== event.priceTime || tick.price !== event.currentPrice),
      ].slice(0, 100));
    }
  }, [queryClient, selectedSymbol]);

  const refreshAll = useCallback(async (preserveMessage = false) => {
    setRefreshError(null);
    if (!preserveMessage) {
      setMessage(null);
    }
    try {
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "시세 갱신에 실패했습니다.");
    }
  }, [queryClient]);

  const invalidateTradingQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: stockKeys.account() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.orders() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.executions() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.rankings() }),
      selectedSymbol ? queryClient.invalidateQueries({ queryKey: stockKeys.orderBook(selectedSymbol) }) : Promise.resolve(),
    ]);
  };

  const placeOrderMutation = useMutation({
    ...placeOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문이 접수되었습니다. batch 서버가 체결 조건을 검사합니다.");
      await invalidateTradingQueries();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문 접수에 실패했습니다.");
    },
  });
  const cancelOrderMutation = useMutation({
    ...cancelOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 취소했습니다.");
      await invalidateTradingQueries();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문 취소에 실패했습니다.");
    },
  });
  const amendOrderMutation = useMutation({
    ...amendOrderMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 정정했습니다.");
      await invalidateTradingQueries();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문 정정에 실패했습니다.");
    },
  });
  const cancelOrderPartiallyMutation = useMutation({
    ...cancelOrderPartiallyMutationOptions(),
    onSuccess: async () => {
      setMessage("주문을 부분 취소했습니다.");
      await invalidateTradingQueries();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "부분 취소에 실패했습니다.");
    },
  });
  const placingOrder = placeOrderMutation.isPending;
  const cancellingOrderId = cancelOrderMutation.isPending ? cancelOrderMutation.variables ?? null : null;
  const amendingOrderId = amendOrderMutation.isPending ? amendOrderMutation.variables?.orderId ?? null : null;
  const partialCancellingOrderId = cancelOrderPartiallyMutation.isPending ? cancelOrderPartiallyMutation.variables?.orderId ?? null : null;

  useEffect(() => {
    if (isHydrated && authStatus === "out") {
      const expiredRedirect = window.sessionStorage.getItem(AUTH_EXPIRED_REDIRECT_KEY) === "1";
      if (expiredRedirect) {
        window.sessionStorage.removeItem(AUTH_EXPIRED_REDIRECT_KEY);
      }
      router.replace(expiredRedirect ? "/login?expired=1" : "/login");
    }
  }, [authStatus, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || authStatus !== "in" || accountStatusQuery.isPending || hasTradingAccount) {
      return;
    }
    router.replace("/account-required?next=/virtual-price");
  }, [accountStatusQuery.isPending, authStatus, hasTradingAccount, isHydrated, router]);

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

  const submitOrder = async () => {
    if (placeOrderMutation.isPending) {
      return;
    }
    if (orderValidationMessage) {
      setMessage(orderValidationMessage);
      return;
    }
    if (!parsedOrderQuantity) {
      return;
    }
    placeOrderMutation.mutate({
      symbol: selectedSymbol,
      marketType: "VIRTUAL_PRICE",
      side,
      orderType,
      limitPrice: orderType === "LIMIT" ? parsedLimitPrice ?? undefined : undefined,
      quantity: parsedOrderQuantity,
      clientOrderId: generateClientOrderId(),
    });
  };

  const cancel = async (orderId: number) => {
    if (cancelOrderMutation.isPending) {
      return;
    }
    cancelOrderMutation.mutate(orderId);
  };

  const updateOrderDraft = (
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
  };

  const amend = async (order: Order) => {
    const draft = orderDrafts[order.id] ?? {
      quantity: String(order.quantity),
      limitPrice: order.limitPrice?.toString() ?? "",
      cancelQuantity: String(Math.max(1, order.quantity - order.filledQuantity)),
    };
    const amendedQuantity = parsePositiveInteger(draft.quantity);
    const amendedLimitPrice = parsePositiveNumber(draft.limitPrice);
    if (!amendedQuantity || !amendedLimitPrice) {
      setMessage("정정 수량과 지정가는 0보다 큰 숫자로 입력해 주세요.");
      return;
    }
    if (amendedQuantity <= order.filledQuantity) {
      setMessage("정정 수량은 이미 체결된 수량보다 커야 합니다.");
      return;
    }

    if (amendOrderMutation.isPending) {
      return;
    }
    amendOrderMutation.mutate({
      orderId: order.id,
      quantity: amendedQuantity,
      limitPrice: amendedLimitPrice,
    });
  };

  const cancelPartially = async (order: Order) => {
    const draft = orderDrafts[order.id] ?? {
      quantity: String(order.quantity),
      limitPrice: order.limitPrice?.toString() ?? "",
      cancelQuantity: String(Math.max(1, order.quantity - order.filledQuantity)),
    };
    const cancelQuantity = parsePositiveInteger(draft.cancelQuantity);
    const remainingQuantity = order.quantity - order.filledQuantity;
    if (!cancelQuantity || cancelQuantity > remainingQuantity) {
      setMessage(`부분 취소 수량은 1주 이상 ${remainingQuantity}주 이하로 입력해 주세요.`);
      return;
    }

    if (cancelOrderPartiallyMutation.isPending) {
      return;
    }
    cancelOrderPartiallyMutation.mutate({ orderId: order.id, quantity: cancelQuantity });
  };

  if (!isHydrated || authStatus === "unknown" || !isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          세션 확인 중
        </div>
      </main>
    );
  }

  if (accountStatusQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          계좌 확인 중
        </div>
      </main>
    );
  }

  if (!hasTradingAccount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          계좌 필요 화면으로 이동 중
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#191f28]">
      <TradingTopBar
        active="virtual-price"
        actions={(
          <button type="button" onClick={() => void refreshAll()} disabled={refreshing} className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b] disabled:cursor-wait disabled:opacity-60">
            {refreshing ? "갱신 중" : "새로고침"}
          </button>
        )}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:px-8">
        <div className="space-y-6">
          <header className="rounded-lg bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-[#3182f6]">STOCK MOCK TRADING</p>
                <h1 className="mt-2 text-2xl font-black md:text-4xl">모의투자 워크스페이스</h1>
                <p className="mt-2 text-sm text-[#6b7684]">{profile?.username ?? user?.username ?? "사용자"}님의 실전형 가상 계좌</p>
                <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-xs font-semibold text-[#4e5968]">
                  <span className="max-w-full truncate rounded-sm bg-[#f2f4f6] px-2 py-1">{profile?.userKey ?? user?.userKey ?? "user-key"}</span>
                  <span className="rounded-sm bg-[#f2f4f6] px-2 py-1">{profile?.role ?? user?.role ?? "USER"}</span>
                  {profile?.email ? <span className="max-w-full truncate rounded-sm bg-[#f2f4f6] px-2 py-1">{profile.email}</span> : null}
                </div>
              </div>
            </div>
            <div className="mt-7 min-w-0">
              <p className="text-sm font-bold text-[#6b7684]">총 자산</p>
              <p className="mt-1 min-w-0 break-words text-[clamp(2rem,7vw,3.5rem)] font-black leading-none text-[#191f28] tabular-nums">
                {formatWon(portfolio?.totalAsset)}
              </p>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-[#6b7684] sm:grid-cols-3">
                <span className="min-w-0 truncate">현금 {formatCompactWon(portfolio?.account.cashBalance)}</span>
                <span className="min-w-0 truncate">평가 {formatCompactWon(portfolio?.marketValue)}</span>
                <span className={portfolio && portfolio.returnRate >= 0 ? "min-w-0 truncate text-[#f04452]" : "min-w-0 truncate text-[#3182f6]"}>
                  수익률 {formatNumber(portfolio?.returnRate)}%
                </span>
              </div>
            </div>
          </header>

          <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
            <Metric label="현금" value={formatCompactWon(portfolio?.account.cashBalance)} tone="blue" />
            <Metric label="예약 현금" value={formatCompactWon(portfolio?.reservedBuyCash)} tone="gray" />
            <Metric label="평가금액" value={formatCompactWon(portfolio?.marketValue)} tone="green" />
            <Metric label="총 손익" value={formatSignedWon(profitSummary?.totalProfit ?? 0)} tone={profitSummary && profitSummary.totalProfit < 0 ? "blue" : "red"} />
            <Metric label="실현손익" value={formatSignedWon(profitSummary?.realizedProfit ?? 0)} tone={profitSummary && profitSummary.realizedProfit < 0 ? "blue" : "red"} />
            <Metric label="미체결" value={`${portfolio?.pendingOrderCount ?? 0}건`} tone="gray" />
          </section>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-y border-[#e5e8eb] py-3 text-xs font-semibold text-[#6b7684]">
            <span>{priceStreamConnected ? "실시간 연결됨" : refreshing ? "갱신 중" : "자동 갱신 대기"}</span>
            <span className="min-w-0 break-words text-right">{refreshError ?? `마지막 갱신 ${formatDateTime(lastUpdatedAt?.toISOString())}`}</span>
          </div>

          <section className="rounded-lg bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">시장 가격</h2>
                <p className="mt-1 text-sm text-[#6b7684]">batch 서버가 갱신한 가격 테이블 기준입니다.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-[#eef0f2]">
              {prices.map((item) => {
                const instrument = instrumentMap.get(item.symbol);
                return (
                  <button
                    type="button"
                    key={item.symbol}
                    onClick={() => {
                      setVirtualOrderTicket({
                        selectedSymbol: item.symbol,
                        limitPrice: String(Math.round(item.currentPrice)),
                      });
                      setMessage(null);
                    }}
                    className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(88px,auto)_minmax(48px,auto)] items-center gap-3 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{instrument?.name ?? item.symbol}</p>
                      <p className="text-xs text-[#8b95a1]">{item.symbol}</p>
                    </div>
                    <p className="min-w-0 break-words text-right text-sm font-bold tabular-nums">{formatWon(item.currentPrice)}</p>
                    <p className={item.changeRate >= 0 ? "text-right text-sm font-bold text-[#f04452] tabular-nums" : "text-right text-sm font-bold text-[#3182f6] tabular-nums"}>
                      {formatNumber(item.changeRate)}%
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 border-t border-[#eef0f2] pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold">가격 흐름</h3>
                  <p className="mt-1 truncate text-xs text-[#8b95a1]">
                    {selectedInstrument?.name ?? selectedSymbol} · 최근 {priceTicks.length}건
                  </p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="min-w-0 break-words text-sm font-black tabular-nums">{formatWon(selectedPrice?.currentPrice)}</p>
                  <p className="mt-1 text-xs text-[#8b95a1]">{selectedPrice?.provider ?? "-"}</p>
                </div>
              </div>
              <div className="mt-4 h-24 w-full">
                <Sparkline ticks={chronologicalTicks} />
              </div>
              {priceTicks.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {priceTicks.slice(0, 4).map((tick) => (
                    <div key={`${tick.symbol}-${tick.priceTime}-${tick.provider}`} className="flex min-w-0 items-center justify-between gap-3 border-b border-[#eef0f2] py-2">
                      <span className="shrink-0 text-xs text-[#8b95a1]">{formatDateTime(tick.priceTime)}</span>
                      <span className="min-w-0 break-words text-right text-sm font-semibold tabular-nums">{formatWon(tick.price)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#6b7684]">아직 수집된 가격 이력이 없습니다.</p>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="보유 종목">
              {visibleHoldings.length ? (
                <div className="space-y-3">
                  {visibleHoldings.map((holding) => (
                    <div key={holding.symbol} className="rounded-md bg-[#f9fafb] p-3">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 truncate font-bold">{holding.symbol}</p>
                        <p className="shrink-0 text-sm tabular-nums">{holding.availableQuantity} / {holding.quantity}주</p>
                      </div>
                      {holding.reservedQuantity > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-[#f04452]">매도 예약 {holding.reservedQuantity}주</p>
                      ) : null}
                      <p className="mt-1 min-w-0 break-words text-sm text-[#6b7684]">
                        평가 {formatWon(holding.marketValue)} / 손익 {formatWon(holding.unrealizedProfit)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7684]">보유 종목이 없습니다.</p>
              )}
            </Panel>

            <Panel title="자산 기록">
              <PortfolioHistory snapshots={portfolioSnapshots} />
            </Panel>

            <Panel title="기업 이벤트">
              {corporateActionEntitlements.length ? (
                <div className="space-y-3">
                  {corporateActionEntitlements.slice(0, 5).map((entitlement) => (
                    <article key={entitlement.id} className="rounded-md bg-[#f9fafb] p-3">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-bold">{formatCorporateActionType(entitlement.actionType)} · {entitlement.symbol}</p>
                        <span className="shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-semibold text-[#4e5968]">
                          {formatEntitlementStatus(entitlement.status)}
                        </span>
                      </div>
                      <p className="mt-2 min-w-0 break-words text-sm font-semibold tabular-nums">
                        {formatEntitlementValue(entitlement)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#8b95a1]">
                        기준 보유 {entitlement.quantity.toLocaleString("ko-KR")}주 · {formatDateTime(entitlement.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7684]">아직 배정된 기업 이벤트가 없습니다.</p>
              )}
            </Panel>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <Panel title="주문장">
            <OrderBookPanel orderBook={orderBook} />
          </Panel>

          <Panel title="랭킹">
            {rankings.length ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#6b7684]">기준일 {formatDate(rankings[0]?.snapshotDate)}</p>
                {rankings.map((ranking) => (
                  <div key={`${ranking.rank}-${ranking.userKey}`} className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-[#f9fafb] p-3">
                    <p className="min-w-0 truncate text-sm font-bold">#{ranking.rank} {ranking.displayName || ranking.userKey}</p>
                    <p className={ranking.returnRate >= 0 ? "shrink-0 text-sm font-bold text-[#f04452] tabular-nums" : "shrink-0 text-sm font-bold text-[#3182f6] tabular-nums"}>{formatNumber(ranking.returnRate)}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6b7684]">장 마감 정산 후 표시됩니다.</p>
            )}
          </Panel>

          <section className="rounded-lg bg-[#191f28] p-5 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
            <h2 className="text-xl font-bold">주문 입력</h2>
            <div className="mt-5 grid gap-3">
              <label className="block">
                <span className="text-xs text-[#b0b8c1]">종목</span>
                <select
                  value={selectedSymbol}
                  onChange={(event) => {
                    setVirtualOrderTicket({ selectedSymbol: event.target.value });
                    setMessage(null);
                  }}
                  className="mt-1 w-full rounded-md bg-[#2b333f] px-3 py-3 text-sm outline-none"
                >
                  <option value="" disabled>등록된 종목 없음</option>
                  {instruments.map((item) => (
                    <option key={item.symbol} value={item.symbol}>{item.symbol} {item.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Toggle active={side === "BUY"} tone="buy" onClick={() => {
                  setVirtualOrderTicket({ side: "BUY" });
                  setMessage(null);
                }} label="매수" />
                <Toggle active={side === "SELL"} tone="sell" onClick={() => {
                  setVirtualOrderTicket({ side: "SELL" });
                  setMessage(null);
                }} label="매도" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Toggle active={orderType === "LIMIT"} onClick={() => {
                  setVirtualOrderTicket({ orderType: "LIMIT" });
                  setMessage(null);
                }} label="지정가" />
                <Toggle active={orderType === "MARKET"} onClick={() => {
                  setVirtualOrderTicket({ orderType: "MARKET" });
                  setMessage(null);
                }} label="시장가" />
              </div>
              <Input label="현재가" value={formatWon(selectedPrice?.currentPrice)} readOnly />
              <Input label="주문가" value={limitPrice} onChange={(value) => {
                setVirtualOrderTicket({ limitPrice: value });
                setMessage(null);
              }} disabled={orderType === "MARKET"} inputMode="decimal" />
              <Input label="수량" value={quantity} onChange={(value) => {
                setVirtualOrderTicket({ quantity: value });
                setMessage(null);
              }} inputMode="numeric" />
            </div>
            <div className="mt-4 grid gap-3 rounded-md bg-[#2b333f] p-3 text-xs sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[#b0b8c1]">예상 금액</p>
                <p className="mt-1 min-w-0 break-words text-sm font-black tabular-nums">{formatWon(estimatedOrderValue)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[#b0b8c1]">{side === "SELL" ? "매도 가능" : "주문 가능"}</p>
                <p className="mt-1 min-w-0 break-words text-sm font-black tabular-nums">
                  {side === "SELL" ? `${selectedHolding?.availableQuantity ?? 0}주` : formatWon(portfolio?.account.cashBalance)}
                </p>
              </div>
            </div>
            {orderValidationMessage ? <p className="mt-3 rounded-md bg-[#3d2830] px-3 py-2 text-sm text-[#ffd1d6]">{orderValidationMessage}</p> : null}
            {message ? <p className="mt-4 rounded-md bg-[#2b333f] px-3 py-2 text-sm text-white">{message}</p> : null}
            <button
              type="button"
              onClick={() => void submitOrder()}
              disabled={Boolean(orderValidationMessage) || placingOrder}
              className={`mt-5 w-full rounded-md px-4 py-3 text-sm font-black text-white ${orderActionClassName} disabled:cursor-not-allowed disabled:bg-[#4e5968] disabled:text-[#b0b8c1]`}
            >
              {placingOrder ? "접수 중" : "주문 접수"}
            </button>
          </section>

          <Panel title="주문 상태">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#6b7684]">
                <span className="rounded-sm bg-[#f2f4f6] px-2 py-1">미체결 {pendingOrders.length}건</span>
                <span className="rounded-sm bg-[#f2f4f6] px-2 py-1">최근 {recentOrders.length}건</span>
              </div>
              {recentOrders.map((order) => {
                const isOpenOrder = order.status === "PENDING" || order.status === "PARTIALLY_FILLED";
                const remainingQuantity = Math.max(0, order.quantity - order.filledQuantity);
                const draft = orderDrafts[order.id] ?? {
                  quantity: String(order.quantity),
                  limitPrice: order.limitPrice?.toString() ?? "",
                  cancelQuantity: String(Math.max(1, remainingQuantity)),
                };

                return (
                  <article key={order.id} className="rounded-md bg-[#f9fafb] p-4">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-bold">{order.side === "BUY" ? "매수" : "매도"} {order.symbol}</p>
                      <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${orderStatusClassName(order.status)}`}>
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>
                    <div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 text-sm text-[#6b7684]">
                      <span>{order.filledQuantity}/{order.quantity}주</span>
                      <span className="min-w-0 break-words text-right tabular-nums">{formatOrderPrice(order)}</span>
                    </div>
                    {order.status === "REJECTED" ? (
                      <p className="mt-2 text-xs font-semibold text-[#f04452]">체결 시점 잔고 조건을 만족하지 못했습니다.</p>
                    ) : null}
                    {isOpenOrder ? (
                      <div className="mt-3 space-y-2">
                        {order.orderType === "LIMIT" ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                              value={draft.quantity}
                              onChange={(event) => updateOrderDraft(order, { quantity: event.target.value })}
                              inputMode="numeric"
                              className="min-w-0 rounded-md border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-bold text-[#191f28]"
                              aria-label={`${order.symbol} 정정 수량`}
                            />
                            <input
                              value={draft.limitPrice}
                              onChange={(event) => updateOrderDraft(order, { limitPrice: event.target.value })}
                              inputMode="decimal"
                              className="min-w-0 rounded-md border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-bold text-[#191f28]"
                              aria-label={`${order.symbol} 정정 지정가`}
                            />
                            <button type="button" onClick={() => void amend(order)} disabled={amendingOrderId === order.id} className="col-span-2 rounded-md bg-white px-3 py-2 text-xs font-bold text-[#333d4b] ring-1 ring-[#e5e8eb] disabled:cursor-wait disabled:opacity-60">
                              {amendingOrderId === order.id ? "정정 중" : "수량/가격 정정"}
                            </button>
                          </div>
                        ) : null}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                          <input
                            value={draft.cancelQuantity}
                            onChange={(event) => updateOrderDraft(order, { cancelQuantity: event.target.value })}
                            inputMode="numeric"
                            className="min-w-0 rounded-md border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-bold text-[#191f28]"
                            aria-label={`${order.symbol} 부분 취소 수량`}
                          />
                          <button type="button" onClick={() => void cancelPartially(order)} disabled={partialCancellingOrderId === order.id} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-[#333d4b] ring-1 ring-[#e5e8eb] disabled:cursor-wait disabled:opacity-60">
                            {partialCancellingOrderId === order.id ? "처리 중" : "부분 취소"}
                          </button>
                          <button type="button" onClick={() => void cancel(order.id)} disabled={cancellingOrderId === order.id} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-[#333d4b] ring-1 ring-[#e5e8eb] disabled:cursor-wait disabled:opacity-60">
                            {cancellingOrderId === order.id ? "취소 중" : "전체 취소"}
                          </button>
                        </div>
                        <p className="text-[11px] font-semibold text-[#8b95a1]">남은 미체결 {remainingQuantity}주</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {!recentOrders.length ? <p className="text-sm text-[#6b7684]">주문 내역이 없습니다.</p> : null}
            </div>
          </Panel>

          <Panel title="최근 체결">
            <div className="space-y-3">
              {executions.map((execution) => (
                <article key={execution.id} className="rounded-md bg-[#f9fafb] p-4">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-bold">{execution.side === "BUY" ? "매수" : "매도"} {execution.symbol}</p>
                    <span className="shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-semibold">{execution.quantity}주</span>
                  </div>
                  <p className="mt-2 min-w-0 break-words text-sm font-semibold tabular-nums">{formatWon(execution.price)}</p>
                  <div className="mt-2 grid gap-1 text-xs font-semibold text-[#6b7684]">
                    <span>순금액 {formatWon(execution.netAmount)}</span>
                    {(execution.feeAmount > 0 || execution.taxAmount > 0) ? (
                      <span>비용 {formatWon(execution.feeAmount + execution.taxAmount)}</span>
                    ) : null}
                    {execution.realizedProfit !== null && execution.realizedProfit !== undefined ? (
                      <span className={execution.realizedProfit >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}>
                        실현손익 {formatWon(execution.realizedProfit)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b7684]">
                    <span>{formatDateTime(execution.executedAt)}</span>
                    <span>{formatExecutionSource(execution.source)}</span>
                  </div>
                </article>
              ))}
              {!executions.length ? <p className="text-sm text-[#6b7684]">체결 내역이 없습니다.</p> : null}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "red" | "gray" }) {
  const toneClassName = {
    blue: "text-[#3182f6]",
    green: "text-[#00a56a]",
    red: "text-[#f04452]",
    gray: "text-[#4e5968]",
  }[tone];

  return (
    <article className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <p className="text-sm font-bold text-[#6b7684]">{label}</p>
      <p className={`mt-2 min-w-0 break-words text-[clamp(1rem,2.2vw,1.25rem)] font-black leading-tight tabular-nums ${toneClassName}`}>{value}</p>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

function Toggle({
  active,
  onClick,
  label,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: "default" | "buy" | "sell";
}) {
  const activeClassName = tone === "buy"
    ? "bg-[#f04452] text-white"
    : tone === "sell"
      ? "bg-[#3182f6] text-white"
      : "bg-[#3182f6] text-white";

  return (
    <button type="button" onClick={onClick} className={active ? `rounded-md px-3 py-2 text-sm font-black ${activeClassName}` : "rounded-md bg-[#2b333f] px-3 py-2 text-sm font-bold text-[#b0b8c1]"}>
      {label}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  inputMode,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-xs text-[#b0b8c1]">{label}</span>
      <input
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        inputMode={inputMode}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1 w-full min-w-0 rounded-md border border-[#3c4654] bg-[#2b333f] px-3 py-3 text-sm font-semibold text-white outline-none disabled:opacity-60"
      />
    </label>
  );
}

function Sparkline({ ticks }: { ticks: PriceTick[] }) {
  if (ticks.length < 2) {
    return (
      <div className="flex h-full items-center justify-center border-y border-[#eef0f2] text-sm text-[#6b7684]">
        가격 이력이 쌓이면 흐름이 표시됩니다.
      </div>
    );
  }

  const values = ticks.map((tick) => tick.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 300;
  const height = 80;
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="선택 종목 가격 흐름" className="h-full w-full overflow-visible">
      <line x1="0" x2={width} y1={height} y2={height} stroke="#eef0f2" strokeWidth="1" />
      <line x1="0" x2={width} y1="0" y2="0" stroke="#eef0f2" strokeWidth="1" />
      <polyline points={points} fill="none" stroke="#3182f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function OrderBookPanel({ orderBook }: { orderBook: OrderBook | null }) {
  if (!orderBook || (!orderBook.bids.length && !orderBook.asks.length)) {
    return <p className="text-sm text-[#6b7684]">아직 공개 호가가 없습니다.</p>;
  }

  const maxQuantity = Math.max(
    ...orderBook.bids.map((level) => level.quantity),
    ...orderBook.asks.map((level) => level.quantity),
    1,
  );

  return (
    <div className="grid gap-4">
      <OrderBookSide title="매도 대기" levels={[...orderBook.asks].reverse()} tone="ask" maxQuantity={maxQuantity} />
      <div className="h-px bg-[#eef0f2]" />
      <OrderBookSide title="매수 대기" levels={orderBook.bids} tone="bid" maxQuantity={maxQuantity} />
    </div>
  );
}

function PortfolioHistory({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  if (!snapshots.length) {
    return <p className="text-sm text-[#6b7684]">장 마감 정산 기록이 아직 없습니다.</p>;
  }

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];
  const trend = latest.totalAsset - oldest.totalAsset;

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-md bg-[#f9fafb] p-3">
          <p className="text-xs font-bold text-[#6b7684]">최근 정산</p>
          <p className="mt-1 min-w-0 break-words text-sm font-black tabular-nums">{formatWon(latest.totalAsset)}</p>
        </div>
        <div className="min-w-0 rounded-md bg-[#f9fafb] p-3">
          <p className="text-xs font-bold text-[#6b7684]">기록 변동</p>
          <p className={trend >= 0 ? "mt-1 min-w-0 break-words text-sm font-black text-[#f04452] tabular-nums" : "mt-1 min-w-0 break-words text-sm font-black text-[#3182f6] tabular-nums"}>
            {formatSignedWon(trend)}
          </p>
        </div>
      </div>
      <AssetLineChart snapshots={snapshots} />
      <div className="mt-4 space-y-2">
        {snapshots.slice(0, 5).map((snapshot) => (
          <div key={snapshot.snapshotDate} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#eef0f2] py-2 text-sm">
            <span className="text-xs font-bold text-[#6b7684]">{formatDate(snapshot.snapshotDate)}</span>
            <span className="min-w-0 break-words font-semibold tabular-nums">{formatWon(snapshot.totalAsset)}</span>
            <span className={snapshot.returnRate >= 0 ? "text-xs font-black text-[#f04452] tabular-nums" : "text-xs font-black text-[#3182f6] tabular-nums"}>
              {formatNumber(snapshot.returnRate)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderBookSide({
  title,
  levels,
  tone,
  maxQuantity,
}: {
  title: string;
  levels: OrderBookLevel[];
  tone: "bid" | "ask";
  maxQuantity: number;
}) {
  if (!levels.length) {
    return (
      <div>
        <p className="text-xs font-bold text-[#6b7684]">{title}</p>
        <p className="mt-2 text-sm text-[#6b7684]">대기 물량 없음</p>
      </div>
    );
  }

  const barColor = tone === "bid" ? "rgba(49, 130, 246, 0.13)" : "rgba(240, 68, 82, 0.12)";
  const priceColor = tone === "bid" ? "text-[#3182f6]" : "text-[#f04452]";

  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-[#6b7684]">{title}</p>
      <div className="mt-2 space-y-1">
        {levels.map((level) => {
          const width = Math.max((level.quantity / maxQuantity) * 100, 8);
          return (
            <div key={`${tone}-${level.price}`} className="relative min-w-0 overflow-hidden rounded-sm bg-[#f9fafb] px-2 py-2">
              <div className="absolute inset-y-0 right-0" style={{ width: `${width}%`, backgroundColor: barColor }} />
              <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-xs">
                <span className={`min-w-0 break-words font-black tabular-nums ${priceColor}`}>{formatWon(level.price)}</span>
                <span className="shrink-0 text-[#333d4b] tabular-nums">{level.quantity.toLocaleString("ko-KR")}주</span>
                <span className="shrink-0 text-[#8b95a1]">{level.orderCount}건</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parsePriceStreamEvent(rawData: string): PriceStreamEvent | null {
  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const currentPrice = toFiniteNumber(record.currentPrice);
    if (
      typeof record.symbol !== "string" ||
      !record.symbol.trim() ||
      currentPrice === null ||
      currentPrice <= 0 ||
      typeof record.priceTime !== "string" ||
      !record.priceTime.trim()
    ) {
      return null;
    }
    return {
      symbol: record.symbol.trim().toUpperCase(),
      currentPrice,
      priceTime: record.priceTime,
      provider: typeof record.provider === "string" && record.provider.trim() ? record.provider : "redis-pubsub",
    };
  } catch {
    return null;
  }
}

function mergePriceStreamEvent(currentPrices: Price[], event: PriceStreamEvent): Price[] {
  const priceIndex = currentPrices.findIndex((price) => price.symbol === event.symbol);
  if (priceIndex < 0) {
    return currentPrices;
  }

  const nextPrices = [...currentPrices];
  const currentPrice = nextPrices[priceIndex];
  const previousClose = currentPrice.previousClose > 0 ? currentPrice.previousClose : event.currentPrice;
  nextPrices[priceIndex] = {
    ...currentPrice,
    currentPrice: event.currentPrice,
    changeRate: calculateChangeRate(event.currentPrice, previousClose),
    priceTime: event.priceTime,
    provider: event.provider,
  };
  return nextPrices;
}

function calculateChangeRate(currentPrice: number, previousClose: number): number {
  if (previousClose <= 0) {
    return 0;
  }
  return ((currentPrice - previousClose) * 100) / previousClose;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function formatWon(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatCompactWon(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  if (abs >= 1_000_000_000_000) {
    return `${sign}${formatCompactUnit(abs / 1_000_000_000_000)}조원`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${formatCompactUnit(abs / 100_000_000)}억원`;
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${sign}${abs.toLocaleString("ko-KR")}원`;
}

function formatCompactUnit(value: number): string {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  });
}

function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function resolveSelectedSymbol(currentSymbol: string, instruments: Instrument[], prices: Price[]): string {
  const availableSymbols = new Set([
    ...prices.map((price) => price.symbol),
    ...instruments.map((instrument) => instrument.symbol),
  ]);
  if (currentSymbol && availableSymbols.has(currentSymbol)) {
    return currentSymbol;
  }
  return prices[0]?.symbol ?? instruments[0]?.symbol ?? "";
}

function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function matchesTickSize(price: number, tickSize: number): boolean {
  const priceInCents = Math.round(price * 100);
  const tickInCents = Math.round(tickSize * 100);
  return tickInCents > 0 && priceInCents % tickInCents === 0;
}

function isWithinPriceLimit(price: number, basePrice: number, priceLimitRate: number): boolean {
  const lowerLimit = basePrice * (100 - priceLimitRate) / 100;
  const upperLimit = basePrice * (100 + priceLimitRate) / 100;
  return price >= lowerLimit && price <= upperLimit;
}

function generateClientOrderId(): string {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function formatNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "0.00";
  }
  return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSignedWon(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatWon(value)}`;
}

function formatOrderPrice(order: Order): string {
  if (order.limitPrice !== undefined && order.limitPrice !== null) {
    return formatWon(order.limitPrice);
  }
  if (order.averageFillPrice !== undefined && order.averageFillPrice !== null) {
    return formatWon(order.averageFillPrice);
  }
  return "시장가";
}

function formatOrderStatus(status: Order["status"]): string {
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

function orderStatusClassName(status: Order["status"]): string {
  switch (status) {
    case "PENDING":
      return "bg-[#f2f4f6] text-[#4e5968]";
    case "PARTIALLY_FILLED":
      return "bg-[#fff4d6] text-[#8b5d00]";
    case "FILLED":
      return "bg-[#e8f7ef] text-[#008a5a]";
    case "CANCELLED":
      return "bg-[#e5e8eb] text-[#6b7684]";
    case "REJECTED":
      return "bg-[#ffecee] text-[#f04452]";
  }
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatExecutionSource(source: Execution["source"]): string {
  if (source === "INTERNAL_ORDER_BOOK") {
    return "오더북";
  }
  return "현재가";
}

function formatCorporateActionType(actionType?: CorporateActionType | null): string {
  switch (actionType) {
    case "INITIAL_ISSUE":
      return "초기 발행";
    case "PAID_IN_CAPITAL_INCREASE":
      return "유상증자";
    case "ADDITIONAL_ISSUE":
      return "추가발행";
    case "STOCK_SPLIT":
      return "액면분할";
    case "CASH_DIVIDEND":
      return "현금배당";
    case "BONUS_ISSUE":
      return "무상증자";
    case "STOCK_DIVIDEND":
      return "주식배당";
    default:
      return "기업 이벤트";
  }
}

function formatEntitlementStatus(status: CorporateActionEntitlement["status"]): string {
  return status === "PAID" ? "지급 완료" : "지급 예정";
}

function formatEntitlementValue(entitlement: CorporateActionEntitlement): string {
  if (entitlement.cashAmount !== undefined && entitlement.cashAmount !== null) {
    return `현금 ${formatWon(entitlement.cashAmount)}`;
  }
  if (entitlement.shareQuantity !== undefined && entitlement.shareQuantity !== null) {
    return `신주 ${entitlement.shareQuantity.toLocaleString("ko-KR")}주`;
  }
  return "배정 수량 확인 중";
}
