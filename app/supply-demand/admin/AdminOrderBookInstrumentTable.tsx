import { Fragment, useState } from "react";

import DataTableViewport from "@/app/components/DataTableViewport";
import { DarkInput } from "@/app/supply-demand/admin/AdminFormControls";
import { formatCount, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { MarketSessionStatus, OrderBookInstrument, OrderBookMarketStatus, SimulationClock } from "@/app/types/stock";

type AdminOrderBookInstrumentTableProps = {
  instruments: OrderBookInstrument[];
  orderBookConfigBySymbol: ReadonlyMap<string, OrderBookMarketStatus["configs"][number]>;
  simulationClock: SimulationClock | null;
  updatingStatusSymbol: string | null;
  updatingTradingRulesSymbol: string | null;
  onChangeMarketStatus: (symbol: string, marketStatus: MarketSessionStatus) => void;
  onUpdateTradingRules: (symbol: string, payload: { priceLimitRate: number }) => Promise<boolean>;
};

export function AdminOrderBookInstrumentTable({
  instruments,
  orderBookConfigBySymbol,
  simulationClock,
  updatingStatusSymbol,
  updatingTradingRulesSymbol,
  onChangeMarketStatus,
  onUpdateTradingRules,
}: AdminOrderBookInstrumentTableProps) {
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [rulesDraft, setRulesDraft] = useState({ priceLimitRate: "" });
  const [rulesError, setRulesError] = useState<string | null>(null);

  const startEditingRules = (instrument: OrderBookInstrument) => {
    setEditingSymbol(instrument.symbol);
    setRulesDraft({
      priceLimitRate: String(instrument.priceLimitRate),
    });
    setRulesError(null);
  };

  const cancelEditingRules = () => {
    setEditingSymbol(null);
    setRulesError(null);
  };

  const submitTradingRules = async () => {
    if (!editingSymbol) {
      return;
    }
    const priceLimitRate = Number(rulesDraft.priceLimitRate);
    if (!Number.isFinite(priceLimitRate) || priceLimitRate <= 0 || priceLimitRate > 100) {
      setRulesError("가격제한폭은 0보다 크고 100 이하로 입력해 주세요.");
      return;
    }
    setRulesError(null);
    const saved = await onUpdateTradingRules(editingSymbol, { priceLimitRate });
    if (saved) {
      setEditingSymbol(null);
    }
  };

  return (
    <DataTableViewport label="주문장 종목과 장 상태" tone="dark" className="mt-5">
      <table className="min-w-[980px] w-full border-collapse text-sm">
        <thead className="bg-white/10 text-left text-admin-muted">
          <tr>
            <th className="px-4 py-3">주문장 종목</th>
            <th className="px-4 py-3">시장</th>
            <th className="px-4 py-3">장 상태</th>
            <th className="px-4 py-3">발행주식수</th>
            <th className="px-4 py-3">유통주식수</th>
            <th className="px-4 py-3">현재가</th>
            <th className="px-4 py-3">기준가</th>
            <th className="px-4 py-3">현재 호가/제한폭</th>
            <th className="px-4 py-3">수정</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {instruments.map((instrument) => {
            const config = orderBookConfigBySymbol.get(instrument.symbol);
            const marketStatus = config?.marketStatus ?? "OPEN";
            const canSelectOpen = marketStatus === "OPEN" || (marketStatus === "HALTED" && simulationClock?.marketSession === "REGULAR");
            const isEditing = editingSymbol === instrument.symbol;
            const isUpdatingRules = updatingTradingRulesSymbol === instrument.symbol;
            return (
              <Fragment key={instrument.symbol}>
                <tr>
                  <td className="px-4 py-3 font-black">{instrument.name} · {instrument.symbol}</td>
                  <td className="px-4 py-3">{instrument.market}</td>
                  <td className="px-4 py-3">
                    <select
                      value={marketStatus}
                      onChange={(event) => onChangeMarketStatus(instrument.symbol, event.target.value as MarketSessionStatus)}
                      disabled={updatingStatusSymbol === instrument.symbol}
                      className="rounded-md border border-white/10 bg-admin-surface px-2 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                      <option value="OPEN" disabled={!canSelectOpen}>정규장</option>
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
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isUpdatingRules}
                      onClick={() => startEditingRules(instrument)}
                      className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent/60 disabled:cursor-wait disabled:opacity-50"
                    >
                      {isUpdatingRules ? "저장 중" : isEditing ? "수정 중" : "수정"}
                    </button>
                  </td>
                </tr>
                {isEditing ? (
                  <tr className="bg-[#0f141a]">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                        <DarkInput
                          label="가격제한폭(%)"
                          value={rulesDraft.priceLimitRate}
                          onChange={(value) => setRulesDraft((current) => ({ ...current, priceLimitRate: value }))}
                          placeholder="30"
                          disabled={isUpdatingRules}
                        />
                        <div className="flex min-w-0 gap-2">
                          <button
                            type="button"
                            onClick={() => void submitTradingRules()}
                            disabled={isUpdatingRules}
                            className="h-11 rounded-md bg-stock-accent px-4 text-sm font-black text-white transition hover:bg-stock-accent-strong disabled:cursor-wait disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingRules}
                            disabled={isUpdatingRules}
                            className="h-11 rounded-md border border-white/10 px-4 text-sm font-black text-admin-muted transition hover:border-white/20 disabled:cursor-wait disabled:opacity-50"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-bold text-stock-subtle">
                        호가 단위는 주가 구간에 따라 자동 적용됩니다. 2천원 미만 1원, 2천-5천원 5원, 5천-2만원 10원, 2만-5만원 50원, 5만-20만원 100원, 20만-50만원 500원, 50만원 이상 1,000원입니다.
                      </p>
                      {rulesError ? <p className="mt-2 text-xs font-bold text-[#ff8a80]">{rulesError}</p> : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          {instruments.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-5 text-stock-subtle">아직 생성된 수요와 공급 종목이 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </DataTableViewport>
  );
}
