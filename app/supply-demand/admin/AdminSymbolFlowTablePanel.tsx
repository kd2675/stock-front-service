import { useState } from "react";

import DataTableViewport from "@/app/components/DataTableViewport";
import useModalDialog from "@/app/hooks/useModalDialog";
import { formatCount, formatDateTime, formatFlowMarketStatus, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminSymbolFlow, AdminSymbolFlowDailyCumulative, AdminSymbolFlowList } from "@/app/types/stock";

const WEEKLY_CUMULATIVE_DAYS = 7;
const EMPTY_PRICE_TEXT = "";

export function AdminSymbolFlowTablePanel({
  loading,
  onLoadWeekly,
  symbolFlowTotalCount,
  visibleSymbolFlows,
}: {
  loading: boolean;
  onLoadWeekly: (dayOffset: number) => Promise<AdminSymbolFlowList | null>;
  symbolFlowTotalCount: number;
  visibleSymbolFlows: AdminSymbolFlow[];
}) {
  const [showWeeklyCumulativeFlows, setShowWeeklyCumulativeFlows] = useState(false);
  const [weeklyDayOffset, setWeeklyDayOffset] = useState(0);
  const [weeklySymbolFlowList, setWeeklySymbolFlowList] = useState<AdminSymbolFlowList | null>(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weeklyError, setWeeklyError] = useState(false);

  const loadWeeklyCumulativeFlows = async (dayOffset: number) => {
    setLoadingWeekly(true);
    setWeeklyError(false);
    const nextList = await onLoadWeekly(dayOffset);
    setLoadingWeekly(false);
    if (!nextList) {
      setWeeklyError(true);
      return;
    }
    setWeeklyDayOffset(dayOffset);
    setWeeklySymbolFlowList(nextList);
  };

  const openWeeklyCumulativeFlows = () => {
    setShowWeeklyCumulativeFlows(true);
    if (!weeklySymbolFlowList && !loadingWeekly) {
      void loadWeeklyCumulativeFlows(0);
    }
  };

  return (
    <>
      <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white">시뮬레이션 하루 종목 흐름</h3>
            <p className="mt-1 text-xs font-bold text-stock-subtle">현재 조회 시점의 시뮬레이션 장 시작부터 지금까지의 체결 기준입니다.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-bold text-stock-subtle">
              거래대금 상위 {formatCount(visibleSymbolFlows.length, "개")} / 전체 {formatCount(symbolFlowTotalCount, "개")}
            </span>
            <button
              type="button"
              onClick={openWeeklyCumulativeFlows}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white"
            >
              최근 7일 누적 보기
            </button>
          </div>
        </div>
        <AdminSymbolFlowTable flows={visibleSymbolFlows} loading={loading} loadingMessage="종목 흐름을 조회하고 있습니다." emptyMessage="시뮬레이션 하루 종목 흐름이 없습니다." />
      </div>
      <AdminWeeklySymbolFlowModal
        dayOffset={weeklyDayOffset}
        error={weeklyError}
        loading={loadingWeekly}
        open={showWeeklyCumulativeFlows}
        dailyCumulativeFlows={weeklySymbolFlowList?.dailyCumulativeFlows ?? []}
        onClose={() => setShowWeeklyCumulativeFlows(false)}
        onLoadOffset={loadWeeklyCumulativeFlows}
      />
    </>
  );
}

