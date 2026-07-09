import {
  formatKoKrFixedTwo,
  formatKoKrInteger,
  formatKoKrMaxOne,
} from "@/app/lib/localeFormatters";
import { formatMonthDay, formatMonthDayTimeSecond, formatWon } from "@/app/lib/stockFormatters";
import type { CorporateActionEntitlement, CorporateActionType, Execution, Instrument, Order, Price } from "@/app/types/stock";

export function formatCompactWon(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  if (abs >= 1_000_000_000_000) {
    return `${sign}${formatCompactUnit(abs / 1_000_000_000_000)}조원`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${formatCompactUnit(abs / 100_000_000)}억원`;
  }
  if (abs >= 10_000) {
    return `${sign}${formatKoKrInteger(Math.round(abs / 10_000))}만원`;
  }
  return `${sign}${formatKoKrInteger(abs)}원`;
}

function formatCompactUnit(value: number): string {
  return value >= 100 ? formatKoKrInteger(Math.round(value)) : formatKoKrMaxOne(value);
}

export function resolveSelectedSymbol(currentSymbol: string, instruments: Instrument[], prices: Price[]): string {
  const availableSymbols = new Set([
    ...prices.map((price) => price.symbol),
    ...instruments.map((instrument) => instrument.symbol),
  ]);
  if (currentSymbol && availableSymbols.has(currentSymbol)) {
    return currentSymbol;
  }
  return prices[0]?.symbol ?? instruments[0]?.symbol ?? "";
}

export function generateClientOrderId(): string {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function formatNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "0.00";
  }
  return formatKoKrFixedTwo(value);
}

export function formatSignedWon(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatWon(value)}`;
}

export function orderStatusClassName(status: Order["status"]): string {
  switch (status) {
    case "PENDING":
      return "bg-[#f2f4f6] text-[#4e5968]";
    case "PARTIALLY_FILLED":
      return "bg-[#fff4d6] text-[#8b5d00]";
    case "FILLED":
      return "bg-[#e8f7ef] text-[#008a5a]";
    case "CANCELLED":
      return "bg-[#e5e8eb] text-[#6b7684]";
    case "REJECTED":
      return "bg-[#ffecee] text-[#f04452]";
  }
}

export function formatDate(value?: string | null): string {
  return formatMonthDay(value);
}

export function formatDateTime(value?: string | null): string {
  return formatMonthDayTimeSecond(value);
}

export function formatExecutionSource(source: Execution["source"]): string {
  if (source === "INTERNAL_ORDER_BOOK") {
    return "오더북";
  }
  return "현재가";
}

export function formatCorporateActionType(actionType?: CorporateActionType | null): string {
  switch (actionType) {
    case "INITIAL_ISSUE":
      return "초기 발행";
    case "PAID_IN_CAPITAL_INCREASE":
      return "유상증자";
    case "STOCK_SPLIT":
      return "액면분할";
    case "CASH_DIVIDEND":
      return "현금배당";
    case "BONUS_ISSUE":
      return "무상증자";
    case "STOCK_DIVIDEND":
      return "주식배당";
    default:
      return "기업 이벤트";
  }
}

export function formatEntitlementStatus(status: CorporateActionEntitlement["status"]): string {
  return status === "PAID" ? "지급 완료" : "지급 예정";
}

export function formatEntitlementValue(entitlement: CorporateActionEntitlement): string {
  if (entitlement.cashAmount !== undefined && entitlement.cashAmount !== null) {
    return `현금 ${formatWon(entitlement.cashAmount)}`;
  }
  if (entitlement.shareQuantity !== undefined && entitlement.shareQuantity !== null) {
    return `신주 ${formatKoKrInteger(entitlement.shareQuantity)}주`;
  }
  return "배정 수량 확인 중";
}
