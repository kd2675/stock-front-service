import type { AuthUser } from "@/app/types/auth";
import type {
  CorporateActionEntitlement,
  Holding,
  Instrument,
  Portfolio,
  PortfolioSnapshot,
  Price,
  PriceTick,
  ProfitSummary,
  StockUserProfile,
} from "@/app/types/stock";
import {
  VirtualPriceHeroPanel,
  VirtualPriceMarketPanel,
  VirtualPricePortfolioPanels,
} from "@/app/virtual-price/VirtualPriceWorkspacePanels";

export type VirtualPriceMainColumnProps = {
  chronologicalTicks: PriceTick[];
  corporateActionEntitlements: CorporateActionEntitlement[];
  instrumentMap: Map<string, Instrument>;
  lastUpdatedAt: Date | null;
  portfolio: Portfolio | null;
  portfolioSnapshots: PortfolioSnapshot[];
  priceStreamConnected: boolean;
  priceTicks: PriceTick[];
  prices: Price[];
  profile: StockUserProfile | null;
  profitSummary: ProfitSummary | null;
  refreshError: string | null;
  refreshing: boolean;
  selectedInstrument?: Instrument;
  selectedPrice?: Price;
  selectedSymbol: string;
  user: AuthUser | null;
  visibleHoldings: Holding[];
  onSelectPrice: (price: Price) => void;
};

export function VirtualPriceMainColumn({
  chronologicalTicks,
  corporateActionEntitlements,
  instrumentMap,
  lastUpdatedAt,
  portfolio,
  portfolioSnapshots,
  priceStreamConnected,
  priceTicks,
  prices,
  profile,
  profitSummary,
  refreshError,
  refreshing,
  selectedInstrument,
  selectedPrice,
  selectedSymbol,
  user,
  visibleHoldings,
  onSelectPrice,
}: VirtualPriceMainColumnProps) {
  return (
    <div className="space-y-6">
      <VirtualPriceHeroPanel
        lastUpdatedAt={lastUpdatedAt}
        portfolio={portfolio}
        priceStreamConnected={priceStreamConnected}
        profile={profile}
        profitSummary={profitSummary}
        refreshError={refreshError}
        refreshing={refreshing}
        user={user}
      />

      <VirtualPriceMarketPanel
        chronologicalTicks={chronologicalTicks}
        instrumentMap={instrumentMap}
        priceTicks={priceTicks}
        prices={prices}
        selectedInstrument={selectedInstrument}
        selectedPrice={selectedPrice}
        selectedSymbol={selectedSymbol}
        onSelectPrice={onSelectPrice}
      />

      <VirtualPricePortfolioPanels
        corporateActionEntitlements={corporateActionEntitlements}
        portfolioSnapshots={portfolioSnapshots}
        visibleHoldings={visibleHoldings}
      />
    </div>
  );
}
