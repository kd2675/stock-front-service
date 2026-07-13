import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type {
  CorporateActionStatus,
  CorporateActionType,
  InstrumentInvestorCategoryFlow,
  MarketSessionStatus,
} from "@/app/types/stock";

export function formatLargeWon(value: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000_000) {
    return `${formatNumber(value / 1_000_000_000_000)}조원`;
  }
  if (absolute >= 100_000_000) {
    return `${formatNumber(value / 100_000_000)}억원`;
  }
  return formatWon(value);
}

export function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${formatNumber(value)}%`;
}

export function formatPercentOrDash(value?: number | null) {
  return value == null || !Number.isFinite(value) ? "-" : `${formatNumber(value)}%`;
}

export function formatSignedPercentOrDash(value?: number | null) {
  return value == null || !Number.isFinite(value) ? "-" : formatSignedPercent(value);
}

export function formatNumberOrDash(value?: number | null, suffix = "") {
  return value == null || !Number.isFinite(value) ? "-" : `${formatNumber(value)}${suffix}`;
}

export function formatSeconds(value?: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "-";
  }
  if (value < 60) {
    return `${formatNumber(value)}초`;
  }
  return `${formatNumber(value / 60)}분`;
}

export function formatSignedWon(value: number) {
  if (value === 0) {
    return "0원";
  }
  return `${value > 0 ? "+" : "-"}${formatWon(Math.abs(value))}`;
}

export function formatMarketStatus(enabled: boolean, status: MarketSessionStatus) {
  if (!enabled) {
    return "시장 정지";
  }
  switch (status) {
    case "OPEN":
      return "정규장";
    case "CLOSED":
      return "장 마감";
    case "HALTED":
      return "거래 정지";
    case "CIRCUIT_BREAKER":
      return "서킷브레이커";
  }
}

export function formatCorporateActionType(actionType: CorporateActionType) {
  switch (actionType) {
    case "INITIAL_ISSUE":
      return "최초 상장";
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
    case "DELISTING":
      return "상장폐지";
  }
}

export function formatCorporateActionStatus(status: CorporateActionStatus) {
  switch (status) {
    case "ANNOUNCED":
      return "예정";
    case "EX_RIGHTS_APPLIED":
      return "권리락 적용";
    case "PAID":
      return "지급·납입 완료";
    case "LISTED":
      return "상장 완료";
    case "DELISTED":
      return "상장폐지 완료";
  }
}

export function formatFlowCategory(category: InstrumentInvestorCategoryFlow["category"]) {
  switch (category) {
    case "MANUAL_PARTICIPANT":
      return "일반 참가자";
    case "AUTO_PARTICIPANT":
      return "자동 참가자";
    case "LISTING_UNDERWRITER":
      return "상장주관사";
  }
}
