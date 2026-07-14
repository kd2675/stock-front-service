import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import InstrumentHistoryChart from "@/app/reports/InstrumentHistoryChart";
import {
  formatLargeWon,
  formatNumberOrDash,
  formatSignedPercent,
  formatSignedPercentOrDash,
} from "@/app/reports/InstrumentReportFormatters";
import { ReportSection } from "@/app/reports/InstrumentReportPanels";
import type { InstrumentMarketReport, InstrumentMetricRank } from "@/app/types/stock";

export function InstrumentPerformanceReport({ report }: { report: InstrumentMarketReport }) {
  const performance = report.analytics.performance;
  const streak = performance.consecutiveUpDays > 0
    ? `${performance.consecutiveUpDays}거래일 연속 상승`
    : performance.consecutiveDownDays > 0
      ? `${performance.consecutiveDownDays}거래일 연속 하락`
      : "연속 상승·하락 없음";
  const trend = performance.closeTrend20Days === "UP"
    ? "상승"
    : performance.closeTrend20Days === "DOWN"
      ? "하락"
      : performance.closeTrend20Days === "FLAT"
        ? "보합"
        : "데이터 부족";

  return (
    <ReportSection eyebrow="PERFORMANCE" title="가격 성과와 위험">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <InstrumentHistoryChart history={performance.dailyHistory} />
        <div className="grid grid-cols-2 gap-2 content-start">
          <PerformanceMetric label="5일 수익률" value={formatSignedPercentOrDash(performance.return5Days)} tone={returnTone(performance.return5Days)} />
          <PerformanceMetric label="20일 수익률" value={formatSignedPercentOrDash(performance.return20Days)} tone={returnTone(performance.return20Days)} />
          <PerformanceMetric label="60일 수익률" value={formatSignedPercentOrDash(performance.return60Days)} tone={returnTone(performance.return60Days)} />
          <PerformanceMetric label="20일 변동성" value={formatNumberOrDash(performance.dailyVolatility20Days, "%")} />
          <PerformanceMetric label="20일 최고가" value={formatWon(performance.highPrice20Days)} tone="red" />
          <PerformanceMetric label="20일 최저가" value={formatWon(performance.lowPrice20Days)} tone="blue" />
          <PerformanceMetric label="고점 대비" value={formatSignedPercent(performance.drawdownFrom20DayHigh)} tone="blue" />
          <PerformanceMetric label="평균 거래량 대비" value={formatNumberOrDash(performance.volumeVsAverage20Days, "%")} />
          <PerformanceMetric label="20일 평균 거래대금" value={performance.averageTurnover20Days == null ? "-" : formatLargeWon(performance.averageTurnover20Days)} />
          <PerformanceMetric label="평균 거래대금 대비" value={formatNumberOrDash(performance.turnoverVsAverage20Days, "%")} />
          <PerformanceMetric label="20일 평균 회전율" value={formatNumberOrDash(performance.averageTurnoverRate20Days, "%")} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <SummaryItem label="20일 종가 추세" value={trend} />
        <SummaryItem label="최근 연속 흐름" value={streak} />
        <SummaryItem label="사용 가능한 마감 이력" value={`${formatNumber(performance.availableTradingDays)}거래일`} />
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-stock-subtle">
        수익률은 보고서 기준 종가와 N거래일 전 종가를 비교합니다. 변동성은 최근 20개 일간 수익률의 표본 표준편차이고, 평균 거래량·거래대금·회전율은 기준일을 제외한 직전 최대 20거래일 평균입니다.
      </p>
    </ReportSection>
  );
}

