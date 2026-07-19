"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import AssetLineChart from "@/app/components/AssetLineChart";
import DataTableViewport from "@/app/components/DataTableViewport";
import TradingStatusBox, { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import TradingTopBar from "@/app/components/TradingTopBar";
import { useAccountRequiredRedirect } from "@/app/hooks/useAccountRequiredRedirect";
import useAuthSession from "@/app/hooks/useAuthSession";
import { useLoginRequiredRedirect } from "@/app/hooks/useLoginRequiredRedirect";
import { getAccessTokenForAuthStatus } from "@/app/lib/auth";
import {
  accountStatusQueryOptions,
  executionsQueryOptions,
  holdingsQueryOptions,
  ordersQueryOptions,
  portfolioQueryOptions,
  portfolioSnapshotsQueryOptions,
  profitSummaryQueryOptions,
  profileQueryOptions,
} from "@/app/lib/react-query/stockAccountQueries";
import { formatKoKrFixedTwo, formatKoKrInteger } from "@/app/lib/localeFormatters";
import { formatMonthDayTime, formatWon } from "@/app/lib/stockFormatters";
import type { Execution, Holding, Portfolio, PortfolioSnapshot, ProfitSummary } from "@/app/types/stock";

type HoldingFilter = "ALL" | "GAIN" | "LOSS" | "RESERVED";
type HoldingSort = "VALUE" | "RETURN" | "PROFIT" | "SYMBOL";

type HoldingRow = Holding & {
  allocationRate: number;
  purchaseAmount: number;
  returnRate: number;
};

const FILTERS: Array<{ label: string; value: HoldingFilter }> = [
  { label: "전체", value: "ALL" },
  { label: "수익", value: "GAIN" },
  { label: "손실", value: "LOSS" },
  { label: "예약", value: "RESERVED" },
];

const SORTS: Array<{ label: string; value: HoldingSort }> = [
  { label: "평가금액", value: "VALUE" },
  { label: "수익률", value: "RETURN" },
  { label: "평가손익", value: "PROFIT" },
  { label: "종목", value: "SYMBOL" },
];

const EMPTY_EXECUTIONS: Execution[] = [];
const EMPTY_HOLDINGS: Holding[] = [];

export default function PortfolioClient() {
  const { authStatus, isHydrated, user } = useAuthSession();
  const token = getAccessTokenForAuthStatus(authStatus);
  const [filter, setFilter] = useState<HoldingFilter>("ALL");
  const [sort, setSort] = useState<HoldingSort>("VALUE");

  const profileQuery = useQuery(profileQueryOptions(token));
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token));
  const hasTradingAccount = accountStatusQuery.data?.hasAccount === true || Boolean(profileQuery.data?.account);
  const portfolioQuery = useQuery(portfolioQueryOptions(token, hasTradingAccount));
  const holdingsQuery = useQuery(holdingsQueryOptions(token, hasTradingAccount));
  const profitSummaryQuery = useQuery(profitSummaryQueryOptions(token, hasTradingAccount));
  const portfolioSnapshotsQuery = useQuery(portfolioSnapshotsQueryOptions(token, hasTradingAccount));
  const ordersQuery = useQuery(ordersQueryOptions(token, { enabled: hasTradingAccount, limit: 50 }));
  const executionsQuery = useQuery(executionsQueryOptions(token, { enabled: hasTradingAccount, limit: 50 }));

  useLoginRequiredRedirect({ authStatus, isHydrated });
  useAccountRequiredRedirect({
    accountStatusPending: accountStatusQuery.isPending,
    authStatus,
    hasTradingAccount,
    isHydrated,
    nextPath: "/portfolio",
  });

  const portfolio = portfolioQuery.data ?? null;
  const profitSummary = profitSummaryQuery.data ?? null;
  const holdings = holdingsQuery.data ?? portfolio?.holdings ?? EMPTY_HOLDINGS;
  const snapshots = portfolioSnapshotsQuery.data ?? [];
  const executions = executionsQuery.data ?? EMPTY_EXECUTIONS;
  const openOrders = (ordersQuery.data ?? []).filter((order) => order.status === "PENDING" || order.status === "PARTIALLY_FILLED");
  const isFetching = portfolioQuery.isFetching || holdingsQuery.isFetching || profitSummaryQuery.isFetching || portfolioSnapshotsQuery.isFetching || executionsQuery.isFetching;

  const holdingRows = useMemo(() => buildHoldingRows(holdings, portfolio), [holdings, portfolio]);
  const filteredRows = useMemo(() => filterAndSortHoldingRows(holdingRows, filter, sort), [filter, holdingRows, sort]);
  const totals = useMemo(() => buildPortfolioTotals(portfolio, profitSummary, holdingRows), [holdingRows, portfolio, profitSummary]);
  const recentBuyExecutions = useMemo(() => executions.filter((execution) => execution.side === "BUY").slice(0, 6), [executions]);

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return <TradingStatusScreen>세션 확인 중</TradingStatusScreen>;
  }

  if (accountStatusQuery.isPending) {
    return <TradingStatusScreen>계좌 확인 중</TradingStatusScreen>;
  }

  if (!hasTradingAccount) {
    return <TradingStatusScreen>계좌 필요 화면으로 이동 중</TradingStatusScreen>;
  }

  return (
    <main className="min-h-screen bg-stock-canvas text-stock-ink">
      <TradingTopBar
        active="portfolio"
        actions={(
          <span className="hidden h-11 items-center rounded-md bg-stock-surface-strong px-3 text-sm font-bold text-stock-text-tertiary sm:inline-flex">
            {isFetching ? "갱신 중" : "잔고 자동 갱신"}
          </span>
        )}
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 space-y-5">
          <PortfolioHeader
            accountCode={portfolio?.account.accountCode ?? profileQuery.data?.account?.accountCode ?? "-"}
            returnRate={portfolio?.returnRate ?? 0}
            totalAsset={portfolio?.totalAsset ?? 0}
            username={profileQuery.data?.username ?? user?.username ?? "사용자"}
          />

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PortfolioMetric label="총매입" value={formatWon(totals.purchaseAmount)} />
            <PortfolioMetric label="총평가" value={formatWon(portfolio?.marketValue)} />
            <PortfolioMetric label="평가손익" value={formatSignedWon(totals.unrealizedProfit)} tone={profitTone(totals.unrealizedProfit)} />
            <PortfolioMetric label="보유 수익률" value={formatPercent(totals.holdingReturnRate)} tone={profitTone(totals.holdingReturnRate)} />
          </section>

          <HoldingSection
            filter={filter}
            rows={filteredRows}
            sort={sort}
            totalRows={holdingRows.length}
            onFilterChange={setFilter}
            onSortChange={setSort}
          />
        </div>

        <aside className="min-w-0 space-y-5">
          <AccountSummaryPanel
            openOrderCount={openOrders.length}
            portfolio={portfolio}
            profitSummary={profitSummary}
            totals={totals}
          />
          <PortfolioHistoryPanel snapshots={snapshots} />
          <RecentBuyPanel executions={recentBuyExecutions} />
        </aside>
      </section>
    </main>
  );
}

