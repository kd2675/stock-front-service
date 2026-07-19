import DataTableViewport from "@/app/components/DataTableViewport";
import useModalDialog from "@/app/hooks/useModalDialog";
import { formatCount, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { AdminTotalAssetHistoryChart } from "@/app/supply-demand/admin/AdminTotalAssetHistoryChart";
import {
  ADMIN_ASSET_HISTORY_METRIC_KEYS,
  ADMIN_ASSET_HISTORY_METRICS,
  summarizeAdminAssetHistoryMetric,
  type AdminAssetHistoryMetric,
  type AdminAssetHistoryMetricDefinition,
} from "@/app/supply-demand/admin/adminTotalAssetHistoryMetrics";
import type { AdminTotalAssetHistoryPage, AdminTotalAssetHistoryPoint } from "@/app/types/stock";

export function AdminTotalAssetHistoryModal({
  history,
  loading,
  error,
  open,
  selectedMetric,
  onMetricChange,
  onClose,
  onLoadPage,
}: {
  history: AdminTotalAssetHistoryPage | null;
  loading: boolean;
  error: boolean;
  open: boolean;
  selectedMetric: AdminAssetHistoryMetric;
  onMetricChange: (metric: AdminAssetHistoryMetric) => void;
  onClose: () => void;
  onLoadPage: (page: number) => void;
}) {
  const dialogRef = useModalDialog<HTMLDivElement>(open, onClose);

  if (!open) {
    return null;
  }

  const points = history?.content ?? [];
  const metricDefinition = ADMIN_ASSET_HISTORY_METRICS[selectedMetric];
  const metricSummary = summarizeAdminAssetHistoryMetric(points, selectedMetric);
  const rangeStart = points.at(-1)?.snapshotDate;
  const rangeEnd = points.at(0)?.snapshotDate;
  const pageLabel = history && history.totalPages > 0
    ? `${history.page + 1} / ${history.totalPages}주`
    : "정산 기록 없음";

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="total-asset-history-title" className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="total-asset-history-title" className="text-base font-black text-white">전체 자산·보유량 · 7일 변화</h3>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
              장 마감 정산이 완료된 활성 참여자 계좌를 일자별로 합산합니다. 운영 재고용 상장 계좌는 모든 지표에서 제외됩니다.
              가용 현금은 미체결 매수 예약 반환 후 금액이며, 청약 대기자산은 청약으로 현금에서 차감된 뒤 신주 상장 전까지 별도로 보유되는 금액만 표시합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-xs font-black text-admin-accent">{pageLabel}</span>
            {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">조회 중</span> : null}
            {error ? <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-xs font-black text-admin-danger">조회 실패</span> : null}
            <button type="button" onClick={() => onLoadPage((history?.page ?? 0) + 1)} disabled={loading || !history?.hasNext} className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
              이전 7일
            </button>
            <button type="button" onClick={() => onLoadPage(Math.max(0, (history?.page ?? 0) - 1))} disabled={loading || !history?.hasPrevious} className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
              다음 7일
            </button>
            <button
              type="button"
              onClick={() => onLoadPage(0)}
              disabled={loading || history?.page === 0}
              aria-label="현재 날짜가 포함된 최신 7일 조회"
              className="min-h-9 rounded-md border border-admin-accent/40 bg-admin-accent/10 px-3 py-2 text-xs font-black text-admin-accent transition hover:border-admin-accent hover:bg-admin-accent/15 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-admin-disabled"
            >
              현재 날짜
            </button>
            <button type="button" onClick={() => onLoadPage(history?.page ?? 0)} disabled={loading} className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
              다시 조회
            </button>
            <button type="button" onClick={onClose} className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-admin-canvas">닫기</button>
          </div>
        </div>

        {points.length > 0 ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="7일 변화 지표 선택">
              {ADMIN_ASSET_HISTORY_METRIC_KEYS.map((metric) => {
                const active = selectedMetric === metric;
                return (
                  <button
                    key={metric}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onMetricChange(metric)}
                    className={active
                      ? "min-h-9 rounded-md bg-admin-accent px-3 py-2 text-xs font-black text-admin-canvas"
                      : "min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-muted transition hover:border-admin-accent hover:text-white"}
                  >
                    {ADMIN_ASSET_HISTORY_METRICS[metric].label}
                  </button>
                );
              })}
            </div>

            {metricSummary ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  <HistoryMetric label="구간" value={`${rangeStart} - ${rangeEnd}`} />
                  <HistoryMetric label={`${metricDefinition.label} 변화`} value={formatSignedMetric(metricSummary.changeAmount, metricDefinition)} valueClassName={changeClassName(metricSummary.changeAmount)} />
                  <HistoryMetric label="변화율" value={formatOptionalSignedPercent(metricSummary.changeRate)} valueClassName={changeClassName(metricSummary.changeAmount)} />
                  <HistoryMetric label="기록 일수" value={`${metricSummary.observedDayCount}일 / ${points.length}일`} />
                  <HistoryMetric label="시작" value={formatMetric(metricSummary.startValue, metricDefinition)} />
                  <HistoryMetric label="종료" value={formatMetric(metricSummary.endValue, metricDefinition)} />
                  <HistoryMetric label="구간 평균" value={formatMetric(metricSummary.averageValue, metricDefinition)} />
                  <HistoryMetric label="구간 최고 · 최저" value={`${formatMetric(metricSummary.highestValue, metricDefinition)} · ${formatMetric(metricSummary.lowestValue, metricDefinition)}`} />
                </div>
                <div className="mt-4">
                  <AdminTotalAssetHistoryChart points={points} metric={selectedMetric} />
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-md border border-admin-warning/25 bg-admin-warning/[0.06] px-3 py-4 text-sm font-bold leading-6 text-admin-warning-soft">
                이 구간에는 {metricDefinition.label} 정산 기록이 없습니다. 보유량 계열은 신규 스냅샷 계약이 적용된 정산일부터 표시됩니다.
              </div>
            )}

            <TotalAssetHistoryTable points={points} selectedMetric={selectedMetric} />
          </>
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-10 text-center text-sm font-bold text-stock-subtle">
            {loading ? "자산·보유량 정산 기록을 조회하고 있습니다." : error ? "자산·보유량 정산 기록을 조회하지 못했습니다. 다시 조회해 주세요." : "장 마감 정산 기록이 아직 없습니다."}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryMetric({ label, value, valueClassName = "text-white" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <p className={["mt-1 break-words text-sm font-black tabular-nums", valueClassName].join(" ")}>{value}</p>
    </div>
  );
}

function TotalAssetHistoryTable({
  points,
  selectedMetric,
}: {
  points: AdminTotalAssetHistoryPoint[];
  selectedMetric: AdminAssetHistoryMetric;
}) {
  const metricDefinition = ADMIN_ASSET_HISTORY_METRICS[selectedMetric];

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-md border border-white/10 bg-admin-canvas/35 lg:hidden">
        <table className="w-full table-fixed border-collapse text-xs">
          <caption className="sr-only">{metricDefinition.label} 일자별 정산</caption>
          <thead className="bg-white/10 text-admin-muted">
            <tr>
              <th className="w-[38%] px-3 py-2 text-left">정산일</th>
              <th className="w-[22%] px-2 py-2 text-right">계좌</th>
              <th className="px-3 py-2 text-right">{metricDefinition.label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {points.map((point) => (
              <tr key={point.snapshotDate}>
                <td className="px-3 py-2.5 font-black text-white">{point.snapshotDate}</td>
                <td className="px-2 py-2.5 text-right font-bold tabular-nums text-admin-muted">{formatCount(point.accountCount, "개")}</td>
                <td className="break-words px-3 py-2.5 text-right font-black tabular-nums text-white">
                  {formatOptionalMetric(metricDefinition.value(point), metricDefinition)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DataTableViewport label="전체 자산·보유량 일자별 변화" tone="dark" className="mt-4 hidden lg:block">
        <table className="w-full min-w-[1420px] border-collapse text-sm">
          <caption className="sr-only">전체 자산·보유량 일자별 정산</caption>
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">정산일</th>
              <th className="px-3 py-2 text-right">참여 계좌</th>
              <th className="px-3 py-2 text-right">전체 총자산</th>
              <th className="px-3 py-2 text-right">전일 대비</th>
              <th className="px-3 py-2 text-right">변화율</th>
              <th className="px-3 py-2 text-right">가용 현금</th>
              <th className="px-3 py-2 text-right">청약 대기자산</th>
              <th className="px-3 py-2 text-right">보유 주식 평가액</th>
              <th className="px-3 py-2 text-right">총 보유량</th>
              <th className="px-3 py-2 text-right">매도 예약</th>
              <th className="px-3 py-2 text-right">가용 보유량</th>
              <th className="px-3 py-2 text-right">보유 포지션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {points.map((point) => (
              <tr key={point.snapshotDate}>
                <td className="px-3 py-2 font-black text-white">{point.snapshotDate}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatCount(point.accountCount, "개")}</td>
                <td className="px-3 py-2 text-right font-black tabular-nums text-white">{formatWon(point.totalAsset)}</td>
                <td className={["px-3 py-2 text-right font-black tabular-nums", changeClassName(point.changeAmount)].join(" ")}>{formatOptionalSignedWon(point.changeAmount)}</td>
                <td className={["px-3 py-2 text-right font-black tabular-nums", changeClassName(point.changeAmount)].join(" ")}>{formatOptionalSignedPercent(point.changeRate)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatWon(point.cashBalance)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatWon(point.pendingSubscriptionAsset)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatWon(point.marketValue)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatOptionalCount(point.holdingQuantity, "주")}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatOptionalCount(point.reservedSellQuantity, "주")}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatOptionalCount(point.availableHoldingQuantity, "주")}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatOptionalCount(point.holdingPositionCount, "건")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableViewport>
    </>
  );
}

function formatMetric(value: number, metric: AdminAssetHistoryMetricDefinition) {
  if (metric.unit === "WON") {
    return formatWon(value);
  }
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}주`;
}

function formatSignedMetric(value: number, metric: AdminAssetHistoryMetricDefinition) {
  const formatted = formatMetric(Math.abs(value), metric);
  if (value === 0) {
    return formatted;
  }
  return `${value > 0 ? "+" : "-"}${formatted}`;
}

function formatOptionalMetric(value: number | null, metric: AdminAssetHistoryMetricDefinition) {
  return value == null ? "-" : formatMetric(value, metric);
}

function formatOptionalCount(value: number | null, unit: string) {
  return value == null ? "-" : formatCount(value, unit);
}

function formatSignedWon(value: number) {
  return value > 0 ? `+${formatWon(value)}` : formatWon(value);
}

function formatOptionalSignedWon(value: number | null) {
  return value == null ? "-" : formatSignedWon(value);
}

function formatOptionalSignedPercent(value: number | null) {
  return value == null ? "-" : formatSignedPercent(value);
}

function changeClassName(value: number | null) {
  if (value == null || value === 0) {
    return "text-admin-muted";
  }
  return value > 0 ? "text-admin-danger" : "text-admin-accent";
}
