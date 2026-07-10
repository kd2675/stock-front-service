"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import TradingTopBar from "@/app/components/TradingTopBar";
import { useCorporateActionPageQueries } from "@/app/corporate-actions/useCorporateActionPageQueries";
import { useAccountRequiredRedirect } from "@/app/hooks/useAccountRequiredRedirect";
import useAuthSession from "@/app/hooks/useAuthSession";
import { useLoginRequiredRedirect } from "@/app/hooks/useLoginRequiredRedirect";
import { getAccessTokenForAuthStatus } from "@/app/lib/auth";
import {
  getCapitalIncreaseOfferingLabel,
  getCorporateActionSubscriptionErrorMessage,
  isCapitalIncreaseOpen,
  isSupportedCapitalIncrease,
  resolveCorporateActionSubscriptionState,
  type CapitalIncreaseAction,
} from "@/app/lib/corporateActionSubscriptions";
import { invalidateCorporateActionSubscriptionQueries } from "@/app/lib/react-query/stockInvalidations";
import { subscribeCorporateActionMutationOptions } from "@/app/lib/react-query/stockMutations";
import { formatMonthDay, formatNumber, formatWon } from "@/app/lib/stockFormatters";
import { CorporateActionSubscriptionPanel } from "@/app/supply-demand/CorporateActionSubscriptionPanel";
import type { CapitalIncreaseOfferingType, CorporateActionEntitlement, OrderBookInstrument } from "@/app/types/stock";

type EventViewFilter = "ALL" | "OPEN" | "MINE";
type OfferingFilter = "ALL" | CapitalIncreaseOfferingType;

const VIEW_FILTERS: Array<{ label: string; value: EventViewFilter }> = [
  { label: "전체", value: "ALL" },
  { label: "진행 중", value: "OPEN" },
  { label: "내 권리·청약", value: "MINE" },
];

