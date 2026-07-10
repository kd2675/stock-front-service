import { mutationOptions } from "@tanstack/react-query";

import type { ApiResult } from "@/app/lib/api";
import {
  amendOrder,
  applyCorporateAction,
  adjustAutoParticipantCash,
  adjustUserAccountCash,
  cancelOrder,
  cancelOrderPartially,
  createOrderBookInstrument,
  deleteInstrumentReport,
  jumpSimulationClock,
  openStockAccount,
  placeOrder,
  publishInstrumentReport,
  reconnectStockAccount,
  regenerateAutoMarketDailyRegime,
  regenerateAutoMarketRegimeModifier,
  runAutoParticipantCashFlow,
  subscribeCorporateAction,
  updateAutoMarketConfig,
  updateAutoParticipantProfileConfig,
  updateAutoParticipantSymbolConfig,
  updateBatchJobRuntimeControl,
  updateInstrumentReport,
  updateOrderBookInstrumentTradingRules,
  updateListingAutoAccountConfig,
  updateMarketStatus,
  upsertAutoParticipant,
  withdrawAutoParticipant,
} from "@/app/lib/stock";
import type {
  StockAutoMarketConfigPayload,
  StockAccountCashAdjustmentPayload,
  StockAutoParticipantCashAdjustmentPayload,
  StockAutoParticipantPayload,
  StockAutoParticipantProfileConfigPayload,
  StockAutoParticipantSymbolConfigPayload,
  StockBatchJobRuntimeControlPayload,
  StockCorporateActionPayload,
  StockCorporateActionSubscriptionPayload,
  StockInstrumentReportPayload,
  StockListingAutoAccountConfigPayload,
  StockMarketStatusPayload,
  StockOrderAmendPayload,
  StockOrderBookInstrumentCreatePayload,
  StockOrderBookInstrumentTradingRulesPayload,
  StockOrderPartialCancelPayload,
  StockOrderPlacePayload,
  StockSimulationClockJumpPayload,
} from "@/app/lib/stock";
import { unwrapAuthenticatedStockRequest } from "@/app/lib/react-query/stockResult";
import type { AutoParticipantProfileType, MarketType } from "@/app/types/stock";

type PlaceOrderVariables = StockOrderPlacePayload;

function authenticatedNoVariablesMutationOptions<TData>(
  request: (token: string) => Promise<ApiResult<TData>>,
  fallbackMessage: string,
) {
  return mutationOptions({
    mutationFn: () => unwrapAuthenticatedStockRequest(request, fallbackMessage),
  });
}

function authenticatedMutationOptions<TVariables, TData>(
  request: (token: string, variables: TVariables) => Promise<ApiResult<TData>>,
  fallbackMessage: string,
) {
  return mutationOptions({
    mutationFn: (variables: TVariables) =>
      unwrapAuthenticatedStockRequest((token) => request(token, variables), fallbackMessage),
  });
}

function adminNoVariablesMutationOptions<TData>(
  request: (token: string) => Promise<ApiResult<TData>>,
) {
  return mutationOptions({
    mutationFn: (variables: { token: string }) => request(variables.token),
  });
}

function adminMutationOptions<TVariables extends object, TData>(
  request: (token: string, variables: TVariables) => Promise<ApiResult<TData>>,
) {
  return mutationOptions({
    mutationFn: ({ token, ...variables }: { token: string } & TVariables) =>
      request(token, variables as TVariables),
  });
}

export function openAccountMutationOptions() {
  return authenticatedNoVariablesMutationOptions(openStockAccount, "계좌 개설에 실패했습니다.");
}

export function reconnectAccountMutationOptions() {
  return authenticatedMutationOptions(
    reconnectStockAccount,
    "계좌 복구 연결에 실패했습니다.",
  );
}

export function placeOrderMutationOptions() {
  return authenticatedMutationOptions(
    (token, payload: PlaceOrderVariables) => placeOrder(token, payload),
    "주문 접수에 실패했습니다.",
  );
}

export function cancelOrderMutationOptions() {
  return authenticatedMutationOptions(cancelOrder, "주문 취소에 실패했습니다.");
}

export function amendOrderMutationOptions() {
  return authenticatedMutationOptions(
    (token, variables: { orderId: number } & StockOrderAmendPayload) =>
      amendOrder(token, variables.orderId, { quantity: variables.quantity, limitPrice: variables.limitPrice }),
    "주문 정정에 실패했습니다.",
  );
}

export function cancelOrderPartiallyMutationOptions() {
  return authenticatedMutationOptions(
    (token, variables: { orderId: number } & StockOrderPartialCancelPayload) =>
      cancelOrderPartially(token, variables.orderId, variables.quantity),
    "부분 취소에 실패했습니다.",
  );
}

