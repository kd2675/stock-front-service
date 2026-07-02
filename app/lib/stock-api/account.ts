import {
  authenticatedGetJson,
  authenticatedPostJson,
} from "@/app/lib/stock-api/core";
import type { Account, AccountCashAdjustment, AccountStatus, FundFlow, StockUserProfile } from "@/app/types/stock";

export type StockAccountReconnectPayload = {
  accountCode: string;
  recoveryCode: string;
};

export type StockAccountCashAdjustmentPayload = {
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  amount: number;
};

export function getAdminUserFundFlow(token: string, userKey: string) {
  return authenticatedGetJson<FundFlow>(token, `/api/stock/v1/accounts/admin/users/${encodeURIComponent(userKey)}/fund-flow`);
}

export function getAccountStatus(token: string) {
  return authenticatedGetJson<AccountStatus>(token, "/api/stock/v1/accounts/me/status");
}

export function openStockAccount(token: string) {
  return authenticatedPostJson<Account>(token, "/api/stock/v1/accounts/me", {});
}

export function reconnectStockAccount(token: string, payload: StockAccountReconnectPayload) {
  return authenticatedPostJson<Account>(token, "/api/stock/v1/accounts/reconnect", payload);
}

export function adjustUserAccountCash(
  token: string,
  userKey: string,
  payload: StockAccountCashAdjustmentPayload,
) {
  return authenticatedPostJson<AccountCashAdjustment>(
    token,
    `/api/stock/v1/accounts/admin/users/${encodeURIComponent(userKey)}/cash-adjustments`,
    payload,
  );
}

export function getStockUserProfile(token: string) {
  return authenticatedGetJson<StockUserProfile>(token, "/api/stock/v1/users/me");
}
