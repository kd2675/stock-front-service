import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import type {
  ListingAutoPosition,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";

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
