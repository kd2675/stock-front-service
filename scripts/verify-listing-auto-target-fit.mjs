import assert from "node:assert/strict";

import { calculateListingAutoTargetFit } from "../app/supply-demand/admin/listingAutoTargetFit.ts";

const example = calculateListingAutoTargetFit({
  issuedShares: 1_000_000,
  holdingQuantity: 97_205,
  openBuyQuantity: 0,
  openSellQuantity: 0,
  targetHoldingQuantity: 102_200,
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
}), null);
assert.equal(calculateListingAutoTargetFit({
  issuedShares: 1_000_000,
  holdingQuantity: 1_000_000,
  openBuyQuantity: 0,
  openSellQuantity: 0,
  targetHoldingQuantity: 1_000_000,
}), null);

console.log("listing auto target fit contract passed");
