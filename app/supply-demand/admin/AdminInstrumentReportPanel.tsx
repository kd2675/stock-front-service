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
  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">종목 평가 보고서</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">최신 보고서 점수는 자동 참여자 성향과 함께 자동장 상승/하락 가격 압력에 반영됩니다.</p>
        </div>
        <span className="text-xs font-bold text-admin-accent">{reports.length}개 이벤트</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.3fr_0.6fr]">
        <DarkSelect label="종목" value={draft.symbol} onChange={draftSetters.setSymbol}>
          <option value="">선택</option>
          {instruments.map((instrument) => (
            <option key={instrument.symbol} value={instrument.symbol}>{instrument.symbol}</option>
          ))}
        </DarkSelect>
        <DarkInput label="제목" value={draft.title} onChange={draftSetters.setTitle} placeholder="예: 수요 회복에 따른 상향 보고서" />
        <DarkInput label="점수(1-10)" value={draft.score} onChange={draftSetters.setScore} placeholder="8" />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <DarkInput label="요약" value={draft.summary} onChange={draftSetters.setSummary} placeholder="핵심 투자 판단을 입력" className="lg:col-span-3" />
        <DarkInput label="상승 이유(선택)" value={draft.riseReason} onChange={draftSetters.setRiseReason} placeholder="가격이 오를 수 있는 이유" />
        <DarkInput label="하락 이유(선택)" value={draft.fallReason} onChange={draftSetters.setFallReason} placeholder="가격이 떨어질 수 있는 이유" />
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onPublish} disabled={saving} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-admin-canvas disabled:opacity-50">
            {saving ? "저장 중" : "발행"}
          </button>
          <button type="button" onClick={onUpdate} disabled={saving} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white disabled:opacity-50">
            수정
          </button>
          <button type="button" onClick={onDelete} disabled={deleting} className="min-h-11 rounded-md bg-admin-danger-surface px-3 py-3 text-sm font-black text-admin-danger disabled:opacity-50">
            {deleting ? "삭제 중" : "삭제"}
          </button>
        </div>
      </div>
      <DataTableViewport label="발행된 종목 보고서" tone="dark" className="mt-4">
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
                      선택
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
    </section>
  );
}
