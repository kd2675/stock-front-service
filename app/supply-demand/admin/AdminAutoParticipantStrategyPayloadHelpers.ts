import { z } from "zod";

import type { StockAutoParticipantSymbolConfigPayload } from "@/app/lib/stock";
import { integerRange, requiredTrimmedString, requiredUppercaseString } from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";

export type AutoParticipantStrategyPayload = StockAutoParticipantSymbolConfigPayload;

export type AutoParticipantStrategyPayloadInput = {
  userKey: string;
  symbol: string;
  enabled: boolean;
  intensity: string;
};

const AUTO_PARTICIPANT_STRATEGY_MESSAGE = "참여자, 종목, 주문 활동 강도 1-10을 올바르게 입력해 주세요.";

const autoParticipantStrategySchema = z.object({
  userKey: requiredTrimmedString(),
  symbol: requiredUppercaseString(),
  enabled: z.boolean(),
  intensity: integerRange(1, 10),
});

export function buildAutoParticipantStrategyPayload(draft: AutoParticipantStrategyPayloadInput): AdminPayloadResult<{
  ok: true;
  userKey: string;
  symbol: string;
  payload: AutoParticipantStrategyPayload;
}> {
  const parsed = autoParticipantStrategySchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_STRATEGY_MESSAGE,
    };
  }

  return {
    ok: true,
    userKey: parsed.data.userKey,
    symbol: parsed.data.symbol,
    payload: {
      enabled: parsed.data.enabled,
      intensity: parsed.data.intensity,
    },
  };
}
