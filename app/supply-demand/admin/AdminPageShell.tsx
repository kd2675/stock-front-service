import Link from "next/link";
import type { ReactNode } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import {
  ACCOUNT_SUB_TABS,
  ADMIN_TABS,
  AUTOMATION_SUB_TABS,
} from "@/app/supply-demand/admin/AdminNavigationConfig";
import {
  AdminSubTabNav,
  AdminTabNav,
} from "@/app/supply-demand/admin/AdminNavigationComponents";
import type {
  AdminSection,
  AdminTab,
} from "@/app/supply-demand/admin/AdminNavigationConfig";

type AdminAccessStatus = "checking" | "allowed" | "denied";

export function AdminAccessStatusPanel({ status }: { status: AdminAccessStatus }) {
  if (status === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101418] px-4 text-white">
        <p className="text-sm font-bold text-[#b8c2cc]">관리자 권한을 확인하고 있습니다.</p>
      </main>
    );
  }

  if (status === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101418] px-4 text-white">
        <div className="max-w-sm text-center">
          <p className="text-sm font-bold text-[#ffb4a8]">관리자 권한이 필요합니다.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-md bg-white px-3 py-2 text-sm font-black text-[#101418]">
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
  return (
    <main className="min-h-screen bg-[#101418] text-white">
      <TradingTopBar
        active="order-book"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/supply-demand/admin/accounts/participants" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
              참여자 현황
            </Link>
            <Link href="/supply-demand" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
              자동장
            </Link>
          </div>
        )}
      />
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold text-[#64a8ff]">AUTO MARKET CONFIG</p>
            <h1 className="mt-1 text-2xl font-black">자동장 설정 현황</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {message ? <p aria-live="polite" className="rounded-md bg-[#3a1f1b] px-3 py-2 text-sm font-bold text-[#ffb4a8]">{message}</p> : null}

        <AdminTabNav tabs={ADMIN_TABS} activeTab={activeAdminTab} />
        {activeAdminTab === "accounts" ? <AdminSubTabNav tabs={ACCOUNT_SUB_TABS} activeSection={activeAdminSection} /> : null}
        {activeAdminTab === "automation" ? <AdminSubTabNav tabs={AUTOMATION_SUB_TABS} activeSection={activeAdminSection} /> : null}

        {children}
      </section>
    </main>
  );
}
