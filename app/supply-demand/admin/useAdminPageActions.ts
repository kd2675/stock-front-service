import type { QueryClient } from "@tanstack/react-query";

import { useAdminAutoMarketConfigActions } from "@/app/supply-demand/admin/useAdminAutoMarketConfigActions";
import { useAdminAutoParticipantActions } from "@/app/supply-demand/admin/useAdminAutoParticipantActions";
import { useAdminAutoParticipantStrategyActions } from "@/app/supply-demand/admin/useAdminAutoParticipantStrategyActions";
import { useAdminBatchActions } from "@/app/supply-demand/admin/useAdminBatchActions";
import { useAdminCorporateActionActions } from "@/app/supply-demand/admin/useAdminCorporateActionActions";
import { useAdminDefaultDraftSelections } from "@/app/supply-demand/admin/useAdminDefaultDraftSelections";
import { useAdminInitialIssueActions } from "@/app/supply-demand/admin/useAdminInitialIssueActions";
import { useAdminInstrumentReportActions } from "@/app/supply-demand/admin/useAdminInstrumentReportActions";
import { useAdminListingAutoAccountActions } from "@/app/supply-demand/admin/useAdminListingAutoAccountActions";
import { useAdminMarketStatusActions } from "@/app/supply-demand/admin/useAdminMarketStatusActions";
import { useAdminOrderBookInstrumentActions } from "@/app/supply-demand/admin/useAdminOrderBookInstrumentActions";
import type { AdminActionMessageSetter } from "@/app/supply-demand/admin/AdminActionTypes";
import type { useAdminPageDraftState } from "@/app/supply-demand/admin/useAdminPageDraftState";
import type { useAdminPageQueries } from "@/app/supply-demand/admin/useAdminPageQueries";
import { useAdminProfileConfigActions } from "@/app/supply-demand/admin/useAdminProfileConfigActions";
import type { useAdminQueryInvalidations } from "@/app/supply-demand/admin/useAdminQueryInvalidations";
import { useAdminSimulationClockActions } from "@/app/supply-demand/admin/useAdminSimulationClockActions";
import { useAdminSymbolFlowActions } from "@/app/supply-demand/admin/useAdminSymbolFlowActions";
import { useAdminTokenRequirement } from "@/app/supply-demand/admin/useAdminTokenRequirement";
import { useAdminUserCashActions } from "@/app/supply-demand/admin/useAdminUserCashActions";

type AdminPageDraftState = ReturnType<typeof useAdminPageDraftState>;
type AdminPageQueries = ReturnType<typeof useAdminPageQueries>;
type AdminQueryInvalidations = ReturnType<typeof useAdminQueryInvalidations>;

type AdminPageActionsParams = {
  drafts: AdminPageDraftState;
  queryClient: QueryClient;
  queries: AdminPageQueries;
  queryInvalidations: AdminQueryInvalidations;
  setMessage: AdminActionMessageSetter;
};

