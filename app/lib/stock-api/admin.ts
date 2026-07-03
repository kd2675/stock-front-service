import { normalizeStringList } from "@/app/lib/stringLists";
import {
  authenticatedDeleteJson,
  authenticatedGetJson,
  authenticatedPatchJson,
  authenticatedPostJson,
  toQuery,
} from "@/app/lib/stock-api/core";
import type { AdminCashFlowPage, AdminFlowOverview, AdminFundFlowScope, AdminFundFlowSummary, AdminSymbolFlowList, AutoMarketStatus, AutoParticipant, AutoParticipantCashAdjustment, AutoParticipantOverview, AutoParticipantProfileOverview, AutoParticipantProfileType, BatchJobRuntimeStatus, ListingAutoPosition, RecurringCashIntervalUnit, StockBatchJobRun } from "@/app/types/stock";

export type { AdminFundFlowScope } from "@/app/types/stock";

export type StockBatchJobRuntimeControlPayload = {
  runtimeEnabled: boolean;
};

export type StockListingAutoAccountConfigPayload = {
  displayName?: string;
  enabled?: boolean;
  positionSide?: ListingAutoPosition;
  maxOrderQuantity?: number;
  orderTtlSeconds?: number;
  priceOffsetTicks?: number;
};

export type StockAutoMarketConfigPayload = {
  enabled?: boolean;
  intensity?: number;
  maxOrderQuantity?: number;
  orderTtlSeconds?: number;
};

export type StockAutoParticipantProfileConfigPayload = {
  newsWeight: number;
  momentumWeight: number;
  contrarianWeight: number;
  lossAversionWeight: number;
  herdingWeight: number;
  marketMakingWeight: number;
  overconfidenceWeight: number;
  noiseWeight: number;
  panicSellWeight: number;
  dipBuyWeight: number;
  orderMultiplier: number;
  aggressionMultiplier: number;
  orderTtlMultiplier: number;
  quantityMultiplier: number;
  holdingPatienceWeight: number;
  deepLossHoldWeight: number;
  profitTakingWeight: number;
  recurringDepositAmount: number;
  recurringDepositIntervalValue: number;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
};

export type StockAutoParticipantPayload = {
  displayName: string;
  enabled?: boolean;
  profileType?: AutoParticipantProfileType;
  recurringCashAmount?: number | null;
  recurringCashIntervalValue?: number | null;
  recurringCashIntervalUnit?: RecurringCashIntervalUnit | null;
  createAccount?: boolean | null;
  initialCashAmount?: number | null;
};

export type StockAutoParticipantSymbolConfigPayload = {
  enabled?: boolean;
  intensity?: number;
};

export type StockAutoParticipantCashAdjustmentPayload = {
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  amount: number;
};

export type AutoParticipantActivityScope = "RECENT_SIMULATION_DAY" | "ALL";

export function getAdminFlowOverview(token: string, options?: { symbolFlowLimit?: number; includeFundFlow?: boolean; includeSymbolFlows?: boolean; fundFlowScope?: AdminFundFlowScope; symbolFlowScope?: AdminFundFlowScope }) {
  const query = toQuery({
    symbolFlowLimit: options?.symbolFlowLimit,
    includeFundFlow: options?.includeFundFlow,
    includeSymbolFlows: options?.includeSymbolFlows,
    fundFlowScope: options?.fundFlowScope,
    symbolFlowScope: options?.symbolFlowScope,
  });
  return authenticatedGetJson<AdminFlowOverview>(token, `/api/stock/v1/markets/admin/flow-overview${query}`);
}

export function getAdminFundFlowSummary(token: string, options?: { scope?: AdminFundFlowScope }) {
  const query = toQuery({
    scope: options?.scope,
  });
  return authenticatedGetJson<AdminFundFlowSummary>(token, `/api/stock/v1/markets/admin/fund-flow-summary${query}`);
}

export function getAdminSymbolFlows(token: string, options?: { limit?: number; scope?: AdminFundFlowScope }) {
  const query = toQuery({
    limit: options?.limit,
    scope: options?.scope,
  });
  return authenticatedGetJson<AdminSymbolFlowList>(token, `/api/stock/v1/markets/admin/symbol-flows${query}`);
}

export function getAdminCashFlows(token: string, page: number, size: number) {
  return authenticatedGetJson<AdminCashFlowPage>(
    token,
    `/api/stock/v1/markets/admin/cash-flows${toQuery({
      page,
      size,
    })}`,
  );
}

