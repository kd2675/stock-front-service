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
    <nav aria-label="관리자 메뉴" className="space-y-5">
      {ADMIN_NAVIGATION_GROUPS.map((group) => (
        <section key={group.tab} aria-labelledby={`admin-nav-${group.tab}`}>
          <h2 id={`admin-nav-${group.tab}`} className="px-2 text-[11px] font-black tracking-[0.12em] text-admin-subtle">
            {group.label}
          </h2>
          <div className="mt-1.5 grid gap-1">
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
        </section>
      ))}
    </nav>
  );
}

export function AdminMobileNavigation({ activeSection }: { activeSection: AdminSection }) {
  const activeItem = findAdminNavigationItem(activeSection);

  return (
    <details className="admin-mobile-navigation group rounded-lg border border-white/10 bg-admin-surface-raised lg:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-black text-white marker:hidden">
        <span className="min-w-0 truncate">메뉴 · {activeItem.label}</span>
        <span aria-hidden="true" className="shrink-0 text-admin-accent transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-white/10 px-3 pb-4 pt-4">
        <AdminSidebarNavigation activeSection={activeSection} markCurrent={false} />
      </div>
    </details>
  );
}
