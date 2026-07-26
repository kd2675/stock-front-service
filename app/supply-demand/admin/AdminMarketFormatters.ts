import { RECURRING_CASH_INTERVAL_UNIT_LABELS } from "@/app/supply-demand/admin/AdminConstants";
import type { RecurringCashIntervalUnit } from "@/app/types/stock";

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
  return value ? RECURRING_CASH_INTERVAL_UNIT_LABELS[value] : "-";
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

export function formatAutoStrategyActivityLevel(intensity: number): string {
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
