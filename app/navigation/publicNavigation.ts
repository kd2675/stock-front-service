export type PublicRouteId = "trade" | "orders" | "portfolio" | "research" | "news" | "corporate-actions";

export type PublicNavigationItem = {
  id: PublicRouteId;
  href: string;
  label: string;
};

export const PUBLIC_NAVIGATION_ITEMS: readonly PublicNavigationItem[] = [
  { id: "trade", href: "/trade", label: "주문장" },
  { id: "orders", href: "/orders", label: "내 주문" },
  { id: "portfolio", href: "/portfolio", label: "내 자산" },
  { id: "research", href: "/research", label: "종목 분석" },
  { id: "news", href: "/news", label: "시장 뉴스" },
  { id: "corporate-actions", href: "/corporate-actions", label: "기업 이벤트" },
];

export function resolvePublicRouteId(pathname: string): PublicRouteId {
  if (pathname.startsWith("/orders")) {
    return "orders";
  }
  if (pathname.startsWith("/portfolio")) {
    return "portfolio";
  }
  if (pathname.startsWith("/research")) {
    return "research";
  }
  if (pathname.startsWith("/corporate-actions")) {
    return "corporate-actions";
  }
  if (pathname.startsWith("/news")) {
    return "news";
  }
  return "trade";
}
