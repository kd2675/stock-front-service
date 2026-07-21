const INVENTORY_BAND_RATIO = 0.30;
const MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN = 10;

export type ListingAutoTargetFit = {
  inventoryBandQuantity: number;
  targetBuyQuantity: number;
  targetSellQuantity: number;
  maxOrderQuantity: number;
  lowerHoldingLimit: number;
  upperHoldingLimit: number;
  effectiveBuyTarget: number;
  effectiveSellTarget: number;
  buyRefillQuantity: number;
  sellRefillQuantity: number;
  buyOrderFragments: number;
  sellOrderFragments: number;
  netTargetQuantity: number;
};

export function calculateListingAutoTargetFit({
  issuedShares,
  holdingQuantity,
  openBuyQuantity,
  openSellQuantity,
  targetHoldingQuantity,
}: {
  issuedShares: number;
  holdingQuantity: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  targetHoldingQuantity: number;
}): ListingAutoTargetFit | null {
  if (!Number.isSafeInteger(issuedShares) || issuedShares <= 0
      || !Number.isSafeInteger(holdingQuantity) || holdingQuantity < 0
      || !Number.isSafeInteger(openBuyQuantity) || openBuyQuantity < 0
      || !Number.isSafeInteger(openSellQuantity) || openSellQuantity < 0
      || !Number.isSafeInteger(targetHoldingQuantity)
      || targetHoldingQuantity <= 0
      || targetHoldingQuantity >= issuedShares) {
    return null;
  }

  const symmetricCapacity = Math.min(targetHoldingQuantity, issuedShares - targetHoldingQuantity);
  const inventoryBandQuantity = Math.max(1, Math.round(symmetricCapacity * INVENTORY_BAND_RATIO));
  const targetBuyQuantity = inventoryBandQuantity;
  const targetSellQuantity = inventoryBandQuantity;
  const maxOrderQuantity = Math.max(
    1,
    Math.ceil(inventoryBandQuantity / MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN),
  );
  const lowerHoldingLimit = targetHoldingQuantity - inventoryBandQuantity;
  const upperHoldingLimit = targetHoldingQuantity + inventoryBandQuantity;
  const effectiveBuyTarget = Math.min(
    targetBuyQuantity,
    Math.max(0, upperHoldingLimit - holdingQuantity),
  );
  const effectiveSellTarget = Math.min(
    targetSellQuantity,
    Math.max(0, holdingQuantity - lowerHoldingLimit),
  );
  const buyRefillQuantity = Math.max(0, effectiveBuyTarget - openBuyQuantity);
  const sellRefillQuantity = Math.max(0, effectiveSellTarget - openSellQuantity);

  return {
    inventoryBandQuantity,
    targetBuyQuantity,
    targetSellQuantity,
    maxOrderQuantity,
    lowerHoldingLimit,
    upperHoldingLimit,
    effectiveBuyTarget,
    effectiveSellTarget,
    buyRefillQuantity,
    sellRefillQuantity,
    buyOrderFragments: Math.ceil(buyRefillQuantity / maxOrderQuantity),
    sellOrderFragments: Math.ceil(sellRefillQuantity / maxOrderQuantity),
    netTargetQuantity: effectiveBuyTarget - effectiveSellTarget,
  };
}
