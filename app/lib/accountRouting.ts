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
  return value === "/supply-demand" || value.startsWith("/supply-demand/");
}

export function formatAccountNextLabel(nextPath: string) {
  if (isOrderBookPath(nextPath)) {
    return "수요와 공급 주문 체결";
  }
  return "특정가격 자동주문체결";
}
