import { calculateChangeRate } from "@/app/lib/priceMath";
import { formatKoKrTimeSecond } from "@/app/lib/localeFormatters";
import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import { formatEffectiveMarketSessionStatus } from "@/app/supply-demand/SupplyDemandFormatters";
import type { AutoMarketConfig, OrderBookInstrument, SymbolMarketConfig } from "@/app/types/stock";

export type InstrumentSummary = {
  instrument: OrderBookInstrument;
  autoConfig?: AutoMarketConfig;
  marketConfig?: SymbolMarketConfig;
};

type InstrumentSelectionPanelProps = {
  isLoading: boolean;
  isAdmin: boolean;
  isMarketOpen: boolean;
  summaries: InstrumentSummary[];
  updatedAt: Date | null;
  onAdminClick: () => void;
  onSelect: (symbol: string) => void;
};

export function InstrumentSelectionPanel({
  isLoading,
  isAdmin,
  isMarketOpen,
  summaries,
  updatedAt,
  onAdminClick,
  onSelect,
}: InstrumentSelectionPanelProps) {
  const openCount = isMarketOpen
    ? summaries.filter((summary) => summary.marketConfig?.enabled === true && summary.marketConfig.marketStatus === "OPEN").length
    : 0;
  const autoEnabledCount = summaries.filter((summary) => summary.autoConfig?.enabled === true).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#6b7684]">주문할 종목을 먼저 선택하세요.</p>
            <h2 className="mt-1 text-xl font-black">수요와 공급 주문 체결 종목</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummaryPill label="등록" value={`${summaries.length}종목`} />
            <SummaryPill label="정규장" value={`${openCount}종목`} tone="blue" />
            <SummaryPill label="자동장" value={`${autoEnabledCount}종목`} />
            {isAdmin ? (
              <button type="button" onClick={onAdminClick} className="h-10 rounded-md bg-[#191f28] px-3 text-sm font-black text-white">
                설정 현황
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InstrumentSelectionMetric label="마지막 갱신" value={updatedAt ? formatKoKrTimeSecond(updatedAt) : isLoading ? "조회 중" : "-"} />
          <InstrumentSelectionMetric label="전체 유통주식" value={`${formatNumber(summaries.reduce((total, summary) => total + summary.instrument.tradableShares, 0))}주`} />
          <InstrumentSelectionMetric label="자동장 대상" value={`${autoEnabledCount}/${summaries.length}`} />
        </div>
      </div>

      {isLoading && !summaries.length ? (
        <div className="mt-5 rounded-lg border border-[#e5e8eb] bg-white px-5 py-10 text-center">
          <p className="text-base font-black text-[#191f28]">종목을 불러오는 중입니다.</p>
          <p className="mt-2 text-sm font-bold text-[#8b95a1]">주문장 종목, 장 상태, 자동장 설정을 함께 확인하고 있습니다.</p>
        </div>
      ) : summaries.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map(({ autoConfig, instrument, marketConfig }) => {
            const isOpen = isMarketOpen && marketConfig?.enabled === true && marketConfig.marketStatus === "OPEN";
            const changeRate = calculateChangeRate(instrument.currentPrice, instrument.priceLimitBase);
            return (
              <button
                key={instrument.symbol}
                type="button"
                onClick={() => onSelect(instrument.symbol)}
                className="rounded-lg border border-[#e5e8eb] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-[#3182f6] hover:shadow-[0_8px_24px_rgba(49,130,246,0.10)] focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">{instrument.name}</p>
                    <p className="mt-1 text-xs font-bold text-[#8b95a1]">{instrument.symbol} · {instrument.market}</p>
                  </div>
                  <span className={isOpen ? "shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]" : "shrink-0 rounded-sm bg-[#fff3f0] px-2 py-1 text-xs font-black text-[#d34b36]"}>
                    {formatEffectiveMarketSessionStatus(marketConfig?.marketStatus, isOpen)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#8b95a1]">현재가</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">{formatWon(instrument.currentPrice)}</p>
                  </div>
                  <p className={changeRate >= 0 ? "text-right text-sm font-black tabular-nums text-[#f04452]" : "text-right text-sm font-black tabular-nums text-[#3182f6]"}>
                    {formatSignedPercent(changeRate)}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 text-xs font-bold text-[#6b7684]">
                  <SelectionInfoRow label="발행 / 유통" value={`${formatNumber(instrument.issuedShares)}주 / ${formatNumber(instrument.tradableShares)}주`} />
                  <SelectionInfoRow label="현재 호가 / 제한폭" value={`${formatNumber(instrument.tickSize)}원 / ${formatNumber(instrument.priceLimitRate)}%`} />
                  <SelectionInfoRow label="자동장" value={autoConfig?.enabled ? `추종 ${autoConfig.intensity}/10, 최대 ${formatNumber(autoConfig.maxOrderQuantity)}주` : "정지"} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-[#e5e8eb] bg-white px-5 py-10 text-center">
          <p className="text-base font-black text-[#191f28]">등록된 수요와 공급 종목이 없습니다.</p>
          <p className="mt-2 text-sm font-bold text-[#8b95a1]">관리자 화면에서 주문장 종목을 만든 뒤 자동장과 거래를 시작할 수 있습니다.</p>
          {isAdmin ? (
            <button type="button" onClick={onAdminClick} className="mt-5 h-11 rounded-md bg-[#191f28] px-4 text-sm font-black text-white">
              관리자 설정으로 이동
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SummaryPill({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "blue" }) {
  const valueClass = tone === "blue" ? "text-[#3182f6]" : "text-[#191f28]";
  return (
    <span className="grid h-10 grid-cols-[auto_auto] items-center gap-2 rounded-md bg-[#f2f4f6] px-3 text-xs font-bold text-[#6b7684]">
      {label}
      <strong className={`text-sm font-black ${valueClass}`}>{value}</strong>
    </span>
  );
}

function SelectionInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-center gap-2 rounded-md bg-[#f7f8fa] px-3 py-2">
      <span className="text-[#8b95a1]">{label}</span>
      <span className="min-w-0 truncate text-right text-[#333d4b]">{value}</span>
    </div>
  );
}

function InstrumentSelectionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f7f8fa] p-3">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums text-[#191f28]">{value}</p>
    </div>
  );
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}%`;
}
