import assert from "node:assert/strict";

import {
  ADMIN_NAVIGATION_GROUPS,
  resolveAdminSectionFromPath,
  resolveAdminTabFromPath,
} from "../app/navigation/adminNavigation.ts";
import { PUBLIC_NAVIGATION_ITEMS, resolvePublicRouteId } from "../app/navigation/publicNavigation.ts";
import { resolveAdminPageQueryFlags } from "../app/supply-demand/admin/AdminPageQueryFlags.ts";

assert.deepEqual(
  PUBLIC_NAVIGATION_ITEMS.map((item) => item.id),
  ["trade", "orders", "portfolio", "research", "corporate-actions"],
  "사용자 상단 탭 순서가 계약과 다릅니다.",
);
assert.equal(new Set(PUBLIC_NAVIGATION_ITEMS.map((item) => item.href)).size, PUBLIC_NAVIGATION_ITEMS.length);
assert.equal(resolvePublicRouteId("/orders"), "orders");
assert.equal(resolvePublicRouteId("/research/DEMO001"), "research");

const adminItems = ADMIN_NAVIGATION_GROUPS.flatMap((group) => group.items);
assert.equal(new Set(adminItems.map((item) => item.section)).size, adminItems.length, "관리자 section이 중복됩니다.");
assert.equal(new Set(adminItems.map((item) => item.href)).size, adminItems.length, "관리자 href가 중복됩니다.");
for (const item of adminItems) {
  assert.equal(resolveAdminSectionFromPath(item.href), item.section, `${item.href} section 해석이 잘못됐습니다.`);
}
assert.equal(resolveAdminTabFromPath("/admin/market/liquidity"), "market");
assert.equal(resolveAdminTabFromPath("/admin/participants/profiles"), "participants");
assert.equal(resolveAdminTabFromPath("/admin/corporate/reports"), "corporate");

const flagsFor = (section, tab, editingAutoParticipantUserKey = null) => resolveAdminPageQueryFlags({
  activeAdminSection: section,
  activeAdminTab: tab,
  adminStatus: "allowed",
  editingAutoParticipantUserKey,
});

assert.deepEqual(
  pickEnabled(flagsFor("dashboard", "dashboard")),
  ["shouldLoadAutoMarketSummary", "shouldLoadMarketSummary", "shouldUseAutoMarketSummary", "shouldUseMarketSummary", "shouldUseSimulationClock"],
);
assert.deepEqual(
  pickEnabled(flagsFor("market-flows", "market")),
  ["shouldLoadAdminFlowOverview", "shouldUseAdminFlowOverview"],
);
assert.deepEqual(
  pickEnabled(flagsFor("market-liquidity", "market")),
  ["includeListingAutoAccounts", "shouldLoadAutoMarketDetails", "shouldUseAutoMarketDetails"],
);
assert.deepEqual(
  pickEnabled(flagsFor("corporate-history", "corporate")),
  ["shouldLoadInstrumentDetails", "shouldUseCorporateActions", "shouldUseInstrumentDetails"],
);
assert.deepEqual(
  pickEnabled(flagsFor("corporate-reports", "corporate")),
  ["shouldLoadInstrumentDetails", "shouldUseInstrumentDetails", "shouldUseInstrumentReports"],
);
assert.deepEqual(
  pickEnabled(flagsFor("system-jobs", "system")),
  ["shouldUseBatchRuntimeControls"],
);

console.log(`navigation contract verified: public=${PUBLIC_NAVIGATION_ITEMS.length}, admin=${adminItems.length}`);

function pickEnabled(flags) {
  return Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .filter((key) => !key.startsWith("is"))
    .sort();
}