export function InstrumentRankingReport({ report }: { report: InstrumentMarketReport }) {
  const rankings = report.analytics.rankings;
  const metrics = [
    ["시가총액", rankings.marketCapitalization, formatLargeWon],
    ["거래대금", rankings.turnover, formatLargeWon],
    ["거래량", rankings.volume, (value: number) => `${formatNumber(value)}주`],
    ["등락률", rankings.returnRate, (value: number) => formatSignedPercent(value)],
    ["회전율", rankings.turnoverRate, (value: number) => `${formatNumber(value)}%`],
    ["변동성", rankings.volatility, (value: number) => `${formatNumber(value)}%`],
  ] as const;

  return (
    <ReportSection eyebrow="MARKET COMPARISON" title="시장 내 순위와 비교">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="overflow-hidden rounded-md border border-stock-border">
          <div className="grid grid-cols-[minmax(0,1fr)_90px_120px] bg-stock-surface-muted px-3 py-2 text-xs font-black text-stock-subtle">
            <span>지표</span><span className="text-right">순위</span><span className="text-right">값</span>
          </div>
          {metrics.map(([label, rank, formatter]) => (
            <RankRow key={label} label={label} rank={rank} formatter={formatter} />
          ))}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2">
            <PerformanceMetric label="시장 평균 수익률" value={formatSignedPercent(rankings.marketAverageReturnRate)} tone={returnTone(rankings.marketAverageReturnRate)} />
            <PerformanceMetric label="시장 대비 초과수익" value={formatSignedPercent(rankings.relativeReturnRate)} tone={returnTone(rankings.relativeReturnRate)} />
          </div>
          <h3 className="mt-4 text-sm font-black">유사 시가총액 종목</h3>
          <div className="mt-2 space-y-2">
            {rankings.similarMarketCapitalizationPeers.map((peer) => (
              <div key={peer.symbol} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md bg-stock-surface-muted px-3 py-2">
                <div className="min-w-0"><p className="truncate text-sm font-black">{peer.name}</p><p className="text-xs font-bold text-stock-subtle">{peer.symbol} · 종가 {formatWon(peer.closePrice)}</p></div>
                <div className="text-right"><p className="text-sm font-black">{formatLargeWon(peer.marketCapitalization)}</p><p className={peer.changeRate >= 0 ? "text-xs font-black text-stock-danger" : "text-xs font-black text-stock-accent"}>{formatSignedPercent(peer.changeRate)}</p></div>
              </div>
            ))}
            {rankings.similarMarketCapitalizationPeers.length === 0 ? <p className="rounded-md bg-stock-surface-muted px-3 py-4 text-sm font-bold text-stock-subtle">비교할 다른 종목이 없습니다.</p> : null}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-stock-subtle">모든 순위와 비교 종목 가격은 동일한 보고서 기준일의 전체 장마감 스냅샷이 있는 {rankings.instrumentCount}개 종목만 사용합니다.</p>
    </ReportSection>
  );
}

function RankRow({ formatter, label, rank }: { formatter: (value: number) => string; label: string; rank: InstrumentMetricRank }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_90px_120px] border-t border-stock-border px-3 py-2 text-sm font-bold">
      <span>{label}</span>
      <span className="text-right tabular-nums">{rank.value == null ? "-" : `${rank.rank}/${rank.total}`}</span>
      <span className="text-right tabular-nums text-stock-text-tertiary">{rank.value == null ? "산정 불가" : formatter(rank.value)}</span>
    </div>
  );
}

function PerformanceMetric({ label, tone = "default", value }: { label: string; tone?: "default" | "red" | "blue"; value: string }) {
  const toneClass = tone === "red" ? "text-stock-danger" : tone === "blue" ? "text-stock-accent" : "text-stock-ink";
  return <div className="rounded-md bg-stock-surface-muted p-3"><p className="text-xs font-bold text-stock-subtle">{label}</p><p className={`mt-1 text-base font-black tabular-nums ${toneClass}`}>{value}</p></div>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-stock-surface-muted px-3 py-2"><p className="text-xs font-bold text-stock-subtle">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>;
}

function returnTone(value?: number | null): "default" | "red" | "blue" {
  if (value == null || value === 0) {
    return "default";
  }
  return value > 0 ? "red" : "blue";
}
