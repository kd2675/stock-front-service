"use client";

import Link from "next/link";
import { useState } from "react";

import { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import TradingTopBar from "@/app/components/TradingTopBar";
import { useAccountRequiredRedirect } from "@/app/hooks/useAccountRequiredRedirect";
import useAuthSession from "@/app/hooks/useAuthSession";
import { useLoginRequiredRedirect } from "@/app/hooks/useLoginRequiredRedirect";
import { getAccessTokenForAuthStatus, isAdminRole } from "@/app/lib/auth";
import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import { OrderMetric } from "@/app/supply-demand/orders/OrderManagementPanels";
import { OrderTable } from "@/app/supply-demand/orders/OrderManagementTable";
import { useOrderManagementActions } from "@/app/supply-demand/orders/useOrderManagementActions";
import { useOrderManagementDerivedState } from "@/app/supply-demand/orders/useOrderManagementDerivedState";
import { useOrderManagementPageQueries } from "@/app/supply-demand/orders/useOrderManagementPageQueries";

export default function SupplyDemandOrdersPage() {
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const token = getAccessTokenForAuthStatus(authStatus);
  const isAdmin = isAdminRole(user?.role);
  const {
    accountStatusQuery,
    hasTradingAccount,
    instruments,
    isRefreshing,
    loading,
    orderBookMarket,
    orders,
    portfolio,
  } = useOrderManagementPageQueries({
    authStatus,
    isHydrated,
    token,
  });
  const {
    completedOrders,
    instrumentBySymbol,
    openOrders,
    partialOrders,
    sortedOpenOrders,
    sortedOrders,
  } = useOrderManagementDerivedState({
    instruments,
    orders,
  });
  const {
    cancelPartialOrder,
    cancelRemainingOrder,
    cancellingOrderId,
    partialCancellingOrderId,
    partialCancelQuantityByOrderId,
    updatePartialCancelQuantity,
  } = useOrderManagementActions({
    setMessage,
  });

  useLoginRequiredRedirect({ authStatus, isHydrated });

  useAccountRequiredRedirect({
    accountStatusPending: accountStatusQuery.isPending,
    authStatus,
    hasTradingAccount,
    isHydrated,
    nextPath: "/supply-demand/orders",
  });

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return <TradingStatusScreen>세션 확인 중</TradingStatusScreen>;
  }

  if (loading) {
    return <TradingStatusScreen>주문 내역 확인 중</TradingStatusScreen>;
  }

  if (!hasTradingAccount) {
    return <TradingStatusScreen>계좌 필요 화면으로 이동 중</TradingStatusScreen>;
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
            {isRefreshing ? "갱신 중" : "자동 갱신"}
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {message ? <p className="mb-4 rounded-md bg-[#fff3f0] px-3 py-2 text-sm font-bold text-[#d34b36]">{message}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <OrderMetric label="미체결" value={`${formatNumber(openOrders.length)}건`} />
          <OrderMetric label="부분체결" value={`${formatNumber(partialOrders.length)}건`} />
          <OrderMetric label="완료/취소" value={`${formatNumber(completedOrders.length)}건`} />
          <OrderMetric label="시장 미체결" value={orderBookMarket ? `${formatNumber(orderBookMarket.openOrderCount)}건` : "-"} />
          <OrderMetric label="예수금" value={portfolio ? formatWon(portfolio.account.cashBalance) : "-"} />
        </div>

        <section className="mt-5 rounded-lg border border-[#e5e8eb] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f2] px-4 py-3">
            <div>
              <h2 className="text-base font-black">미체결 주문</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">대기와 부분체결 주문 전체를 보여줍니다. 부분체결 주문은 남은 수량 안에서 일부만 취소할 수 있습니다.</p>
            </div>
            <span className="rounded-md bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-black text-[#4e5968]">{formatNumber(openOrders.length)}건</span>
          </div>
          <OrderTable
            cancellingOrderId={cancellingOrderId}
            instrumentBySymbol={instrumentBySymbol}
            orders={sortedOpenOrders}
            partialCancelQuantityByOrderId={partialCancelQuantityByOrderId}
            partialCancellingOrderId={partialCancellingOrderId}
            showActions
            onCancelPartial={cancelPartialOrder}
            onCancelRemaining={cancelRemainingOrder}
            onPartialQuantityChange={updatePartialCancelQuantity}
          />
        </section>

        <section className="mt-5 rounded-lg border border-[#e5e8eb] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f2] px-4 py-3">
            <div>
              <h2 className="text-base font-black">전체 주문 내역</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">주문장 주문을 최신순으로 모두 확인합니다.</p>
            </div>
            <span className="rounded-md bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-black text-[#4e5968]">{formatNumber(orders.length)}건</span>
          </div>
          <OrderTable
            instrumentBySymbol={instrumentBySymbol}
            orders={sortedOrders}
            showActions={false}
          />
        </section>
      </section>
    </main>
  );
}