export default function CorporateActionsClient() {
  const queryClient = useQueryClient();
  const { authStatus, isHydrated } = useAuthSession();
  const token = getAccessTokenForAuthStatus(authStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [offeringFilter, setOfferingFilter] = useState<OfferingFilter>("ALL");
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
  const [viewFilter, setViewFilter] = useState<EventViewFilter>("ALL");
  const {
    accountStatusQuery,
    actionsErrorMessage,
    cashErrorMessage,
    corporateActions,
    entitlements,
    entitlementsReady,
    hasTradingAccount,
    instruments,
    isFetching,
    isLoading,
    portfolio,
    refetchEvents,
    simulationClock,
  } = useCorporateActionPageQueries({ authStatus, isHydrated, token });
  const corporateActionMutation = useMutation({
    ...subscribeCorporateActionMutationOptions(),
    onSuccess: async (_entitlement, variables) => {
      setMessage("기업 이벤트 청약이 접수되었습니다.");
      await invalidateCorporateActionSubscriptionQueries(queryClient, variables.symbol);
    },
    onError: (error) => setMessage(getCorporateActionSubscriptionErrorMessage(error)),
  });

  const capitalIncreases = useMemo(
    () => corporateActions
      .filter(isSupportedCapitalIncrease)
      .sort((left, right) => compareCapitalIncreases(left, right, simulationClock?.simulationDate)),
    [corporateActions, simulationClock?.simulationDate],
  );
  const entitlementByActionId = useMemo(
    () => new Map(entitlements.map((entitlement) => [entitlement.actionId, entitlement])),
    [entitlements],
  );
  const instrumentBySymbol = useMemo(
    () => new Map(instruments.map((instrument) => [instrument.symbol, instrument])),
    [instruments],
  );
  const filteredActions = capitalIncreases.filter((action) => {
    if (offeringFilter !== "ALL" && action.offeringType !== offeringFilter) {
      return false;
    }
    if (viewFilter === "OPEN") {
      return isCapitalIncreaseOpen(action, simulationClock?.simulationDate);
    }
    if (viewFilter === "MINE") {
      return entitlementByActionId.has(action.id);
    }
    return true;
  });
  const selectedAction = filteredActions.find((action) => action.id === selectedActionId)
    ?? filteredActions[0]
    ?? null;
  const openCount = capitalIncreases.filter((action) => isCapitalIncreaseOpen(action, simulationClock?.simulationDate)).length;
  const subscribedCount = capitalIncreases.filter((action) => {
    const status = entitlementByActionId.get(action.id)?.status;
    return status === "SUBSCRIBED" || status === "PAID";
  }).length;

  useLoginRequiredRedirect({ authStatus, isHydrated });
  useAccountRequiredRedirect({
    accountStatusPending: accountStatusQuery.isPending || accountStatusQuery.isError,
    authStatus,
    hasTradingAccount,
    isHydrated,
    nextPath: "/corporate-actions",
  });

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return <TradingStatusScreen>세션 확인 중</TradingStatusScreen>;
  }
  if (accountStatusQuery.isPending) {
    return <TradingStatusScreen>계좌 확인 중</TradingStatusScreen>;
  }
  if (accountStatusQuery.isError) {
    return (
      <TradingStatusScreen>
        계좌 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.
      </TradingStatusScreen>
    );
  }
  if (!hasTradingAccount) {
    return <TradingStatusScreen>계좌 필요 화면으로 이동 중</TradingStatusScreen>;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#191f28]">
      <TradingTopBar
        active="corporate-actions"
        actions={(
          <button
            type="button"
            title="기업 이벤트는 5초마다 자동 갱신됩니다."
            onClick={() => void refetchEvents()}
            disabled={isFetching}
            className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#4e5968] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6] disabled:cursor-wait disabled:opacity-60"
          >
            {isFetching ? "이벤트 갱신 중" : "이벤트 새로고침"}
          </button>
        )}
      />

      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.18em] text-[#3182f6]">CAPITAL INCREASE</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">유상증자 기업 이벤트</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#6b7684]">
              주주배정은 권리락일 기준 보유자에게 배정된 수량 안에서, 일반공모는 전체 남은 모집 수량 안에서 청약합니다.
              두 방식 모두 청약 기간의 장 마감 후에만 접수됩니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HeaderMetric label="전체 이벤트" value={isLoading ? "-" : `${formatNumber(capitalIncreases.length)}건`} />
            <HeaderMetric label="진행 중" value={simulationClock ? `${formatNumber(openCount)}건` : "-"} />
            <HeaderMetric label="내 청약" value={entitlementsReady ? `${formatNumber(subscribedCount)}건` : "-"} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-2">
          <OfferingGuide
            title="주주배정"
            description="권리락 처리 후 내 계좌에 생성된 배정 권리 수량이 청약 상한입니다. 권리가 없으면 청약할 수 없습니다."
          />
          <OfferingGuide
            title="일반공모"
            description="기존 보유 여부와 관계없이 남은 모집 수량 안에서 한 번 청약할 수 있으며, 접수 즉시 납입금이 차감됩니다."
          />
        </div>

        {message ? (
          <p aria-live="polite" className="mt-4 rounded-md bg-[#eff6ff] px-4 py-3 text-sm font-bold text-[#1b64da]">{message}</p>
        ) : null}
        {actionsErrorMessage ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#fff3f0] px-4 py-3 text-sm font-bold text-[#d34b36]">
            <span>{actionsErrorMessage}</span>
            <button
              type="button"
              onClick={() => void refetchEvents()}
              className="rounded-md bg-white px-3 py-2 text-xs font-black text-[#d34b36] ring-1 ring-[#ffd4cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d34b36]"
            >
              다시 조회
            </button>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e8eb] bg-white p-3">
          <div role="group" className="flex flex-wrap gap-2" aria-label="기업 이벤트 상태 필터">
            {VIEW_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={viewFilter === filter.value}
                onClick={() => setViewFilter(filter.value)}
                className={[
                  "h-9 rounded-md px-3 text-sm font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6]",
                  viewFilter === filter.value ? "bg-[#191f28] text-white" : "bg-[#f2f4f6] text-[#4e5968]",
                ].join(" ")}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#6b7684]">
            모집 방식
            <select
              value={offeringFilter}
              onChange={(event) => setOfferingFilter(event.target.value as OfferingFilter)}
              className="h-9 rounded-md border border-[#d1d6db] bg-white px-3 text-sm font-black text-[#333d4b] outline-none focus:border-[#3182f6]"
            >
              <option value="ALL">전체</option>
              <option value="SHAREHOLDER_ALLOCATION">주주배정</option>
              <option value="PUBLIC_OFFERING">일반공모</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start">
          <CorporateActionEventList
            actions={filteredActions}
            currentDate={simulationClock?.simulationDate}
            entitlements={entitlements}
            entitlementsReady={entitlementsReady}
            instrumentBySymbol={instrumentBySymbol}
            isLoading={isLoading}
            marketSession={simulationClock?.marketSession}
            selectedActionId={selectedAction?.id ?? null}
            onSelect={setSelectedActionId}
          />

          {selectedAction ? (
            <div className="lg:sticky lg:top-24">
              <CorporateActionSubscriptionPanel
                actions={[selectedAction]}
                availableCash={portfolio?.account.cashBalance}
                cashErrorMessage={cashErrorMessage}
                currentDate={simulationClock?.simulationDate}
                entitlements={entitlements.filter((entitlement) => entitlement.actionId === selectedAction.id)}
                entitlementsReady={entitlementsReady}
                isLoading={isLoading}
                marketSession={simulationClock?.marketSession}
                subscribingActionId={corporateActionMutation.isPending ? corporateActionMutation.variables?.actionId ?? null : null}
                title="이벤트 상세 및 청약"
                onSubscribe={(action, shareQuantity) => {
                  setMessage(null);
                  corporateActionMutation.mutate({
                    actionId: action.id,
                    payload: { shareQuantity },
                    symbol: action.symbol,
                  });
                }}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-[#e5e8eb] bg-white p-6 text-sm font-bold text-[#8b95a1]">
              왼쪽 목록에서 확인할 유상증자 이벤트를 선택해 주세요.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function CorporateActionEventList({
  actions,
  currentDate,
  entitlements,
  entitlementsReady,
  instrumentBySymbol,
  isLoading,
  marketSession,
  selectedActionId,
  onSelect,
}: {
  actions: CapitalIncreaseAction[];
  currentDate?: string | null;
  entitlements: CorporateActionEntitlement[];
  entitlementsReady: boolean;
  instrumentBySymbol: Map<string, OrderBookInstrument>;
  isLoading: boolean;
  marketSession?: "PRE_OPEN" | "REGULAR" | "AFTER_CLOSE" | null;
  selectedActionId: number | null;
  onSelect: (actionId: number) => void;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#e5e8eb] bg-white p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#8b95a1]">EVENT LIST</p>
          <h2 className="mt-1 text-xl font-black">기업 이벤트 목록</h2>
        </div>
        <span className="text-xs font-black text-[#6b7684]">{formatNumber(actions.length)}건</span>
      </div>

      <div className="mt-4 grid gap-2">
        {actions.map((action) => {
          const entitlement = entitlements.find((item) => item.actionId === action.id);
          const state = resolveCorporateActionSubscriptionState({ action, currentDate, entitlement, entitlementsReady, marketSession });
          const instrument = instrumentBySymbol.get(action.symbol);
          const selected = selectedActionId === action.id;
          return (
            <button
              key={action.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(action.id)}
              className={[
                "grid min-w-0 gap-3 rounded-md border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
                selected ? "border-[#3182f6] bg-[#f5f9ff]" : "border-[#e5e8eb] bg-white hover:bg-[#f7f8fa]",
              ].join(" ")}
            >
              <span className="min-w-0">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-black text-[#191f28]">{instrument?.name ?? action.symbol}</span>
                  <span className="rounded-sm bg-[#f2f4f6] px-2 py-1 text-[11px] font-black text-[#4e5968]">{action.symbol}</span>
                  <span className="rounded-sm bg-[#eff6ff] px-2 py-1 text-[11px] font-black text-[#3182f6]">
                    {getCapitalIncreaseOfferingLabel(action.offeringType)}
                  </span>
                </span>
                <span className="mt-2 block text-xs font-bold text-[#6b7684]">
                  {`청약 ${formatMonthDay(action.subscriptionStartDate)} - ${formatMonthDay(action.subscriptionEndDate)} · 발행가 ${formatWon(action.issuePrice)}`}
                </span>
              </span>
              <span className={[
                "justify-self-start rounded-sm px-2 py-1 text-xs font-black sm:justify-self-end",
                state.kind === "ready"
                  ? "bg-[#eff6ff] text-[#3182f6]"
                  : state.kind === "done"
                    ? "bg-[#e8f7ef] text-[#179c52]"
                    : state.kind === "waiting"
                      ? "bg-[#fff8e6] text-[#8a5a00]"
                      : "bg-[#fff3f0] text-[#d34b36]",
              ].join(" ")}
              >
                {state.label}
              </span>
            </button>
          );
        })}
        {actions.length === 0 && isLoading ? (
          <p className="rounded-md bg-[#f7f8fa] px-4 py-6 text-sm font-bold text-[#8b95a1]">기업 이벤트를 조회하고 있습니다.</p>
        ) : null}
        {actions.length === 0 && !isLoading ? (
          <p className="rounded-md bg-[#f7f8fa] px-4 py-6 text-sm font-bold text-[#8b95a1]">조건에 맞는 유상증자 이벤트가 없습니다.</p>
        ) : null}
      </div>
    </section>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f7f8fa] p-3 ring-1 ring-[#eef0f2]">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums">{value}</p>
    </div>
  );
}

function OfferingGuide({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <h2 className="text-sm font-black text-[#3182f6]">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#6b7684]">{description}</p>
    </article>
  );
}

function compareCapitalIncreases(left: CapitalIncreaseAction, right: CapitalIncreaseAction, currentDate?: string | null) {
  const openDifference = Number(isCapitalIncreaseOpen(right, currentDate)) - Number(isCapitalIncreaseOpen(left, currentDate));
  if (openDifference !== 0) {
    return openDifference;
  }
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}
