import { formatMarketEnabledStatus } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AutoMarketStatus, OrderBookMarketStatus } from "@/app/types/stock";

type AdminMarketSummaryPanelProps = {
  orderBookMarketSummary: OrderBookMarketStatus | null;
  autoMarketSummary: AutoMarketStatus | null;
  orderBookInstrumentCount: number;
  openOrderBookConfigCount: number;
};

export function AdminMarketSummaryPanel({
  orderBookMarketSummary,
  autoMarketSummary,
  orderBookInstrumentCount,
  openOrderBookConfigCount,
}: AdminMarketSummaryPanelProps) {
  return (
    <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black text-white">시장/종목 요약</h2>
        <span className="text-xs font-bold text-[#8b95a1]">수요와 공급 주문장 기준</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <DarkMetric label="주문장 시장" value={formatMarketEnabledStatus(orderBookMarketSummary)} />
        <DarkMetric label="주문장 종목" value={`${orderBookInstrumentCount.toLocaleString("ko-KR")}종목`} />
        <DarkMetric label="정규장 종목" value={`${openOrderBookConfigCount.toLocaleString("ko-KR")}종목`} />
        <DarkMetric label="주문장 대기 주문" value={orderBookMarketSummary ? `${orderBookMarketSummary.openOrderCount ?? 0}건` : "-"} />
        <DarkMetric label="오늘 주문장 체결" value={orderBookMarketSummary ? `${(orderBookMarketSummary.todayExecutionCount ?? 0).toLocaleString("ko-KR")}건` : "-"} />
        <DarkMetric label="가동 자동 참여자" value={autoMarketSummary ? `${(autoMarketSummary.enabledParticipantCount ?? 0).toLocaleString("ko-KR")}명` : "-"} />
      </div>
    </section>
  );
}
