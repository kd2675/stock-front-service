"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import useAuthSession from "@/app/hooks/useAuthSession";
import { getAccessToken, isAdminRole } from "@/app/lib/auth";
import { cancelOrderMutationOptions, cancelOrderPartiallyMutationOptions } from "@/app/lib/react-query/stockMutations";
import { accountStatusQueryOptions, orderBookInstrumentsQueryOptions, orderBookMarketStatusQueryOptions, ordersQueryOptions, portfolioQueryOptions } from "@/app/lib/react-query/stockQueries";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import type { Order, OrderBookInstrument } from "@/app/types/stock";

const EMPTY_ORDERS: Order[] = [];
const EMPTY_INSTRUMENTS: OrderBookInstrument[] = [];

export default function SupplyDemandOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [partialCancelQuantityByOrderId, setPartialCancelQuantityByOrderId] = useState<Record<number, string>>({});
  const token = authStatus === "in" ? getAccessToken() : null;
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const accountStatusQuery = useQuery({
    ...accountStatusQueryOptions(token),
    enabled: isHydrated && authStatus === "in" && Boolean(token),
  });
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true;
  const ordersQuery = useQuery(ordersQueryOptions(token, { marketType: "ORDER_BOOK", enabled: hasTradingAccount }));
  const instrumentsQuery = useQuery({
    ...orderBookInstrumentsQueryOptions(),
    enabled: hasTradingAccount,
  });
  const orderBookMarketQuery = useQuery({
    ...orderBookMarketStatusQueryOptions(),
    enabled: hasTradingAccount,
  });
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const instruments = instrumentsQuery.data ?? EMPTY_INSTRUMENTS;
  const instrumentBySymbol = useMemo(() => new Map(instruments.map((instrument) => [instrument.symbol, instrument])), [instruments]);
  const openOrders = useMemo(() => orders.filter(isOpenOrder), [orders]);
  const partialOrders = useMemo(() => openOrders.filter((order) => order.status === "PARTIALLY_FILLED"), [openOrders]);
  const completedOrders = useMemo(() => orders.filter((order) => !isOpenOrder(order)), [orders]);
  const sortedOpenOrders = useMemo(() => [...openOrders].sort(compareOrderCreatedDesc), [openOrders]);
  const sortedOrders = useMemo(() => [...orders].sort(compareOrderCreatedDesc), [orders]);
  const loading = accountStatusQuery.isPending || ordersQuery.isLoading || instrumentsQuery.isLoading;

  useEffect(() => {
    if (!isHydrated || authStatus === "unknown") {
      return;
    }
    if (authStatus === "out") {
      router.replace("/login");
    }
  }, [authStatus, isHydrated, router]);

  useEffect(() => {
    if (accountStatusQuery.isPending || hasTradingAccount) {
      return;
    }
    router.replace("/account-required?redirect=/supply-demand/orders");
  }, [accountStatusQuery.isPending, hasTradingAccount, router]);

  const invalidateOrderState = async (targetOrders: Order[]) => {
    const symbols = [...new Set(targetOrders.map((order) => order.symbol))];
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: stockKeys.orders({ marketType: "ORDER_BOOK" }) }),
      queryClient.invalidateQueries({ queryKey: stockKeys.portfolio() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.holdings() }),
      queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatus() }),
      ...symbols.map((symbol) => queryClient.invalidateQueries({ queryKey: stockKeys.orderBook(symbol) })),
    ]);
  };

  const cancelOrderMutation = useMutation({
    ...cancelOrderMutationOptions(),
    onSuccess: async (order) => {
      setMessage("주문 잔량을 취소했습니다.");
      await invalidateOrderState([order]);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문 취소에 실패했습니다.");
    },
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
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "부분 취소에 실패했습니다.");
    },
  });
  const cancellingOrderIdValue = cancelOrderMutation.isPending ? cancelOrderMutation.variables ?? null : null;
  const partialCancellingOrderId = partialCancelMutation.isPending ? partialCancelMutation.variables?.orderId ?? null : null;

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
    const quantity = Number.parseInt(rawQuantity, 10);
    const remainingQuantity = getRemainingQuantity(order);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > remainingQuantity) {
      setMessage(`부분 취소 수량은 1주 이상 ${remainingQuantity.toLocaleString("ko-KR")}주 이하로 입력해 주세요.`);
      return;
    }
    partialCancelMutation.mutate({ orderId: order.id, quantity });
  };

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#191f28]">
        <StatusBox>세션 확인 중</StatusBox>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#191f28]">
        <StatusBox>주문 내역 확인 중</StatusBox>
      </main>
    );
  }

  if (!hasTradingAccount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 text-[#191f28]">
        <StatusBox>계좌 필요 화면으로 이동 중</StatusBox>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#191f28]">
      <TradingTopBar
        active="order-book"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Link href="/supply-demand/admin" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
                설정 현황
              </Link>
            ) : null}
            <Link href="/supply-demand" className="inline-flex h-11 items-center rounded-md bg-[#191f28] px-3 text-sm font-bold text-white">
              주문장
            </Link>
          </div>
        )}
      />

      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold text-[#3182f6]">ORDER MANAGEMENT</p>
            <h1 className="mt-1 text-2xl font-black">내 주문 관리</h1>
            <p className="mt-1 text-sm font-bold text-[#6b7684]">미체결과 부분체결 주문을 전체 목록에서 확인하고 잔량 취소 또는 부분 취소합니다.</p>
          </div>
          <span className="rounded-md bg-[#f2f4f6] px-3 py-2 text-xs font-black text-[#4e5968]">
            {ordersQuery.isFetching || orderBookMarketQuery.isFetching || portfolioQuery.isFetching ? "갱신 중" : "자동 갱신"}
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {message ? <p className="mb-4 rounded-md bg-[#fff3f0] px-3 py-2 text-sm font-bold text-[#d34b36]">{message}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <OrderMetric label="미체결" value={`${openOrders.length.toLocaleString("ko-KR")}건`} />
          <OrderMetric label="부분체결" value={`${partialOrders.length.toLocaleString("ko-KR")}건`} />
          <OrderMetric label="완료/취소" value={`${completedOrders.length.toLocaleString("ko-KR")}건`} />
          <OrderMetric label="시장 미체결" value={orderBookMarketQuery.data ? `${orderBookMarketQuery.data.openOrderCount.toLocaleString("ko-KR")}건` : "-"} />
          <OrderMetric label="예수금" value={portfolioQuery.data ? formatWon(portfolioQuery.data.account.cashBalance) : "-"} />
        </div>

        <section className="mt-5 rounded-lg border border-[#e5e8eb] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f2] px-4 py-3">
            <div>
              <h2 className="text-base font-black">미체결 주문</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">대기와 부분체결 주문 전체를 보여줍니다. 부분체결 주문은 남은 수량 안에서 일부만 취소할 수 있습니다.</p>
            </div>
            <span className="rounded-md bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-black text-[#4e5968]">{openOrders.length.toLocaleString("ko-KR")}건</span>
          </div>
          <OrderTable
            cancellingOrderId={cancellingOrderIdValue}
            instrumentBySymbol={instrumentBySymbol}
            orders={sortedOpenOrders}
            partialCancelQuantityByOrderId={partialCancelQuantityByOrderId}
            partialCancellingOrderId={partialCancellingOrderId}
            showActions
            onCancelPartial={cancelPartialOrder}
            onCancelRemaining={cancelRemainingOrder}
            onPartialQuantityChange={(orderId, value) => setPartialCancelQuantityByOrderId((current) => ({ ...current, [orderId]: value }))}
          />
        </section>

        <section className="mt-5 rounded-lg border border-[#e5e8eb] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f2] px-4 py-3">
            <div>
              <h2 className="text-base font-black">전체 주문 내역</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">주문장 주문을 최신순으로 모두 확인합니다.</p>
            </div>
            <span className="rounded-md bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-black text-[#4e5968]">{orders.length.toLocaleString("ko-KR")}건</span>
          </div>
          <OrderTable
            cancellingOrderId={null}
            instrumentBySymbol={instrumentBySymbol}
            orders={sortedOrders}
            partialCancelQuantityByOrderId={{}}
            partialCancellingOrderId={null}
            showActions={false}
            onCancelPartial={() => undefined}
            onCancelRemaining={() => undefined}
            onPartialQuantityChange={() => undefined}
          />
        </section>
      </section>
    </main>
  );
}

