import type { ListingAutoOperationMode, ListingAutoStrategyProfile } from "@/app/types/stock";

export const LISTING_AUTO_OPERATION_MODES: ReadonlyArray<{
  value: ListingAutoOperationMode;
  label: string;
  description: string;
}> = [
  { value: "UNDERWRITER_RETURN", label: "인수수익형", description: "발행가로 인수한 재고의 원가를 회수하고 목표 이익률 이상에서 매도합니다." },
  { value: "LIQUIDITY_PROVIDER", label: "유동성공급형", description: "재고 목표를 지키면서 양방향 사다리 호가와 낮은 스프레드를 우선합니다." },
  { value: "HYBRID", label: "혼합형", description: "양방향 유동성을 유지하되 평시 매도에는 원가 대비 이익 조건을 함께 적용합니다." },
];

export type ListingAutoPolicyPreset = {
  targetSpreadTicks: string;
  inventorySkewTicks: string;
  minimumProfitRate: string;
  aggressiveUnwindThreshold: string;
  aggressiveOrderRatio: string;
};

export const LISTING_AUTO_STRATEGY_PROFILES: ReadonlyArray<{
  value: ListingAutoStrategyProfile;
  label: string;
  description: string;
  preset: ListingAutoPolicyPreset;
}> = [
  {
    value: "LIQUIDITY_FIRST",
    label: "유동성 우선",
    description: "좁은 2틱 스프레드와 강한 재고 보정으로 호가 유지율을 높입니다.",
    preset: { targetSpreadTicks: "2", inventorySkewTicks: "6", minimumProfitRate: "0", aggressiveUnwindThreshold: "0.8", aggressiveOrderRatio: "0.2" },
  },
  {
    value: "BALANCED",
    label: "균형",
    description: "유동성, 인수원가 회수, 재고 위험을 같은 비중으로 관리합니다.",
    preset: { targetSpreadTicks: "4", inventorySkewTicks: "4", minimumProfitRate: "0.5", aggressiveUnwindThreshold: "0.9", aggressiveOrderRatio: "0.1" },
  },
  {
    value: "RETURN_FIRST",
    label: "수익 우선",
    description: "넓은 스프레드와 최소 이익률을 적용하고 손해 매도형 공격 주문을 사용하지 않습니다.",
    preset: { targetSpreadTicks: "8", inventorySkewTicks: "3", minimumProfitRate: "1", aggressiveUnwindThreshold: "1", aggressiveOrderRatio: "0" },
  },
];

export function listingAutoStrategyPreset(profile: ListingAutoStrategyProfile): ListingAutoPolicyPreset {
  return LISTING_AUTO_STRATEGY_PROFILES.find((item) => item.value === profile)?.preset
    ?? LISTING_AUTO_STRATEGY_PROFILES[1].preset;
}
