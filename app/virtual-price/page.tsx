"use client";

import { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import TradingTopBar from "@/app/components/TradingTopBar";

import { VirtualPriceWorkspace } from "./VirtualPriceWorkspace";
import { useVirtualPricePageModel } from "./useVirtualPricePageModel";

export default function Home() {
  const { refreshAll, refreshing, statusMessage, workspaceProps } = useVirtualPricePageModel();

  if (statusMessage) {
    return <TradingStatusScreen backgroundClassName="bg-[#f6f7f9]">{statusMessage}</TradingStatusScreen>;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#191f28]">
      <TradingTopBar
        active="virtual-price"
        actions={(
          <button type="button" onClick={() => void refreshAll()} disabled={refreshing} className="h-11 rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b] disabled:cursor-wait disabled:opacity-60">
            {refreshing ? "갱신 중" : "새로고침"}
          </button>
        )}
      />

      <VirtualPriceWorkspace {...workspaceProps} />
    </main>
  );
}