function OrderTable({
  cancellingOrderId,
  instrumentBySymbol,
  orders,
  partialCancelQuantityByOrderId,
  partialCancellingOrderId,
  showActions,
  onCancelPartial,
  onCancelRemaining,
  onPartialQuantityChange,
}: {
  cancellingOrderId: number | null;
  instrumentBySymbol: Map<string, OrderBookInstrument>;
  orders: Order[];
  partialCancelQuantityByOrderId: Record<number, string>;
  partialCancellingOrderId: number | null;
  showActions: boolean;
  onCancelPartial: (order: Order) => void;
  onCancelRemaining: (order: Order) => void;
  onPartialQuantityChange: (orderId: number, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1120px] w-full border-collapse text-sm">
        <thead className="bg-[#f7f8fa] text-left text-xs font-black text-[#6b7684]">
          <tr>
            <th className="px-4 py-3">주문</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">주문가</th>
            <th className="px-4 py-3">주문/체결/잔량</th>
            <th className="px-4 py-3">평균 체결가</th>
            <th className="px-4 py-3">접수시각</th>
            {showActions ? <th className="px-4 py-3">취소</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef0f2]">
          {orders.map((order) => {
            const instrument = instrumentBySymbol.get(order.symbol);
            const remainingQuantity = getRemainingQuantity(order);
            return (
              <tr key={order.id}>
                <td className="px-4 py-3">
                  <p className="font-black text-[#191f28]">{order.side === "BUY" ? "매수" : "매도"} {order.symbol}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{instrument?.name ?? order.clientOrderId}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={["inline-flex rounded-md px-2 py-1 text-xs font-black", order.status === "PARTIALLY_FILLED" ? "bg-[#fff3d6] text-[#a36300]" : isOpenOrder(order) ? "bg-[#eaf3ff] text-[#1f6ed4]" : "bg-[#f2f4f6] text-[#4e5968]"].join(" ")}>
                    {formatOrderStatus(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold tabular-nums text-[#333d4b]">{formatOrderPrice(order)}</td>
                <td className="px-4 py-3 font-bold tabular-nums text-[#4e5968]">
                  {formatNumber(order.quantity)} / {formatNumber(order.filledQuantity)} / {formatNumber(remainingQuantity)}주
                </td>
                <td className="px-4 py-3 font-bold tabular-nums text-[#4e5968]">{order.averageFillPrice == null ? "-" : formatWon(order.averageFillPrice)}</td>
                <td className="px-4 py-3 text-xs font-bold text-[#6b7684]">{formatDateTime(order.createdAt)}</td>
                {showActions ? (
                  <td className="px-4 py-3">
                    <div className="grid min-w-[280px] gap-2">
                      <button
                        type="button"
                        onClick={() => onCancelRemaining(order)}
                        disabled={cancellingOrderId === order.id || partialCancellingOrderId === order.id}
                        className="h-9 rounded-md bg-[#191f28] px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-50"
                      >
                        {cancellingOrderId === order.id ? "취소 중" : "잔량 전부 취소"}
                      </button>
                      {remainingQuantity > 1 ? (
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <input
                            value={partialCancelQuantityByOrderId[order.id] ?? ""}
                            onChange={(event) => onPartialQuantityChange(order.id, event.target.value)}
                            inputMode="numeric"
                            placeholder={`${remainingQuantity}주 이하`}
                            className="h-9 min-w-0 rounded-md border border-[#d1d6db] px-2 text-right text-xs font-black outline-none focus:border-[#3182f6]"
                          />
                          <button
                            type="button"
                            onClick={() => onCancelPartial(order)}
                            disabled={cancellingOrderId === order.id || partialCancellingOrderId === order.id}
                            className="h-9 rounded-md bg-white px-3 text-xs font-black text-[#333d4b] ring-1 ring-[#d1d6db] disabled:cursor-wait disabled:opacity-50"
                          >
                            {partialCancellingOrderId === order.id ? "처리 중" : "부분 취소"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 7 : 6} className="px-4 py-8 text-center text-sm font-bold text-[#8b95a1]">표시할 주문이 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white px-4 py-3">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums text-[#191f28]">{value}</p>
    </div>
  );
}

function StatusBox({ children }: { children: string }) {
  return <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">{children}</div>;
}

function compareOrderCreatedDesc(left: Order, right: Order) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function isOpenOrder(order: Order) {
  return order.status === "PENDING" || order.status === "PARTIALLY_FILLED";
}

function getRemainingQuantity(order: Order) {
  return Math.max(0, order.quantity - order.filledQuantity);
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

function formatWon(value: number | null | undefined) {
  const normalizedValue = Number.isFinite(value) ? Number(value) : 0;
  return `${Math.round(normalizedValue).toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
