import { z } from "zod";

import type { StockAutoMarketConfigPayload, StockListingAutoAccountConfigPayload } from "@/app/lib/stock";
import {
  integerRange,
  nonNegativeInteger,
  numberRange,
  optionalTrimmedStringAsUndefined,
  positiveInteger,
  requiredUppercaseString,
} from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";
import { MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN } from "@/app/supply-demand/admin/AdminConstants";
import type { ListingAutoOperationMode, ListingAutoPosition, ListingAutoStrategyProfile } from "@/app/types/stock";

export type AutoMarketConfigPayload = StockAutoMarketConfigPayload;

export type AutoMarketConfigDraftInput = {
  symbol: string;
  enabled: boolean;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  primaryRegimeCountWeights: AutoMarketRegimeCountWeightsDraftInput;
  primaryDistributionBias: AutoMarketDistributionBiasDraftInput;
  secondaryDistributionBias: AutoMarketDistributionBiasDraftInput;
};

export type AutoMarketRegimeCountWeightsDraftInput = {
  oneTime: string;
  twoTimes: string;
  threeTimes: string;
  fourTimes: string;
};

export type AutoMarketDistributionBiasDraftInput = {
  pricePressure: string;
  assetPreferencePressure: string;
  volatilityPressure: string;
  liquidityPressure: string;
  executionAggressionPressure: string;
};

export type ListingAutoAccountConfigPayload = StockListingAutoAccountConfigPayload;

export type ListingAutoAccountConfigDraftInput = {
  symbol: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  operationMode: ListingAutoOperationMode;
  strategyProfile: ListingAutoStrategyProfile;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  priceOffsetTicks: string;
  targetSpreadTicks: string;
  inventorySkewTicks: string;
  minimumProfitRate: string;
  aggressiveUnwindThreshold: string;
  aggressiveOrderRatio: string;
  targetBuyQuantity: string;
  targetSellQuantity: string;
  targetHoldingQuantity: string;
  inventoryBandQuantity: string;
};

const AUTO_MARKET_CONFIG_MESSAGE = "자동장 대상 종목, 1~4회 주 랜덤 가중치, 주·보조 분포 편향, 최대 수량과 TTL을 올바르게 입력해 주세요.";
const LISTING_AUTO_ACCOUNT_CONFIG_MESSAGE = "상장주관사 운용 모드, 전략, 재고·호가·수익·위험 값을 올바르게 입력해 주세요.";

const distributionBiasSchema = z.object({
  pricePressure: integerRange(-100, 100),
  assetPreferencePressure: integerRange(-100, 100),
  volatilityPressure: integerRange(-100, 100),
  liquidityPressure: integerRange(-100, 100),
  executionAggressionPressure: integerRange(-100, 100),
});

const regimeCountWeightsSchema = z.object({
  oneTime: integerRange(0, 100),
  twoTimes: integerRange(0, 100),
  threeTimes: integerRange(0, 100),
  fourTimes: integerRange(0, 100),
}).refine(
  (value) => value.oneTime + value.twoTimes + value.threeTimes + value.fourTimes > 0,
  { message: "주 랜덤 적용 횟수 가중치는 하나 이상 0보다 커야 합니다." },
);

const autoMarketConfigSchema = z.object({
  symbol: requiredUppercaseString(),
  enabled: z.boolean(),
  maxOrderQuantity: positiveInteger(),
  orderTtlSeconds: positiveInteger(),
  primaryRegimeCountWeights: regimeCountWeightsSchema,
  primaryDistributionBias: distributionBiasSchema,
  secondaryDistributionBias: distributionBiasSchema,
});

