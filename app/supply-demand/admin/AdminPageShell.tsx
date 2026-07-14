import Link from "next/link";
import type { ReactNode } from "react";

import { findAdminNavigationItem } from "@/app/navigation/adminNavigation";
import {
  AdminMobileNavigation,
  AdminSidebarNavigation,
} from "@/app/supply-demand/admin/AdminNavigationComponents";
import type {
  AdminSection,
  AdminTab,
} from "@/app/supply-demand/admin/AdminNavigationConfig";
import { AdminTopBar } from "@/app/supply-demand/admin/AdminTopBar";

type AdminAccessStatus = "checking" | "allowed" | "denied";

export function AdminAccessStatusPanel({ status }: { status: AdminAccessStatus }) {
  if (status === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-admin-canvas px-4 text-white">
        <p className="text-sm font-bold text-admin-muted">관리자 권한을 확인하고 있습니다.</p>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-admin-canvas px-4 text-white">
        <div className="max-w-sm text-center">
          <p className="text-sm font-bold text-admin-danger">관리자 권한이 필요합니다.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-md bg-white px-3 py-2 text-sm font-black text-admin-canvas">
            로그인
          </Link>
        </div>
      </main>
    );
  }

  return null;
}

export function AdminPageShell({
  activeAdminSection,
  activeAdminTab,
  children,
  message,
}: {
  activeAdminSection: AdminSection;
  activeAdminTab: AdminTab;
  children: ReactNode;
  message: string | null;
}) {
  const activeItem = findAdminNavigationItem(activeAdminSection);

  return (
    <main className="admin-surface min-h-screen bg-admin-canvas text-white">
      <AdminTopBar />
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-7">
        <aside className="hidden min-w-0 border-r border-white/10 pr-5 lg:block">
          <div className="pb-6 pr-2">
            <AdminSidebarNavigation activeSection={activeAdminSection} />
          </div>
        </aside>

        <section className="min-w-0">
          <AdminMobileNavigation activeSection={activeAdminSection} />
          <header className="border-b border-white/10 pb-5 pt-5 lg:pt-0">
            <p className="text-xs font-black tracking-[0.16em] text-admin-accent">ADMIN · {activeAdminTab.toUpperCase()}</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{activeItem.label}</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-stock-subtle">{activeItem.description}</p>
          </header>

          {message ? <p role="alert" aria-live="polite" className="mt-5 rounded-md border border-admin-danger/25 bg-admin-danger-surface px-3 py-3 text-sm font-bold text-admin-danger">{message}</p> : null}

          <div className="min-w-0 pt-1">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