function PortfolioHeader({
  accountCode,
  returnRate,
  totalAsset,
  username,
}: {
  accountCode: string;
  returnRate: number;
  totalAsset: number;
  username: string;
}) {
  return (
    <header className="overflow-hidden rounded-lg bg-stock-ink p-5 text-white shadow-[0_18px_50px_rgba(25,31,40,0.16)]">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.18em] text-stock-subtle">MY STOCKS</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal sm:text-4xl">내 주식 잔고</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stock-disabled">
            {username}님의 보유 종목, 매입 금액, 평가손익과 수익률을 현재가 기준으로 확인합니다.
          </p>
        </div>
        <div className="min-w-0 rounded-md bg-white/8 px-3 py-2 text-right ring-1 ring-white/10">
          <p className="text-xs font-bold text-stock-disabled">계좌</p>
          <p className="mt-1 max-w-[220px] truncate text-sm font-black">{accountCode}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] md:items-end">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stock-disabled">추정 총자산</p>
          <p className="mt-1 min-w-0 break-words text-[clamp(2.4rem,8vw,4.8rem)] font-black leading-none tabular-nums">
            {formatWon(totalAsset)}
          </p>
        </div>
        <div className="min-w-0 rounded-md bg-white p-4 text-stock-ink">
          <p className="text-xs font-bold text-stock-muted">계좌 수익률</p>
          <p className={`mt-1 text-3xl font-black tabular-nums ${profitTextClass(returnRate)}`}>{formatPercent(returnRate)}</p>
        </div>
      </div>
    </header>
  );
}

function PortfolioMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  return (
    <section className="min-w-0 rounded-lg bg-white p-4 shadow-[var(--shadow-panel)] ring-1 ring-stock-divider">
      <p className="text-sm font-bold text-stock-muted">{label}</p>
      <p className={`mt-2 min-w-0 break-words text-xl font-black tabular-nums ${toneClassName(tone)}`}>{value}</p>
    </section>
  );
}

function HoldingSection({
  filter,
  rows,
  sort,
  totalRows,
  onFilterChange,
  onSortChange,
}: {
  filter: HoldingFilter;
  rows: HoldingRow[];
  sort: HoldingSort;
  totalRows: number;
  onFilterChange: (value: HoldingFilter) => void;
  onSortChange: (value: HoldingSort) => void;
}) {
  return (
    <section className="min-w-0 rounded-lg bg-white p-5 shadow-[var(--shadow-panel)] ring-1 ring-stock-divider">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">보유 종목</h2>
          <p className="mt-1 text-sm font-semibold text-stock-muted">총 {totalRows}종목 · 평균단가 대비 현재가 기준</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as HoldingSort)}
            className="h-11 rounded-md border border-stock-border-strong bg-white px-3 text-sm font-bold text-stock-text-secondary outline-none"
            aria-label="보유 종목 정렬"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={[
              "h-9 rounded-md px-3 text-sm font-black transition-colors",
              filter === option.value ? "bg-stock-ink text-white" : "bg-stock-surface-strong text-stock-text-tertiary hover:bg-stock-border",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      {rows.length ? (
        <>
          <DataTableViewport label="보유 종목" className="mt-5 hidden lg:block">
            <table className="w-full min-w-[920px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs font-black text-stock-subtle">
                  <th className="border-b border-stock-border px-3 py-3">종목</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">보유/가용</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">평단/현재가</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">매입금액</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">평가금액</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">평가손익</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">수익률</th>
                  <th className="border-b border-stock-border px-3 py-3 text-right">비중</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <HoldingTableRow key={row.symbol} row={row} />
                ))}
              </tbody>
            </table>
          </DataTableViewport>
          <div className="mt-5 grid gap-3 lg:hidden">
            {rows.map((row) => (
              <HoldingMobileRow key={row.symbol} row={row} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5">
          <TradingStatusBox>조건에 맞는 보유 종목이 없습니다.</TradingStatusBox>
        </div>
      )}
    </section>
  );
}

function HoldingTableRow({ row }: { row: HoldingRow }) {
  return (
    <tr className="group">
      <td className="border-b border-stock-surface-strong px-3 py-4">
        <p className="font-black">{row.symbol}</p>
        {row.reservedQuantity > 0 ? <p className="mt-1 text-xs font-bold text-stock-danger">매도 예약 {formatKoKrInteger(row.reservedQuantity)}주</p> : null}
      </td>
      <td className="border-b border-stock-surface-strong px-3 py-4 text-right font-bold tabular-nums">
        {formatKoKrInteger(row.quantity)}주
        <p className="mt-1 text-xs text-stock-subtle">가용 {formatKoKrInteger(row.availableQuantity)}주</p>
      </td>
      <td className="border-b border-stock-surface-strong px-3 py-4 text-right font-bold tabular-nums">
        {formatWon(row.averagePrice)}
        <p className="mt-1 text-xs text-stock-subtle">현재 {formatWon(row.currentPrice)}</p>
      </td>
      <td className="border-b border-stock-surface-strong px-3 py-4 text-right font-black tabular-nums">{formatWon(row.purchaseAmount)}</td>
      <td className="border-b border-stock-surface-strong px-3 py-4 text-right font-black tabular-nums">{formatWon(row.marketValue)}</td>
      <td className={`border-b border-stock-surface-strong px-3 py-4 text-right font-black tabular-nums ${profitTextClass(row.unrealizedProfit)}`}>
        {formatSignedWon(row.unrealizedProfit)}
      </td>
      <td className={`border-b border-stock-surface-strong px-3 py-4 text-right font-black tabular-nums ${profitTextClass(row.returnRate)}`}>
        {formatPercent(row.returnRate)}
      </td>
      <td className="border-b border-stock-surface-strong px-3 py-4 text-right">
        <AllocationCell rate={row.allocationRate} />
      </td>
    </tr>
  );
}

