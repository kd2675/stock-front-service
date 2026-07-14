import DataTableViewport from "@/app/components/DataTableViewport";
import useModalDialog from "@/app/hooks/useModalDialog";
import { formatCount, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { AdminTotalAssetHistoryChart } from "@/app/supply-demand/admin/AdminTotalAssetHistoryChart";
import type { AdminTotalAssetHistoryPage, AdminTotalAssetHistoryPoint } from "@/app/types/stock";

export function AdminTotalAssetHistoryModal({
  history,
  loading,
  error,
  open,
  onClose,
  onLoadPage,
}: {
  history: AdminTotalAssetHistoryPage | null;
  loading: boolean;
  error: boolean;
  open: boolean;
  onClose: () => void;
  onLoadPage: (page: number) => void;
}) {
  const dialogRef = useModalDialog<HTMLDivElement>(open, onClose);

  if (!open) {
    return null;
  }

  const summary = history?.summary;
  const pageLabel = history && history.totalPages > 0
    ? `${history.page + 1} / ${history.totalPages}주`
    : "정산 기록 없음";

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="total-asset-history-title" className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="total-asset-history-title" className="text-base font-black text-white">전체 총자산 · 7일 변화</h3>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
              장 마감 정산이 완료된 활성 참여자 계좌를 일자별로 합산합니다. 운영 재고용 상장 계좌는 지표에서 제외됩니다.
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
            <button type="button" onClick={() => onLoadPage(history?.page ?? 0)} disabled={loading} className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
              다시 조회
            </button>
            <button type="button" onClick={onClose} className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-admin-canvas">닫기</button>
          </div>
        </div>

        {summary ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HistoryMetric label="구간" value={`${summary.rangeStart} - ${summary.rangeEnd}`} />
              <HistoryMetric label="총자산 변화" value={formatSignedWon(summary.changeAmount)} valueClassName={changeClassName(summary.changeAmount)} />
              <HistoryMetric label="변화율" value={formatOptionalSignedPercent(summary.changeRate)} valueClassName={changeClassName(summary.changeAmount)} />
              <HistoryMetric label="구간 평균" value={formatWon(summary.averageTotalAsset)} />
              <HistoryMetric label="시작 총자산" value={formatWon(summary.startTotalAsset)} />
              <HistoryMetric label="종료 총자산" value={formatWon(summary.endTotalAsset)} />
              <HistoryMetric label="구간 최고" value={formatWon(summary.highestTotalAsset)} />
              <HistoryMetric label="구간 최저" value={formatWon(summary.lowestTotalAsset)} />
            </div>
            <div className="mt-4">
              <AdminTotalAssetHistoryChart points={history?.content ?? []} />
            </div>
            <TotalAssetHistoryTable points={history?.content ?? []} />
          </>
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-10 text-center text-sm font-bold text-stock-subtle">
            {loading ? "전체 총자산 정산 기록을 조회하고 있습니다." : error ? "전체 총자산 정산 기록을 조회하지 못했습니다. 다시 조회해 주세요." : "장 마감 정산 기록이 아직 없습니다."}
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

function TotalAssetHistoryTable({ points }: { points: AdminTotalAssetHistoryPoint[] }) {
  return (
    <DataTableViewport label="전체 총자산 일자별 변화" tone="dark" className="mt-4">
      <table className="w-full min-w-[940px] border-collapse text-sm">
        <thead className="bg-white/10 text-left text-admin-muted">
          <tr>
            <th className="px-3 py-2">정산일</th>
            <th className="px-3 py-2 text-right">참여 계좌</th>
            <th className="px-3 py-2 text-right">전체 총자산</th>
            <th className="px-3 py-2 text-right">전일 대비</th>
            <th className="px-3 py-2 text-right">변화율</th>
            <th className="px-3 py-2 text-right">현금</th>
            <th className="px-3 py-2 text-right">예약 현금</th>
            <th className="px-3 py-2 text-right">보유 평가액</th>
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
              <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatWon(point.reservedCash)}</td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-admin-muted">{formatWon(point.marketValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableViewport>
  );
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
