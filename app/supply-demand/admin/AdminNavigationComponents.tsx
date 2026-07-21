"use client";

import Link from "next/link";

import { ADMIN_NAVIGATION_GROUPS, findAdminNavigationItem, type AdminSection } from "@/app/navigation/adminNavigation";

export function AdminSidebarNavigation({
  activeSection,
  markCurrent = true,
}: {
  activeSection: AdminSection;
  markCurrent?: boolean;
}) {
  return (
    <nav aria-label="관리자 메뉴" className="space-y-2">
      {ADMIN_NAVIGATION_GROUPS.map((group) => {
        const activeGroup = group.items.some((item) => item.section === activeSection);
        return (
        <details key={group.tab} open={activeGroup || group.items.length === 1} className="group rounded-md border border-transparent open:border-white/[0.07] open:bg-white/[0.025]">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-2 text-[11px] font-black tracking-[0.12em] text-admin-subtle marker:hidden hover:bg-white/[0.04] hover:text-admin-muted">
            <span>{group.label}</span>
            <span aria-hidden="true" className="text-admin-placeholder transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="grid gap-1 px-1 pb-1">
            {group.items.map((item) => {
              const active = item.section === activeSection;
              return (
                <Link
                  key={item.section}
                  href={item.href}
                  aria-current={active && markCurrent ? "page" : undefined}
                  className={[
                    "flex min-h-11 items-center rounded-md border-l-2 px-3 text-sm font-black transition-colors",
                    active
                      ? "border-admin-accent bg-[#132b45] text-white"
                      : "border-transparent text-[#aab4bf] hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </details>
        );
      })}
    </nav>
  );
}

export function AdminMobileNavigation({ activeSection }: { activeSection: AdminSection }) {
  const activeItem = findAdminNavigationItem(activeSection);
  const activeGroup = ADMIN_NAVIGATION_GROUPS.find((group) => group.items.some((item) => item.section === activeSection)) ?? ADMIN_NAVIGATION_GROUPS[0];

  return (
    <details className="admin-mobile-navigation group rounded-lg border border-white/10 bg-admin-surface-raised lg:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-black text-white marker:hidden">
        <span className="min-w-0 truncate">메뉴 · {activeItem.label}</span>
        <span aria-hidden="true" className="shrink-0 text-admin-accent transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-white/10 px-3 pb-4 pt-4">
        <p className="text-[10px] font-black tracking-[0.12em] text-admin-placeholder">업무 영역</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ADMIN_NAVIGATION_GROUPS.map((group) => {
            const active = group.tab === activeGroup.tab;
            return (
              <Link
                key={group.tab}
                href={group.items[0].href}
                className={[
                  "min-h-10 rounded-sm px-3 py-2 text-center text-xs font-black transition",
                  active ? "bg-admin-accent text-admin-canvas" : "bg-white/[0.05] text-admin-muted hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {group.label}
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] font-black tracking-[0.12em] text-admin-placeholder">{activeGroup.label} 메뉴</p>
        <div className="mt-2 grid gap-1">
          {activeGroup.items.map((item) => {
            const active = item.section === activeSection;
            return (
              <Link key={item.section} href={item.href} className={[
                "flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-sm font-black transition",
                active ? "bg-[#132b45] text-white" : "text-admin-muted hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}>
                <span>{item.label}</span>
                {active ? <span className="text-[10px] text-admin-accent">현재</span> : null}
              </Link>
            );
          })}
        </div>
      </div>
    </details>
  );
}
