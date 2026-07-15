"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import StockBrandLink from "@/app/components/StockBrandLink";
import { SimulationTimeInline } from "@/app/components/SimulationTimeBadge";
import useAuthSession from "@/app/hooks/useAuthSession";
import { logout } from "@/app/lib/auth";

export function AdminTopBar() {
  const router = useRouter();
  const { user } = useAuthSession();

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-admin-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <StockBrandLink inverse />
          <span className="hidden h-6 w-px bg-white/10 sm:block" />
          <span className="hidden rounded-sm bg-admin-accent/15 px-2 py-1 text-xs font-black text-admin-accent-soft sm:inline-flex">운영 관리</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-44 truncate text-xs font-bold text-stock-subtle md:inline">{user?.username ?? "관리자"}</span>
          <Link href="/trade" className="inline-flex h-11 items-center rounded-md border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-white hover:bg-white/10">
            투자 화면
          </Link>
          <button type="button" onClick={() => void signOut()} className="h-11 rounded-md bg-white px-3 text-xs font-black text-stock-ink hover:bg-stock-surface-strong">
            로그아웃
          </button>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-white/[0.025] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] justify-end">
          <SimulationTimeInline inverse />
        </div>
      </div>
    </header>
  );
}
