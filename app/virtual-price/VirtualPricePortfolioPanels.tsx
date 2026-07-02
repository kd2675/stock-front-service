import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { CorporateActionEntitlement, Holding, PortfolioSnapshot } from "@/app/types/stock";

import {
  formatCorporateActionType,
  formatDateTime,
  formatEntitlementStatus,
  formatEntitlementValue,
} from "./VirtualPriceFormatters";
import { Panel, PortfolioHistory } from "./VirtualPricePanels";

type VirtualPricePortfolioPanelsProps = {
  corporateActionEntitlements: CorporateActionEntitlement[];
  portfolioSnapshots: PortfolioSnapshot[];
  visibleHoldings: Holding[];
};

export function VirtualPricePortfolioPanels({
  corporateActionEntitlements,
  portfolioSnapshots,
  visibleHoldings,
}: VirtualPricePortfolioPanelsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel title="보유 종목">
        {visibleHoldings.length ? (
          <div className="space-y-3">
            {visibleHoldings.map((holding) => (
              <div key={holding.symbol} className="rounded-md bg-[#f9fafb] p-3">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-bold">{holding.symbol}</p>
                  <p className="shrink-0 text-sm tabular-nums">{holding.availableQuantity} / {holding.quantity}주</p>
                </div>
                {holding.reservedQuantity > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-[#f04452]">매도 예약 {holding.reservedQuantity}주</p>
                ) : null}
                <p className="mt-1 min-w-0 break-words text-sm text-[#6b7684]">
                  평가 {formatWon(holding.marketValue)} / 손익 {formatWon(holding.unrealizedProfit)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6b7684]">보유 종목이 없습니다.</p>
        )}
      </Panel>

      <Panel title="자산 기록">
        <PortfolioHistory snapshots={portfolioSnapshots} />
      </Panel>

      <Panel title="기업 이벤트">
        {corporateActionEntitlements.length ? (
          <div className="space-y-3">
            {corporateActionEntitlements.slice(0, 5).map((entitlement) => (
              <article key={entitlement.id} className="rounded-md bg-[#f9fafb] p-3">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-bold">{formatCorporateActionType(entitlement.actionType)} · {entitlement.symbol}</p>
                  <span className="shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-semibold text-[#4e5968]">
                    {formatEntitlementStatus(entitlement.status)}
                  </span>
                </div>
                <p className="mt-2 min-w-0 break-words text-sm font-semibold tabular-nums">
                  {formatEntitlementValue(entitlement)}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#8b95a1]">
                  기준 보유 {formatNumber(entitlement.quantity)}주 · {formatDateTime(entitlement.createdAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6b7684]">아직 배정된 기업 이벤트가 없습니다.</p>
        )}
      </Panel>
    </section>
  );
}
