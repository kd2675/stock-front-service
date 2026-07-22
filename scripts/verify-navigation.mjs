import assert from "node:assert/strict";

import {
  ADMIN_NAVIGATION_GROUPS,
  resolveAdminSectionFromPath,
  resolveAdminTabFromPath,
} from "../app/navigation/adminNavigation.ts";
import { PUBLIC_NAVIGATION_ITEMS, resolvePublicRouteId } from "../app/navigation/publicNavigation.ts";
import { resolveAdminPageQueryFlags } from "../app/supply-demand/admin/AdminPageQueryFlags.ts";
import nextConfig from "../next.config.ts";

assert.deepEqual(
  PUBLIC_NAVIGATION_ITEMS.map((item) => item.id),
  ["trade", "orders", "portfolio", "research", "corporate-actions"],
  "사용자 상단 탭 순서가 계약과 다릅니다.",
);
assert.equal(new Set(PUBLIC_NAVIGATION_ITEMS.map((item) => item.href)).size, PUBLIC_NAVIGATION_ITEMS.length);
assert.equal(resolvePublicRouteId("/orders"), "orders");
assert.equal(resolvePublicRouteId("/research/DEMO001"), "research");

const adminItems = ADMIN_NAVIGATION_GROUPS.flatMap((group) => group.items);
const adminGroupSections = Object.fromEntries(ADMIN_NAVIGATION_GROUPS.map((group) => [
  group.tab,
  group.items.map((item) => item.section),
]));
assert.equal(new Set(adminItems.map((item) => item.section)).size, adminItems.length, "관리자 section이 중복됩니다.");
assert.equal(new Set(adminItems.map((item) => item.href)).size, adminItems.length, "관리자 href가 중복됩니다.");
assert.deepEqual(
  adminGroupSections.market,
  ["market-instruments", "market-auto-market", "market-liquidity", "market-flows"],
  "시장 운영 메뉴의 업무 순서가 계약과 다릅니다.",
);
assert.deepEqual(
  adminGroupSections.participants,
  ["participants-overview", "participants-list", "participants-profiles"],
  "자동 참여자 메뉴에는 계정·프로필 업무만 있어야 합니다.",
);
for (const item of adminItems) {
  assert.equal(resolveAdminSectionFromPath(item.href), item.section, `${item.href} section 해석이 잘못됐습니다.`);
}
assert.equal(resolveAdminTabFromPath("/admin/market/liquidity"), "market");
assert.equal(resolveAdminTabFromPath("/admin/market/auto-market"), "market");
assert.equal(resolveAdminTabFromPath("/admin/participants/profiles"), "participants");
assert.equal(resolveAdminTabFromPath("/admin/corporate/reports"), "corporate");

assert.equal(typeof nextConfig.redirects, "function", "Next.js redirect 설정이 없습니다.");
const redirects = await nextConfig.redirects();
const redirectsBySource = new Map(redirects.map((redirect) => [redirect.source, redirect.destination]));
assert.equal(redirectsBySource.has("/admin/participants/symbols"), false, "이전 자동 참여자 경로에 호환 리다이렉트를 두면 안 됩니다.");
assert.equal(redirectsBySource.has("/supply-demand/admin/automation/symbols"), false, "이전 자동장 경로에 호환 리다이렉트를 두면 안 됩니다.");

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
  pickEnabled(flagsFor("market-auto-market", "market")),
  ["includeConfigs", "shouldLoadAutoMarketDetails", "shouldUseAutoMarketDetails"],
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
