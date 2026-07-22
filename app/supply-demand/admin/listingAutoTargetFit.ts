const MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN = 10;

export type ListingAutoQuantityPresetId =
  | "PILOT"
  | "CONSERVATIVE"
  | "BALANCED"
  | "ACTIVE"
  | "MAX_RECOMMENDED";

export type ListingAutoQuantityPreset = {
  id: ListingAutoQuantityPresetId;
  label: string;
  description: string;
  inventoryBandRatio: number;
  orderFragmentCount: number;
};

export const LISTING_AUTO_QUANTITY_PRESETS: ReadonlyArray<ListingAutoQuantityPreset> = [
  {
    id: "PILOT",
    label: "시험 공급",
    description: "새 설정과 주문 부하를 작은 규모로 먼저 확인합니다.",
    inventoryBandRatio: 0.10,
    orderFragmentCount: 4,
  },
  {
    id: "CONSERVATIVE",
    label: "보수 공급",
    description: "재고 변동과 주문 수를 낮게 유지합니다.",
    inventoryBandRatio: 0.15,
    orderFragmentCount: 5,
  },
  {
    id: "BALANCED",
    label: "균형 공급",
    description: "유동성 공급과 재고 위험을 균형 있게 배분합니다.",
    inventoryBandRatio: 0.20,
    orderFragmentCount: 6,
  },
  {
    id: "ACTIVE",
    label: "적극 공급",
    description: "더 깊은 양방향 호가를 여러 주문으로 분산합니다.",
    inventoryBandRatio: 0.25,
    orderFragmentCount: 8,
  },
  {
    id: "MAX_RECOMMENDED",
    label: "최대 권장",
    description: "현재 권장 범위에서 가장 많은 양방향 잔량을 공급합니다.",
    inventoryBandRatio: 0.30,
    orderFragmentCount: 10,
  },
];

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

export type ListingAutoTargetFitInput = {
  issuedShares: number;
  holdingQuantity: number;
  openBuyQuantity: number;
  openSellQuantity: number;
  targetHoldingQuantity: number;
  quantityPresetId: ListingAutoQuantityPresetId;
};

export function calculateListingAutoTargetFit({
  issuedShares,
  holdingQuantity,
  openBuyQuantity,
  openSellQuantity,
  targetHoldingQuantity,
  quantityPresetId,
}: ListingAutoTargetFitInput): ListingAutoTargetFit | null {
  if (!Number.isSafeInteger(issuedShares) || issuedShares <= 0
      || !Number.isSafeInteger(holdingQuantity) || holdingQuantity < 0
      || !Number.isSafeInteger(openBuyQuantity) || openBuyQuantity < 0
      || !Number.isSafeInteger(openSellQuantity) || openSellQuantity < 0
      || !Number.isSafeInteger(targetHoldingQuantity)
      || targetHoldingQuantity <= 0
      || targetHoldingQuantity >= issuedShares) {
    return null;
  }

  const quantityPreset = LISTING_AUTO_QUANTITY_PRESETS.find((preset) => preset.id === quantityPresetId);
  if (!quantityPreset) {
    return null;
  }

  const symmetricCapacity = Math.min(targetHoldingQuantity, issuedShares - targetHoldingQuantity);
  const inventoryBandQuantity = Math.max(
    1,
    Math.round(symmetricCapacity * quantityPreset.inventoryBandRatio),
  );
  const targetBuyQuantity = inventoryBandQuantity;
  const targetSellQuantity = inventoryBandQuantity;
  const orderFragmentCount = Math.min(
    quantityPreset.orderFragmentCount,
    MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN,
  );
  const maxOrderQuantity = Math.max(
    1,
    Math.ceil(inventoryBandQuantity / orderFragmentCount),
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
