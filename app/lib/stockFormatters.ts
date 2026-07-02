import {
  formatKoKrInteger,
  formatKoKrMonthDay,
  formatKoKrMonthDayTime,
  formatKoKrMonthDayTimeSecond,
  formatKoKrNumber,
  formatKoKrTimeSecond,
} from "@/app/lib/localeFormatters";
import type { Order } from "@/app/types/stock";

export function formatWon(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "-";
  }
  return `${formatKoKrInteger(Math.round(value))}원`;
}

export function formatNumber(value: number) {
  return formatKoKrNumber(value);
}

export function formatRoundedPrice(value: number) {
  return formatKoKrInteger(Math.round(value));
}

export function formatRoundedPriceOrDash(value?: number | null) {
  if (value === undefined || value === null || value <= 0) {
    return "-";
  }
  return formatRoundedPrice(value);
}

export function formatMonthDay(value?: string | null) {
  const date = parseDisplayDate(value, { dateOnlyAsStartOfDay: true });
  if (!date) {
    return value || "-";
  }
  return formatKoKrMonthDay(date);
}

export function formatMonthDayTime(value?: string | null) {
  const date = parseDisplayDate(value);
  if (!date) {
    return value || "-";
  }
  return formatKoKrMonthDayTime(date);
}

export function formatMonthDayTimeSecond(value?: string | null) {
  const date = parseDisplayDate(value);
  if (!date) {
    return value || "-";
  }
  return formatKoKrMonthDayTimeSecond(date);
}

export function formatTimeSecond(value?: string | null) {
  const date = parseDisplayDate(value);
  if (!date) {
    return value || "-";
  }
  return formatKoKrTimeSecond(date);
}

export function formatDateTimeMinute(value?: string | null) {
  const date = parseDisplayDate(value);
  if (!date) {
    return value || "-";
  }
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function formatOrderStatus(status: Order["status"]) {
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

export function formatOrderPrice(order: Pick<Order, "averageFillPrice" | "limitPrice">) {
  if (order.limitPrice !== undefined && order.limitPrice !== null) {
    return formatWon(order.limitPrice);
  }
  if (order.averageFillPrice !== undefined && order.averageFillPrice !== null) {
    return formatWon(order.averageFillPrice);
  }
  return "시장가";
}

function parseDisplayDate(value: string | null | undefined, options?: { dateOnlyAsStartOfDay?: boolean }) {
  if (!value) {
    return null;
  }

  const normalizedValue = options?.dateOnlyAsStartOfDay && !value.includes("T")
    ? `${value}T00:00:00`
    : value.includes("T")
      ? value
      : value.replace(" ", "T");
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}
