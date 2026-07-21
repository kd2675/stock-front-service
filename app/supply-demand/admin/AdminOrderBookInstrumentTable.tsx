import { useState } from "react";

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
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [rulesDraft, setRulesDraft] = useState({ priceLimitRate: "" });
  const [rulesError, setRulesError] = useState<string | null>(null);

  const selectedInstrument = instruments.find((instrument) => instrument.symbol === selectedSymbol) ?? instruments.at(0) ?? null;
  const selectedConfig = selectedInstrument ? orderBookConfigBySymbol.get(selectedInstrument.symbol) : null;
  const marketStatus = selectedConfig?.marketStatus ?? "OPEN";
  const canSelectOpen = marketStatus === "OPEN" || (marketStatus === "HALTED" && simulationClock?.marketSession === "REGULAR");
  const isUpdatingStatus = selectedInstrument ? updatingStatusSymbol === selectedInstrument.symbol : false;
  const isUpdatingRules = selectedInstrument ? updatingTradingRulesSymbol === selectedInstrument.symbol : false;
  const isEditing = selectedInstrument ? editingSymbol === selectedInstrument.symbol : false;

  const selectInstrument = (instrument: OrderBookInstrument) => {
    setSelectedSymbol(instrument.symbol);
    setEditingSymbol(null);
    setRulesError(null);
  };

  const startEditingRules = (instrument: OrderBookInstrument) => {
    setEditingSymbol(instrument.symbol);
    setRulesDraft({ priceLimitRate: String(instrument.priceLimitRate) });
    setRulesError(null);
  };

  const cancelEditingRules = () => {
    setEditingSymbol(null);
    setRulesError(null);
  };

  const submitTradingRules = async () => {
    if (!editingSymbol) return;
    const priceLimitRate = Number(rulesDraft.priceLimitRate);
    if (!Number.isFinite(priceLimitRate) || priceLimitRate <= 0 || priceLimitRate > 100) {
      setRulesError("가격제한폭은 0보다 크고 100 이하로 입력해 주세요.");
      return;
    }
    setRulesError(null);
    const saved = await onUpdateTradingRules(editingSymbol, { priceLimitRate });
    if (saved) setEditingSymbol(null);
  };

  if (!selectedInstrument) {
    return (
      <section className="admin-panel mt-5">
        <h2 className="text-base font-black">종목·장 상태</h2>
        <p className="mt-3 rounded-md border border-dashed border-white/15 bg-black/15 px-3 py-4 text-sm font-bold text-stock-subtle">
          아직 생성된 주문장 종목이 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-panel mt-5 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">종목·장 상태</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">종목을 먼저 선택한 뒤 장 상태와 가격제한폭을 확인·수정합니다.</p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-muted">{formatCount(instruments.length, "개 종목")}</span>
      </div>

      <label className="mt-4 block text-xs font-black text-admin-muted lg:hidden">
        관리 종목
        <select
          value={selectedInstrument.symbol}
          onChange={(event) => {
            const instrument = instruments.find((candidate) => candidate.symbol === event.target.value);
            if (instrument) selectInstrument(instrument);
          }}
          className="admin-control mt-1 w-full px-3 text-sm font-black"
        >
          {instruments.map((instrument) => <option key={instrument.symbol} value={instrument.symbol}>{instrument.name} · {instrument.symbol}</option>)}
        </select>
      </label>

      <div className="mt-4 hidden grid-cols-1 gap-2 lg:grid lg:grid-cols-3">
        {instruments.map((instrument) => {
          const config = orderBookConfigBySymbol.get(instrument.symbol);
          const selected = instrument.symbol === selectedInstrument.symbol;
          return (
            <button
              key={instrument.symbol}
              type="button"
              onClick={() => selectInstrument(instrument)}
              className={[
                "min-w-0 rounded-md border px-3 py-3 text-left transition",
                selected ? "border-admin-accent/50 bg-admin-accent-surface" : "border-white/10 bg-black/15 hover:border-white/20",
              ].join(" ")}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-black text-white">{instrument.name}</span>
                <MarketStatusBadge status={config?.marketStatus ?? "OPEN"} />
              </span>
              <span className="mt-1 block text-xs font-bold text-stock-subtle">{instrument.symbol} · {instrument.market}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-black text-white">{selectedInstrument.name}</p>
              <p className="mt-1 text-xs font-bold text-stock-subtle">{selectedInstrument.symbol} · {selectedInstrument.market}</p>
            </div>
            <MarketStatusBadge status={marketStatus} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <InstrumentMetric label="현재가" value={formatWon(selectedInstrument.currentPrice)} />
            <InstrumentMetric label="기준가" value={formatWon(selectedInstrument.initialPrice)} />
            <InstrumentMetric label="발행주식" value={formatCount(selectedInstrument.issuedShares, "주")} />
            <InstrumentMetric label="유통주식" value={formatCount(selectedInstrument.tradableShares, "주")} />
            <InstrumentMetric label="호가 단위" value={`${formatNumber(selectedInstrument.tickSize)}원`} />
            <InstrumentMetric label="가격제한폭" value={`${formatNumber(selectedInstrument.priceLimitRate)}%`} />
            <InstrumentMetric label="가격 제공자" value={selectedInstrument.priceProvider || "-"} />
            <InstrumentMetric label="종목 상태" value={selectedInstrument.enabled ? "사용" : "중지"} />
          </dl>
        </div>

        <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-black text-white">운영 설정</p>
          <label className="mt-3 grid gap-1 text-xs font-black text-admin-muted">
            장 상태
            <select
              value={marketStatus}
              onChange={(event) => onChangeMarketStatus(selectedInstrument.symbol, event.target.value as MarketSessionStatus)}
              disabled={isUpdatingStatus}
              className="admin-control w-full px-3 text-sm font-black disabled:cursor-wait disabled:opacity-50"
            >
              <option value="OPEN" disabled={!canSelectOpen}>정규장</option>
              <option value="CLOSED">마감</option>
              <option value="HALTED">거래정지</option>
              <option value="CIRCUIT_BREAKER">서킷브레이크</option>
            </select>
          </label>

          {isEditing ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <DarkInput
                label="가격제한폭(%)"
                value={rulesDraft.priceLimitRate}
                onChange={(value) => setRulesDraft({ priceLimitRate: value })}
                placeholder="30"
                disabled={isUpdatingRules}
              />
              {rulesError ? <p className="mt-2 text-xs font-bold text-admin-danger">{rulesError}</p> : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => void submitTradingRules()} disabled={isUpdatingRules} className="min-h-11 rounded-md bg-stock-accent px-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-50">{isUpdatingRules ? "저장 중" : "저장"}</button>
                <button type="button" onClick={cancelEditingRules} disabled={isUpdatingRules} className="min-h-11 rounded-md bg-white/10 px-3 text-sm font-black text-white disabled:opacity-50">취소</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => startEditingRules(selectedInstrument)} className="mt-3 min-h-11 w-full rounded-md bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/15">가격제한폭 수정</button>
          )}
        </div>
      </div>

      <details className="group mt-4 rounded-md border border-white/[0.07] bg-white/[0.025]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:hidden">
          <span className="text-xs font-black text-admin-muted">호가 단위 적용 기준</span>
          <span aria-hidden="true" className="text-admin-accent transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <p className="border-t border-white/[0.07] px-3 py-3 text-xs font-bold leading-5 text-stock-subtle">
          호가 단위는 주가 구간에 따라 자동 적용됩니다. 2천원 미만 1원, 2천-5천원 5원, 5천-2만원 10원, 2만-5만원 50원, 5만-20만원 100원, 20만-50만원 500원, 50만원 이상 1,000원입니다.
        </p>
      </details>
    </section>
  );
}

function InstrumentMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[11px] font-bold text-admin-placeholder">{label}</dt><dd className="mt-1 break-words text-sm font-black tabular-nums text-white">{value}</dd></div>;
}

function MarketStatusBadge({ status }: { status: MarketSessionStatus }) {
  const label = status === "OPEN" ? "정규장" : status === "CLOSED" ? "마감" : status === "HALTED" ? "거래정지" : "서킷브레이크";
  const tone = status === "OPEN" ? "bg-admin-success-surface text-admin-success" : status === "CLOSED" ? "bg-white/10 text-admin-muted" : "bg-admin-warning-surface text-admin-warning";
  return <span className={`shrink-0 rounded-sm px-2 py-1 text-[11px] font-black ${tone}`}>{label}</span>;
}
