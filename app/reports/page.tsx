"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import useAuthSession from "@/app/hooks/useAuthSession";
import { useLoginRequiredRedirect } from "@/app/hooks/useLoginRequiredRedirect";
import { instrumentMarketReportQueryOptions, instrumentReportsQueryOptions, orderBookInstrumentsQueryOptions } from "@/app/lib/react-query/stockMarketQueries";
import { InstrumentInvestorFlowReport, InstrumentTradingActivityReport } from "@/app/reports/InstrumentTradingActivityPanels";
import { InstrumentCorporateActionAnalyticsReport, InstrumentDataQualityReport, InstrumentOwnershipReport, InstrumentReportHistory } from "@/app/reports/InstrumentOwnershipPanels";
import { InstrumentPerformanceReport, InstrumentRankingReport } from "@/app/reports/InstrumentPerformancePanels";
import { InstrumentEvaluationReport, InstrumentPriceRangeReport, InstrumentReportOverview, InstrumentTradingReport } from "@/app/reports/InstrumentReportPanels";

const REPORT_REFETCH_INTERVAL_MS = 300_000;

export default function ReportsPage() {
  const { authStatus, isHydrated } = useAuthSession();
  const [requestedSymbol, setRequestedSymbol] = useState("");
  const instrumentsQuery = useQuery(orderBookInstrumentsQueryOptions({ enabled: isHydrated && authStatus === "in" }));
  const instruments = useMemo(
    () => [...(instrumentsQuery.data ?? [])].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    [instrumentsQuery.data],
  );
  const selectedSymbol = instruments.some((instrument) => instrument.symbol === requestedSymbol)
    ? requestedSymbol
    : instruments[0]?.symbol ?? "";
  const reportQuery = useQuery(instrumentMarketReportQueryOptions(selectedSymbol, { enabled: Boolean(selectedSymbol), refetchIntervalMs: REPORT_REFETCH_INTERVAL_MS }));
  const reportHistoryQuery = useQuery(instrumentReportsQueryOptions(selectedSymbol, { enabled: Boolean(selectedSymbol) }));
  const report = reportQuery.data ?? null;

  useLoginRequiredRedirect({ authStatus, isHydrated });

  if (!isHydrated || authStatus === "unknown" || authStatus !== "in") {
    return <TradingStatusScreen>세션 확인 중</TradingStatusScreen>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#191f28]">
      <TradingTopBar active="reports" />
      <section className="border-b border-[#e5e8eb] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-xs font-black tracking-[0.12em] text-[#3182f6]">STOCK RESEARCH</p>
          <h1 className="mt-1 text-2xl font-black">종목 보고서</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#6b7684]">최신 전체 장마감일을 기준으로 종가·거래활동·수급·보유 구조·기업 이벤트를 같은 시점에서 분석합니다. 실시간 호가와 현재 계좌 운영 상태는 섞지 않습니다.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-lg border border-[#e5e8eb] bg-white p-3 lg:sticky lg:top-[92px]">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <h2 className="text-sm font-black">보고서 종목</h2>
            <span className="text-xs font-bold text-[#8b95a1]">{instruments.length}종목</span>
          </div>
          <div className="mt-1 space-y-2">
            {instruments.map((instrument) => {
              const selected = instrument.symbol === selectedSymbol;
              return (
                <button key={instrument.symbol} type="button" onClick={() => setRequestedSymbol(instrument.symbol)} className={selected ? "w-full rounded-md bg-[#eff6ff] p-3 text-left ring-1 ring-[#3182f6]" : "w-full rounded-md bg-[#f7f8fa] p-3 text-left transition hover:bg-[#f2f4f6]"}>
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-black">{instrument.name}</p><p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{instrument.symbol}</p></div><span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-black text-[#6b7684]">{instrument.market}</span></div>
                </button>
              );
            })}
            {!instrumentsQuery.isLoading && instruments.length === 0 ? <p className="rounded-md bg-[#f7f8fa] px-3 py-5 text-sm font-bold text-[#8b95a1]">등록된 주문장 종목이 없습니다.</p> : null}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {report ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e8eb] bg-white px-4 py-3 text-xs font-bold text-[#6b7684]">
                <span>보고서 기준 {report.reportDate ?? "완료 마감 없음"}</span>
                <span>마감 실행 {report.closeRunId == null ? "없음" : `#${report.closeRunId}`}</span>
                <span>마감 완료 {report.closeRunCompletedAt?.replace("T", " ") ?? "없음"}</span>
                <span>생성 {report.simulationDateTime.replace("T", " ")}</span>
                <span>데이터 상태 {report.analytics.dataQuality.level}</span>
                <span>종가 원장 {report.closePriceProvider ?? "없음"}</span>
              </div>
              <InstrumentReportOverview report={report} />
              <InstrumentTradingReport report={report} />
              <InstrumentPerformanceReport report={report} />
              <InstrumentTradingActivityReport report={report} />
              <InstrumentInvestorFlowReport report={report} />
              <InstrumentOwnershipReport report={report} />
              <InstrumentCorporateActionAnalyticsReport report={report} />
              <InstrumentRankingReport report={report} />
              <div className="grid gap-4 xl:grid-cols-2">
                <InstrumentPriceRangeReport report={report} />
                <InstrumentEvaluationReport report={report} />
              </div>
              <InstrumentReportHistory reports={reportHistoryQuery.data ?? []} />
              <InstrumentDataQualityReport report={report} />
              <section className="rounded-lg bg-[#191f28] px-4 py-4 text-xs font-bold leading-5 text-[#d1d6db]">
                시가총액은 보고서 기준 종가 × 기준일 발행주식수, 유통 시가총액은 기준 종가 × 기준일 유통주식수입니다. 거래량·거래대금은 한 거래의 매수·매도 원장 중 매수 측만 집계해 중복을 제거했습니다. 과거 호가·재무제표·공시·뉴스·보호예수처럼 원장에 없는 정보는 추정하지 않습니다. 이 화면은 모의시장 정보이며 투자 권유가 아닙니다.
              </section>
            </>
          ) : reportQuery.isError ? (
            <div className="rounded-lg border border-[#ffd8d2] bg-[#fff3f0] px-5 py-8 text-center"><p className="font-black text-[#d34b36]">종목 보고서를 불러오지 못했습니다.</p><button type="button" onClick={() => void reportQuery.refetch()} className="mt-4 h-10 rounded-md bg-[#191f28] px-4 text-sm font-black text-white">다시 조회</button></div>
          ) : (
            <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-12 text-center text-sm font-bold text-[#8b95a1]">{instrumentsQuery.isLoading || reportQuery.isLoading ? "종목 보고서를 계산하고 있습니다." : "왼쪽에서 종목을 선택하세요."}</div>
          )}
        </div>
      </div>
    </main>
  );
}
