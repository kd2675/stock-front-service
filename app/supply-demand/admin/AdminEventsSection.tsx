import type { UseFormReturn } from "react-hook-form";

import type {
  CreateInstrumentFormValues,
  CreateInstrumentPayload,
} from "@/app/lib/validation/adminSchemas";
import { AdminCorporateActionHistoryPanel } from "@/app/supply-demand/admin/AdminCorporateActionHistoryPanel";
import { AdminInstrumentReportPanel, type InstrumentReportDraft, type InstrumentReportDraftSetters } from "@/app/supply-demand/admin/AdminInstrumentReportPanel";
import { AdminStockEventPanel, type StockEventDraft, type StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventPanel";
import type { CorporateAction, InstrumentReport, OrderBookInstrument } from "@/app/types/stock";

type AdminEventsSectionProps = {
  instruments: OrderBookInstrument[];
  createInstrumentForm: UseFormReturn<CreateInstrumentFormValues, unknown, CreateInstrumentPayload>;
  stockEventDraft: StockEventDraft;
  stockEventDraftSetters: StockEventDraftSetters;
  creatingInitialIssue: boolean;
  applyingAction: boolean;
  onSubmitStockEvent: () => void;
  instrumentReports: InstrumentReport[];
  instrumentReportDraft: InstrumentReportDraft;
  instrumentReportDraftSetters: InstrumentReportDraftSetters;
  savingReport: boolean;
  deletingReport: boolean;
  onPublishReport: () => void;
  onUpdateReport: () => void;
  onDeleteReport: () => void;
  onFillReportDraft: (report: InstrumentReport) => void;
  actionSymbol: string;
  corporateActions: CorporateAction[];
};

export function AdminEventsSection({
  instruments,
  createInstrumentForm,
  stockEventDraft,
  stockEventDraftSetters,
  creatingInitialIssue,
  applyingAction,
  onSubmitStockEvent,
  instrumentReports,
  instrumentReportDraft,
  instrumentReportDraftSetters,
  savingReport,
  deletingReport,
  onPublishReport,
  onUpdateReport,
  onDeleteReport,
  onFillReportDraft,
  actionSymbol,
  corporateActions,
}: AdminEventsSectionProps) {
  return (
    <>
      <AdminStockEventPanel
        instruments={instruments}
        createInstrumentForm={createInstrumentForm}
        draft={stockEventDraft}
        draftSetters={stockEventDraftSetters}
        creatingInitialIssue={creatingInitialIssue}
        applyingAction={applyingAction}
        onSubmit={onSubmitStockEvent}
      />

      <AdminInstrumentReportPanel
        instruments={instruments}
        reports={instrumentReports}
        draft={instrumentReportDraft}
        draftSetters={instrumentReportDraftSetters}
        saving={savingReport}
        deleting={deletingReport}
        onPublish={onPublishReport}
        onUpdate={onUpdateReport}
        onDelete={onDeleteReport}
        onFillDraft={onFillReportDraft}
      />

      <AdminCorporateActionHistoryPanel symbol={actionSymbol} actions={corporateActions} />
    </>
  );
}
