import { formatKoKrTimeSecond } from "@/app/lib/localeFormatters";
import { formatNumber, formatRoundedPriceOrDash, formatWon } from "@/app/lib/stockFormatters";
import { formatEffectiveMarketSessionStatus } from "@/app/supply-demand/SupplyDemandFormatters";
import type {
  AutoMarketConfig,
  AutoMarketStatus,
  OrderBookInstrument,
  OrderBookMarketStatus,
  OrderBookTradeSummary,
  SymbolMarketConfig,
} from "@/app/types/stock";

export function SelectedOrderBookInstrumentPanel({
  instruments,
  isSelectedMarketOpen,
  message,
  selectedInstrument,
  selectedOrderBookConfig,
  summary,
  selectedSymbol,
  onClearSelectedInstrument,
  onSelectInstrument,
}: {
  instruments: OrderBookInstrument[];
  isSelectedMarketOpen: boolean;
  message: string | null;
  selectedInstrument: OrderBookInstrument;
  selectedOrderBookConfig?: SymbolMarketConfig;
  summary: OrderBookTradeSummary | null;
  selectedSymbol: string;
  onClearSelectedInstrument: () => void;
  onSelectInstrument: (symbol: string) => void;
}) {
  return (
    <div className="rounded-lg border border-stock-border bg-white p-3 shadow-[var(--shadow-panel)] sm:p-4">
      <div className="stock-instrument-summary grid gap-3">
        <div className="stock-instrument-identity min-w-0">
          <p className="text-xs font-bold text-stock-subtle">SELECTED INSTRUMENT</p>
          <h2 className="mt-1 truncate text-lg font-black sm:text-xl">{`${selectedInstrument.name} ${selectedInstrument.symbol}`}</h2>
        </div>

        <div className="stock-instrument-controls grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <select
            value={selectedSymbol}
            onChange={(event) => onSelectInstrument(event.target.value)}
            className="min-w-0 rounded-md border border-stock-border-strong bg-white px-3 py-2 text-sm font-bold"
          >
            <option value="" disabled>등록된 종목 없음</option>
            {instruments.map((instrument) => (
              <option key={instrument.symbol} value={instrument.symbol}>
                {instrument.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClearSelectedInstrument}
            className="h-10 shrink-0 rounded-md bg-stock-surface-strong px-3 text-xs font-black text-stock-text-secondary"
          >
            종목 목록
          </button>
        </div>

        <div className="stock-instrument-metrics grid grid-cols-2 gap-px overflow-hidden rounded-md bg-stock-divider sm:grid-cols-4 xl:grid-cols-8">
          <Metric label="현재가" value={formatWon(selectedInstrument.currentPrice)} />
          <Metric label="제한 기준가" value={formatWon(selectedInstrument.priceLimitBase)} />
          <Metric label="장 상태" value={formatEffectiveMarketSessionStatus(selectedOrderBookConfig?.marketStatus, isSelectedMarketOpen)} tone={isSelectedMarketOpen ? "blue" : "red"} />
          <Metric label="2시간 거래량" value={`${formatNumber(summary?.todayVolume ?? 0)}주`} />
          <Metric label="2시간 거래대금" value={formatWon(summary?.todayTurnover)} />
          <Metric label="VWAP" value={formatWon(summary?.vwap)} />
          <Metric label="고가 / 저가" value={`${formatRoundedPriceOrDash(summary?.highPrice)} / ${formatRoundedPriceOrDash(summary?.lowPrice)}`} />
          <Metric label="평균 체결량" value={formatAverageExecutionQuantity(summary)} />
        </div>
      </div>

      {message ? <p className="mt-4 rounded-md bg-stock-danger-surface px-3 py-2 text-sm font-bold text-stock-danger-strong">{message}</p> : null}
    </div>
  );
}

export function AutoMarketStatusPanel({
  autoMarket,
  loading,
  orderBookMarket,
  selectedConfig,
  selectedOrderBookConfig,
  updatedAt,
}: {
  autoMarket: AutoMarketStatus | null;
  loading: boolean;
  orderBookMarket: OrderBookMarketStatus | null;
  selectedConfig?: AutoMarketConfig;
  selectedOrderBookConfig?: SymbolMarketConfig;
  updatedAt: Date | null;
}) {
  const isSelectedOrderBookOpen = orderBookMarket?.enabled === true
    && selectedOrderBookConfig?.enabled === true
    && selectedOrderBookConfig.marketStatus === "OPEN";

  return (
    <div className="rounded-lg border border-stock-border bg-white p-4">
      <h3 className="text-base font-black">자동장 상태</h3>
      <div className="mt-4 space-y-3">
        <StatusRow label="상태" value={autoMarket?.enabled ? "가동" : "정지"} />
        <StatusRow label="주문장 시장" value={orderBookMarket?.enabled ? "가동" : "정지"} />
        <StatusRow label="선택 종목 장" value={formatEffectiveMarketSessionStatus(selectedOrderBookConfig?.marketStatus, isSelectedOrderBookOpen)} />
        <StatusRow label="주 가격 편향" value={selectedConfig ? signedPressure(selectedConfig.primaryDistributionBias.pricePressure) : "-"} />
        <StatusRow label="자동 참여자" value={autoMarket ? `${autoMarket.enabledParticipantCount}명` : "-"} />
        <StatusRow label="2시간 자동 계좌 체결 참여 (비동기·보통 30초)" value={autoMarket ? `${autoMarket.todayAutoExecutionCount}건` : "-"} />
        <StatusRow label="전체 대기 주문" value={orderBookMarket ? `${orderBookMarket.openOrderCount}건` : "-"} />
        <StatusRow label="마지막 갱신" value={updatedAt ? formatKoKrTimeSecond(updatedAt) : loading ? "조회 중" : "-"} />
      </div>
    </div>
  );
}

function signedPressure(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  const toneClass = tone === "red" ? "text-stock-danger" : tone === "blue" ? "text-stock-accent" : "text-stock-ink";
  return (
    <div className="min-w-0 bg-stock-surface-muted px-3 py-2.5">
      <p className="text-xs font-bold text-stock-subtle">{label}</p>
      <p className={`mt-1 truncate text-sm font-black tabular-nums ${toneClass}`} title={value}>{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-bold text-stock-muted">{label}</span>
      <span className="font-black text-stock-ink">{value}</span>
    </div>
  );
}

function formatAverageExecutionQuantity(summary: OrderBookTradeSummary | null) {
  if (!summary || summary.todayExecutionCount <= 0) {
    return "-";
  }
  return `${formatNumber(Math.round(summary.todayVolume / summary.todayExecutionCount))}주`;
}