function HoldingMobileRow({ row }: { row: HoldingRow }) {
  return (
    <article className="rounded-lg bg-stock-surface-muted p-4 ring-1 ring-stock-divider">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black">{row.symbol}</h3>
          <p className="mt-1 text-xs font-bold text-stock-subtle">보유 {formatKoKrInteger(row.quantity)}주 · 가용 {formatKoKrInteger(row.availableQuantity)}주</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black tabular-nums">{formatWon(row.marketValue)}</p>
          <p className={`mt-1 text-sm font-black tabular-nums ${profitTextClass(row.returnRate)}`}>{formatPercent(row.returnRate)}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <MiniLine label="평균단가" value={formatWon(row.averagePrice)} />
        <MiniLine label="현재가" value={formatWon(row.currentPrice)} />
        <MiniLine label="매입금액" value={formatWon(row.purchaseAmount)} />
        <MiniLine label="평가손익" value={formatSignedWon(row.unrealizedProfit)} tone={profitTone(row.unrealizedProfit)} />
      </div>
      <div className="mt-4">
        <AllocationCell rate={row.allocationRate} />
      </div>
    </article>
  );
}

function AccountSummaryPanel({
  openOrderCount,
  portfolio,
  profitSummary,
  totals,
}: {
  openOrderCount: number;
  portfolio: Portfolio | null;
  profitSummary: ProfitSummary | null;
  totals: PortfolioTotals;
}) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-[var(--shadow-panel)] ring-1 ring-stock-divider">
      <h2 className="text-lg font-black">계좌 요약</h2>
      <p className="mt-1 text-xs font-semibold leading-5 text-stock-subtle">
        실현손익·체결금액·수수료·세금은 체결 원장 보호를 위해 비동기 집계됩니다. 정상 집계 시 약 30초 늦을 수 있고, 장애·재기동 시에는 야간 원본 대사 후 확정됩니다.
      </p>
      <div className="mt-4 space-y-3">
        <SummaryLine label="현금" value={formatWon(portfolio?.account.cashBalance)} />
        <SummaryLine label="예약 현금" value={formatWon(portfolio?.reservedBuyCash)} />
        <SummaryLine label="미체결 주문" value={`${openOrderCount}건`} />
        <SummaryLine label="실현손익" value={formatSignedWon(profitSummary?.realizedProfit ?? 0)} tone={profitTone(profitSummary?.realizedProfit ?? 0)} />
        <SummaryLine label="총 손익" value={formatSignedWon(profitSummary?.totalProfit ?? totals.unrealizedProfit)} tone={profitTone(profitSummary?.totalProfit ?? totals.unrealizedProfit)} />
        <SummaryLine label="수수료/세금" value={formatWon((profitSummary?.totalFeeAmount ?? 0) + (profitSummary?.totalTaxAmount ?? 0))} />
      </div>
    </section>
  );
}

