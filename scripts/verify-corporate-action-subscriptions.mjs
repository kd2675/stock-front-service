import assert from "node:assert/strict";

import {
  getCorporateActionSubscriptionErrorMessage,
  isCapitalIncreaseOpen,
  resolveCorporateActionSubscriptionState,
} from "../app/lib/corporateActionSubscriptions.ts";

const baseAction = {
  id: 1,
  symbol: "DEMO001",
  actionType: "PAID_IN_CAPITAL_INCREASE",
  offeringType: "SHAREHOLDER_ALLOCATION",
  shareQuantity: 1_000,
  remainingShareQuantity: 1_000,
  issuePrice: 5_000,
  status: "EX_RIGHTS_APPLIED",
  exRightsDate: "2026-07-11",
  subscriptionStartDate: "2026-07-12",
  subscriptionEndDate: "2026-07-13",
  paymentDate: "2026-07-14",
  listingDate: "2026-07-15",
  createdAt: "2026-07-10T18:00:00",
};

const shareholderRight = {
  id: 11,
  accountId: 101,
  actionId: 1,
  symbol: "DEMO001",
  actionType: "PAID_IN_CAPITAL_INCREASE",
  quantity: 25,
  shareQuantity: 25,
  status: "ANNOUNCED",
  createdAt: "2026-07-10T18:00:01",
};

assert.equal(resolveState({ currentDate: "2026-07-10", entitlement: shareholderRight }).label, "청약 예정");
assert.equal(resolveState({ currentDate: "2026-07-14", entitlement: shareholderRight }).label, "청약 마감");
assert.equal(resolveState({ currentDate: "2026-07-12", entitlement: shareholderRight, marketSession: "REGULAR" }).label, "장 마감 후");
assert.equal(resolveState({ currentDate: "2026-07-12", marketSession: "AFTER_CLOSE" }).label, "권리 없음");
assert.equal(resolveState({ currentDate: "2026-07-12", entitlementsReady: false }).label, "권리 확인");

const readyShareholder = resolveState({
  currentDate: "2026-07-12",
  entitlement: shareholderRight,
  marketSession: "AFTER_CLOSE",
});
assert.equal(readyShareholder.kind, "ready");
assert.equal(readyShareholder.maxShares, 25);

const publicOffering = {
  ...baseAction,
  id: 2,
  offeringType: "PUBLIC_OFFERING",
  status: "ANNOUNCED",
  exRightsDate: null,
  remainingShareQuantity: 600,
};
const readyPublicOffering = resolveCorporateActionSubscriptionState({
  action: publicOffering,
  currentDate: "2026-07-12",
  marketSession: "AFTER_CLOSE",
});
assert.equal(readyPublicOffering.kind, "ready");
assert.equal(readyPublicOffering.maxShares, 600);

assert.equal(resolveCorporateActionSubscriptionState({
  action: { ...publicOffering, remainingShareQuantity: null },
  currentDate: "2026-07-12",
  marketSession: "AFTER_CLOSE",
}).label, "모집 수량 확인");

assert.equal(resolveCorporateActionSubscriptionState({
  action: baseAction,
  currentDate: "2026-07-14",
  entitlement: { ...shareholderRight, status: "SUBSCRIBED" },
  marketSession: "REGULAR",
}).label, "청약 완료");

assert.equal(isCapitalIncreaseOpen(baseAction, "2026-07-10"), false);
assert.equal(isCapitalIncreaseOpen(baseAction, "2026-07-12"), true);
assert.equal(isCapitalIncreaseOpen({ ...baseAction, status: "ANNOUNCED" }, "2026-07-12"), false);
assert.equal(isCapitalIncreaseOpen(publicOffering, "2026-07-12"), true);
assert.equal(getCorporateActionSubscriptionErrorMessage(new Error("Insufficient cash balance for capital increase subscription")), "청약 납입에 필요한 예수금이 부족합니다.");

console.log("corporate action subscription contract passed");

function resolveState({ currentDate, entitlement, entitlementsReady, marketSession = "AFTER_CLOSE" }) {
  return resolveCorporateActionSubscriptionState({
    action: baseAction,
    currentDate,
    entitlement,
    entitlementsReady,
    marketSession,
  });
}
