export function buildAccountRequiredPath(nextPath: string) {
  return `/account-required?next=${encodeURIComponent(sanitizeAccountNextPath(nextPath))}`;
}

export function sanitizeAccountNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }
  if (value.startsWith("/login") || value.startsWith("/account-required")) {
    return "/";
  }
  return value;
}

export function isOrderBookPath(value: string) {
  return value === "/trade" || value === "/orders";
}

export function formatAccountNextLabel(nextPath: string) {
  if (isOrderBookPath(nextPath)) {
    return nextPath.startsWith("/orders") ? "내 주문" : "주문장";
  }
  if (nextPath.startsWith("/portfolio")) {
    return "내 자산";
  }
  if (nextPath.startsWith("/corporate-actions")) {
    return "기업 이벤트";
  }
  if (nextPath.startsWith("/research")) {
    return "종목 분석";
  }
  return "투자 화면";
}
