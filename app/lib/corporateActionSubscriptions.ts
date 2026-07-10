import type {
  CapitalIncreaseOfferingType,
  CorporateAction,
  CorporateActionEntitlement,
  SimulationClock,
} from "@/app/types/stock";

export type CapitalIncreaseAction = CorporateAction & {
  actionType: "PAID_IN_CAPITAL_INCREASE";
  offeringType: CapitalIncreaseOfferingType;
};

export type CorporateActionSubscriptionState = {
  kind: "ready" | "waiting" | "blocked" | "done";
  label: string;
  maxShares: number | null;
  message: string;
};

type ResolveCorporateActionSubscriptionStateOptions = {
  action: CapitalIncreaseAction;
  currentDate?: string | null;
  entitlement?: CorporateActionEntitlement;
  entitlementsReady?: boolean;
  marketSession?: SimulationClock["marketSession"] | null;
};

export function isSupportedCapitalIncrease(action: CorporateAction): action is CapitalIncreaseAction {
  return action.actionType === "PAID_IN_CAPITAL_INCREASE"
    && (action.offeringType === "SHAREHOLDER_ALLOCATION" || action.offeringType === "PUBLIC_OFFERING");
}

export function getCapitalIncreaseOfferingLabel(offeringType: CapitalIncreaseOfferingType) {
  return offeringType === "PUBLIC_OFFERING" ? "일반공모" : "주주배정";
}

export function getMaxSubscribableShares(
  action: CapitalIncreaseAction,
  entitlement?: CorporateActionEntitlement,
) {
  if (action.offeringType === "SHAREHOLDER_ALLOCATION") {
    return normalizeNonNegativeInteger(entitlement?.shareQuantity) ?? 0;
  }
  return normalizeNonNegativeInteger(action.remainingShareQuantity);
}

export function resolveCorporateActionSubscriptionState({
  action,
  currentDate,
  entitlement,
  entitlementsReady = true,
  marketSession,
}: ResolveCorporateActionSubscriptionStateOptions): CorporateActionSubscriptionState {
  const maxShares = entitlementsReady ? getMaxSubscribableShares(action, entitlement) : null;

  if (entitlement?.status === "SUBSCRIBED") {
    return subscriptionState("done", "청약 완료", "이미 청약이 접수되었습니다.", maxShares);
  }
  if (entitlement?.status === "PAID") {
    return subscriptionState("done", "지급 완료", "신주 지급이 완료되었습니다.", maxShares);
  }
  if (entitlement?.status === "EXPIRED") {
    return subscriptionState("blocked", "권리 만료", "청약하지 않은 권리가 만료되었습니다.", maxShares);
  }
  if (action.status === "PAID" || action.status === "LISTED" || action.status === "DELISTED") {
    return subscriptionState("blocked", "청약 마감", "청약 접수가 종료된 이벤트입니다.", maxShares);
  }
  if (typeof action.issuePrice !== "number" || !Number.isFinite(action.issuePrice) || action.issuePrice <= 0) {
    return subscriptionState("blocked", "발행가 확인", "서버에 유효한 유상증자 발행가가 등록되지 않았습니다.", maxShares);
  }
  if (entitlementsReady && action.offeringType === "PUBLIC_OFFERING" && maxShares === null) {
    return subscriptionState("blocked", "모집 수량 확인", "서버에서 남은 일반공모 수량을 확인할 수 없습니다.", maxShares);
  }
  if (!isIsoDate(action.subscriptionStartDate) || !isIsoDate(action.subscriptionEndDate)) {
    return subscriptionState("blocked", "일정 확인", "서버에 청약 일정이 등록되지 않았습니다.", maxShares);
  }
  if (!isIsoDate(currentDate)) {
    return subscriptionState("waiting", "시간 확인", "시뮬레이션 날짜를 확인하고 있습니다.", maxShares);
  }
  if (currentDate < action.subscriptionStartDate) {
    return subscriptionState("waiting", "청약 예정", `${action.subscriptionStartDate}부터 청약할 수 있습니다.`, maxShares);
  }
  if (currentDate > action.subscriptionEndDate) {
    return subscriptionState("blocked", "청약 마감", `${action.subscriptionEndDate}에 청약이 마감되었습니다.`, maxShares);
  }
  if (!entitlementsReady) {
    return subscriptionState("waiting", "권리 확인", "내 배정 권리와 기존 청약 이력을 확인하고 있습니다.", maxShares);
  }

  if (action.offeringType === "SHAREHOLDER_ALLOCATION") {
    if (action.status !== "EX_RIGHTS_APPLIED") {
      return subscriptionState("waiting", "권리 반영 전", "권리락 처리 후 배정 권리를 확인할 수 있습니다.", maxShares);
    }
    if (!entitlement) {
      return subscriptionState("blocked", "권리 없음", "기준일 보유 수량에 따라 배정된 청약 권리가 없습니다.", maxShares);
    }
    if (entitlement.status !== "ANNOUNCED") {
      return subscriptionState("blocked", "청약 불가", "현재 권리 상태로는 청약할 수 없습니다.", maxShares);
    }
  } else {
    if (action.status !== "ANNOUNCED") {
      return subscriptionState("blocked", "청약 마감", "현재 이벤트 상태로는 일반공모에 청약할 수 없습니다.", maxShares);
    }
    if (entitlement) {
      return subscriptionState("blocked", "청약 이력 있음", "이 이벤트에는 이미 청약 이력이 있습니다.", maxShares);
    }
  }

  if (maxShares !== null && maxShares <= 0) {
    const message = action.offeringType === "PUBLIC_OFFERING"
      ? "남은 일반공모 수량이 없습니다."
      : "배정된 청약 가능 수량이 없습니다.";
    return subscriptionState("blocked", "가능 수량 없음", message, maxShares);
  }
  if (!marketSession) {
    return subscriptionState("waiting", "장 상태 확인", "현재 장 세션을 확인하고 있습니다.", maxShares);
  }
  if (marketSession !== "AFTER_CLOSE") {
    return subscriptionState("waiting", "장 마감 후", "청약 기간 중 장 마감 후에 접수할 수 있습니다.", maxShares);
  }
  return subscriptionState("ready", "접수 가능", "청약 수량과 예상 납입금을 확인해 주세요.", maxShares);
}

