import DataTableViewport from "@/app/components/DataTableViewport";
import { formatDateTime, formatReportEventType } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import type { InstrumentReport, OrderBookInstrument } from "@/app/types/stock";

export type InstrumentReportDraft = {
  symbol: string;
  title: string;
  score: string;
  summary: string;
  riseReason: string;
  fallReason: string;
};

export type InstrumentReportDraftSetters = {
  setSymbol: (value: string) => void;
  setTitle: (value: string) => void;
  setScore: (value: string) => void;
  setSummary: (value: string) => void;
  setRiseReason: (value: string) => void;
  setFallReason: (value: string) => void;
};

type AdminInstrumentReportPanelProps = {
  instruments: OrderBookInstrument[];
  reports: InstrumentReport[];
  draft: InstrumentReportDraft;
  draftSetters: InstrumentReportDraftSetters;
  saving: boolean;
  deleting: boolean;
  onPublish: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onFillDraft: (report: InstrumentReport) => void;
};

export function AdminInstrumentReportPanel({
  instruments,
  reports,
  draft,
  draftSetters,
  saving,
  deleting,
  onPublish,
  onUpdate,
  onDelete,
  onFillDraft,
}: AdminInstrumentReportPanelProps) {
  const latestReport = reports.find((report) => report.symbol === draft.symbol);
  const hasActiveReport = latestReport !== undefined && latestReport.eventType !== "DELETE";

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">종목 평가 보고서</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">최신 보고서 점수는 자동 참여자 성향과 함께 자동장 상승/하락 가격 압력에 반영됩니다.</p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-muted">{reports.length}개 이력</span>
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white">보고서 편집</h3>
            <p className="mt-1 text-xs font-bold text-stock-subtle">새 보고서를 발행하거나, 현재 종목의 최신 유효 보고서를 수정·삭제 이벤트로 기록합니다.</p>
          </div>
          <span className="text-xs font-black text-admin-accent">{draft.symbol || "종목 미선택"}</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.3fr_0.6fr]">
          <DarkSelect label="종목" value={draft.symbol} onChange={draftSetters.setSymbol}>
            <option value="">선택</option>
            {instruments.map((instrument) => (
              <option key={instrument.symbol} value={instrument.symbol}>{instrument.name} · {instrument.symbol}</option>
            ))}
          </DarkSelect>
          <DarkInput label="제목" value={draft.title} onChange={draftSetters.setTitle} placeholder="예: 수요 회복에 따른 상향 보고서" />
          <DarkInput label="점수(1-10)" value={draft.score} onChange={draftSetters.setScore} placeholder="8" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <DarkInput label="요약" value={draft.summary} onChange={draftSetters.setSummary} placeholder="핵심 투자 판단을 입력" className="lg:col-span-2" />
          <DarkInput label="상승 이유(선택)" value={draft.riseReason} onChange={draftSetters.setRiseReason} placeholder="가격이 오를 수 있는 이유" />
          <DarkInput label="하락 이유(선택)" value={draft.fallReason} onChange={draftSetters.setFallReason} placeholder="가격이 떨어질 수 있는 이유" />
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || !hasActiveReport}
            className="min-h-11 rounded-md bg-admin-danger-surface px-4 py-3 text-sm font-black text-admin-danger disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "삭제 중" : "최신 보고서 삭제"}
          </button>
          <button type="button" onClick={onUpdate} disabled={saving || !hasActiveReport} className="min-h-11 rounded-md bg-white/10 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">최신 보고서 수정</button>
          <button type="button" onClick={onPublish} disabled={saving} className="min-h-11 rounded-md bg-stock-accent px-4 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "저장 중" : "새 보고서 발행"}</button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-white">발행 이력</h3>
        <p className="text-xs font-bold text-stock-subtle">최신 이력이 자동장 판단 기준입니다.</p>
      </div>
      <DataTableViewport label="발행된 종목 보고서" tone="dark" className="mt-3 hidden md:block">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">이벤트</th>
              <th className="px-3 py-2">보고서</th>
              <th className="px-3 py-2">점수</th>
              <th className="px-3 py-2">상승/하락 이유</th>
              <th className="px-3 py-2">등록</th>
              <th className="px-3 py-2">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {reports.map((report, index) => (
              <tr key={report.id}>
                <td className="px-3 py-2">
                  <p className="font-black">{formatReportEventType(report.eventType)}</p>
                  {index === 0 ? <p className="mt-0.5 text-xs font-bold text-admin-accent">최신 기준</p> : null}
                </td>
                <td className="px-3 py-2">
                  <p className="font-black">{report.title ?? report.deleteReason ?? "-"}</p>
                  <p className="mt-1 max-h-10 overflow-hidden text-xs font-semibold text-admin-muted">{report.summary ?? "-"}</p>
                </td>
                <td className="px-3 py-2 tabular-nums">{report.score ? `${report.score}/10` : "-"}</td>
                <td className="px-3 py-2 text-xs text-admin-muted">
                  <p>상승: {report.riseReason ?? "-"}</p>
                  <p className="mt-1">하락: {report.fallReason ?? "-"}</p>
                </td>
                <td className="px-3 py-2 text-admin-muted">
                  <p>{formatDateTime(report.createdAt)}</p>
                  <p className="mt-0.5 text-xs">{report.createdBy ?? "-"}</p>
                </td>
                <td className="px-3 py-2">
                  {report.eventType !== "DELETE" ? (
                    <button type="button" onClick={() => onFillDraft(report)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                      불러오기
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-stock-subtle">삭제 이벤트</span>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-stock-subtle">선택한 종목의 평가 보고서가 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </DataTableViewport>

      <div className="mt-3 grid gap-3 md:hidden">
        {reports.map((report, index) => (
          <article key={report.id} className="rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-white">{report.title ?? report.deleteReason ?? "제목 없음"}</p>
                <p className="mt-1 text-xs font-bold text-stock-subtle">{formatReportEventType(report.eventType)} · {formatDateTime(report.createdAt)}</p>
              </div>
              <span className="shrink-0 rounded-sm bg-white/10 px-2 py-1 text-xs font-black tabular-nums text-admin-accent">{report.score ? `${report.score}/10` : "-"}</span>
            </div>
            {index === 0 ? <p className="mt-2 text-[11px] font-black text-admin-accent">최신 자동장 기준</p> : null}
            <p className="mt-2 text-xs font-bold leading-5 text-admin-muted">{report.summary ?? "요약 없음"}</p>
            <dl className="mt-3 grid gap-2 text-xs">
              <ReportMobileDetail label="상승 이유" value={report.riseReason ?? "-"} />
              <ReportMobileDetail label="하락 이유" value={report.fallReason ?? "-"} />
              <ReportMobileDetail label="작성자" value={report.createdBy ?? "-"} />
            </dl>
            {report.eventType !== "DELETE" ? <button type="button" onClick={() => onFillDraft(report)} className="mt-3 min-h-10 w-full rounded-md bg-white/10 px-3 text-xs font-black text-white">편집기로 불러오기</button> : null}
          </article>
        ))}
        {reports.length === 0 ? <p className="rounded-md border border-dashed border-white/15 bg-black/15 px-3 py-4 text-sm font-bold text-stock-subtle">선택한 종목의 평가 보고서가 없습니다.</p> : null}
      </div>
    </section>
  );
}

function ReportMobileDetail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2"><dt className="font-bold text-admin-placeholder">{label}</dt><dd className="break-words font-black leading-5 text-admin-text-strong">{value}</dd></div>;
}
