import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import type {
  BatchJobRuntimeStatus,
  CorporateAction,
  CorporateActionStatus,
  CorporateActionType,
  InstrumentReport,
  ListingAutoPosition,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";

export function formatWon(value: number | null | undefined) {
  const normalizedValue = Number.isFinite(value) ? Number(value) : 0;
  return `${Math.round(normalizedValue).toLocaleString("ko-KR")}원`;
}

export function formatNumber(value: number | null | undefined) {
  const normalizedValue = Number.isFinite(value) ? Number(value) : 0;
  return normalizedValue.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

export function formatMarketEnabledStatus(status: { enabled: boolean; configCount?: number; configs: unknown[] } | null) {
  if (!status) {
    return "-";
  }
  if ((status.configCount ?? status.configs.length) === 0) {
    return "미등록";
  }
  return status.enabled ? "가동" : "정지";
}

export function formatRecurringCashIntervalUnit(value: RecurringCashIntervalUnit | null | undefined) {
  return RECURRING_CASH_INTERVAL_UNIT_OPTIONS.find((option) => option.value === value)?.label ?? "-";
}

export function formatAccountStatus(status: string | null) {
  if (status === null) {
    return "확인 필요";
  }
  if (status === "ACTIVE") {
    return "ACTIVE";
  }
  return status;
}

export function formatFlowMarketStatus(status: string) {
  if (status === "OPEN") {
    return "정규장";
  }
  if (status === "CLOSED") {
    return "마감";
  }
  if (status === "HALTED") {
    return "거래정지";
  }
  return status;
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}%`;
}

export function formatRuntimeUpdateMessage(label: string, requestedRuntimeEnabled: boolean, effectiveEnabled: boolean) {
  if (!requestedRuntimeEnabled) {
    return `${label}을 중지했습니다.`;
  }
  if (!effectiveEnabled) {
    return `${label} DB 런타임은 ON이지만 배치 서버 설정이 OFF라 자동 실행은 아직 스킵됩니다.`;
  }
  return `${label}을 재개했습니다.`;
}

export function formatRuntimeReason(control: Pick<BatchJobRuntimeStatus, "schedulerConfigured" | "runtimeEnabled" | "effectiveEnabled">) {
  if (control.effectiveEnabled) {
    return "스케줄러 설정과 DB 런타임이 모두 ON입니다.";
  }
  if (!control.schedulerConfigured && control.runtimeEnabled) {
    return "배치 서버 설정이 OFF라 DB ON이어도 자동 실행하지 않습니다.";
  }
  if (control.schedulerConfigured && !control.runtimeEnabled) {
    return "DB 런타임이 OFF라 스케줄러가 실행을 건너뜁니다.";
  }
  return "배치 서버 설정과 DB 런타임이 모두 OFF입니다.";
}

export function formatAutoIntensityDirection(intensity: number): string {
  if (intensity >= 8) {
    return "강한 상승";
  }
  if (intensity >= 6) {
    return "상승";
  }
  if (intensity <= 3) {
    return "하락";
  }
  return "중립";
}

export function formatListingAutoPosition(positionSide: ListingAutoPosition): string {
  if (positionSide === "BUY_ONLY") {
    return "매수 전용";
  }
  return "매도 전용";
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCashFlowReason(reason: string) {
  switch (reason) {
    case "OPENING_GRANT":
      return "계좌 개설 지급";
    case "ADMIN_DEPOSIT":
      return "관리자 입금";
    case "ADMIN_WITHDRAW":
      return "관리자 회수";
    case "DIVIDEND_PAYMENT":
      return "배당 지급";
    case "AUTO_PROFILE_RECURRING_DEPOSIT":
      return "프로필 정기 지급";
    case "AUTO_PARTICIPANT_RECURRING_DEPOSIT":
      return "자동 참여자 정기 지급";
    default:
      return reason;
  }
}

export function formatCorporateActionType(actionType: CorporateActionType): string {
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
    case "DELISTING":
      return "상장폐지";
  }
}

export function formatCorporateActionStatus(status: CorporateActionStatus): string {
  switch (status) {
    case "ANNOUNCED":
      return "공시";
    case "EX_RIGHTS_APPLIED":
      return "권리락 반영";
    case "PAID":
      return "지급 완료";
    case "LISTED":
      return "상장 반영";
    case "DELISTED":
      return "상장폐지";
  }
}

export function formatCorporateActionValue(action: CorporateAction): string {
  if (action.actionType === "STOCK_SPLIT") {
    return `${action.splitFrom ?? "-"}:${action.splitTo ?? "-"}`;
  }
  if (action.actionType === "CASH_DIVIDEND") {
    return formatWon(action.dividendAmount ?? 0);
  }
  if (action.actionType === "DELISTING") {
    return action.delistingTreatment === "ZERO_VALUE" ? "가치 0원 처리" : "상장폐지";
  }
  if (action.shareQuantity) {
    const issuePrice = action.issuePrice ? ` · ${formatWon(action.issuePrice)}` : "";
    return `${action.shareQuantity.toLocaleString("ko-KR")}주${issuePrice}`;
  }
  return "-";
}

export function formatCorporateActionPrice(action: CorporateAction): string {
  if (action.actionType === "CASH_DIVIDEND") {
    return "가격 조정 없음";
  }
  if (!action.basePrice || !action.theoreticalExRightsPrice) {
    return "-";
  }
  return `${formatWon(action.basePrice)} -> ${formatWon(action.theoreticalExRightsPrice)}`;
}

export function formatCorporateActionSchedule(action: CorporateAction): string {
  const dates = [
    action.exRightsDate ? `권리락 ${action.exRightsDate}` : null,
    action.paymentDate ? `지급 ${action.paymentDate}` : null,
    action.listingDate ? `상장 ${action.listingDate}` : null,
    action.delistingDate ? `폐지 ${action.delistingDate}` : null,
  ].filter(Boolean);
  return dates.length ? dates.join(" / ") : "-";
}

export function formatReportEventType(eventType: InstrumentReport["eventType"]): string {
  switch (eventType) {
    case "PUBLISH":
      return "발행";
    case "UPDATE":
      return "수정";
    case "DELETE":
      return "삭제";
  }
}
