export type AdminTab = "dashboard" | "market" | "funds" | "participants" | "corporate" | "system";

export type AdminSection =
  | "dashboard"
  | "market-instruments"
  | "market-flows"
  | "market-liquidity"
  | "funds-accounts"
  | "funds-ledger"
  | "funds-payroll"
  | "participants-overview"
  | "participants-list"
  | "participants-profiles"
  | "participants-symbols"
  | "corporate-instruments"
  | "corporate-actions"
  | "corporate-history"
  | "corporate-reports"
  | "system-jobs";

export type AdminNavigationItem = {
  section: AdminSection;
  href: string;
  label: string;
  description: string;
};

export type AdminNavigationGroup = {
  tab: AdminTab;
  label: string;
  items: readonly AdminNavigationItem[];
};

export const ADMIN_NAVIGATION_GROUPS: readonly AdminNavigationGroup[] = [
  {
    tab: "dashboard",
    label: "대시보드",
    items: [
      { section: "dashboard", href: "/admin", label: "운영 현황", description: "시장과 자동장 핵심 상태를 확인합니다." },
    ],
  },
  {
    tab: "market",
    label: "시장 운영",
    items: [
      { section: "market-instruments", href: "/admin/market/instruments", label: "종목·장 상태", description: "종목별 장 상태와 가격 제한을 관리합니다." },
      { section: "market-flows", href: "/admin/market/flows", label: "시장 자금 흐름", description: "주문·체결·기업 이벤트 자금 흐름을 봅니다." },
      { section: "market-liquidity", href: "/admin/market/liquidity", label: "유동성 공급", description: "상장주관사 자동계정의 호가 공급을 관리합니다." },
    ],
  },
  {
    tab: "funds",
    label: "계좌·자금",
    items: [
      { section: "funds-accounts", href: "/admin/funds/accounts", label: "계좌 현금", description: "사용자 계좌의 현금과 자금 흐름을 확인합니다." },
      { section: "funds-ledger", href: "/admin/funds/ledger", label: "현금 원장", description: "전체 현금 변동 원장을 조회합니다." },
      { section: "funds-payroll", href: "/admin/funds/payroll", label: "월급 지급", description: "월급 대상과 수동 지급 실행 상태를 관리합니다." },
    ],
  },
  {
    tab: "participants",
    label: "자동참여자",
    items: [
      { section: "participants-overview", href: "/admin/participants/overview", label: "프로필 현황", description: "프로필별 계좌와 성과를 요약합니다." },
      { section: "participants-list", href: "/admin/participants/list", label: "참여자 목록", description: "자동참여자 계정과 개별 전략을 관리합니다." },
      { section: "participants-profiles", href: "/admin/participants/profiles", label: "프로필 정책", description: "프로필별 기본 성향과 주문 정책을 설정합니다." },
      { section: "participants-symbols", href: "/admin/participants/symbols", label: "종목별 자동장", description: "종목별 주문 수량과 랜덤 분포를 설정합니다." },
    ],
  },
  {
    tab: "corporate",
    label: "기업 관리",
    items: [
      { section: "corporate-instruments", href: "/admin/corporate/instruments", label: "신규 상장", description: "신규 종목과 상장주관사 계정을 생성합니다." },
      { section: "corporate-actions", href: "/admin/corporate/actions", label: "기업 이벤트", description: "증자·배당·분할·상장폐지를 등록합니다." },
      { section: "corporate-history", href: "/admin/corporate/history", label: "이벤트 이력", description: "종목별 기업 이벤트 처리 상태를 조회합니다." },
      { section: "corporate-reports", href: "/admin/corporate/reports", label: "종목 보고서", description: "투자자에게 공개할 종목 보고서를 관리합니다." },
    ],
  },
  {
    tab: "system",
    label: "시스템",
    items: [
      { section: "system-jobs", href: "/admin/system/jobs", label: "배치·작업", description: "배치 가동 여부와 수동 작업을 제어합니다." },
    ],
  },
];

const ADMIN_ITEMS = ADMIN_NAVIGATION_GROUPS.flatMap((group) => group.items);

export function resolveAdminSectionFromPath(pathname: string | null): AdminSection {
  const normalizedPath = pathname?.replace(/\/$/, "") || "/admin";
  const match = [...ADMIN_ITEMS]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`));
  return match?.section ?? "dashboard";
}

export function resolveAdminTabFromSection(section: AdminSection): AdminTab {
  return ADMIN_NAVIGATION_GROUPS.find((group) => group.items.some((item) => item.section === section))?.tab ?? "dashboard";
}

export function resolveAdminTabFromPath(pathname: string | null): AdminTab {
  return resolveAdminTabFromSection(resolveAdminSectionFromPath(pathname));
}

export function findAdminNavigationItem(section: AdminSection): AdminNavigationItem {
  return ADMIN_ITEMS.find((item) => item.section === section) ?? ADMIN_ITEMS[0];
}