const listingAutoAccountConfigSchema = z.object({
  symbol: requiredUppercaseString(),
  displayName: optionalTrimmedStringAsUndefined(),
  enabled: z.boolean(),
  positionSide: z.enum(["SELL_ONLY", "BUY_ONLY", "TWO_SIDED"]),
  operationMode: z.enum(["UNDERWRITER_RETURN", "LIQUIDITY_PROVIDER", "HYBRID"]),
  strategyProfile: z.enum(["LIQUIDITY_FIRST", "BALANCED", "RETURN_FIRST"]),
  maxOrderQuantity: positiveInteger(),
  orderTtlSeconds: positiveInteger(),
  priceOffsetTicks: nonNegativeInteger(),
  targetSpreadTicks: integerRange(1, 50),
  inventorySkewTicks: integerRange(0, 50),
  minimumProfitRate: numberRange(0, 100),
  aggressiveUnwindThreshold: numberRange(0, 1),
  aggressiveOrderRatio: numberRange(0, 1),
  targetBuyQuantity: nonNegativeInteger(),
  targetSellQuantity: nonNegativeInteger(),
  targetHoldingQuantity: nonNegativeInteger(),
  inventoryBandQuantity: nonNegativeInteger(),
}).superRefine((value, context) => {
  if ((value.operationMode === "LIQUIDITY_PROVIDER" || value.operationMode === "HYBRID")
      && value.positionSide !== "TWO_SIDED") {
    context.addIssue({ code: "custom", path: ["positionSide"], message: "유동성공급형과 혼합형은 양방향 포지션이 필요합니다." });
  }
  if ((value.positionSide === "BUY_ONLY" || value.positionSide === "TWO_SIDED") && value.targetBuyQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["targetBuyQuantity"], message: "활성 매수 목표는 1주 이상이어야 합니다." });
  }
  if ((value.positionSide === "SELL_ONLY" || value.positionSide === "TWO_SIDED") && value.targetSellQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["targetSellQuantity"], message: "활성 매도 목표는 1주 이상이어야 합니다." });
  }
  if (value.positionSide === "BUY_ONLY" && value.targetHoldingQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["targetHoldingQuantity"], message: "매수 전용 목표 보유 수량은 1주 이상이어야 합니다." });
  }
  const oneRunCapacity = value.maxOrderQuantity * MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN;
  if ((value.positionSide === "BUY_ONLY" || value.positionSide === "TWO_SIDED") && value.targetBuyQuantity > oneRunCapacity) {
    context.addIssue({ code: "custom", path: ["targetBuyQuantity"], message: "목표 매수 잔량은 최대 수량의 10배를 넘을 수 없습니다." });
  }
  if ((value.positionSide === "SELL_ONLY" || value.positionSide === "TWO_SIDED") && value.targetSellQuantity > oneRunCapacity) {
    context.addIssue({ code: "custom", path: ["targetSellQuantity"], message: "목표 매도 잔량은 최대 수량의 10배를 넘을 수 없습니다." });
  }
  if (value.positionSide === "TWO_SIDED") {
    if (value.inventoryBandQuantity <= 0 || value.inventoryBandQuantity > value.targetHoldingQuantity) {
      context.addIssue({ code: "custom", path: ["inventoryBandQuantity"], message: "보유 허용 밴드는 1주 이상이고 목표 보유 수량 이하여야 합니다." });
    }
    if (value.targetBuyQuantity > value.inventoryBandQuantity) {
      context.addIssue({ code: "custom", path: ["targetBuyQuantity"], message: "목표 매수 호가 잔량은 보유 허용 밴드를 넘을 수 없습니다." });
    }
    if (value.targetSellQuantity > value.inventoryBandQuantity) {
      context.addIssue({ code: "custom", path: ["targetSellQuantity"], message: "목표 매도 호가 잔량은 보유 허용 밴드를 넘을 수 없습니다." });
    }
  }
});

export function buildAutoMarketConfigPayload(draft: AutoMarketConfigDraftInput): AdminPayloadResult<{
  ok: true;
  symbol: string;
  payload: AutoMarketConfigPayload;
}> {
  const parsed = autoMarketConfigSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      message: AUTO_MARKET_CONFIG_MESSAGE,
    };
  }

  return {
    ok: true,
    symbol: parsed.data.symbol,
    payload: {
      enabled: parsed.data.enabled,
      maxOrderQuantity: parsed.data.maxOrderQuantity,
      orderTtlSeconds: parsed.data.orderTtlSeconds,
      primaryRegimeCountWeights: parsed.data.primaryRegimeCountWeights,
      primaryDistributionBias: parsed.data.primaryDistributionBias,
      secondaryDistributionBias: parsed.data.secondaryDistributionBias,
    },
  };
}

export function buildListingAutoAccountConfigPayload(draft: ListingAutoAccountConfigDraftInput): AdminPayloadResult<{
  ok: true;
  symbol: string;
  payload: ListingAutoAccountConfigPayload;
}> {
  const parsed = listingAutoAccountConfigSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      message: LISTING_AUTO_ACCOUNT_CONFIG_MESSAGE,
    };
  }

  return {
    ok: true,
    symbol: parsed.data.symbol,
    payload: {
      displayName: parsed.data.displayName,
      enabled: parsed.data.enabled,
      positionSide: parsed.data.positionSide,
      operationMode: parsed.data.operationMode,
      strategyProfile: parsed.data.strategyProfile,
      maxOrderQuantity: parsed.data.maxOrderQuantity,
      orderTtlSeconds: parsed.data.orderTtlSeconds,
      priceOffsetTicks: parsed.data.priceOffsetTicks,
      targetSpreadTicks: parsed.data.targetSpreadTicks,
      inventorySkewTicks: parsed.data.inventorySkewTicks,
      minimumProfitRate: parsed.data.minimumProfitRate,
      aggressiveUnwindThreshold: parsed.data.aggressiveUnwindThreshold,
      aggressiveOrderRatio: parsed.data.aggressiveOrderRatio,
      targetBuyQuantity: parsed.data.targetBuyQuantity,
      targetSellQuantity: parsed.data.targetSellQuantity,
      targetHoldingQuantity: parsed.data.targetHoldingQuantity,
      inventoryBandQuantity: parsed.data.inventoryBandQuantity,
    },
  };
}
