import { useAdminAutoMarketConfigDraftState } from "@/app/supply-demand/admin/useAdminAutoMarketConfigDraftState";
import { useAdminAutoParticipantDraftState } from "@/app/supply-demand/admin/useAdminAutoParticipantDraftState";
import { useAdminAutoParticipantGenerateDraftState } from "@/app/supply-demand/admin/useAdminAutoParticipantGenerateDraftState";
import { useAdminInstrumentReportDraftState } from "@/app/supply-demand/admin/useAdminInstrumentReportDraftState";
import { useAdminListingAutoAccountDraftState } from "@/app/supply-demand/admin/useAdminListingAutoAccountDraftState";
import { useAdminProfileConfigDraftState } from "@/app/supply-demand/admin/useAdminProfileConfigDraftState";
import { useAdminStockEventDraftState } from "@/app/supply-demand/admin/useAdminStockEventDraftState";
import { useAdminUserCashAdjustmentDraftState } from "@/app/supply-demand/admin/useAdminUserCashAdjustmentDraftState";

export function useAdminPageDraftState() {
  return {
    autoMarketConfig: useAdminAutoMarketConfigDraftState(),
    autoParticipant: useAdminAutoParticipantDraftState(),
    autoParticipantGenerate: useAdminAutoParticipantGenerateDraftState(),
    instrumentReport: useAdminInstrumentReportDraftState(),
    listingAutoAccount: useAdminListingAutoAccountDraftState(),
    profileConfig: useAdminProfileConfigDraftState(),
    stockEvent: useAdminStockEventDraftState(),
    userCashAdjustment: useAdminUserCashAdjustmentDraftState(),
  };
}
