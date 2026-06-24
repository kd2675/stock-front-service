"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import MarketModeTabs from "@/app/components/MarketModeTabs";
import useAuthSession from "@/app/hooks/useAuthSession";
import { clearAccessToken, logout } from "@/app/lib/auth";

type MarketMode = "virtual-price" | "order-book";

export default function TradingTopBar({ active, actions }: { active: MarketMode; actions?: ReactNode }) {
  const router = useRouter();
  const { user } = useAuthSession();

  const signOut = async () => {
    try {
      await logout();
    } finally {
      clearAccessToken();
      router.replace("/login");
    }
  };

  return (
    <div className="sticky top-0 z-30 border-b border-[#e5e8eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0 lg:w-[min(540px,50vw)]">
          <MarketModeTabs active={active} />
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 lg:justify-end">
          <div className="flex min-w-0 items-center gap-2 rounded-md bg-[#f2f4f6] px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-[#3182f6] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {initialOf(user?.username)}
            </div>
            <div className="min-w-0">
              <p className="max-w-[140px] truncate text-sm font-black text-[#191f28] sm:max-w-[180px]">{user?.username ?? "사용자"}</p>
              <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-bold text-[#6b7684]">
                <span className="shrink-0">{user?.role ?? "USER"}</span>
                <span className="text-[#d1d6db]">/</span>
                <span className="max-w-[120px] truncate sm:max-w-[170px]">{user?.userKey ?? "-"}</span>
              </div>
            </div>
          </div>

          {actions}

          <button type="button" onClick={() => void signOut()} className="h-11 rounded-md bg-[#191f28] px-3 text-sm font-bold text-white">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

function initialOf(username?: string | null) {
  const value = username?.trim();
  if (!value) {
    return "U";
  }
  return value.slice(0, 1).toUpperCase();
}
