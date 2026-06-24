import Link from "next/link";

type MarketMode = "virtual-price" | "order-book";

const MARKET_MODE_TABS: Array<{
  mode: MarketMode;
  href: string;
  label: string;
}> = [
  {
    mode: "virtual-price",
    href: "/virtual-price",
    label: "특정가격 자동주문체결",
  },
  {
    mode: "order-book",
    href: "/supply-demand",
    label: "수요와 공급 주문 체결",
  },
];

export default function MarketModeTabs({ active }: { active: MarketMode }) {
  return (
    <nav aria-label="체결 방식" className="grid grid-cols-2 gap-1 rounded-lg bg-[#f2f4f6] p-1">
      {MARKET_MODE_TABS.map((tab) => {
        const selected = tab.mode === active;

        return (
          <Link
            key={tab.mode}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={[
              "flex min-h-11 min-w-0 items-center justify-center rounded-md px-2 py-2 text-center text-xs font-black leading-tight transition-colors sm:text-sm",
              selected
                ? "bg-white text-[#191f28] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[#6b7684] hover:bg-white/70 hover:text-[#333d4b]",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
