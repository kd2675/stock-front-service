import { MarketChartPanel } from "@/app/supply-demand/MarketChartPanel";
import { OrderBookDepthPanel } from "@/app/supply-demand/OrderBookDepthPanel";
import type { FlashingOrderBookLevel, OrderBookSideType } from "@/app/supply-demand/OrderBookDepthModel";
import { SelectedOrderBookInstrumentPanel } from "@/app/supply-demand/SupplyDemandWorkspacePanels";
import type {
  OrderBook,
  OrderBookCandle,
  OrderBookCandleInterval,
  OrderBookInstrument,
  OrderBookTradeSummary,
  SymbolMarketConfig,
} from "@/app/types/stock";

export type SupplyDemandMarketColumnProps = {
  candles: OrderBookCandle[];
  candleInterval: OrderBookCandleInterval;
  chartExpanded: boolean;
  flashingOrderBookLevel: FlashingOrderBookLevel;
  instruments: OrderBookInstrument[];
  isCandlesLoading: boolean;
  isSelectedMarketOpen: boolean;
  message: string | null;
  orderBook: OrderBook | null;
  orderBookLayout: "split" | "stacked";
  orderBookTradeSummary: OrderBookTradeSummary | null;
  selectedInstrument: OrderBookInstrument;
  selectedOrderBookConfig?: SymbolMarketConfig;
  selectedSymbol: string;
  onChartExpandedChange: (expanded: boolean) => void;
  onCandleIntervalChange: (interval: OrderBookCandleInterval) => void;
  onFlashEnd: () => void;
  onLayoutChange: (layout: "split" | "stacked") => void;
  onPriceSelect: (price: number, side: OrderBookSideType) => void;
  onSelectInstrument: (symbol: string) => void;
};

export function SupplyDemandMarketColumn({
  candles,
  candleInterval,
  chartExpanded,
  flashingOrderBookLevel,
  instruments,
  isCandlesLoading,
  isSelectedMarketOpen,
  message,
  orderBook,
  orderBookLayout,
  orderBookTradeSummary,
  selectedInstrument,
  selectedOrderBookConfig,
  selectedSymbol,
  onChartExpandedChange,
  onCandleIntervalChange,
  onFlashEnd,
  onLayoutChange,
  onPriceSelect,
  onSelectInstrument,
}: SupplyDemandMarketColumnProps) {
  return (
    <div className="space-y-5">
      <SelectedOrderBookInstrumentPanel
        instruments={instruments}
        isSelectedMarketOpen={isSelectedMarketOpen}
        message={message}
        selectedInstrument={selectedInstrument}
        selectedOrderBookConfig={selectedOrderBookConfig}
        selectedSymbol={selectedSymbol}
        summary={orderBookTradeSummary}
        onSelectInstrument={onSelectInstrument}
      />

      <OrderBookDepthPanel
        currentPrice={selectedInstrument.currentPrice}
        flashingLevel={flashingOrderBookLevel}
        layout={orderBookLayout}
        orderBook={orderBook}
        onFlashEnd={onFlashEnd}
        onLayoutChange={onLayoutChange}
        onPriceSelect={onPriceSelect}
      />

      <MarketChartPanel
        candles={candles}
        expanded={chartExpanded}
        interval={candleInterval}
        isLoading={isCandlesLoading}
        summary={orderBookTradeSummary}
        onExpandedChange={onChartExpandedChange}
        onIntervalChange={onCandleIntervalChange}
      />
    </div>
  );
}