export function isCapitalIncreaseOpen(action: CapitalIncreaseAction, currentDate?: string | null) {
  if (action.status === "PAID" || action.status === "LISTED" || action.status === "DELISTED") {
    return false;
  }
  if (!isIsoDate(currentDate) || !isIsoDate(action.subscriptionStartDate) || !isIsoDate(action.subscriptionEndDate)) {
    return false;
  }
  const statusAllowsSubscription = action.offeringType === "SHAREHOLDER_ALLOCATION"
    ? action.status === "EX_RIGHTS_APPLIED"
    : action.status === "ANNOUNCED";
  return statusAllowsSubscription
    && action.subscriptionStartDate <= currentDate
    && currentDate <= action.subscriptionEndDate;
}

export function getCorporateActionSubscriptionErrorMessage(error: unknown) {
  const fallbackMessage = "기업 이벤트 청약에 실패했습니다.";
  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalizedMessage = message.toLowerCase();
  const mappings: Array<[needle: string, translated: string]> = [
    ["only available after market close", "청약은 장 마감 후에만 접수할 수 있습니다."],
    ["has not started yet", "아직 청약 시작일이 되지 않았습니다."],
    ["already closed", "청약 기간이 이미 종료되었습니다."],
    ["rights are not granted", "주주배정 권리가 아직 반영되지 않았습니다."],
    ["right was not granted", "배정된 주주 청약 권리가 없습니다."],
    ["right is not subscribable", "현재 주주배정 권리 상태로는 청약할 수 없습니다."],
    ["exceeds allocated shareholder rights", "입력 수량이 배정된 주주 청약 권리를 초과합니다."],
    ["public offering shares are insufficient", "남은 일반공모 수량보다 많은 수량을 입력했습니다."],
    ["subscription already exists", "이미 접수된 청약이 있습니다."],
    ["insufficient cash balance", "청약 납입에 필요한 예수금이 부족합니다."],
    ["user account is not opened", "청약하려면 먼저 모의투자 계좌가 필요합니다."],
    ["share quantity must be positive", "청약 수량은 1주 이상이어야 합니다."],
  ];
  return mappings.find(([needle]) => normalizedMessage.includes(needle))?.[1] ?? message;
}

function subscriptionState(
  kind: CorporateActionSubscriptionState["kind"],
  label: string,
  message: string,
  maxShares: number | null,
): CorporateActionSubscriptionState {
  return { kind, label, maxShares, message };
}

function normalizeNonNegativeInteger(value: number | null | undefined) {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function isIsoDate(value: string | null | undefined): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
}
