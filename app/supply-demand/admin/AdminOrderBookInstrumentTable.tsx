import { formatCount, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { MarketSessionStatus, OrderBookInstrument, OrderBookMarketStatus } from "@/app/types/stock";

type AdminOrderBookInstrumentTableProps = {
  instruments: OrderBookInstrument[];
  orderBookConfigBySymbol: ReadonlyMap<string, OrderBookMarketStatus["configs"][number]>;
  updatingStatusSymbol: string | null;
  onChangeMarketStatus: (symbol: string, marketStatus: MarketSessionStatus) => void;
};

export function AdminOrderBookInstrumentTable({
  instruments,
  orderBookConfigBySymbol,
  updatingStatusSymbol,
  onChangeMarketStatus,
}: AdminOrderBookInstrumentTableProps) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-[900px] w-full border-collapse text-sm">
        <thead className="bg-white/10 text-left text-[#b8c2cc]">
          <tr>
            <th className="px-4 py-3">주문장 종목</th>
            <th className="px-4 py-3">시장</th>
            <th className="px-4 py-3">장 상태</th>
            <th className="px-4 py-3">발행주식수</th>
            <th className="px-4 py-3">유통주식수</th>
            <th className="px-4 py-3">현재가</th>
            <th className="px-4 py-3">기준가</th>
            <th className="px-4 py-3">호가/제한폭</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {instruments.map((instrument) => {
            const config = orderBookConfigBySymbol.get(instrument.symbol);
            const marketStatus = config?.marketStatus ?? "OPEN";
            return (
              <tr key={instrument.symbol}>
                <td className="px-4 py-3 font-black">{instrument.name} · {instrument.symbol}</td>
                <td className="px-4 py-3">{instrument.market}</td>
                <td className="px-4 py-3">
                  <select
                    value={marketStatus}
                    onChange={(event) => onChangeMarketStatus(instrument.symbol, event.target.value as MarketSessionStatus)}
                    disabled={updatingStatusSymbol === instrument.symbol}
                    className="rounded-md border border-white/10 bg-[#161b21] px-2 py-2 text-xs font-black text-white disabled:opacity-50"
                  >
                    <option value="OPEN">정규장</option>
                    <option value="CLOSED">마감</option>
                    <option value="HALTED">거래정지</option>
                    <option value="CIRCUIT_BREAKER">서킷브레이크</option>
                  </select>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatCount(instrument.issuedShares, "주")}</td>
                <td className="px-4 py-3 tabular-nums">{formatCount(instrument.tradableShares, "주")}</td>
                <td className="px-4 py-3 tabular-nums">{formatWon(instrument.currentPrice)}</td>
                <td className="px-4 py-3 tabular-nums">{formatWon(instrument.initialPrice)}</td>
                <td className="px-4 py-3 tabular-nums">{formatNumber(instrument.tickSize)}원 / {formatNumber(instrument.priceLimitRate)}%</td>
              </tr>
            );
          })}
          {instruments.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-5 text-[#8b95a1]">아직 생성된 수요와 공급 종목이 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
