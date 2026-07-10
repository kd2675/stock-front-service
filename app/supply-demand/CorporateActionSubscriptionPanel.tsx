"use client";

import { useState } from "react";

import { formatMonthDay, formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { CorporateAction, CorporateActionEntitlement } from "@/app/types/stock";

type CorporateActionSubscriptionPanelProps = {
  actions: CorporateAction[];
  availableCash?: number;
  entitlements: CorporateActionEntitlement[];
  isLoading: boolean;
  subscribingActionId: number | null;
  onSubscribe: (actionId: number, shareQuantity: number) => void;
};

export function CorporateActionSubscriptionPanel({
  actions,
  availableCash,
  entitlements,
  isLoading,
  subscribingActionId,
  onSubscribe,
}: CorporateActionSubscriptionPanelProps) {
  const [shareQuantityByActionId, setShareQuantityByActionId] = useState<Record<number, string>>({});
  const subscriptionActions = actions.filter(isCapitalIncreaseSubscriptionVisible);

  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#8b95a1]">CORPORATE ACTION</p>
          <h3 className="mt-1 truncate text-lg font-black">선택 종목 이벤트</h3>
        </div>
        <span className="shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]">
          청약
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">이벤트 조회 중</p>
        ) : subscriptionActions.length ? (
          subscriptionActions.map((action) => {
            const entitlement = entitlements.find((item) => item.actionId === action.id);
            const draftValue = shareQuantityByActionId[action.id] ?? "";
            const shareQuantity = parsePositiveInteger(draftValue);
            const issuePrice = action.issuePrice ?? 0;
            const estimatedAmount = shareQuantity === null || issuePrice <= 0 ? null : shareQuantity * issuePrice;
            const maxShares = resolveMaxSubscribableShares(action, entitlement);
            const status = resolveSubscriptionStatus(action, entitlement, maxShares);
            const hasInsufficientCash = estimatedAmount !== null
              && availableCash !== undefined
              && estimatedAmount > availableCash;
            const helperMessage = hasInsufficientCash
              ? "현금 잔고가 부족합니다."
              : maxShares !== null && shareQuantity !== null && shareQuantity > maxShares
                ? "가능 수량을 초과했습니다."
                : status.message;
            const canSubscribe = status.kind === "ready"
              && shareQuantity !== null
              && shareQuantity > 0
              && (maxShares === null || shareQuantity <= maxShares)
              && !hasInsufficientCash
              && subscribingActionId === null;

            return (
              <div key={action.id} className="rounded-md border border-[#e5e8eb] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#191f28]">{formatOfferingType(action)}</p>
                    <p className="mt-1 text-xs font-bold text-[#8b95a1]">
                      {`${formatMonthDay(action.subscriptionStartDate)} - ${formatMonthDay(action.subscriptionEndDate)}`}
                    </p>
                  </div>
                  <span className={status.className}>{status.label}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <SmallMetric label="발행가" value={formatWon(action.issuePrice)} />
                  <SmallMetric label={action.offeringType === "SHAREHOLDER_ALLOCATION" ? "배정 가능" : "남은 모집"} value={maxShares === null ? "-" : `${formatNumber(maxShares)}주`} />
                </div>

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
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        inputMode="numeric"
                        value={draftValue}
                        onChange={(event) => setShareQuantityByActionId((previous) => ({
                          ...previous,
                          [action.id]: event.target.value.replace(/[^\d]/g, ""),
                        }))}
                        className="h-10 min-w-0 flex-1 rounded-md border border-[#d1d6db] px-3 text-right text-sm font-black tabular-nums outline-none focus:border-[#3182f6]"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => onSubscribe(action.id, shareQuantity ?? 0)}
                        disabled={!canSubscribe}
                        className="h-10 shrink-0 rounded-md bg-[#191f28] px-4 text-sm font-black text-white disabled:bg-[#b0b8c1] disabled:opacity-70"
                      >
                        {subscribingActionId === action.id ? "접수 중" : "청약"}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-[#8b95a1]">
                      <span>{helperMessage}</span>
                      <span className={hasInsufficientCash ? "tabular-nums text-[#f04452]" : "tabular-nums text-[#6b7684]"}>
                        {estimatedAmount === null ? "예상 -" : formatWon(estimatedAmount)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold text-[#8b95a1]">청약 가능한 이벤트 없음</p>
        )}
      </div>
    </div>
  );
}

function isCapitalIncreaseSubscriptionVisible(action: CorporateAction) {
  return action.actionType === "PAID_IN_CAPITAL_INCREASE"
    && (action.offeringType === "SHAREHOLDER_ALLOCATION" || action.offeringType === "PUBLIC_OFFERING")
    && action.status !== "PAID"
    && action.status !== "LISTED";
}

function resolveMaxSubscribableShares(
  action: CorporateAction,
  entitlement: CorporateActionEntitlement | undefined,
) {
  if (action.offeringType === "SHAREHOLDER_ALLOCATION") {
    return entitlement?.shareQuantity ?? 0;
  }
  return action.remainingShareQuantity ?? action.shareQuantity ?? null;
}

function resolveSubscriptionStatus(
  action: CorporateAction,
  entitlement: CorporateActionEntitlement | undefined,
  maxShares: number | null,
) {
  if (entitlement?.status === "SUBSCRIBED") {
    return {
      kind: "done",
      label: "청약 완료",
      message: "이미 접수된 권리입니다.",
      className: "shrink-0 rounded-sm bg-[#e8f7ef] px-2 py-1 text-xs font-black text-[#179c52]",
    } as const;
  }
  if (entitlement?.status === "PAID") {
    return {
      kind: "done",
      label: "지급 완료",
      message: "신주 지급이 완료된 권리입니다.",
      className: "shrink-0 rounded-sm bg-[#e8f7ef] px-2 py-1 text-xs font-black text-[#179c52]",
    } as const;
  }
  if (action.offeringType === "SHAREHOLDER_ALLOCATION" && action.status !== "EX_RIGHTS_APPLIED") {
    return {
      kind: "blocked",
      label: "권리 전",
      message: "권리락 반영 후 청약할 수 있습니다.",
      className: "shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-black text-[#6b7684]",
    } as const;
  }
  if (action.offeringType === "SHAREHOLDER_ALLOCATION" && !entitlement) {
    return {
      kind: "blocked",
      label: "권리 없음",
      message: "배정된 권리가 없습니다.",
      className: "shrink-0 rounded-sm bg-[#fff3f0] px-2 py-1 text-xs font-black text-[#d34b36]",
    } as const;
  }
  if (action.offeringType === "PUBLIC_OFFERING" && maxShares !== null && maxShares <= 0) {
    return {
      kind: "blocked",
      label: "마감",
      message: "남은 모집 수량이 없습니다.",
      className: "shrink-0 rounded-sm bg-[#fff3f0] px-2 py-1 text-xs font-black text-[#d34b36]",
    } as const;
  }
  return {
    kind: "ready",
    label: "접수 가능",
    message: "청약 수량을 입력하세요.",
    className: "shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]",
  } as const;
}

function formatOfferingType(action: CorporateAction) {
  return action.offeringType === "PUBLIC_OFFERING" ? "유상증자 일반공모" : "유상증자 주주배정";
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
