import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";

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
    corporateActionsErrorMessage: queries.corporateActionsQuery.isError
      ? getStockErrorMessage(queries.corporateActionsQuery.error, "선택 종목의 기업 이벤트 이력을 조회하지 못했습니다.")
      : null,
    corporateActionsLoading: queries.corporateActionsQuery.isLoading,
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
    onRetryCorporateActions: () => void queries.corporateActionsQuery.refetch(),
    onPublishReport: () => void submitInstrumentReport("publish"),
    onSubmitStockEvent: submitStockEvent,
    onUpdateReport: () => void submitInstrumentReport("update"),
    savingReport,
    stockEventDraft,
    stockEventDraftSetters,
  };
}