export function getAutoParticipantOverviews(token: string, options?: { activityScope?: AutoParticipantActivityScope; includeHoldings?: boolean; userKeys?: string[] }) {
  const normalizedUserKeys = normalizeStringList(options?.userKeys);
  const query = toQuery({
    activityScope: options?.activityScope,
    includeHoldings: options?.includeHoldings,
    userKeys: normalizedUserKeys,
  });
  return authenticatedGetJson<AutoParticipantOverview[]>(token, `/api/stock/v1/markets/auto-market/participants/overviews${query}`);
}

export function getAutoParticipants(token: string) {
  return authenticatedGetJson<AutoParticipant[]>(token, "/api/stock/v1/markets/auto-market/participants");
}

export function getAutoParticipantProfileOverviews(token: string, options?: { activityScope?: AutoParticipantActivityScope; profileTypes?: string[] }) {
  const normalizedProfileTypes = normalizeStringList(options?.profileTypes);
  const query = toQuery({
    activityScope: options?.activityScope,
    profileTypes: normalizedProfileTypes,
  });
  return authenticatedGetJson<AutoParticipantProfileOverview[]>(token, `/api/stock/v1/markets/auto-market/participants/profile-overviews${query}`);
}

export function runAutoParticipantCashFlow(token: string) {
  return authenticatedPostJson<StockBatchJobRun>(token, "/api/stock/v1/markets/auto-market/cash-flow/run", {});
}

export function getBatchJobRuntimeControls(token: string) {
  return authenticatedGetJson<BatchJobRuntimeStatus[]>(token, "/api/stock/v1/markets/batch-jobs/runtime-controls");
}

export function updateBatchJobRuntimeControl(token: string, jobName: string, payload: StockBatchJobRuntimeControlPayload) {
  return authenticatedPatchJson<BatchJobRuntimeStatus>(
    token,
    `/api/stock/v1/markets/batch-jobs/runtime-controls/${encodeURIComponent(jobName)}`,
    payload,
  );
}

export function updateListingAutoAccountConfig(
  token: string,
  symbol: string,
  payload: StockListingAutoAccountConfigPayload,
) {
  return authenticatedPatchJson<AutoMarketStatus["listingAutoAccounts"][number]>(
    token,
    `/api/stock/v1/markets/auto-market/listing-accounts/${encodeURIComponent(symbol)}`,
    payload,
  );
}

export function updateAutoMarketConfig(
  token: string,
  symbol: string,
  payload: StockAutoMarketConfigPayload,
) {
  return authenticatedPatchJson<AutoMarketStatus["configs"][number]>(
    token,
    `/api/stock/v1/markets/auto-market/configs/${encodeURIComponent(symbol)}`,
    payload,
  );
}

export function updateAutoParticipantProfileConfig(
  token: string,
  profileType: AutoParticipantProfileType,
  payload: StockAutoParticipantProfileConfigPayload,
) {
  return authenticatedPatchJson<AutoMarketStatus["participantProfileConfigs"][number]>(
    token,
    `/api/stock/v1/markets/auto-market/profile-configs/${encodeURIComponent(profileType)}`,
    payload,
  );
}

export function upsertAutoParticipant(
  token: string,
  userKey: string,
  payload: StockAutoParticipantPayload,
) {
  return authenticatedPatchJson<AutoMarketStatus["participants"][number]>(
    token,
    `/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}`,
    payload,
  );
}

export function withdrawAutoParticipant(token: string, userKey: string) {
  return authenticatedDeleteJson<AutoMarketStatus["participants"][number]>(
    token,
    `/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}`,
  );
}

export function adjustAutoParticipantCash(
  token: string,
  userKey: string,
  payload: StockAutoParticipantCashAdjustmentPayload,
) {
  return authenticatedPostJson<AutoParticipantCashAdjustment>(
    token,
    `/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}/cash-adjustments`,
    payload,
  );
}

export function updateAutoParticipantSymbolConfig(
  token: string,
  userKey: string,
  symbol: string,
  payload: StockAutoParticipantSymbolConfigPayload,
) {
  return authenticatedPatchJson<AutoMarketStatus["participantSymbolConfigs"][number]>(
    token,
    `/api/stock/v1/markets/auto-market/participants/${encodeURIComponent(userKey)}/symbols/${encodeURIComponent(symbol)}`,
    payload,
  );
}
