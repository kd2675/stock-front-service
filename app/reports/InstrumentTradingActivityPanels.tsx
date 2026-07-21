import { formatNumber } from "@/app/lib/stockFormatters";
import {
  formatFlowCategory,
  formatLargeWon,
  formatNumberOrDash,
  formatPercentOrDash,
  formatSeconds,
} from "@/app/reports/InstrumentReportFormatters";
import { ReportSection } from "@/app/reports/InstrumentReportPanels";
import type { InstrumentInvestorFlowWindow, InstrumentMarketReport } from "@/app/types/stock";

export function InstrumentTradingActivityReport({ report }: { report: InstrumentMarketReport }) {
  const activity = report.analytics.tradingActivity;

  return (
    <ReportSection eyebrow="TRADING ACTIVITY" title="거래활동과 체결 빈도">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActivityMetric label="체결 건수" value={`${formatNumber(activity.executionCount20Days)}건`} detail="최근 20거래일, 매수 측 원장 기준" />
        <ActivityMetric label="체결 수량" value={`${formatNumber(activity.executionQuantity20Days)}주`} detail="매수·매도 중복을 제거한 거래량" />
        <ActivityMetric label="평균 체결 크기" value={formatNumberOrDash(activity.averageExecutionQuantity20Days, "주")} detail="매수 측 체결 원장 기준" />
        <ActivityMetric label="평균 체결 간격" value={formatSeconds(activity.averageSecondsBetweenTrades20Days)} detail="첫 체결부터 마지막 체결 사이" />
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-stock-subtle">
        이 영역은 체결 원장으로 확인 가능한 거래 빈도만 보여줍니다. 취소율·완전체결률·최초 체결 시간은 종목 성과가 아니라 주문 집행 품질이므로 제외합니다. 기준일의 장중 호가 이력이 없어 스프레드·호가 깊이·예상 슬리피지도 추정하지 않습니다.
      </p>
    </ReportSection>
  );
}

export function InstrumentInvestorFlowReport({ report }: { report: InstrumentMarketReport }) {
  const flow = report.analytics.investorFlow;
  return (
    <ReportSection eyebrow="PARTICIPANT FLOW" title="참여자별 수급">
      <div className="grid gap-4 xl:grid-cols-3">
        {flow.windows.map((window) => <FlowWindowCard key={window.window} window={window} />)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ActivityMetric label="자동 참여자 거래 비중" value={`${formatNumber(flow.autoParticipantExecutionShareRateLatestTradingDay)}%`} detail="최근 완료 거래일 양방향 체결금액" />
        <ActivityMetric label="최대 계좌 거래 집중도" value={`${formatNumber(flow.topAccountExecutionShareRate20Days)}%`} detail="최근 20거래일 계좌별 체결금액" />
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-stock-subtle">
        순매수 수량은 매수-매도, 순현금흐름은 매도 유입-매수 유출입니다. 실물시장 투자자 분류가 아니라 모의시장의 유저·자동 참여자·상장주관사 계정 역할을 기준으로 집계합니다.
      </p>
    </ReportSection>
  );
}

function FlowWindowCard({ window }: { window: InstrumentInvestorFlowWindow }) {
  const label = window.window === "1D" ? "기준 거래일" : `최근 ${window.window.replace("D", "")}거래일`;
  return (
    <div className="overflow-hidden rounded-md border border-stock-border">
      <div className="bg-stock-surface-muted px-3 py-3"><h3 className="text-sm font-black">{label}</h3><p className="mt-0.5 text-xs font-bold text-stock-subtle">{window.startDate} ~ {window.endDate}</p></div>
      <div className="divide-y divide-stock-border">
        {window.categories.map((category) => (
          <div key={category.category} className="px-3 py-3">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-black">{formatFlowCategory(category.category)}</p><p className={category.netQuantity >= 0 ? "text-sm font-black text-stock-danger" : "text-sm font-black text-stock-accent"}>{category.netQuantity >= 0 ? "+" : ""}{formatNumber(category.netQuantity)}주</p></div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-stock-muted"><span>매수 {formatNumber(category.buyQuantity)}주</span><span className="text-right">매도 {formatNumber(category.sellQuantity)}주</span><span>매수/매도 {formatPercentOrDash(category.buySellRatio)}</span><span className="text-right">거래 비중 {formatNumber(category.executionShareRate)}%</span><span className="col-span-2">순현금 {formatLargeWon(category.netCashFlow)}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityMetric({ detail, label, surface = "muted", value }: { detail: string; label: string; surface?: "muted" | "white"; value: string }) {
  const surfaceClass = surface === "white" ? "bg-white" : "rounded-md bg-stock-surface-muted";
  return <div className={`${surfaceClass} p-3`}><p className="text-xs font-bold text-stock-subtle">{label}</p><p className="mt-1 text-base font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">{detail}</p></div>;
}
