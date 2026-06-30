import Link from "next/link";

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

export function AdminTabNav({
  tabs,
  activeTab,
}: {
  tabs: AdminTabItem[];
  activeTab: AdminTab;
}) {
  return (
    <nav className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-2" aria-label="관리자 설정 영역">
      <div className="grid min-w-[760px] grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const active = tab.value === activeTab;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={[
                "min-h-[76px] rounded-md px-3 py-3 text-left transition-colors",
                active
                  ? "border border-[#64a8ff]/60 bg-[#10233a] text-white shadow-[0_0_0_1px_rgba(100,168,255,0.16)]"
                  : "border border-transparent bg-white/[0.04] text-[#b8c2cc] hover:bg-white/[0.07]",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-center justify-between gap-3">
                <span className="truncate text-sm font-black">{tab.label}</span>
              </span>
              <span className="mt-2 block truncate text-xs font-bold text-[#8b95a1]">{tab.description}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminSubTabNav({
  tabs,
  activeSection,
}: {
  tabs: AdminSubTabItem[];
  activeSection: AdminSection;
}) {
  return (
    <nav className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-2" aria-label="관리자 세부 설정 영역">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const active = tab.value === activeSection;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex min-h-11 min-w-[150px] items-center rounded-md px-3 text-sm font-black transition-colors",
                active
                  ? "bg-white text-[#101418]"
                  : "bg-black/20 text-[#b8c2cc] hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
            >
              <span className="min-w-0 truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
