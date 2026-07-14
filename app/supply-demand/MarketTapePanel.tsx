"use client";

import { useState } from "react";

import { formatNumber, formatTimeSecond, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBookRecentExecution } from "@/app/types/stock";

const COLLAPSED_EXECUTION_COUNT = 6;

export function MarketTapePanel({ executions, isLoading }: { executions: OrderBookRecentExecution[]; isLoading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visibleExecutions = expanded ? executions : executions.slice(0, COLLAPSED_EXECUTION_COUNT);
  const hasHiddenExecutions = executions.length > COLLAPSED_EXECUTION_COUNT;

  return (
    <div className="rounded-lg border border-stock-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-stock-subtle">MARKET TAPE</p>
          <h3 className="mt-1 text-base font-black">전체 체결</h3>
        </div>
        <span className="rounded-sm bg-stock-surface-strong px-2 py-1 text-xs font-black text-stock-muted">
          최근 {executions.length}건
        </span>
      </div>
      <div id="market-tape-executions" className="mt-3 space-y-2">
        {visibleExecutions.map((execution) => {
          const up = execution.priceChange >= 0;
          return (
            <article key={execution.id} className="rounded-md bg-stock-surface-muted px-3 py-2">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className={execution.side === "BUY" ? "shrink-0 text-xs font-black text-stock-danger" : "shrink-0 text-xs font-black text-stock-accent"}>
                  {execution.side === "BUY" ? "매수체결" : "매도체결"}
                </span>
                <span className="min-w-0 truncate text-right text-xs font-bold text-stock-subtle">{formatTimeSecond(execution.executedAt)}</span>
              </div>
              <div className="mt-1 flex min-w-0 items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className={up ? "text-sm font-black tabular-nums text-stock-danger" : "text-sm font-black tabular-nums text-stock-accent"}>
                    {formatWon(execution.price)}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                    {up ? "+" : ""}{formatNumber(execution.priceChange)}원
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tabular-nums text-stock-ink">{formatNumber(execution.quantity)}주</p>
                  <p className="mt-0.5 text-xs font-bold text-stock-subtle">{formatWon(execution.grossAmount)}</p>
                </div>
              </div>
            </article>
          );
        })}
        {executions.length === 0 ? (
          <p className="rounded-md bg-stock-surface-muted px-3 py-4 text-sm font-bold leading-6 text-stock-subtle">
            {isLoading ? "전체 체결을 불러오는 중입니다." : "아직 종목 전체 체결이 없습니다."}
          </p>
        ) : null}
      </div>
      {hasHiddenExecutions ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="market-tape-executions"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 min-h-11 w-full rounded-md border border-stock-border bg-white px-3 text-sm font-black text-stock-text-secondary hover:border-stock-border-strong hover:bg-stock-surface-muted"
        >
          {expanded ? "최근 체결 접기" : `체결 ${executions.length - COLLAPSED_EXECUTION_COUNT}건 더 보기`}
        </button>
      ) : null}
    </div>
  );
}
