export type AdminTab = "dashboard" | "market" | "funds" | "participants" | "corporate" | "system";

export type AdminSection =
  | "dashboard"
  | "market-instruments"
  | "market-auto-market"
  | "market-liquidity"
  | "market-flows"
  | "funds-accounts"
  | "funds-ledger"
  | "funds-payroll"
  | "participants-overview"
  | "participants-list"
  | "participants-institutions"
  | "participants-dormant"
  | "participants-profiles"
  | "corporate-instruments"
  | "corporate-underwriting"
  | "corporate-actions"
  | "corporate-history"
  | "corporate-reports"
  | "system-eod"
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
      { section: "dashboard", href: "/admin", label: "운영 현황", description: "시뮬레이션 시각과 장 상태, 자동장 핵심 상태를 한눈에 확인합니다." },
    ],
  },
  {
    tab: "market",
    label: "시장 운영",
    items: [
      { section: "market-instruments", href: "/admin/market/instruments", label: "종목·장 상태", description: "종목별 거래 상태와 가격 제한을 확인하고 제어합니다." },
      { section: "market-auto-market", href: "/admin/market/auto-market", label: "종목별 자동장", description: "종목별 자동 주문 생성, 주문 상한, TTL과 시장 압력 분포를 관리합니다." },
      { section: "market-liquidity", href: "/admin/market/liquidity", label: "유동성 공급", description: "전용 LP 계약·재고·일일 한도와 전환 전 상장주관사 레거시 정책을 분리해 점검합니다." },
      { section: "market-flows", href: "/admin/market/flows", label: "시장 흐름", description: "전체 계좌 자산과 참여자별 체결, 종목별 거래·현금 흐름을 확인합니다." },
    ],
  },
  {
    tab: "funds",
    label: "계좌·자금",
    items: [
      { section: "funds-accounts", href: "/admin/funds/accounts", label: "유저 계좌 자금", description: "로그인 유저의 모의투자 계좌를 조회하고 현금을 입금·회수합니다." },
      { section: "funds-ledger", href: "/admin/funds/ledger", label: "현금 원장", description: "모든 계좌의 입금·회수·배당·정기 자금 원장을 조회합니다." },
      { section: "funds-payroll", href: "/admin/funds/payroll", label: "정기 자금", description: "자동 참여자의 지급 대상과 야간 정기 자금 실행 상태를 관리합니다." },
    ],
  },
  {
    tab: "participants",
    label: "시장 참여자",
    items: [
      { section: "participants-overview", href: "/admin/participants/overview", label: "프로필별 현황", description: "프로필별 계좌·자산·보유·주문·체결 성과를 요약합니다." },
      { section: "participants-list", href: "/admin/participants/list", label: "참여자 관리", description: "자동 참여자 계정을 조회·등록·대량 생성하고 개별 종목 전략을 관리합니다." },
      { section: "participants-institutions", href: "/admin/participants/institutions", label: "기관 포트폴리오", description: "축소 시장용 기관의 AUM·목표 비중·shadow 결정과 위험 예산을 검증합니다." },
      { section: "participants-dormant", href: "/admin/participants/dormant", label: "휴면 자산", description: "탈퇴한 자동 참여자의 계좌·현금·보유주식·예약·전략과 마지막 활동 원장을 조회합니다." },
      { section: "participants-profiles", href: "/admin/participants/profiles", label: "프로필 정책", description: "프로필별 주문 행동과 가격 반응, 보유·자금 정책을 설정합니다." },
    ],
  },
  {
    tab: "corporate",
    label: "기업 관리",
    items: [
      { section: "corporate-instruments", href: "/admin/corporate/instruments", label: "신규 상장", description: "신규 종목의 발행량과 축소시장 유통·잠금 배정을 생성합니다." },
      { section: "corporate-underwriting", href: "/admin/corporate/underwriting", label: "인수 계약", description: "종목별 인수기관 계정, 유통·잠금 배정원장과 수량 대사를 확인합니다." },
      { section: "corporate-actions", href: "/admin/corporate/actions", label: "기업 이벤트 등록", description: "증자·배당·분할·상장폐지의 일정과 처리 조건을 등록합니다." },
      { section: "corporate-history", href: "/admin/corporate/history", label: "이벤트 처리 이력", description: "종목별 기업 이벤트의 진행 상태와 처리 결과를 조회합니다." },
      { section: "corporate-reports", href: "/admin/corporate/reports", label: "종목 보고서", description: "투자자에게 공개하고 자동장 신호에 반영할 종목 보고서를 관리합니다." },
    ],
  },
  {
    tab: "system",
    label: "시스템",
    items: [
      { section: "system-eod", href: "/admin/system/eod", label: "장마감 운영", description: "거래일 원장 동결, 정산, 야간 후처리와 다음 장 준비 상태를 확인합니다." },
      { section: "system-jobs", href: "/admin/system/jobs", label: "배치·작업", description: "배치별 자동 실행 상태를 확인하고 허용된 수동 작업을 제어합니다." },
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
