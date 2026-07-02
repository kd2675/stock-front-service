import { z } from "zod";

import type { StockAutoParticipantCashAdjustmentPayload } from "@/app/lib/stock";
import { positiveNumber, requiredTrimmedString } from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";

export type CashAdjustmentPayload = StockAutoParticipantCashAdjustmentPayload;
export type CashAdjustmentType = CashAdjustmentPayload["adjustmentType"];

export type CashAdjustmentDraftInput = {
  userKey: string | null;
  amount: string;
  adjustmentType: CashAdjustmentType;
  invalidMessage: string;
};

const cashAdjustmentPayloadSchema = z.object({
  userKey: z.string().nullable().transform((value) => value ?? "").pipe(requiredTrimmedString()),
  amount: positiveNumber(),
  adjustmentType: z.enum(["DEPOSIT", "WITHDRAW"]),
});

export function buildCashAdjustmentPayload(draft: CashAdjustmentDraftInput): AdminPayloadResult<{
  ok: true;
  userKey: string;
  payload: CashAdjustmentPayload;
}> {
  const parsed = cashAdjustmentPayloadSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      message: draft.invalidMessage,
    };
  }

  return {
    ok: true,
    userKey: parsed.data.userKey,
    payload: {
      adjustmentType: parsed.data.adjustmentType,
      amount: parsed.data.amount,
    },
  };
}
