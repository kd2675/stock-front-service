import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";

export function buildAdminEventsContentProps({
  actions,
  drafts,
  queries,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["eventsProps"]> {
  const {
    draft: stockEventDraft,
    draftSetters: stockEventDraftSetters,
    historySymbol,
    setHistorySymbol,
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
    applyingAction,
    corporateActions,
    createInstrumentForm,
    creatingInitialIssue,
    currentSimulationDate: queries.simulationClockQuery.data?.simulationDate,
    deletingReport,
    instrumentReportDraft,
    instrumentReportDraftSetters,
    instrumentReports,
    instruments,
    historySymbol,
    onDeleteReport: () => void removeInstrumentReport(),
    onFillReportDraft: fillReportDraft,
    onHistorySymbolChange: setHistorySymbol,
    onPublishReport: () => void submitInstrumentReport("publish"),
    onSubmitStockEvent: submitStockEvent,
    onUpdateReport: () => void submitInstrumentReport("update"),
    savingReport,
    stockEventDraft,
    stockEventDraftSetters,
  };
}
