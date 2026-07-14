import Link from "next/link";

import { PUBLIC_NAVIGATION_ITEMS, type PublicRouteId } from "@/app/navigation/publicNavigation";

export type MarketMode = PublicRouteId;

export default function MarketModeTabs({ active }: { active: MarketMode }) {
  return (
    <nav aria-label="투자 화면" className="grid grid-cols-5 gap-1 rounded-lg bg-stock-surface-strong p-1">
      {PUBLIC_NAVIGATION_ITEMS.map((tab) => {
        const selected = tab.id === active;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={[
              "flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap rounded-md px-1 py-2 text-center text-[10px] font-black leading-tight transition-colors sm:px-2 sm:text-sm",
              selected
                ? "bg-white text-stock-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-stock-muted hover:bg-white/70 hover:text-stock-text-secondary",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
