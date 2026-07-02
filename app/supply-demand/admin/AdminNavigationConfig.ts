export type AdminTab = "market" | "accounts" | "automation" | "events";

export type AdminTabItem = {
  value: AdminTab;
  href: string;
  label: string;
  description: string;
};

export type AdminSection =
  | "market"
  | "account-cash"
  | "cash-flow-ledger"
  | "salary"
  | "profile-overview"
  | "participants"
  | "profiles"
  | "auto-symbols"
  | "listing-auto"
  | "batch"
  | "events";

export type AdminSubTabItem = {
  value: AdminSection;
  href: string;
  label: string;
};

export const ADMIN_TABS: AdminTabItem[] = [
  {
    value: "market",
    href: "/supply-demand/admin/market",
    label: "시장/종목",
    description: "장 상태와 주문장 종목",
  },
  {
    value: "accounts",
    href: "/supply-demand/admin/accounts",
    label: "계좌/참여자",
    description: "유저 현금과 자동참여자",
  },
  {
    value: "automation",
    href: "/supply-demand/admin/automation",
    label: "자동장/배치",
    description: "알고리즘과 배치 제어",
  },
  {
    value: "events",
    href: "/supply-demand/admin/events",
    label: "이벤트/보고서",
    description: "주식 이벤트와 평가 보고서",
  },
];

export const ACCOUNT_SUB_TABS: AdminSubTabItem[] = [
  {
    value: "account-cash",
    href: "/supply-demand/admin/accounts",
    label: "유저 현금",
  },
  {
    value: "cash-flow-ledger",
    href: "/supply-demand/admin/accounts/cash-flows",
    label: "현금 원장",
  },
  {
    value: "salary",
    href: "/supply-demand/admin/accounts/salary",
    label: "월급 대상",
  },
  {
    value: "profile-overview",
    href: "/supply-demand/admin/accounts/profiles",
    label: "프로필 현황",
  },
  {
    value: "participants",
    href: "/supply-demand/admin/accounts/participants",
    label: "자동참여자",
  },
];

export const AUTOMATION_SUB_TABS: AdminSubTabItem[] = [
  {
    value: "profiles",
    href: "/supply-demand/admin/automation",
    label: "프로필",
  },
  {
    value: "auto-symbols",
    href: "/supply-demand/admin/automation/symbols",
    label: "종목 기본값",
  },
  {
    value: "listing-auto",
    href: "/supply-demand/admin/automation/listing-auto",
    label: "상장주관사",
  },
  {
    value: "batch",
    href: "/supply-demand/admin/automation/batch",
    label: "배치 제어",
  },
];

export function resolveAdminTabFromPath(pathname: string | null): AdminTab {
  if (pathname?.startsWith("/supply-demand/admin/accounts")) {
    return "accounts";
  }
  if (pathname?.startsWith("/supply-demand/admin/automation")) {
    return "automation";
  }
  if (pathname?.startsWith("/supply-demand/admin/events")) {
    return "events";
  }
  return "market";
}

export function resolveAdminSectionFromPath(pathname: string | null): AdminSection {
  if (pathname?.startsWith("/supply-demand/admin/accounts/cash-flows")) {
    return "cash-flow-ledger";
  }
  if (pathname?.startsWith("/supply-demand/admin/accounts/participants")) {
    return "participants";
  }
  if (pathname?.startsWith("/supply-demand/admin/accounts/profiles")) {
    return "profile-overview";
  }
  if (pathname?.startsWith("/supply-demand/admin/accounts/salary")) {
    return "salary";
  }
  if (pathname?.startsWith("/supply-demand/admin/accounts")) {
    return "account-cash";
  }
  if (pathname?.startsWith("/supply-demand/admin/automation/symbols")) {
    return "auto-symbols";
  }
  if (pathname?.startsWith("/supply-demand/admin/automation/listing-auto")) {
    return "listing-auto";
  }
  if (pathname?.startsWith("/supply-demand/admin/automation/batch")) {
    return "batch";
  }
  if (pathname?.startsWith("/supply-demand/admin/automation")) {
    return "profiles";
  }
  if (pathname?.startsWith("/supply-demand/admin/events")) {
    return "events";
  }
  return "market";
}
