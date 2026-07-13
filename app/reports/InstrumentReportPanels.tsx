import { formatMonthDayTime, formatNumber, formatRoundedPriceOrDash, formatWon } from "@/app/lib/stockFormatters";
import { formatLargeWon, formatSignedPercent, formatSignedWon } from "@/app/reports/InstrumentReportFormatters";
import type { InstrumentMarketReport } from "@/app/types/stock";

export function InstrumentReportOverview({ report }: { report: InstrumentMarketReport }) {
  const positive = report.changeAmount >= 0;
  return (
    <section className="rounded-lg border border-[#e5e8eb] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.12em] text-[#3182f6]">CLOSING REPORT · {report.reportDate ?? "NO CLOSE"}</p>
          <h1 className="mt-1 text-2xl font-black">{report.name}</h1>
          <p className="mt-1 text-sm font-bold text-[#8b95a1]">{report.symbol} · {report.market}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums">{report.reportDate ? formatWon(report.closePrice) : "-"}</p>
          <p className={positive ? "mt-1 text-sm font-black text-[#f04452]" : "mt-1 text-sm font-black text-[#3182f6]"}>
            {formatSignedWon(report.changeAmount)} · {formatSignedPercent(report.changeRate)}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetric label="기준일 시가총액" value={formatLargeWon(report.marketCapitalization)} detail={`${formatNumber(report.issuedShares)}주 × ${formatWon(report.closePrice)}`} />
        <ReportMetric label="유통 시가총액" value={formatLargeWon(report.tradableMarketCapitalization)} detail={`유통비율 ${formatNumber(report.tradableShareRate)}%`} />
        <ReportMetric label="발행 / 유통주식" value={`${formatNumber(report.issuedShares)}주`} detail={`${formatNumber(report.tradableShares)}주 유통`} />
        <ReportMetric label="상장 후 수익률" value={formatSignedPercent(report.returnSinceListing)} detail={`상장가 ${formatWon(report.initialPrice)}`} tone={report.returnSinceListing >= 0 ? "red" : "blue"} />
      </div>
    </section>
  );
}

export function InstrumentTradingReport({ report }: { report: InstrumentMarketReport }) {
  return (
    <ReportSection eyebrow="DAILY MARKET" title={report.reportDate ? `${report.reportDate} 마감 시세` : "완료 거래 데이터 없음"}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <CompactMetric label="종가" value={formatRoundedPriceOrDash(report.closePrice)} />
        <CompactMetric label="시가" value={formatRoundedPriceOrDash(report.daily.openPrice)} />
        <CompactMetric label="고가" value={formatRoundedPriceOrDash(report.daily.highPrice)} tone="red" />
        <CompactMetric label="저가" value={formatRoundedPriceOrDash(report.daily.lowPrice)} tone="blue" />
        <CompactMetric label="VWAP" value={formatRoundedPriceOrDash(report.daily.vwap)} />
        <CompactMetric label="거래량" value={`${formatNumber(report.daily.volume)}주`} />
        <CompactMetric label="거래대금" value={formatLargeWon(report.daily.turnover)} />
        <CompactMetric label="회전율" value={`${formatNumber(report.daily.turnoverRate)}%`} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ReportRow label="체결 건수" value={`${formatNumber(report.daily.tradeCount)}건`} />
        <ReportRow label="마지막 체결" value={report.daily.lastExecutedAt ? formatMonthDayTime(report.daily.lastExecutedAt) : "체결 없음"} />
      </div>
    </ReportSection>
  );
}

export function InstrumentPriceRangeReport({ report }: { report: InstrumentMarketReport }) {
  return (
    <ReportSection eyebrow="DAILY LIMIT" title="기준일 가격제한 범위">
      <div className="grid gap-2 sm:grid-cols-2">
        <ReportRow label="기준일 전일 종가" value={formatWon(report.previousClose)} />
        <ReportRow label="가격제한폭" value={`±${formatNumber(report.priceLimitRate)}%`} />
        <ReportRow label="하한가" value={formatWon(report.lowerLimitPrice)} valueTone="blue" />
        <ReportRow label="상한가" value={formatWon(report.upperLimitPrice)} valueTone="red" />
      </div>
    </ReportSection>
  );
}

export function InstrumentEvaluationReport({ report }: { report: InstrumentMarketReport }) {
  const evaluation = report.latestEvaluation;
  return (
    <ReportSection eyebrow="ADMIN EVALUATION" title="최신 종목 평가">
      {evaluation ? (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black">{evaluation.title}</h3>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">{formatMonthDayTime(evaluation.createdAt)} · {evaluation.createdBy ?? "관리자"}</p>
            </div>
            <span className="rounded-md bg-[#eff6ff] px-3 py-2 text-sm font-black text-[#3182f6]">{evaluation.score}/10</span>
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-[#333d4b]">{evaluation.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ReasonBox label="상승 요인" value={evaluation.riseReason} tone="red" />
            <ReasonBox label="하락 요인" value={evaluation.fallReason} tone="blue" />
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-[#f7f8fa] px-4 py-5 text-sm font-bold text-[#8b95a1]">현재 활성화된 관리자 평가 보고서가 없습니다.</p>
      )}
    </ReportSection>
  );
}

export function ReportSection({ children, eyebrow, title }: { children: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="rounded-lg border border-[#e5e8eb] bg-white p-5">
      <p className="text-xs font-black tracking-[0.12em] text-[#3182f6]">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ReportMetric({ detail, label, tone = "default", value }: { detail: string; label: string; tone?: "default" | "red" | "blue"; value: string }) {
  const toneClass = tone === "red" ? "text-[#f04452]" : tone === "blue" ? "text-[#3182f6]" : "text-[#191f28]";
  return <div className="rounded-md bg-[#f7f8fa] p-4"><p className="text-xs font-bold text-[#8b95a1]">{label}</p><p className={`mt-1 text-xl font-black tabular-nums ${toneClass}`}>{value}</p><p className="mt-1 text-xs font-bold text-[#8b95a1]">{detail}</p></div>;
}

function CompactMetric({ label, tone = "default", value }: { label: string; tone?: "default" | "red" | "blue"; value: string }) {
  const toneClass = tone === "red" ? "text-[#f04452]" : tone === "blue" ? "text-[#3182f6]" : "text-[#191f28]";
  return <div className="rounded-md bg-[#f7f8fa] p-3"><p className="text-xs font-bold text-[#8b95a1]">{label}</p><p className={`mt-1 text-base font-black tabular-nums ${toneClass}`}>{value}</p></div>;
}

function ReportRow({ label, value, valueTone = "default" }: { label: string; value: string; valueTone?: "default" | "red" | "blue" }) {
  const toneClass = valueTone === "red" ? "text-[#f04452]" : valueTone === "blue" ? "text-[#3182f6]" : "text-[#333d4b]";
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md bg-[#f7f8fa] px-3 py-2 text-sm font-bold"><span className="text-[#8b95a1]">{label}</span><span className={`text-right tabular-nums ${toneClass}`}>{value}</span></div>;
}

function ReasonBox({ label, tone, value }: { label: string; tone: "red" | "blue"; value?: string | null }) {
  return <div className="rounded-md bg-[#f7f8fa] p-3"><p className={tone === "red" ? "text-xs font-black text-[#f04452]" : "text-xs font-black text-[#3182f6]"}>{label}</p><p className="mt-2 text-sm font-bold leading-6 text-[#4e5968]">{value || "등록된 내용이 없습니다."}</p></div>;
}
