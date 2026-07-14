import Link from "next/link";

export default function StockBrandLink({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stock-accent">
      <span className={inverse ? "grid size-9 place-items-center rounded-md bg-white text-sm font-black text-stock-ink" : "grid size-9 place-items-center rounded-md bg-stock-ink text-sm font-black text-white"}>
        SQ
      </span>
      <span className="min-w-0">
        <span className={inverse ? "block text-sm font-black text-white" : "block text-sm font-black text-stock-ink"}>StockQ</span>
        <span className={inverse ? "block text-[10px] font-bold text-stock-subtle" : "block text-[10px] font-bold text-stock-muted"}>MOCK MARKET</span>
      </span>
    </Link>
  );
}