export function useAdminPageActions({
  drafts,
  queryClient,
  queries,
  queryInvalidations,
  setMessage,
}: AdminPageActionsParams) {
  const {
    reloadAdminCashFlowState,
    reloadAutoMarketConfigurationState,
    reloadAutoMarketDetailsState,
    reloadAutoParticipantState,
    reloadAutoParticipantStrategyState,
    reloadOrderBookMarketState,
    reloadSimulationClockState,
  } = queryInvalidations;
  const requireAdminToken = useAdminTokenRequirement({ setMessage });
  const {
    actionSymbol,
    actionType,
    draft: stockEventDraft,
    historySymbol,
    resetCorporateActionFields,
    setActionSymbol,
    setHistorySymbol,
  } = drafts.stockEvent;
  const {
    draft: instrumentReportDraft,
    symbol: reportSymbol,
    setSymbol: setReportSymbol,
  } = drafts.instrumentReport;
  const {
    draft: autoMarketConfigDraft,
    setEditingSymbol: setEditingAutoConfigSymbol,
    setEnabled: setAutoConfigEnabled,
    symbol: autoConfigSymbol,
  } = drafts.autoMarketConfig;
  const {
    draft: listingAutoAccountDraft,
    symbol: listingAutoSymbol,
  } = drafts.listingAutoAccount;
  const {
    autoParticipantEditDraftSetters,
    autoParticipantUserKey,
    cashAdjustmentAmount,
    displayName: autoParticipantDisplayName,
    editingAutoParticipantUserKey,
    enabled: autoParticipantEnabled,
    profileType: autoParticipantProfileType,
    recurringCashAmount: autoParticipantRecurringCashAmount,
    recurringCashIntervalUnit: autoParticipantRecurringCashIntervalUnit,
    recurringCashIntervalValue: autoParticipantRecurringCashIntervalValue,
    resetAutoParticipantDraft,
    setEditingStrategyKey,
    setStrategyEnabled,
    strategyEnabled,
    strategyIntensity,
    strategySymbol,
    strategyUserKey,
  } = drafts.autoParticipant;
  const { draft: autoParticipantGenerateDraft } = drafts.autoParticipantGenerate;
  const {
    amount: userCashAdjustmentAmount,
    clearAmount: clearUserCashAdjustmentAmount,
    fundFlowUserKey: userFundFlowUserKey,
    setFundFlowUserKey,
    userKey: userCashAdjustmentUserKey,
  } = drafts.userCashAdjustment;
  const {
    draft: profileConfigDraft,
    editingProfileType,
  } = drafts.profileConfig;
  const {
    autoParticipants,
    instruments,
    shouldLoadInstrumentDetails,
    simulationClockQuery,
    status,
    userFundFlowQuery,
  } = queries;

  const { reportSymbolRef } = useAdminDefaultDraftSelections({
    applyAutoMarketConfigDraft: drafts.autoMarketConfig.applyAutoMarketConfigDraft,
    applyListingAutoAccountConfigDraft: drafts.listingAutoAccount.applyListingAutoAccountConfigDraft,
    autoConfigSymbol,
    historySymbol,
    instruments,
    listingAutoSymbol,
    reportSymbol,
    setHistorySymbol,
    setReportSymbol,
    shouldLoadInstrumentDetails,
    status,
  });

  const batchActions = useAdminBatchActions({
    queryClient,
    reloadAdminCashFlowState,
    reloadAutoParticipantState,
    requireAdminToken,
    setMessage,
  });
  const instrumentReportActions = useAdminInstrumentReportActions({
    draft: instrumentReportDraft,
    instruments,
    queryClient,
    reportSymbol,
    requireAdminToken,
    setMessage,
  });
  const marketStatusActions = useAdminMarketStatusActions({
    reloadOrderBookMarketState,
    requireAdminToken,
    setMessage,
  });
  const orderBookInstrumentActions = useAdminOrderBookInstrumentActions({
    queryClient,
    reloadOrderBookMarketState,
    requireAdminToken,
    setMessage,
  });
  const simulationClockActions = useAdminSimulationClockActions({
    reloadSimulationClockState,
    requireAdminToken,
    setMessage,
  });
  const autoMarketConfigActions = useAdminAutoMarketConfigActions({
    autoConfigSymbol,
    draft: autoMarketConfigDraft,
    reloadAutoMarketConfigurationState,
    requireAdminToken,
    setAutoConfigEnabled,
    setEditingAutoConfigSymbol,
    setMessage,
  });
  const listingAutoAccountActions = useAdminListingAutoAccountActions({
    draft: listingAutoAccountDraft,
    reloadAutoMarketDetailsState,
    requireAdminToken,
    setEditingListingAutoSymbol: drafts.listingAutoAccount.setEditingSymbol,
    setMessage,
  });
  const profileConfigActions = useAdminProfileConfigActions({
    draft: profileConfigDraft,
    editingProfileType,
    reloadAutoMarketDetailsState,
    requireAdminToken,
    setMessage,
  });
  const autoParticipantActions = useAdminAutoParticipantActions({
    autoParticipantEditDraftSetters,
    autoParticipantUserKey,
    cashAdjustmentAmount,
    displayName: autoParticipantDisplayName,
    editingAutoParticipantUserKey,
    enabled: autoParticipantEnabled,
    existingParticipants: autoParticipants,
    generateDraft: autoParticipantGenerateDraft,
    profileType: autoParticipantProfileType,
    recurringCashAmount: autoParticipantRecurringCashAmount,
    recurringCashIntervalUnit: autoParticipantRecurringCashIntervalUnit,
    recurringCashIntervalValue: autoParticipantRecurringCashIntervalValue,
    reloadAdminCashFlowState,
    reloadAutoParticipantState,
    requireAdminToken,
    resetAutoParticipantDraft,
    setMessage,
  });
  const autoParticipantStrategyActions = useAdminAutoParticipantStrategyActions({
    reloadAutoParticipantStrategyState,
    requireAdminToken,
    setEditingStrategyKey,
    setMessage,
    setStrategyEnabled,
    strategyEnabled,
    strategyIntensity,
    strategySymbol,
    strategyUserKey,
  });
  const userCashActions = useAdminUserCashActions({
    amount: userCashAdjustmentAmount,
    clearAmount: clearUserCashAdjustmentAmount,
    fundFlowUserKey: userFundFlowUserKey,
    queryClient,
    requireAdminToken,
    setFundFlowUserKey,
    setMessage,
    userFundFlowQuery,
    userKey: userCashAdjustmentUserKey,
  });
  const corporateActionActions = useAdminCorporateActionActions({
    actionSymbol,
    currentSimulationDate: simulationClockQuery.data?.simulationDate,
    draft: stockEventDraft,
    instruments,
    queryClient,
    requireAdminToken,
    resetCorporateActionFields,
    setMessage,
  });
  const symbolFlowActions = useAdminSymbolFlowActions({
    requireAdminToken,
    setMessage,
  });
  const initialIssueActions = useAdminInitialIssueActions({
    queryClient,
    reportSymbolRef,
    setActionSymbol,
    setHistorySymbol,
    setMessage,
    setReportSymbol,
  });

  const submitStockEvent = () => {
    if (actionType === "INITIAL_ISSUE") {
      void initialIssueActions.submitInstrument();
      return;
    }
    void corporateActionActions.submitCorporateAction();
  };

  return {
    ...batchActions,
    ...instrumentReportActions,
    ...marketStatusActions,
    ...orderBookInstrumentActions,
    ...simulationClockActions,
    ...autoMarketConfigActions,
    ...listingAutoAccountActions,
    ...profileConfigActions,
    ...autoParticipantActions,
    ...autoParticipantStrategyActions,
    ...userCashActions,
    ...corporateActionActions,
    ...symbolFlowActions,
    ...initialIssueActions,
    submitStockEvent,
  };
}
