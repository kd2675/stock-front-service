import type { ReactNode } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import type { OrderBookInstrument } from "@/app/types/stock";

type SupplyDemandPageChromeProps = {
  children: ReactNode;
  selectedInstrument?: OrderBookInstrument;
};

export function SupplyDemandPageChrome({
  children,
  selectedInstrument,
}: SupplyDemandPageChromeProps) {
  return (
    <main className="min-h-screen bg-stock-surface-muted text-stock-ink">
      <TradingTopBar active="trade" />

      {!selectedInstrument ? <SupplyDemandPageHeader /> : null}

      {children}
    </main>
  );
}

function SupplyDemandPageHeader() {
  return (
    <section className="border-b border-stock-border bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-stock-accent">LIVE ORDER BOOK</p>
            <h1 className="mt-1 text-2xl font-black">자동장 종목 선택</h1>
          </div>
        </div>
      </div>
    </section>
  );
}
