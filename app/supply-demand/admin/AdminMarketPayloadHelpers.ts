import { z } from "zod";

import type { StockAutoMarketConfigPayload } from "@/app/lib/stock";
import {
  integerRange,
  positiveInteger,
  requiredUppercaseString,
} from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";

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

const AUTO_MARKET_CONFIG_MESSAGE = "자동장 대상 종목, 1~4회 주 랜덤 가중치, 주·보조 분포 편향, 최대 수량과 TTL을 올바르게 입력해 주세요.";

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
