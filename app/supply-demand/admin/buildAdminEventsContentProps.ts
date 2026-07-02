import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";

export function buildAdminEventsContentProps({
  actions,
  drafts,
  queries,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["eventsProps"]> {
  const {
    actionSymbol,
    draft: stockEventDraft,
    draftSetters: stockEventDraftSetters,
  } = drafts.stockEvent;
  const {
    draft: instrumentReportDraft,
    draftSetters: instrumentReportDraftSetters,
    fillReportDraft,
  } = drafts.instrumentReport;
  const { corporateActions, instrumentReports, instruments } = queries;
  const {
    applyingAction,
    createInstrumentForm,
    creatingInitialIssue,
    deletingReport,
    removeInstrumentReport,
    savingReport,
    submitInstrumentReport,
    submitStockEvent,
  } = actions;

  return {
    actionSymbol,
    applyingAction,
    corporateActions,
    createInstrumentForm,
    creatingInitialIssue,
    deletingReport,
    instrumentReportDraft,
    instrumentReportDraftSetters,
    instrumentReports,
    instruments,
    onDeleteReport: () => void removeInstrumentReport(),
    onFillReportDraft: fillReportDraft,
    onPublishReport: () => void submitInstrumentReport("publish"),
    onSubmitStockEvent: submitStockEvent,
    onUpdateReport: () => void submitInstrumentReport("update"),
    savingReport,
    stockEventDraft,
    stockEventDraftSetters,
  };
}
