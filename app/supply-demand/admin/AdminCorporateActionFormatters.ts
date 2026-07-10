import { formatCount, formatWon } from "@/app/supply-demand/admin/AdminNumberFormatters";
import type {
  CorporateAction,
  CorporateActionStatus,
  CorporateActionType,
} from "@/app/types/stock";

export function formatCorporateActionType(actionType: CorporateActionType): string {
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
    const offering = action.actionType === "PAID_IN_CAPITAL_INCREASE"
      ? ` · ${action.offeringType === "PUBLIC_OFFERING" ? "일반공모" : "주주배정"}`
      : "";
    return `${formatCount(action.shareQuantity, "주")}${issuePrice}${offering}`;
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
    action.subscriptionStartDate && action.subscriptionEndDate ? `청약 ${action.subscriptionStartDate}~${action.subscriptionEndDate}` : null,
    action.paymentDate ? `지급 ${action.paymentDate}` : null,
    action.listingDate ? `상장 ${action.listingDate}` : null,
    action.delistingDate ? `폐지 ${action.delistingDate}` : null,
  ].filter(Boolean);
  return dates.length ? dates.join(" / ") : "-";
}
