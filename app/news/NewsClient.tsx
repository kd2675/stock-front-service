"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import { getMarketNews } from "@/app/lib/stock";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { stockQueryOptions } from "@/app/lib/react-query/stockQueryCore";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import type { MarketNews } from "@/app/types/stock";

type DirectionFilter = "ALL" | MarketNews["direction"];

const DIRECTION_FILTERS: Array<{ label: string; value: DirectionFilter }> = [
  { label: "전체", value: "ALL" },
  { label: "긍정", value: "POSITIVE" },
  { label: "중립", value: "NEUTRAL" },
  { label: "부정", value: "NEGATIVE" },
  { label: "불확실", value: "UNCERTAIN" },
];

export default function NewsClient() {
  const [direction, setDirection] = useState<DirectionFilter>("ALL");
  const [symbol, setSymbol] = useState("ALL");
  const newsQuery = useQuery(stockQueryOptions({
    queryKey: stockKeys.marketNews(undefined, 100),
    request: () => getMarketNews(undefined, 100),
    fallbackMessage: "시장 뉴스를 조회하지 못했습니다.",
    refetchInterval: 5_000,
  }));
  const news = useMemo(() => newsQuery.data ?? [], [newsQuery.data]);
  const symbols = useMemo(
    () => [...new Set(news.map((item) => item.scopeKey))].sort((left, right) => left.localeCompare(right)),
    [news],
  );
  const filteredNews = news.filter((item) => (
    (symbol === "ALL" || item.scopeKey === symbol)
    && (direction === "ALL" || item.direction === direction)
  ));
  const latest = filteredNews[0] ?? null;

  return (
    <main className="min-h-screen bg-stock-canvas text-stock-ink">
      <TradingTopBar active="news" />

      <section className="border-b border-stock-border bg-stock-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-admin-accent">SIMULATION DISCLOSURE WIRE</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">시장 뉴스</h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-admin-muted">
                시뮬레이션 시각에 실제 공개된 기업 사실만 표시합니다. 예약 공시는 공개 전 노출되지 않으며 정정·철회는 원문을 덮어쓰지 않습니다.
              </p>
            </div>
            <div className="border-l-2 border-stock-accent pl-4">
              <p className="text-xs font-black text-admin-subtle">최근 공개</p>
              <p className="mt-1 text-sm font-black text-white">{latest?.headline ?? "공개된 뉴스가 없습니다."}</p>
              <p className="mt-2 text-xs font-bold text-admin-muted">{latest ? `${latest.scopeKey} · ${formatSimulationDateTime(latest.publishedAt ?? latest.embargoUntil)}` : "-"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-3 border-b border-stock-border pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="뉴스 방향 필터">
            {DIRECTION_FILTERS.map((filter) => (
              <button key={filter.value} type="button" onClick={() => setDirection(filter.value)} className={direction === filter.value ? "h-10 rounded-md bg-stock-ink px-4 text-sm font-black text-white" : "h-10 rounded-md bg-stock-surface-strong px-4 text-sm font-black text-stock-muted hover:text-stock-ink"}>{filter.label}</button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-xs font-black text-stock-muted">
            종목
            <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="h-10 min-w-44 rounded-md border border-stock-border bg-white px-3 text-sm font-black text-stock-ink">
              <option value="ALL">전체 종목</option>
              {symbols.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black">공개 뉴스 {filteredNews.length}건</h2>
            <button type="button" onClick={() => void newsQuery.refetch()} disabled={newsQuery.isFetching} className="text-xs font-black text-stock-accent disabled:opacity-50">{newsQuery.isFetching ? "갱신 중" : "새로고침"}</button>
          </div>

          <div className="divide-y divide-stock-border border-y border-stock-border bg-white">
            {filteredNews.map((item) => (
              <article key={item.publicationId} className="grid gap-4 px-4 py-5 sm:px-5 md:grid-cols-[130px_minmax(0,1fr)_150px] md:items-start">
                <div>
                  <p className="font-mono text-sm font-black text-stock-ink">{item.scopeKey}</p>
                  <p className="mt-1 text-xs font-bold text-stock-subtle">revision {item.revisionNo}</p>
                  <span className={`mt-3 inline-block border-l-2 pl-2 text-xs font-black ${directionClass(item.direction)}`}>{directionLabel(item.direction)}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black text-stock-subtle">
                    <span>{publicationLabel(item.publicationType)}</span>
                    <span>·</span>
                    <span>{factTypeLabel(item.factType)}</span>
                    <span>·</span>
                    <span>중요도 {item.materiality.toFixed(2)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black leading-7">{item.headline}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-stock-muted">{item.summary}</p>
                  <details className="mt-3">
                    <summary className="w-fit text-xs font-black text-stock-accent">본문 보기</summary>
                    <p className="mt-3 whitespace-pre-wrap border-l-2 border-stock-border pl-4 text-sm font-semibold leading-7 text-stock-text-tertiary">{item.body}</p>
                  </details>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs font-black text-stock-text-secondary">{formatSimulationDateTime(item.publishedAt ?? item.embargoUntil)}</p>
                  <p className="mt-1 text-xs font-bold text-stock-subtle">{item.sourceLabel}</p>
                  <p className="mt-3 text-[11px] font-bold text-stock-disabled">모든 시각은 시뮬레이션 기준</p>
                </div>
              </article>
            ))}
            {newsQuery.isLoading ? <p className="px-5 py-14 text-center text-sm font-bold text-stock-subtle">공개 뉴스를 불러오고 있습니다.</p> : null}
            {newsQuery.isError ? <p className="px-5 py-14 text-center text-sm font-bold text-stock-danger-strong">{getStockErrorMessage(newsQuery.error, "시장 뉴스를 조회하지 못했습니다.")}</p> : null}
            {!newsQuery.isLoading && !newsQuery.isError && filteredNews.length === 0 ? <p className="px-5 py-14 text-center text-sm font-bold text-stock-subtle">조건에 맞는 공개 뉴스가 없습니다.</p> : null}
          </div>
        </section>

        <p className="mt-5 text-xs font-bold leading-5 text-stock-subtle">
          뉴스는 자동참여자에게 계좌별 확률과 지연을 거쳐 인지될 수 있지만 주문을 강제하지 않습니다. 가격과 거래량은 기존 주문장 체결 결과로만 형성됩니다.
        </p>
      </div>
    </main>
  );
}

function directionLabel(direction: MarketNews["direction"]) {
  return { POSITIVE: "긍정", NEUTRAL: "중립", NEGATIVE: "부정", UNCERTAIN: "불확실" }[direction];
}

function directionClass(direction: MarketNews["direction"]) {
  if (direction === "POSITIVE") return "border-stock-success text-stock-success";
  if (direction === "NEGATIVE") return "border-stock-danger text-stock-danger-strong";
  if (direction === "UNCERTAIN") return "border-stock-warning text-stock-warning";
  return "border-stock-subtle text-stock-muted";
}

function publicationLabel(type: MarketNews["publicationType"]) {
  return { DISCLOSURE: "공시", FLASH: "속보", FULL_ARTICLE: "상세 기사", CORRECTION: "정정", RETRACTION: "철회" }[type];
}

function factTypeLabel(type: MarketNews["factType"]) {
  const labels: Partial<Record<MarketNews["factType"], string>> = {
    ANALYST_OPINION: "분석 의견",
    INITIAL_ISSUE: "최초 발행",
    CAPITAL_INCREASE: "유상증자",
    CASH_DIVIDEND: "현금배당",
    STOCK_SPLIT: "주식분할",
    BONUS_ISSUE: "무상증자",
    STOCK_DIVIDEND: "주식배당",
    DELISTING: "상장폐지",
    LARGE_CONTRACT: "대형 계약",
    CONTRACT_TERMINATION: "계약 해지",
    PRODUCTION_HALT: "생산 중단",
    LITIGATION: "소송",
    MANAGEMENT_CHANGE: "경영진 변경",
  };
  return labels[type] ?? type;
}

function formatSimulationDateTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}