export function createOrderBookInstrumentMutationOptions() {
  return authenticatedMutationOptions(
    (token, payload: StockOrderBookInstrumentCreatePayload) => createOrderBookInstrument(token, payload),
    "주문장 종목 생성에 실패했습니다.",
  );
}

export function adminUpdateOrderBookInstrumentTradingRulesMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
      payload: StockOrderBookInstrumentTradingRulesPayload;
    }) => updateOrderBookInstrumentTradingRules(token, variables.symbol, variables.payload),
  );
}

export function adminUpdateMarketStatusMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      marketType: MarketType;
      symbol: string;
      payload: StockMarketStatusPayload;
    }) => updateMarketStatus(token, variables.marketType, variables.symbol, variables.payload),
  );
}

export function adminJumpSimulationClockMutationOptions() {
  return adminMutationOptions(
    (token, payload: StockSimulationClockJumpPayload) => jumpSimulationClock(token, payload),
  );
}

export function adminUpdateAutoMarketConfigMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
      payload: StockAutoMarketConfigPayload;
    }) => updateAutoMarketConfig(token, variables.symbol, variables.payload),
  );
}

export function adminRegenerateAutoMarketDailyRegimeMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
    }) => regenerateAutoMarketDailyRegime(token, variables.symbol),
  );
}

export function adminRegenerateAutoMarketRegimeModifierMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
    }) => regenerateAutoMarketRegimeModifier(token, variables.symbol),
  );
}

export function adminUpdateListingAutoAccountConfigMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
      payload: StockListingAutoAccountConfigPayload;
    }) => updateListingAutoAccountConfig(token, variables.symbol, variables.payload),
  );
}

export function adminAdjustUserAccountCashMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      userKey: string;
      payload: StockAccountCashAdjustmentPayload;
    }) => adjustUserAccountCash(token, variables.userKey, variables.payload),
  );
}

export function adminUpsertAutoParticipantMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      userKey: string;
      payload: StockAutoParticipantPayload;
    }) => upsertAutoParticipant(token, variables.userKey, variables.payload),
  );
}

export function adminWithdrawAutoParticipantMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      userKey: string;
    }) => withdrawAutoParticipant(token, variables.userKey),
  );
}

export function adminAdjustAutoParticipantCashMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      userKey: string;
      payload: StockAutoParticipantCashAdjustmentPayload;
    }) => adjustAutoParticipantCash(token, variables.userKey, variables.payload),
  );
}

export function adminApplyCorporateActionMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
      payload: StockCorporateActionPayload;
    }) => applyCorporateAction(token, variables.symbol, variables.payload),
  );
}

export function subscribeCorporateActionMutationOptions() {
  return authenticatedMutationOptions(
    (token, variables: {
      actionId: number;
      payload: StockCorporateActionSubscriptionPayload;
      symbol: string;
    }) => subscribeCorporateAction(token, variables.actionId, variables.payload),
    "기업 이벤트 청약에 실패했습니다.",
  );
}

export function adminUpdateAutoParticipantProfileConfigMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      profileType: AutoParticipantProfileType;
      payload: StockAutoParticipantProfileConfigPayload;
    }) => updateAutoParticipantProfileConfig(token, variables.profileType, variables.payload),
  );
}

export function adminUpdateAutoParticipantSymbolConfigMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      userKey: string;
      symbol: string;
      payload: StockAutoParticipantSymbolConfigPayload;
    }) => updateAutoParticipantSymbolConfig(token, variables.userKey, variables.symbol, variables.payload),
  );
}

export function adminUpdateBatchJobRuntimeControlMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      jobName: string;
      payload: StockBatchJobRuntimeControlPayload;
    }) => updateBatchJobRuntimeControl(token, variables.jobName, variables.payload),
  );
}

export function adminRunAutoParticipantCashFlowMutationOptions() {
  return adminNoVariablesMutationOptions(runAutoParticipantCashFlow);
}

export function adminSaveInstrumentReportMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      mode: "publish" | "update";
      symbol: string;
      payload: StockInstrumentReportPayload;
    }) => variables.mode === "publish"
      ? publishInstrumentReport(token, variables.symbol, variables.payload)
      : updateInstrumentReport(token, variables.symbol, variables.payload),
  );
}

export function adminDeleteInstrumentReportMutationOptions() {
  return adminMutationOptions(
    (token, variables: {
      symbol: string;
    }) => deleteInstrumentReport(token, variables.symbol),
  );
}
