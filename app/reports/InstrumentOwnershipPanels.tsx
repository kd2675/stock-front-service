import { formatMonthDay, formatMonthDayTime, formatNumber, formatWon } from "@/app/lib/stockFormatters";
import {
  formatCorporateActionStatus,
  formatCorporateActionType,
  formatLargeWon,
  formatPercentOrDash,
} from "@/app/reports/InstrumentReportFormatters";
import { ReportSection } from "@/app/reports/InstrumentReportPanels";
import type { InstrumentCorporateActionMetric, InstrumentMarketReport, InstrumentReport } from "@/app/types/stock";

export function InstrumentOwnershipReport({ report }: { report: InstrumentMarketReport }) {
  const ownership = report.analytics.ownership;
  return (
    <ReportSection eyebrow="OWNERSHIP AT CLOSE" title="마감 시점 주식 수와 보유 구조">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OwnershipMetric label="보유 계좌 수" value={`${formatNumber(ownership.holderCount)}개`} detail={`원장 반영 ${formatNumber(ownership.accountedHoldingQuantity)}주`} />
        <OwnershipMetric label="보유 원장 커버리지" value={`${formatNumber(ownership.holdingCoverageRate)}%`} detail="전체 발행량 대비 계좌 보유량" />
        <OwnershipMetric label="최대 보유 계좌" value={`${formatNumber(ownership.topHolderRate)}%`} detail={`${formatNumber(ownership.topHolderQuantity)}주`} />
        <OwnershipMetric label="상위 5계좌 집중도" value={`${formatNumber(ownership.topFiveHolderRate)}%`} detail={`${formatNumber(ownership.topFiveHolderQuantity)}주`} />
        <OwnershipMetric label="60일 발행량 변화" value={`${ownership.issuedShareChange60Days >= 0 ? "+" : ""}${formatNumber(ownership.issuedShareChange60Days)}주`} detail={`현재 ${formatNumber(report.issuedShares)}주`} />
        <OwnershipMetric label="60일 유통량 변화" value={`${ownership.tradableShareChange60Days >= 0 ? "+" : ""}${formatNumber(ownership.tradableShareChange60Days)}주`} detail={`현재 ${formatNumber(report.tradableShares)}주`} />
        <OwnershipMetric label="기준일 유통 비율" value={`${formatNumber(report.tradableShareRate)}%`} detail={formatLargeWon(report.tradableMarketCapitalization)} />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-[#e5e8eb]">
        <div className="grid grid-cols-[100px_minmax(100px,1fr)_minmax(100px,1fr)] bg-[#f7f8fa] px-3 py-2 text-xs font-black text-[#8b95a1]"><span>거래일</span><span className="text-right">발행주식</span><span className="text-right">유통주식</span></div>
        {ownership.shareHistory.slice(-10).reverse().map((point) => (
          <div key={point.tradeDate} className="grid grid-cols-[100px_minmax(100px,1fr)_minmax(100px,1fr)] border-t border-[#e5e8eb] px-3 py-2 text-sm font-bold tabular-nums"><span>{point.tradeDate}</span><span className="text-right">{formatNumber(point.issuedShares)}주 <Change value={point.issuedShareChange} /></span><span className="text-right">{formatNumber(point.tradableShares)}주 <Change value={point.tradableShareChange} /></span></div>
        ))}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-[#8b95a1]">보유량과 집중도는 보고서 기준일 전체 마감의 계좌별 보유 스냅샷을 사용하며 계좌 식별정보는 노출하지 않습니다. 별도 보호예수 원장이 없어 보호예수 비율은 산출하지 않습니다.</p>
    </ReportSection>
  );
}

export function InstrumentCorporateActionAnalyticsReport({ report }: { report: InstrumentMarketReport }) {
  const actions = report.analytics.corporateActions;
  return (
    <ReportSection eyebrow="CORPORATE ACTIONS" title="기준일까지 공시된 기업 이벤트">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OwnershipMetric label="예정·진행 이벤트" value={`${formatNumber(actions.announcedCount)}건`} detail="종류별 최종 처리 전" />
        <OwnershipMetric label="완료 이벤트" value={`${formatNumber(actions.completedCount)}건`} detail="지급·상장·폐지 완료" />
        <OwnershipMetric label="누적 지급 배당" value={`${formatNumber(actions.cumulativePaidDividendPerShare)}원/주`} detail={formatLargeWon(actions.cumulativePaidDividendCash)} />
        <OwnershipMetric label="이벤트 원장" value={`${formatNumber(actions.events.length)}건`} detail={`${report.reportDate ?? "기준일 없음"}까지 등록`} />
      </div>
      <div className="mt-4 space-y-3">
        {actions.events.map((event) => <CorporateActionCard key={event.id} event={event} />)}
        {actions.events.length === 0 ? <p className="rounded-md bg-[#f7f8fa] px-4 py-5 text-sm font-bold text-[#8b95a1]">등록된 기업 이벤트가 없습니다.</p> : null}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-[#8b95a1]">이벤트 상태는 기준일까지 기록된 적용·납입·상장 시각으로 복원합니다. 할인율은 기준가격 대비 발행가, 희석률은 이벤트 직전 발행량 대비 신규 주식 비중이며 전후 가격은 7일 이내 가장 가까운 마감가격만 사용합니다.</p>
    </ReportSection>
  );
}

export function InstrumentReportHistory({ reports }: { reports: InstrumentReport[] }) {
  return (
    <ReportSection eyebrow="REPORT HISTORY" title="관리자 평가 이력">
      <div className="space-y-2">
        {reports.map((report) => (
          <div key={report.id} className="grid gap-2 rounded-md bg-[#f7f8fa] px-3 py-3 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-start">
            <span className={report.eventType === "DELETE" ? "text-xs font-black text-[#8b95a1]" : "text-xs font-black text-[#3182f6]"}>{report.eventType === "PUBLISH" ? "발행" : report.eventType === "UPDATE" ? "수정" : "삭제"}</span>
            <div className="min-w-0"><p className="truncate text-sm font-black">{report.title ?? report.deleteReason ?? "삭제된 보고서"}</p><p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#6b7684]">{report.summary ?? report.deleteReason ?? "내용 없음"}</p></div>
            <div className="text-right"><p className="text-xs font-black">{report.score == null ? "-" : `${report.score}/10`}</p><p className="mt-1 text-xs font-bold text-[#8b95a1]">{formatMonthDayTime(report.createdAt)}</p></div>
          </div>
        ))}
        {reports.length === 0 ? <p className="rounded-md bg-[#f7f8fa] px-4 py-5 text-sm font-bold text-[#8b95a1]">발행된 관리자 평가 이력이 없습니다.</p> : null}
      </div>
    </ReportSection>
  );
}

export function InstrumentDataQualityReport({ report }: { report: InstrumentMarketReport }) {
  const quality = report.analytics.dataQuality;
  const level = quality.level === "FULL" ? "충분" : quality.level === "PARTIAL" ? "부분 충족" : "제한적";
  return (
    <ReportSection eyebrow="DATA QUALITY" title="데이터 기준과 신뢰 상태">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OwnershipMetric label="신뢰 상태" value={level} detail={`${formatNumber(quality.historicalTradingDays)}거래일 이력`} />
        <OwnershipMetric label="종가 기준시각" value={quality.closePriceAsOf ? formatMonthDayTime(quality.closePriceAsOf) : "없음"} detail={quality.priceProvider ?? "원장 없음"} />
        <OwnershipMetric label="최근 체결" value={quality.lastExecutionAt ? formatMonthDayTime(quality.lastExecutionAt) : "체결 없음"} detail={quality.executionSource} />
        <OwnershipMetric label="보고서 기준 마감" value={quality.reportDateMarketCloseCompleted ? "완료" : "미완료"} detail={quality.latestCompletedMarketCloseAt ? `${formatMonthDayTime(quality.latestCompletedMarketCloseAt)} 완료` : quality.reportDate ? `${quality.reportDate} 기준` : "완료 이력 없음"} />
        <OwnershipMetric label="과거 데이터 범위" value={quality.historyStartDate && quality.historyEndDate ? `${formatMonthDay(quality.historyStartDate)} ~ ${formatMonthDay(quality.historyEndDate)}` : "없음"} detail="차트 최대 61거래일 표시" />
        <OwnershipMetric label="기준일 체결" value={quality.hasReportDateTrades ? "있음" : "없음"} detail={quality.reportDate ?? "완료 마감 없음"} />
      </div>
      <ul className="mt-4 space-y-2 rounded-md bg-[#f7f8fa] px-4 py-3 text-sm font-bold leading-6 text-[#6b7684]">
        {quality.notes.map((note) => <li key={note}>· {note}</li>)}
      </ul>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-md border border-[#e5e8eb] p-4">
          <h3 className="text-sm font-black">주요 계산식</h3>
          <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-[#6b7684]">
            <li>· 기간 수익률 = (보고서 기준 종가 - N거래일 전 종가) ÷ N거래일 전 종가</li>
            <li>· 변동성 = 최근 20거래일 일간 수익률의 표준편차</li>
            <li>· 회전율 = 거래량 ÷ 유통주식수</li>
            <li>· 거래대금 상대비율 = 기준일 거래대금 ÷ 직전 최대 20거래일 평균</li>
            <li>· 보유 집중도 = 상위 계좌 보유수량 ÷ 기준일 발행주식수</li>
            <li>· 예상 희석률 = 신규 주식 ÷ 이벤트 후 예상 발행주식</li>
          </ul>
        </div>
        <div className="rounded-md border border-[#e5e8eb] p-4">
          <h3 className="text-sm font-black">현재 원장 한계</h3>
          <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-[#6b7684]">
            {quality.limitations.map((limitation) => <li key={limitation}>· {limitation}</li>)}
          </ul>
        </div>
      </div>
    </ReportSection>
  );
}

function CorporateActionCard({ event }: { event: InstrumentCorporateActionMetric }) {
  const dates = [
    event.exRightsDate ? `권리락 ${event.exRightsDate}` : null,
    event.subscriptionStartDate && event.subscriptionEndDate ? `청약 ${event.subscriptionStartDate}~${event.subscriptionEndDate}` : null,
    event.paymentDate ? `지급·납입 ${event.paymentDate}` : null,
    event.listingDate ? `상장 ${event.listingDate}` : null,
    event.delistingDate ? `폐지 ${event.delistingDate}` : null,
  ].filter((value): value is string => value !== null);
  const metrics = [
    event.issuePrice != null ? `발행가 ${formatWon(event.issuePrice)}` : null,
    event.basePrice != null ? `기준가 ${formatWon(event.basePrice)}` : null,
    event.theoreticalExRightsPrice != null ? `이론 권리락가 ${formatWon(event.theoreticalExRightsPrice)}` : null,
    event.issueDiscountRate != null ? `할인율 ${formatPercentOrDash(event.issueDiscountRate)}` : null,
    event.newShareRate != null ? `신주 비율 ${formatPercentOrDash(event.newShareRate)}` : null,
    event.estimatedDilutionRate != null ? `예상 희석 ${formatPercentOrDash(event.estimatedDilutionRate)}` : null,
    event.dividendYield != null ? `배당수익률 ${formatPercentOrDash(event.dividendYield)}` : null,
    event.splitRatio != null ? `분할 배수 ${formatNumber(event.splitRatio)}배` : null,
  ].filter((value): value is string => value !== null);
  return (
    <article className="rounded-md bg-[#f7f8fa] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-black">{formatCorporateActionType(event.actionType)}</h3><span className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#3182f6]">{formatCorporateActionStatus(event.status)}</span></div><p className="mt-1 text-xs font-bold text-[#8b95a1]">등록 {formatMonthDayTime(event.createdAt)}</p></div><p className="text-sm font-black">{event.shareQuantity > 0 ? `${formatNumber(event.shareQuantity)}주` : event.dividendPerShare != null ? `${formatNumber(event.dividendPerShare)}원/주` : "-"}</p></div>
      {event.description ? <p className="mt-3 text-sm font-bold leading-6 text-[#4e5968]">{event.description}</p> : null}
      {metrics.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{metrics.map((metric) => <span key={metric} className="rounded-md bg-white px-2 py-1 text-xs font-black text-[#4e5968]">{metric}</span>)}</div> : null}
      {dates.length > 0 ? <p className="mt-3 text-xs font-bold leading-5 text-[#6b7684]">{dates.join(" · ")}</p> : null}
      {event.beforePrice != null || event.afterPrice != null ? <p className="mt-2 text-xs font-bold text-[#8b95a1]">이벤트 전후 가격 {event.beforePrice == null ? "-" : formatWon(event.beforePrice)} → {event.afterPrice == null ? "-" : formatWon(event.afterPrice)} · 시가총액 {event.beforeMarketCapitalization == null ? "-" : formatLargeWon(event.beforeMarketCapitalization)} → {event.afterMarketCapitalization == null ? "-" : formatLargeWon(event.afterMarketCapitalization)}</p> : null}
      {event.beforeIssuedShares != null || event.afterIssuedShares != null ? <p className="mt-2 text-xs font-bold text-[#8b95a1]">이벤트 전후 발행주식 {event.beforeIssuedShares == null ? "-" : `${formatNumber(event.beforeIssuedShares)}주`} → {event.afterIssuedShares == null ? "-" : `${formatNumber(event.afterIssuedShares)}주`}</p> : null}
    </article>
  );
}

function OwnershipMetric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return <div className="rounded-md bg-[#f7f8fa] p-3"><p className="text-xs font-bold text-[#8b95a1]">{label}</p><p className="mt-1 text-base font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">{detail}</p></div>;
}

function Change({ value }: { value: number }) {
  if (value === 0) {
    return null;
  }
  return <span className={value > 0 ? "ml-1 text-xs text-[#f04452]" : "ml-1 text-xs text-[#3182f6]"}>{formatSignedQuantity(value)}</span>;
}

function formatSignedQuantity(value: number) {
  return `${value > 0 ? "+" : ""}${formatNumber(value)}주`;
}
