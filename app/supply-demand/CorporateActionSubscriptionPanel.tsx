"use client";

import Link from "next/link";
import { useState } from "react";

import {
  getCapitalIncreaseOfferingLabel,
  isCapitalIncreaseOpen,
  isSupportedCapitalIncrease,
  resolveCorporateActionSubscriptionState,
  type CapitalIncreaseAction,
  type CorporateActionSubscriptionState,
} from "@/app/lib/corporateActionSubscriptions";
import { formatMonthDay, formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { CorporateAction, CorporateActionEntitlement, SimulationClock } from "@/app/types/stock";

type CorporateActionSubscriptionPanelProps = {
  actions: CorporateAction[];
  availableCash?: number;
  cashErrorMessage?: string | null;
  currentDate?: string | null;
  entitlements: CorporateActionEntitlement[];
  entitlementsReady?: boolean;
  errorMessage?: string | null;
  isLoading: boolean;
  marketSession?: SimulationClock["marketSession"] | null;
  maxVisibleActions?: number;
  showAllLink?: boolean;
  subscribingActionId: number | null;
  title?: string;
  onSubscribe: (action: CapitalIncreaseAction, shareQuantity: number) => void;
};

export function CorporateActionSubscriptionPanel({
  actions,
  availableCash,
  cashErrorMessage,
  currentDate,
  entitlements,
  entitlementsReady = true,
  errorMessage,
  isLoading,
  marketSession,
  maxVisibleActions,
  showAllLink = false,
  subscribingActionId,
  title = "선택 종목 이벤트",
  onSubscribe,
}: CorporateActionSubscriptionPanelProps) {
  const [shareQuantityByActionId, setShareQuantityByActionId] = useState<Record<number, string>>({});
  const subscriptionActions = actions
    .filter(isSupportedCapitalIncrease)
    .sort((left, right) => {
      const openDifference = Number(isCapitalIncreaseOpen(right, currentDate)) - Number(isCapitalIncreaseOpen(left, currentDate));
      return openDifference || Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
  const visibleActions = maxVisibleActions === undefined
    ? subscriptionActions
    : subscriptionActions.slice(0, maxVisibleActions);

  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#8b95a1]">CORPORATE ACTION</p>
          <h3 className="mt-1 text-lg font-black">{title}</h3>
        </div>
        {showAllLink ? (
          <Link
            href="/corporate-actions"
            className="shrink-0 rounded-md bg-[#eff6ff] px-2.5 py-1.5 text-xs font-black text-[#3182f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6]"
          >
            전체 이벤트
          </Link>
        ) : (
          <span className="shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]">청약</span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {errorMessage ? (
          <p role="alert" className="rounded-md bg-[#fff3f0] px-3 py-3 text-sm font-bold leading-5 text-[#d34b36]">
            {errorMessage}
          </p>
        ) : null}
        {cashErrorMessage ? (
          <p role="alert" className="rounded-md bg-[#fff8e6] px-3 py-3 text-sm font-bold leading-5 text-[#8a5a00]">
            {cashErrorMessage}
          </p>
        ) : null}
        {isLoading && visibleActions.length === 0 ? (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">이벤트 조회 중</p>
        ) : visibleActions.length ? (
          visibleActions.map((action) => {
            const entitlement = entitlements.find((item) => item.actionId === action.id);
            const draftValue = shareQuantityByActionId[action.id] ?? "";
            const shareQuantity = parsePositiveInteger(draftValue);
            const issuePrice = action.issuePrice ?? 0;
            const estimatedAmount = shareQuantity === null || issuePrice <= 0 ? null : shareQuantity * issuePrice;
            const status = resolveCorporateActionSubscriptionState({
              action,
              currentDate,
              entitlement,
              entitlementsReady,
              marketSession,
            });
            const maxShares = status.maxShares;
            const hasInsufficientCash = estimatedAmount !== null
              && availableCash !== undefined
              && estimatedAmount > availableCash;
            const cashUnavailable = availableCash === undefined;
            const helperMessage = cashErrorMessage
              ? "예수금을 확인한 뒤 다시 시도해 주세요."
              : cashUnavailable
                ? "예수금을 확인하고 있습니다."
                : hasInsufficientCash
                  ? "현금 잔고가 부족합니다."
                  : maxShares !== null && shareQuantity !== null && shareQuantity > maxShares
                    ? "가능 수량을 초과했습니다."
                    : status.message;
            const canSubscribe = status.kind === "ready"
              && shareQuantity !== null
              && shareQuantity > 0
              && (maxShares === null || shareQuantity <= maxShares)
              && !hasInsufficientCash
              && !cashUnavailable
              && subscribingActionId === null;
            const inputId = `corporate-action-${action.id}-quantity`;
            const helperId = `${inputId}-helper`;

            return (
              <article key={action.id} className="rounded-md border border-[#e5e8eb] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#191f28]">
                      {`${action.symbol} · 유상증자 ${getCapitalIncreaseOfferingLabel(action.offeringType)}`}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8b95a1]">
                      {`청약 ${formatMonthDay(action.subscriptionStartDate)} - ${formatMonthDay(action.subscriptionEndDate)}`}
                    </p>
                  </div>
                  <SubscriptionStatusBadge state={status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <SmallMetric label="발행가" value={formatWon(action.issuePrice)} />
                  <SmallMetric label={action.offeringType === "SHAREHOLDER_ALLOCATION" ? "내 배정 권리" : "남은 모집"} value={maxShares === null ? "-" : `${formatNumber(maxShares)}주`} />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {action.offeringType === "SHAREHOLDER_ALLOCATION" ? <ScheduleItem label="권리락" value={action.exRightsDate} /> : null}
                  <ScheduleItem label="청약 마감" value={action.subscriptionEndDate} />
                  <ScheduleItem label="납입" value={action.paymentDate} />
                  <ScheduleItem label="신주상장" value={action.listingDate} />
                </div>

                {action.description ? (
                  <p className="mt-3 whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-[#6b7684]">{action.description}</p>
                ) : null}

                {entitlement?.status === "SUBSCRIBED" || entitlement?.status === "PAID" ? (
                  <div className="mt-3 rounded-md bg-[#f7f8fa] p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-[#6b7684]">청약 수량</span>
                      <span className="font-black tabular-nums text-[#191f28]">{formatNumber(entitlement.subscribedShareQuantity ?? 0)}주</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-bold text-[#6b7684]">청약 금액</span>
                      <span className="font-black tabular-nums text-[#191f28]">{formatWon(entitlement.subscribedCashAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <label htmlFor={inputId} className="mt-3 block text-xs font-bold text-[#6b7684]">청약 수량</label>
                    <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] rounded-md border border-[#d1d6db] bg-white focus-within:border-[#3182f6] focus-within:ring-2 focus-within:ring-[#3182f6]/15">
                        <input
                          id={inputId}
                          inputMode="numeric"
                          autoComplete="off"
                          aria-describedby={helperId}
                          disabled={status.kind !== "ready" || cashUnavailable || subscribingActionId !== null}
                          value={draftValue}
                          onChange={(event) => setShareQuantityByActionId((previous) => ({
                            ...previous,
                            [action.id]: event.target.value.replace(/[^\d]/g, ""),
                          }))}
                          className="h-10 min-w-0 rounded-l-md px-3 text-right text-sm font-black tabular-nums outline-none disabled:cursor-not-allowed disabled:bg-[#f2f4f6] disabled:text-[#8b95a1]"
                          placeholder="0"
                        />
                        <span className="flex items-center border-l border-[#e5e8eb] px-3 text-xs font-black text-[#6b7684]">주</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSubscribe(action, shareQuantity ?? 0)}
                        disabled={!canSubscribe}
                        className="h-10 shrink-0 rounded-md bg-[#191f28] px-4 text-sm font-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3182f6] disabled:cursor-not-allowed disabled:bg-[#b0b8c1] disabled:opacity-70"
                      >
                        {subscribingActionId === action.id ? "접수 중" : "청약"}
                      </button>
                    </div>
                    <div id={helperId} aria-live="polite" className="mt-2 flex flex-wrap items-start justify-between gap-2 text-xs font-bold text-[#8b95a1]">
                      <span>{helperMessage}</span>
                      <span className={hasInsufficientCash ? "tabular-nums text-[#f04452]" : "tabular-nums text-[#6b7684]"}>
                        {estimatedAmount === null ? "예상 -" : formatWon(estimatedAmount)}
                      </span>
                    </div>
                  </>
                )}
              </article>
            );
          })
        ) : (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">유상증자 이벤트가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function parsePositiveInteger(value: string) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f7f8fa] p-3">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 truncate text-sm font-black tabular-nums text-[#191f28]">{value}</p>
    </div>
  );
}

function ScheduleItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 rounded-md bg-[#f7f8fa] px-2.5 py-2">
      <p className="font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-0.5 truncate font-black tabular-nums text-[#333d4b]">{formatMonthDay(value)}</p>
    </div>
  );
}

function SubscriptionStatusBadge({ state }: { state: CorporateActionSubscriptionState }) {
  const className = state.kind === "ready"
    ? "bg-[#eff6ff] text-[#3182f6]"
    : state.kind === "done"
      ? "bg-[#e8f7ef] text-[#179c52]"
      : state.kind === "waiting"
        ? "bg-[#fff8e6] text-[#8a5a00]"
        : "bg-[#fff3f0] text-[#d34b36]";
  return <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-black ${className}`}>{state.label}</span>;
}
