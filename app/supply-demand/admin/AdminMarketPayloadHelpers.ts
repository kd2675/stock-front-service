import { z } from "zod";

import type { StockAutoMarketConfigPayload, StockListingAutoAccountConfigPayload } from "@/app/lib/stock";
import {
  integerRange,
  nonNegativeInteger,
  optionalTrimmedStringAsUndefined,
  positiveInteger,
  requiredUppercaseString,
} from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";
import type { ListingAutoPosition, ListingAutoPriceDirection } from "@/app/types/stock";

export type AutoMarketConfigPayload = StockAutoMarketConfigPayload;

export type AutoMarketConfigDraftInput = {
  symbol: string;
  enabled: boolean;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  primaryDistributionBias: AutoMarketDistributionBiasDraftInput;
  secondaryDistributionBias: AutoMarketDistributionBiasDraftInput;
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
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  priceOffsetTicks: string;
  targetBuyQuantity: string;
  targetSellQuantity: string;
  targetHoldingQuantity: string;
  inventoryBandQuantity: string;
  buyPriceOffsetDirection: ListingAutoPriceDirection;
  sellPriceOffsetDirection: ListingAutoPriceDirection;
};

const AUTO_MARKET_CONFIG_MESSAGE = "자동장 대상 종목, 주·보조 분포 편향 -100~100, 1회 주문 최대 수량, 미체결 호가 TTL을 올바르게 입력해 주세요.";
const LISTING_AUTO_ACCOUNT_CONFIG_MESSAGE = "상장주관사 종목, 목표 보유 수량·허용 밴드·양쪽 호가 잔량, 최대 수량, TTL, 가격 분산 방향을 올바르게 입력해 주세요.";

const distributionBiasSchema = z.object({
  pricePressure: integerRange(-100, 100),
  assetPreferencePressure: integerRange(-100, 100),
  volatilityPressure: integerRange(-100, 100),
  liquidityPressure: integerRange(-100, 100),
  executionAggressionPressure: integerRange(-100, 100),
});

const autoMarketConfigSchema = z.object({
  symbol: requiredUppercaseString(),
  enabled: z.boolean(),
  maxOrderQuantity: positiveInteger(),
  orderTtlSeconds: positiveInteger(),
  primaryDistributionBias: distributionBiasSchema,
  secondaryDistributionBias: distributionBiasSchema,
});

const listingAutoAccountConfigSchema = z.object({
  symbol: requiredUppercaseString(),
  displayName: optionalTrimmedStringAsUndefined(),
  enabled: z.boolean(),
  positionSide: z.enum(["SELL_ONLY", "BUY_ONLY", "TWO_SIDED"]),
  maxOrderQuantity: positiveInteger(),
  orderTtlSeconds: positiveInteger(),
  priceOffsetTicks: nonNegativeInteger(),
  targetBuyQuantity: nonNegativeInteger(),
  targetSellQuantity: nonNegativeInteger(),
  targetHoldingQuantity: nonNegativeInteger(),
  inventoryBandQuantity: nonNegativeInteger(),
  buyPriceOffsetDirection: z.enum(["UP", "DOWN", "RANDOM"]),
  sellPriceOffsetDirection: z.enum(["UP", "DOWN", "RANDOM"]),
}).superRefine((value, context) => {
  if ((value.positionSide === "BUY_ONLY" || value.positionSide === "TWO_SIDED") && value.targetBuyQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["targetBuyQuantity"], message: "활성 매수 목표는 1주 이상이어야 합니다." });
  }
  if ((value.positionSide === "SELL_ONLY" || value.positionSide === "TWO_SIDED") && value.targetSellQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["targetSellQuantity"], message: "활성 매도 목표는 1주 이상이어야 합니다." });
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
      maxOrderQuantity: parsed.data.maxOrderQuantity,
      orderTtlSeconds: parsed.data.orderTtlSeconds,
      priceOffsetTicks: parsed.data.priceOffsetTicks,
      targetBuyQuantity: parsed.data.targetBuyQuantity,
      targetSellQuantity: parsed.data.targetSellQuantity,
      targetHoldingQuantity: parsed.data.targetHoldingQuantity,
      inventoryBandQuantity: parsed.data.inventoryBandQuantity,
      buyPriceOffsetDirection: parsed.data.buyPriceOffsetDirection,
      sellPriceOffsetDirection: parsed.data.sellPriceOffsetDirection,
    },
  };
}
