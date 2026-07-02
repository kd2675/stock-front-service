import Link from "next/link";

import type {
  AdminSection,
  AdminSubTabItem,
  AdminTab,
  AdminTabItem,
} from "@/app/supply-demand/admin/AdminNavigationConfig";

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
