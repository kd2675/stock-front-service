import assert from "node:assert/strict";

import {
  buildCashDividendGuidanceModel,
  comparisonPositionPercent,
} from "../app/supply-demand/admin/cashDividendGuidance.ts";

const baseGuidance = {
  symbol: "DEMO001",
  referencePrice: 88_500,
  referencePriceBasis: "PREVIOUS_CLOSE",
  issuedShares: 1_000_000,
  tradableShares: 1_000_000,
  recentHoldingQuantity: 980_000,
  holdingReferenceCloseRunId: 81,
  holdingReferenceBusinessDate: "2026-08-20",
  completedDividendCount: 1,
  history: [{
    actionId: 4,
    status: "PAID",
    originalDividendPerShare: 2_300,
    splitAdjustedDividendPerShare: 2_300,
    basePrice: 99_600,
    dividendYield: 2.3092,
    actualPaidCash: 2_300_000_000,
    eligibleShareQuantity: 1_000_000,
    exRightsDate: "2026-08-16",
    paymentDate: "2026-08-17",
  }],
};

const maintained = buildCashDividendGuidanceModel(baseGuidance, "2300");
assert.equal(maintained.primarySuggestion.amount, 2_300);
assert.equal(maintained.comparisons[0].ratioPercent, 100);
assert.equal(maintained.comparisons[0].positionPercent, 50);
assert.equal(maintained.estimatedEligiblePayout, 2_254_000_000);
assert.equal(maintained.issuedSharePayoutCeiling, 2_300_000_000);
assert.equal(maintained.comparisons.find((comparison) => comparison.id === "TOTAL_PAYOUT")?.ratioPercent, 98);
assert.equal(maintained.warning, null);

const oversized = buildCashDividendGuidanceModel(baseGuidance, "12000");
assert.ok(oversized.comparisons.every((comparison) => comparison.ratioPercent > 500));
assert.match(oversized.warning ?? "", /5배/);

const noHistory = buildCashDividendGuidanceModel({ ...baseGuidance, completedDividendCount: 0, history: [] }, "");
assert.equal(noHistory.primarySuggestion.id, "YIELD_2");
assert.equal(noHistory.primarySuggestion.amount, 1_800);
assert.deepEqual(noHistory.comparisons, []);

const threeHistory = buildCashDividendGuidanceModel({
  ...baseGuidance,
  completedDividendCount: 3,
  history: [
    baseGuidance.history[0],
    { ...baseGuidance.history[0], actionId: 3, splitAdjustedDividendPerShare: 1_900 },
    { ...baseGuidance.history[0], actionId: 2, splitAdjustedDividendPerShare: 2_100 },
  ],
}, "");
assert.equal(threeHistory.primarySuggestion.id, "RECENT_MEDIAN");
assert.equal(threeHistory.primarySuggestion.amount, 2_100);

assert.equal(comparisonPositionPercent(100), 50);
assert.equal(comparisonPositionPercent(200), 75);
assert.equal(comparisonPositionPercent(500), 100);
assert.equal(comparisonPositionPercent(900), 100);

console.log("cash dividend guidance verification passed");
