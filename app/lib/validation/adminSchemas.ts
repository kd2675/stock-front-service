import { z } from "zod";

import {
  positiveInteger,
  positiveNumber,
  requiredTrimmedString,
  requiredUppercaseString,
} from "@/app/lib/validation/zodFormSchemas";

export const createInstrumentSchema = z.object({
  symbol: requiredUppercaseString("종목 코드를 입력해 주세요."),
  name: requiredTrimmedString("종목명을 입력해 주세요."),
  market: z.string().trim().default("ORDERBOOK"),
  initialPrice: positiveNumber("초기 가격은 0보다 큰 숫자로 입력해 주세요."),
  issuedShares: positiveInteger("초기 발행주식수는 1주 이상 정수로 입력해 주세요.")
    .max(Number.MAX_SAFE_INTEGER, "초기 발행주식수는 안전하게 계산 가능한 정수 범위여야 합니다."),
  priceLimitRate: positiveNumber("가격제한폭은 0보다 큰 숫자로 입력해 주세요.").max(100, "가격제한폭은 100 이하로 입력해 주세요."),
  initialIssueMode: z.literal("SCALED_ROLE_SEPARATED").default("SCALED_ROLE_SEPARATED"),
  tradableShareRatePercent: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.number()
      .finite("초기 유통비율은 숫자로 입력해 주세요.")
      .min(20, "초기 유통비율은 20% 이상이어야 합니다.")
      .max(85, "초기 유통비율은 85% 이하여야 합니다.")
      .optional(),
  ),
}).superRefine((value, context) => {
  if (value.tradableShareRatePercent === undefined) {
    context.addIssue({
      code: "custom",
      path: ["tradableShareRatePercent"],
      message: "초기 유통비율을 입력해 주세요.",
    });
  }
  if (value.issuedShares < 2) {
    context.addIssue({
      code: "custom",
      path: ["issuedShares"],
      message: "역할 분리 발행은 유통·잠금 물량을 나누기 위해 2주 이상이어야 합니다.",
    });
  }
});

export type CreateInstrumentFormValues = z.input<typeof createInstrumentSchema>;
export type CreateInstrumentPayload = z.output<typeof createInstrumentSchema>;
