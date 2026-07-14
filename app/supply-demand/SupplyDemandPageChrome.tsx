import type { ReactNode } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import type { OrderBookInstrument } from "@/app/types/stock";

type SupplyDemandPageChromeProps = {
  children: ReactNode;
  selectedInstrument?: OrderBookInstrument;
  onClearSelectedInstrument: () => void;
};

export function SupplyDemandPageChrome({
  children,
  selectedInstrument,
  onClearSelectedInstrument,
}: SupplyDemandPageChromeProps) {
  return (
    <main className="min-h-screen bg-stock-surface-muted text-stock-ink">
      <TradingTopBar active="trade" />

      <SupplyDemandPageHeader
        selectedInstrument={selectedInstrument}
        onClearSelectedInstrument={onClearSelectedInstrument}
      />

      {children}
    </main>
  );
}

function SupplyDemandPageHeader({
  selectedInstrument,
  onClearSelectedInstrument,
}: {
  selectedInstrument?: OrderBookInstrument;
  onClearSelectedInstrument: () => void;
}) {
  return (
    <section className="border-b border-stock-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-stock-accent">LIVE ORDER BOOK</p>
            <h1 className="mt-1 text-2xl font-black">{selectedInstrument ? "자동장 주문" : "자동장 종목 선택"}</h1>
          </div>
          {selectedInstrument ? (
            <button
              type="button"
              onClick={onClearSelectedInstrument}
              className="h-11 rounded-md bg-stock-surface-strong px-3 text-sm font-bold text-stock-text-secondary"
            >
              종목 목록
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