function AdminWeeklySymbolFlowModal({
  dayOffset,
  dailyCumulativeFlows,
  error,
  loading,
  open,
  onClose,
  onLoadOffset,
}: {
  dayOffset: number;
  dailyCumulativeFlows: AdminSymbolFlowDailyCumulative[];
  error: boolean;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onLoadOffset: (dayOffset: number) => void;
}) {
  const dialogRef = useModalDialog<HTMLDivElement>(open, onClose);

  if (!open) {
    return null;
  }

  const rangeLabel = dayOffset === 0
    ? "최근 7일"
    : `${dayOffset + 1}일 전 - ${dayOffset + WEEKLY_CUMULATIVE_DAYS}일 전`;
  const dateRangeLabel = dailyCumulativeFlows.length > 0
    ? `${dailyCumulativeFlows.at(-1)?.simulationTradeDate} - ${dailyCumulativeFlows[0]?.simulationTradeDate}`
    : rangeLabel;

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="weekly-symbol-flow-title" className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="weekly-symbol-flow-title" className="text-base font-black text-white">최근 7일 누적 종목 흐름</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
              시뮬레이션 일자별 주문장 체결 누적입니다. 이전 7일 단위로 과거 구간을 넘겨 볼 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-xs font-black text-admin-accent">{dateRangeLabel}</span>
            {loading ? (
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">조회 중</span>
            ) : null}
            {error ? (
              <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-xs font-black text-admin-danger">조회 실패</span>
            ) : null}
            <button
              type="button"
              onClick={() => onLoadOffset(dayOffset + WEEKLY_CUMULATIVE_DAYS)}
              disabled={loading}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전 7일
            </button>
            <button
              type="button"
              onClick={() => onLoadOffset(Math.max(0, dayOffset - WEEKLY_CUMULATIVE_DAYS))}
              disabled={loading || dayOffset === 0}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음 7일
            </button>
            <button
              type="button"
              onClick={() => onLoadOffset(dayOffset)}
              disabled={loading}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white"
            >
              다시 조회
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-admin-canvas"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {dailyCumulativeFlows.map((dailyFlow) => (
            <section key={dailyFlow.simulationTradeDate} className="rounded-md border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-white">{dailyFlow.simulationTradeDate}</h4>
                  <p className="mt-1 text-xs font-bold text-stock-subtle">
                    {formatDateTime(dailyFlow.rangeStart)} - {formatDateTime(dailyFlow.rangeEnd)}
                  </p>
                </div>
                <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">
                  전체 {formatCount(dailyFlow.totalCount, "개")}
                </span>
              </div>
              <AdminSymbolFlowTable flows={dailyFlow.symbolFlows} loading={loading} loadingMessage="최근 7일 누적 종목 흐름을 조회하고 있습니다." emptyMessage="해당 시뮬레이션 일자의 종목 흐름이 없습니다." priceLabel="종가" />
            </section>
          ))}
          {dailyCumulativeFlows.length === 0 ? (
            <div className="rounded-md border border-white/10 px-3 py-8 text-center text-sm font-bold text-stock-subtle">
              {loading ? "최근 7일 누적 종목 흐름을 조회하고 있습니다." : "최근 7일 누적 종목 흐름이 없습니다."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AdminSymbolFlowTable({
  flows,
  loading,
  loadingMessage,
  emptyMessage,
  priceLabel = "현재가",
}: {
  flows: AdminSymbolFlow[];
  loading: boolean;
  loadingMessage: string;
  emptyMessage: string;
  priceLabel?: string;
}) {
  return (
    <>
      <DataTableViewport label="종목별 자금 흐름" tone="dark" className="mt-3 hidden md:block">
        <table className="min-w-[980px] w-full border-collapse text-sm">
        <thead className="bg-white/10 text-left text-admin-muted">
          <tr>
            <th className="px-3 py-2">종목</th>
            <th className="px-3 py-2">장</th>
            <th className="px-3 py-2 text-right">{priceLabel}</th>
            <th className="px-3 py-2 text-right">등락</th>
            <th className="px-3 py-2 text-right">거래대금</th>
            <th className="px-3 py-2 text-right">체결</th>
            <th className="px-3 py-2 text-right">대기주문</th>
            <th className="px-3 py-2 text-right">보유자</th>
            <th className="px-3 py-2">최근 체결</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {flows.map((flow) => (
            <tr key={flow.symbol}>
              <td className="px-3 py-2">
                <p className="font-black text-white">{flow.name}</p>
                <p className="mt-0.5 text-xs font-bold text-stock-subtle">{flow.symbol}</p>
              </td>
              <td className="px-3 py-2 text-xs font-bold text-admin-muted">{formatFlowMarketStatus(flow.marketStatus)}</td>
              <td className="px-3 py-2 text-right font-black tabular-nums text-white">{formatOptionalWon(flow.currentPrice)}</td>
              <td className={changeRateClassName(flow.changeRate)}>
                {formatOptionalSignedPercent(flow.changeRate)}
              </td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatWon(flow.turnoverAmount)}</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatCount(flow.executionCount, "건")}</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatCount(flow.openOrderCount, "건")}</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatCount(flow.holderCount, "명")}</td>
              <td className="px-3 py-2 text-xs font-bold text-stock-subtle">{formatDateTime(flow.lastExecutedAt)}</td>
            </tr>
          ))}
          {flows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-sm font-bold text-stock-subtle">
                {loading ? loadingMessage : emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
        </table>
      </DataTableViewport>
      <div className="mt-3 grid gap-3 md:hidden">
        {flows.map((flow) => (
          <article key={flow.symbol} className="rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{flow.name}</p>
                <p className="mt-0.5 text-[11px] font-bold text-stock-subtle">{flow.symbol} · {formatFlowMarketStatus(flow.marketStatus)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black tabular-nums text-white">{formatOptionalWon(flow.currentPrice)}</p>
                <p className={flow.changeRate == null ? "mt-0.5 text-xs font-black text-stock-subtle" : flow.changeRate >= 0 ? "mt-0.5 text-xs font-black text-admin-danger" : "mt-0.5 text-xs font-black text-admin-accent"}>{formatOptionalSignedPercent(flow.changeRate)}</p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <FlowMobileDetail label="거래대금" value={formatWon(flow.turnoverAmount)} />
              <FlowMobileDetail label="체결" value={formatCount(flow.executionCount, "건")} />
              <FlowMobileDetail label="대기 주문" value={formatCount(flow.openOrderCount, "건")} />
              <FlowMobileDetail label="보유자" value={formatCount(flow.holderCount, "명")} />
              <FlowMobileDetail label="최근 체결" value={formatDateTime(flow.lastExecutedAt)} wide />
            </dl>
          </article>
        ))}
        {flows.length === 0 ? <p className="rounded-md border border-dashed border-white/15 bg-black/15 px-3 py-5 text-center text-sm font-bold text-stock-subtle">{loading ? loadingMessage : emptyMessage}</p> : null}
      </div>
    </>
  );
}

function FlowMobileDetail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}><dt className="text-[10px] font-bold text-admin-placeholder">{label}</dt><dd className="mt-0.5 break-words font-black tabular-nums text-admin-text-strong">{value}</dd></div>;
}

function formatOptionalWon(value: number | null | undefined) {
  return value == null ? EMPTY_PRICE_TEXT : formatWon(value);
}

function formatOptionalSignedPercent(value: number | null | undefined) {
  return value == null ? EMPTY_PRICE_TEXT : formatSignedPercent(value);
}

function changeRateClassName(value: number | null | undefined) {
  if (value == null) {
    return "px-3 py-2 text-right font-black tabular-nums text-stock-subtle";
  }
  return value >= 0
    ? "px-3 py-2 text-right font-black tabular-nums text-admin-danger"
    : "px-3 py-2 text-right font-black tabular-nums text-admin-accent";
}
