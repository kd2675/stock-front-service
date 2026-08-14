import { useAdminAutoMarketConfigDraftState } from "@/app/supply-demand/admin/useAdminAutoMarketConfigDraftState";
import { useAdminInstrumentReportDraftState } from "@/app/supply-demand/admin/useAdminInstrumentReportDraftState";
import { useAdminProfileConfigDraftState } from "@/app/supply-demand/admin/useAdminProfileConfigDraftState";
import { useAdminStockEventDraftState } from "@/app/supply-demand/admin/useAdminStockEventDraftState";
import { useAdminUserCashAdjustmentDraftState } from "@/app/supply-demand/admin/useAdminUserCashAdjustmentDraftState";

export function useAdminPageDraftState() {
  return {
    autoMarketConfig: useAdminAutoMarketConfigDraftState(),
    instrumentReport: useAdminInstrumentReportDraftState(),
    profileConfig: useAdminProfileConfigDraftState(),
    stockEvent: useAdminStockEventDraftState(),
    userCashAdjustment: useAdminUserCashAdjustmentDraftState(),
  };
}
