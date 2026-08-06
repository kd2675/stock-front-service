import {
  formatCompactWon,
  formatDateTime,
  formatInteger,
  formatMarketFlowSourceStatus,
  formatNumber,
  formatSignedPercent,
} from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminMarketIndex } from "@/app/types/stock";

type AdminMarketIndexPanelProps = {
  index: AdminMarketIndex | null;
  error: boolean;
  loading: boolean;
};

export function AdminMarketIndexPanel({
  index,
  error,
  loading,
}: AdminMarketIndexPanelProps) {
  if (!index) {
    return (
      <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white">전체 장 지수</h3>
            <p className="mt-1 text-xs font-bold text-stock-subtle">
              1/100 시장 계약의 MATURE 종목을 고정 주식수 시가총액 방식으로 계산합니다.
            </p>
          </div>
          <span className={error
            ? "rounded-md bg-admin-danger-surface px-2 py-1 text-xs font-black text-admin-danger"
            : "rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft"}
          >
            {error ? "지수 조회 실패" : loading ? "지수 계산 중" : "활성 계약 대기"}
          </span>
        </div>
      </div>
    );
  }

  const changeTone = index.changeValue > 0
    ? "text-admin-success"
    : index.changeValue < 0
      ? "text-admin-danger"
      : "text-white";
  const recentHistory = index.history.slice(-7);

  return (
    <section className="mt-4 overflow-hidden rounded-md border border-white/10 bg-black/20" aria-label="전체 장 지수">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{index.name}</h3>
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-[10px] font-black text-admin-accent">
              {index.simulationTradeDate}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-admin-accent-soft">
              {formatMarketFlowSourceStatus(index.sourceStatus)}
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            계약 V{formatInteger(index.contractVersion)} · 기준 {index.referenceDate} · 고정 주식수 시가총액 가중
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums tracking-tight text-white">
            {formatNumber(index.currentValue)}
          </p>
          <p className={`mt-1 text-sm font-black tabular-nums ${changeTone}`}>
            {formatSignedNumber(index.changeValue)} · {formatSignedPercent(index.changeRate * 100)}
          </p>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-3">
        <IndexMetric label="전일 지수" value={formatNumber(index.previousCloseValue)} />
        <IndexMetric
          label="현재 시가총액"
          value={formatCompactWon(index.currentMarketCapitalization)}
        />
        <IndexMetric
          label="구성 정합성"
          value={`${formatInteger(index.constituentCount)}/${formatInteger(index.expectedConstituentCount)}${index.complete ? " · 완전" : " · 불완전"}`}
          warning={!index.complete}
        />
      </div>

      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-white">최근 완료장</h4>
            <span className="text-[10px] font-bold text-stock-subtle">
              현재 거래일은 상단 지수로 별도 표시
            </span>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentHistory.map((point) => (
              <div key={point.simulationTradeDate} className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-stock-subtle">
                  <span>{point.simulationTradeDate}</span>
                  <span>{point.complete ? `${point.constituentCount}종목` : "불완전"}</span>
                </div>
                <p className="mt-1 text-sm font-black tabular-nums text-white">
                  {formatNumber(point.currentValue)}
                </p>
                <p className={`mt-0.5 text-[11px] font-black tabular-nums ${point.changeValue >= 0 ? "text-admin-success" : "text-admin-danger"}`}>
                  {formatSignedPercent(point.changeRate * 100)}
                </p>
              </div>
            ))}
            {recentHistory.length === 0 ? (
              <p className="rounded-md border border-white/10 px-3 py-6 text-center text-xs font-bold text-stock-subtle sm:col-span-2 lg:col-span-3">
                완료된 과거 지수 기록이 아직 없습니다.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-white">지수 기여 상위</h4>
            <span className="text-[10px] font-bold text-stock-subtle">
              절대 기여도 순
            </span>
          </div>
          <div className="mt-2 divide-y divide-white/10 rounded-md border border-white/10 bg-white/[0.035]">
            {index.contributions.slice(0, 5).map((contribution) => (
              <div key={contribution.symbol} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{contribution.name}</p>
                  <p className="text-[10px] font-bold text-stock-subtle">
                    {contribution.symbol} · 기준비중 {formatSignedPercent(contribution.referenceWeight * 100).replace("+", "")}
                  </p>
                </div>
                <span className={`font-black tabular-nums ${contribution.changeRate >= 0 ? "text-admin-success" : "text-admin-danger"}`}>
                  {formatSignedPercent(contribution.changeRate * 100)}
                </span>
                <span className={`min-w-16 text-right font-black tabular-nums ${contribution.indexPointContribution >= 0 ? "text-admin-success" : "text-admin-danger"}`}>
                  {formatSignedNumber(contribution.indexPointContribution)}p
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="border-t border-white/10 px-4 py-2 text-[10px] font-bold text-stock-subtle">
        산출 {formatDateTime(index.generatedAt)} · 가격 소스 갱신 {index.sourceUpdatedAt ? formatDateTime(index.sourceUpdatedAt) : "현재 조회 시각"}
      </p>
    </section>
  );
}

function IndexMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-black/20 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stock-subtle">{label}</p>
      <p className={`mt-1 text-sm font-black tabular-nums ${warning ? "text-admin-danger" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function formatSignedNumber(value: number) {
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}
