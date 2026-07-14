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
  onSelectInstrument,
}: {
  instruments: OrderBookInstrument[];
  isSelectedMarketOpen: boolean;
  message: string | null;
  selectedInstrument: OrderBookInstrument;
  selectedOrderBookConfig?: SymbolMarketConfig;
  summary: OrderBookTradeSummary | null;
  selectedSymbol: string;
  onSelectInstrument: (symbol: string) => void;
}) {
  return (
    <div className="rounded-lg border border-stock-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stock-muted">종목</p>
          <h2 className="mt-1 text-xl font-black">{`${selectedInstrument.name} ${selectedInstrument.symbol}`}</h2>
        </div>
        <select
          value={selectedSymbol}
          onChange={(event) => onSelectInstrument(event.target.value)}
          className="rounded-md border border-stock-border-strong bg-white px-3 py-2 text-sm font-bold"
        >
          <option value="" disabled>등록된 종목 없음</option>
          {instruments.map((instrument) => (
            <option key={instrument.symbol} value={instrument.symbol}>
              {instrument.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="현재가" value={formatWon(selectedInstrument.currentPrice)} />
        <Metric label="제한 기준가" value={formatWon(selectedInstrument.priceLimitBase)} />
        <Metric label="장 상태" value={formatEffectiveMarketSessionStatus(selectedOrderBookConfig?.marketStatus, isSelectedMarketOpen)} tone={isSelectedMarketOpen ? "blue" : "red"} />
        <Metric label="2시간 거래량" value={`${formatNumber(summary?.todayVolume ?? 0)}주`} />
        <Metric label="2시간 거래대금" value={formatWon(summary?.todayTurnover)} />
        <Metric label="VWAP" value={formatWon(summary?.vwap)} />
        <Metric label="고가 / 저가" value={`${formatRoundedPriceOrDash(summary?.highPrice)} / ${formatRoundedPriceOrDash(summary?.lowPrice)}`} />
        <Metric label="체결강도" value={formatExecutionStrength(summary)} tone={resolveExecutionStrengthTone(summary)} />
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
        <StatusRow label="2시간 자동 체결" value={autoMarket ? `${autoMarket.todayAutoExecutionCount}건` : "-"} />
        <StatusRow label="전체 대기 주문" value={orderBookMarket ? `${orderBookMarket.openOrderCount}건` : "-"} />
        <StatusRow label="마지막 갱신" value={updatedAt ? formatKoKrTimeSecond(updatedAt) : loading ? "조회 중" : "-"} />
      </div>
    </div>
  );
}

export function AutoMarketConfigListPanel({
  configs,
  onSelectInstrument,
}: {
  configs: AutoMarketConfig[];
  onSelectInstrument: (symbol: string) => void;
}) {
  return (
    <div className="rounded-lg border border-stock-border bg-white p-4">
      <h3 className="text-base font-black">종목별 자동장</h3>
      <div className="mt-3 divide-y divide-stock-divider">
        {configs.length ? configs.map((config) => (
          <button
            key={config.symbol}
            type="button"
            onClick={() => onSelectInstrument(config.symbol)}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-left"
          >
            <span className="font-bold">{config.symbol}</span>
            <span className={config.enabled ? "font-black text-stock-accent" : "font-bold text-stock-subtle"}>
              {config.enabled ? "가동" : "정지"}
            </span>
          </button>
        )) : (
          <p className="rounded-md bg-stock-surface-muted px-3 py-4 text-sm font-bold text-stock-subtle">관리자 설정에서 자동장 대상 종목을 먼저 등록하세요.</p>
        )}
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
    <div className="rounded-md bg-stock-surface-muted p-3">
      <p className="text-xs font-bold text-stock-subtle">{label}</p>
      <p className={`mt-1 text-lg font-black tabular-nums ${toneClass}`}>{value}</p>
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

function formatExecutionStrength(summary: OrderBookTradeSummary | null) {
  if (!summary || summary.executionStrength <= 0) {
    return "-";
  }
  return `${formatNumber(summary.executionStrength)}%`;
}

function resolveExecutionStrengthTone(summary: OrderBookTradeSummary | null): "default" | "red" | "blue" {
  if (!summary || summary.executionStrength <= 0) {
    return "default";
  }
  if (summary.executionStrength >= 120) {
    return "red";
  }
  if (summary.executionStrength <= 80) {
    return "blue";
  }
  return "default";
}
