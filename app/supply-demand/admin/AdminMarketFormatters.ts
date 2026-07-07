import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import type {
  AutoMarketAssetPreference,
  AutoMarketPriceDirection,
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
  if (status === "CIRCUIT_BREAKER") {
    return "서킷브레이크";
  }
  return status;
}

export function formatAutoIntensityFollowLevel(intensity: number): string {
  if (intensity >= 8) {
    return "매우 적극";
  }
  if (intensity >= 6) {
    return "적극";
  }
  if (intensity <= 3) {
    return "소극";
  }
  return "보통";
}

export function formatAutoMarketPriceDirection(direction: AutoMarketPriceDirection | null | undefined): string {
  if (direction === "UP") {
    return "상승";
  }
  if (direction === "DOWN") {
    return "하락";
  }
  if (direction === "NEUTRAL") {
    return "중립";
  }
  return "-";
}

export function formatAutoMarketAssetPreference(preference: AutoMarketAssetPreference | null | undefined): string {
  if (preference === "STOCK") {
    return "주식 보유";
  }
  if (preference === "CASH") {
    return "현금 전환";
  }
  if (preference === "BALANCED") {
    return "균형";
  }
  return "-";
}

export function formatListingAutoPosition(positionSide: ListingAutoPosition): string {
  if (positionSide === "BUY_ONLY") {
    return "매수 전용";
  }
  return "매도 전용";
}