function PortfolioHistoryPanel({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  const latest = snapshots[0];
  return (
    <section className="rounded-lg bg-white p-5 shadow-[var(--shadow-panel)] ring-1 ring-stock-divider">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">자산 이력</h2>
        <span className="text-xs font-bold text-stock-subtle">{latest ? formatMonthDayTime(latest.snapshotDate) : "기록 없음"}</span>
      </div>
      <AssetLineChart snapshots={snapshots} />
      {snapshots.length ? (
        <div className="mt-4 space-y-2">
          {snapshots.slice(0, 4).map((snapshot) => (
            <SummaryLine
              key={snapshot.snapshotDate}
              label={formatMonthDayTime(snapshot.snapshotDate)}
              value={`${formatWon(snapshot.totalAsset)} · ${formatPercent(snapshot.returnRate)}`}
              tone={profitTone(snapshot.returnRate)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RecentBuyPanel({ executions }: { executions: Execution[] }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-[var(--shadow-panel)] ring-1 ring-stock-divider">
      <h2 className="text-lg font-black">최근 매수 금액</h2>
      <p className="mt-1 text-sm font-semibold text-stock-muted">이전에 체결된 매수 주문 기준입니다.</p>
      <div className="mt-4 space-y-2">
        {executions.length ? executions.map((execution) => (
          <article key={execution.id} className="rounded-md bg-stock-surface-muted px-3 py-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-black">{execution.symbol}</p>
              <p className="shrink-0 text-sm font-black tabular-nums">{formatWon(execution.grossAmount)}</p>
            </div>
            <p className="mt-1 text-xs font-bold text-stock-subtle">
              {formatKoKrInteger(execution.quantity)}주 · {formatWon(execution.price)} · {formatMonthDayTime(execution.executedAt)}
            </p>
          </article>
        )) : (
          <p className="rounded-md bg-stock-surface-muted px-3 py-4 text-sm font-bold text-stock-subtle">최근 매수 체결이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function SummaryLine({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-stock-surface-strong pb-2 last:border-b-0 last:pb-0">
      <span className="min-w-0 truncate text-sm font-bold text-stock-muted">{label}</span>
      <span className={`shrink-0 text-right text-sm font-black tabular-nums ${toneClassName(tone)}`}>{value}</span>
    </div>
  );
}

function MiniLine({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" | "blue" }) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-xs font-bold text-stock-subtle">{label}</p>
      <p className={`mt-1 min-w-0 break-words text-sm font-black tabular-nums ${toneClassName(tone)}`}>{value}</p>
    </div>
  );
}

function AllocationCell({ rate }: { rate: number }) {
  const width = Math.min(100, Math.max(0, rate));
  return (
    <div className="min-w-[120px]">
      <p className="text-xs font-black tabular-nums text-stock-text-tertiary">{formatPercent(rate)}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-sm bg-stock-divider">
        <div className="h-full rounded-sm bg-stock-accent" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

type PortfolioTotals = {
  holdingReturnRate: number;
  purchaseAmount: number;
  unrealizedProfit: number;
};

function buildPortfolioTotals(portfolio: Portfolio | null, profitSummary: ProfitSummary | null, rows: HoldingRow[]): PortfolioTotals {
  const purchaseAmount = rows.reduce((sum, row) => sum + row.purchaseAmount, 0);
  const unrealizedProfit = profitSummary?.unrealizedProfit ?? rows.reduce((sum, row) => sum + row.unrealizedProfit, 0);
  const holdingReturnRate = purchaseAmount > 0 ? (unrealizedProfit / purchaseAmount) * 100 : portfolio?.returnRate ?? 0;
  return {
    holdingReturnRate,
    purchaseAmount,
    unrealizedProfit,
  };
}

function buildHoldingRows(holdings: Holding[], portfolio: Portfolio | null): HoldingRow[] {
  const marketValue = portfolio?.marketValue ?? holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  return holdings.map((holding) => {
    const purchaseAmount = holding.averagePrice * holding.quantity;
    const returnRate = purchaseAmount > 0 ? (holding.unrealizedProfit / purchaseAmount) * 100 : 0;
    const allocationRate = marketValue > 0 ? (holding.marketValue / marketValue) * 100 : 0;
    return {
      ...holding,
      allocationRate,
      purchaseAmount,
      returnRate,
    };
  });
}

function filterAndSortHoldingRows(rows: HoldingRow[], filter: HoldingFilter, sort: HoldingSort) {
  const filtered = rows.filter((row) => {
    switch (filter) {
      case "GAIN":
        return row.unrealizedProfit > 0;
      case "LOSS":
        return row.unrealizedProfit < 0;
      case "RESERVED":
        return row.reservedQuantity > 0;
      case "ALL":
        return true;
    }
  });

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "RETURN":
        return b.returnRate - a.returnRate;
      case "PROFIT":
        return b.unrealizedProfit - a.unrealizedProfit;
      case "SYMBOL":
        return a.symbol.localeCompare(b.symbol);
      case "VALUE":
        return b.marketValue - a.marketValue;
    }
  });
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatKoKrFixedTwo(value)}%`;
}

function formatSignedWon(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatWon(value)}`;
}

function profitTone(value: number): "default" | "red" | "blue" {
  if (value > 0) {
    return "red";
  }
  if (value < 0) {
    return "blue";
  }
  return "default";
}

function profitTextClass(value: number) {
  return toneClassName(profitTone(value));
}

function toneClassName(tone: "default" | "red" | "blue") {
  if (tone === "red") {
    return "text-stock-danger";
  }
  if (tone === "blue") {
    return "text-stock-accent";
  }
  return "text-stock-ink";
}
