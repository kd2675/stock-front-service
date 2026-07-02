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
import type { ListingAutoPosition } from "@/app/types/stock";

export type AutoMarketConfigPayload = StockAutoMarketConfigPayload;

export type AutoMarketConfigDraftInput = {
  symbol: string;
  enabled: boolean;
  intensity: string;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
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
};

const AUTO_MARKET_CONFIG_MESSAGE = "자동장 대상 종목, 기본 방향 강도 1-10, 1회 주문 최대 수량, 미체결 호가 TTL을 올바르게 입력해 주세요.";
const LISTING_AUTO_ACCOUNT_CONFIG_MESSAGE = "상장주관사 종목, 최대 수량, TTL, 가격 분산 틱을 올바르게 입력해 주세요.";

const autoMarketConfigSchema = z.object({
  symbol: requiredUppercaseString(),
  enabled: z.boolean(),
  intensity: integerRange(1, 10),
  maxOrderQuantity: positiveInteger(),
  orderTtlSeconds: positiveInteger(),
});

const listingAutoAccountConfigSchema = z.object({
  symbol: requiredUppercaseString(),
  displayName: optionalTrimmedStringAsUndefined(),
  enabled: z.boolean(),
  positionSide: z.enum(["SELL_ONLY", "BUY_ONLY"]),
  maxOrderQuantity: positiveInteger(),
  orderTtlSeconds: positiveInteger(),
  priceOffsetTicks: nonNegativeInteger(),
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
      intensity: parsed.data.intensity,
      maxOrderQuantity: parsed.data.maxOrderQuantity,
      orderTtlSeconds: parsed.data.orderTtlSeconds,
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
    },
  };
}
