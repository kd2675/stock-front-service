import { z } from "zod";

import {
  nonNegativeInteger,
  optionalTrimmedStringAsUndefined,
  positiveInteger,
  positiveNumber,
  requiredTrimmedString,
  requiredUppercaseString,
} from "@/app/lib/validation/zodFormSchemas";
import { MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN } from "@/app/supply-demand/admin/AdminConstants";

export const createInstrumentSchema = z.object({
  symbol: requiredUppercaseString("종목 코드를 입력해 주세요."),
  name: requiredTrimmedString("종목명을 입력해 주세요."),
  market: z.string().trim().default("ORDERBOOK"),
  initialPrice: positiveNumber("초기 가격은 0보다 큰 숫자로 입력해 주세요."),
  issuedShares: positiveInteger("초기 발행주식수는 1주 이상 정수로 입력해 주세요."),
  priceLimitRate: z.coerce.number().finite("가격제한폭을 입력해 주세요.").positive("가격제한폭은 0보다 커야 합니다.").max(100, "가격제한폭은 100 이하로 입력해 주세요."),
  listingAutoDisplayName: optionalTrimmedStringAsUndefined(),
  listingAutoEnabled: z.enum(["true", "false"]).default("true"),
  listingAutoPositionSide: z.enum(["SELL_ONLY", "BUY_ONLY", "TWO_SIDED"]).default("SELL_ONLY"),
  listingAutoMaxOrderQuantity: positiveInteger("상장주관사 최대 주문 수량은 1주 이상 정수로 입력해 주세요."),
  listingAutoOrderTtlSeconds: positiveInteger("상장주관사 호가 TTL은 1초 이상 정수로 입력해 주세요."),
  listingAutoPriceOffsetTicks: nonNegativeInteger("상장주관사 가격 분산 틱은 0 이상 정수로 입력해 주세요."),
  listingAutoTargetBuyQuantity: nonNegativeInteger("상장주관사 목표 매수 잔량은 0 이상 정수로 입력해 주세요."),
  listingAutoTargetSellQuantity: nonNegativeInteger("상장주관사 목표 매도 잔량은 0 이상 정수로 입력해 주세요."),
  listingAutoTargetHoldingQuantity: nonNegativeInteger("상장주관사 목표 보유 수량은 0 이상 정수로 입력해 주세요."),
  listingAutoInventoryBandQuantity: nonNegativeInteger("상장주관사 보유 허용 밴드는 0 이상 정수로 입력해 주세요."),
  listingAutoBuyPriceOffsetDirection: z.enum(["UP", "DOWN", "RANDOM"]).default("DOWN"),
  listingAutoSellPriceOffsetDirection: z.enum(["UP", "DOWN", "RANDOM"]).default("UP"),
}).superRefine((value, context) => {
  if ((value.listingAutoPositionSide === "BUY_ONLY" || value.listingAutoPositionSide === "TWO_SIDED")
      && value.listingAutoTargetBuyQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["listingAutoTargetBuyQuantity"], message: "활성 매수 목표는 1주 이상이어야 합니다." });
  }
  if ((value.listingAutoPositionSide === "SELL_ONLY" || value.listingAutoPositionSide === "TWO_SIDED")
      && value.listingAutoTargetSellQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["listingAutoTargetSellQuantity"], message: "활성 매도 목표는 1주 이상이어야 합니다." });
  }
  if (value.listingAutoPositionSide === "BUY_ONLY" && value.listingAutoTargetHoldingQuantity <= 0) {
    context.addIssue({ code: "custom", path: ["listingAutoTargetHoldingQuantity"], message: "매수 전용 목표 보유 수량은 1주 이상이어야 합니다." });
  }
  if (value.listingAutoTargetHoldingQuantity > value.issuedShares) {
    context.addIssue({ code: "custom", path: ["listingAutoTargetHoldingQuantity"], message: "목표 보유 수량은 발행주식수를 넘을 수 없습니다." });
  }
  const oneRunCapacity = value.listingAutoMaxOrderQuantity * MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN;
  if ((value.listingAutoPositionSide === "BUY_ONLY" || value.listingAutoPositionSide === "TWO_SIDED")
      && value.listingAutoTargetBuyQuantity > oneRunCapacity) {
    context.addIssue({ code: "custom", path: ["listingAutoTargetBuyQuantity"], message: "목표 매수 잔량은 최대 수량의 10배를 넘을 수 없습니다." });
  }
  if ((value.listingAutoPositionSide === "SELL_ONLY" || value.listingAutoPositionSide === "TWO_SIDED")
      && value.listingAutoTargetSellQuantity > oneRunCapacity) {
    context.addIssue({ code: "custom", path: ["listingAutoTargetSellQuantity"], message: "목표 매도 잔량은 최대 수량의 10배를 넘을 수 없습니다." });
  }
  if (value.listingAutoPositionSide === "TWO_SIDED") {
    if (value.listingAutoInventoryBandQuantity <= 0) {
      context.addIssue({ code: "custom", path: ["listingAutoInventoryBandQuantity"], message: "양방향 운용의 보유 허용 밴드는 1주 이상이어야 합니다." });
    }
    if (value.listingAutoInventoryBandQuantity > value.listingAutoTargetHoldingQuantity) {
      context.addIssue({ code: "custom", path: ["listingAutoInventoryBandQuantity"], message: "보유 허용 밴드는 목표 보유 수량을 넘을 수 없습니다." });
    }
    if (value.listingAutoTargetHoldingQuantity + value.listingAutoInventoryBandQuantity > value.issuedShares) {
      context.addIssue({ code: "custom", path: ["listingAutoInventoryBandQuantity"], message: "목표 보유 수량과 밴드의 합은 발행주식수를 넘을 수 없습니다." });
    }
    if (value.listingAutoTargetBuyQuantity > value.listingAutoInventoryBandQuantity) {
      context.addIssue({ code: "custom", path: ["listingAutoTargetBuyQuantity"], message: "목표 매수 호가 잔량은 보유 허용 밴드를 넘을 수 없습니다." });
    }
    if (value.listingAutoTargetSellQuantity > value.listingAutoInventoryBandQuantity) {
      context.addIssue({ code: "custom", path: ["listingAutoTargetSellQuantity"], message: "목표 매도 호가 잔량은 보유 허용 밴드를 넘을 수 없습니다." });
    }
  }
});

export type CreateInstrumentFormValues = z.input<typeof createInstrumentSchema>;
export type CreateInstrumentPayload = z.output<typeof createInstrumentSchema>;
