import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  calculateListingAutoTargetFit,
  LISTING_AUTO_QUANTITY_PRESETS,
} from "../app/supply-demand/admin/listingAutoTargetFit.ts";

const example = calculateListingAutoTargetFit({
  issuedShares: 1_000_000,
  holdingQuantity: 97_205,
  openBuyQuantity: 0,
  openSellQuantity: 0,
  targetHoldingQuantity: 102_200,
  quantityPresetId: "MAX_RECOMMENDED",
});

assert.deepEqual(example, {
  inventoryBandQuantity: 30_660,
  targetBuyQuantity: 30_660,
  targetSellQuantity: 30_660,
  maxOrderQuantity: 3_066,
  lowerHoldingLimit: 71_540,
  upperHoldingLimit: 132_860,
  effectiveBuyTarget: 30_660,
  effectiveSellTarget: 25_665,
  buyRefillQuantity: 30_660,
  sellRefillQuantity: 25_665,
  buyOrderFragments: 10,
  sellOrderFragments: 9,
  netTargetQuantity: 4_995,
});

const aboveTarget = calculateListingAutoTargetFit({
  issuedShares: 1_000_000,
  holdingQuantity: 110_000,
  openBuyQuantity: 5_000,
  openSellQuantity: 10_000,
  targetHoldingQuantity: 100_000,
  quantityPresetId: "MAX_RECOMMENDED",
});

assert.equal(aboveTarget?.effectiveBuyTarget, 20_000);
assert.equal(aboveTarget?.effectiveSellTarget, 30_000);
assert.equal(aboveTarget?.netTargetQuantity, -10_000);
assert.equal(aboveTarget?.maxOrderQuantity, 3_000);
assert.equal(aboveTarget?.buyRefillQuantity, 15_000);
assert.equal(aboveTarget?.sellRefillQuantity, 20_000);
assert.equal(aboveTarget?.buyOrderFragments, 5);
assert.equal(aboveTarget?.sellOrderFragments, 7);

assert.equal(calculateListingAutoTargetFit({
  issuedShares: 1_000_000,
  holdingQuantity: 0,
  openBuyQuantity: 0,
  openSellQuantity: 0,
  targetHoldingQuantity: 0,
  quantityPresetId: "BALANCED",
}), null);
assert.equal(calculateListingAutoTargetFit({
  issuedShares: 1_000_000,
  holdingQuantity: 1_000_000,
  openBuyQuantity: 0,
  openSellQuantity: 0,
  targetHoldingQuantity: 1_000_000,
  quantityPresetId: "BALANCED",
}), null);

assert.deepEqual(
  LISTING_AUTO_QUANTITY_PRESETS.map((preset) => preset.id),
  ["PILOT", "CONSERVATIVE", "BALANCED", "ACTIVE", "MAX_RECOMMENDED"],
);

const presetFits = LISTING_AUTO_QUANTITY_PRESETS.map((preset) => ({
  preset,
  fit: calculateListingAutoTargetFit({
    issuedShares: 1_000_000,
    holdingQuantity: 100_000,
    openBuyQuantity: 0,
    openSellQuantity: 0,
    targetHoldingQuantity: 100_000,
    quantityPresetId: preset.id,
  }),
}));

for (const { preset, fit } of presetFits) {
  assert.ok(fit);
  assert.equal(fit.targetBuyQuantity, fit.inventoryBandQuantity);
  assert.equal(fit.targetSellQuantity, fit.inventoryBandQuantity);
  assert.ok(fit.lowerHoldingLimit >= 0);
  assert.ok(fit.upperHoldingLimit <= 1_000_000);
  assert.ok(fit.targetBuyQuantity <= fit.maxOrderQuantity * 10);
  assert.ok(fit.buyOrderFragments <= preset.orderFragmentCount);
  assert.ok(fit.sellOrderFragments <= preset.orderFragmentCount);
}

assert.deepEqual(
  presetFits.map(({ fit }) => fit?.inventoryBandQuantity),
  [10_000, 15_000, 20_000, 25_000, 30_000],
);

const listingAutoPanelSource = readFileSync(
  new URL("../app/supply-demand/admin/AdminListingAutoAccountPanel.tsx", import.meta.url),
  "utf8",
);
const quantityPresetModalSource = readFileSync(
  new URL("../app/supply-demand/admin/AdminListingAutoQuantityPresetModal.tsx", import.meta.url),
  "utf8",
);

assert.doesNotMatch(listingAutoPanelSource, /draftSetters\.setEnabled\(true\)/);
assert.match(listingAutoPanelSource, /actionLabel="권장 수량 적용"/);
assert.match(quantityPresetModalSource, /양방향으로 전환하고 적용/);
assert.match(quantityPresetModalSource, /계정의 가동·정지 상태는 유지됩니다/);

console.log("listing auto target fit contract passed");
