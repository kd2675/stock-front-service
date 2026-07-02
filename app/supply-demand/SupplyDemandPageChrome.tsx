import Link from "next/link";
import type { ReactNode } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import type { OrderBookInstrument } from "@/app/types/stock";

type SupplyDemandPageChromeProps = {
  children: ReactNode;
  isAdmin: boolean;
  selectedInstrument?: OrderBookInstrument;
  onAdminClick: () => void;
  onClearSelectedInstrument: () => void;
};

export function SupplyDemandPageChrome({
  children,
  isAdmin,
  selectedInstrument,
  onAdminClick,
  onClearSelectedInstrument,
}: SupplyDemandPageChromeProps) {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#191f28]">
      <TradingTopBar
        active="order-book"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/supply-demand/orders" className="inline-flex h-11 items-center rounded-md bg-[#191f28] px-3 text-sm font-bold text-white">
              내 주문
            </Link>
            {isAdmin ? (
              <button type="button" onClick={onAdminClick} className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
                설정 현황
              </button>
            ) : null}
          </div>
        )}
      />

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
    <section className="border-b border-[#e5e8eb] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#3182f6]">LIVE ORDER BOOK</p>
            <h1 className="mt-1 text-2xl font-black">{selectedInstrument ? "자동장 주문" : "자동장 종목 선택"}</h1>
          </div>
          {selectedInstrument ? (
            <button
              type="button"
              onClick={onClearSelectedInstrument}
              className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]"
            >
              종목 목록
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
