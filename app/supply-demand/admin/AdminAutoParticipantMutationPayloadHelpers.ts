import { z } from "zod";

import type { StockAutoParticipantPayload } from "@/app/lib/stock";
import { numberFromBlankZero, requiredTrimmedString } from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";
import type { AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type AutoParticipantPayload = StockAutoParticipantPayload;

export type AutoParticipantDraftInput = {
  userKey: string | null;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalValue: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
};

const AUTO_PARTICIPANT_REQUIRED_MESSAGE = "자동 참여자 키와 표시명을 입력해 주세요.";
const AUTO_PARTICIPANT_RECURRING_CASH_MESSAGE = "참여자별 월급/정기 현금은 금액 0 이상, 주기 0 초과 1000 이하로 입력해 주세요. 비워두면 프로필 기본값을 사용합니다.";

const emptyAutoParticipantRecurringCashPayload = {
  recurringCashAmount: null,
  recurringCashIntervalValue: null,
  recurringCashIntervalUnit: null,
};

const recurringCashIntervalUnitSchema = z.enum(["SECOND", "MINUTE", "HOUR", "DAY", "MONTH", "YEAR"]);

const autoParticipantRecurringCashSchema = z.object({
  amount: numberFromBlankZero({ min: 0, max: 1000000000000 }),
  intervalValue: numberFromBlankZero({ min: 0, max: 1000 }),
  intervalUnit: recurringCashIntervalUnitSchema,
}).refine((value) => value.amount <= 0 || value.intervalValue > 0);

const autoParticipantBaseSchema = z.object({
  userKey: z.string().nullable().transform((value) => value ?? "").pipe(requiredTrimmedString()),
  displayName: requiredTrimmedString(),
  enabled: z.boolean(),
  profileType: z.string().min(1).transform((value) => value as AutoParticipantProfileType),
});

export function parseAutoParticipantRecurringCashDraft(
  amountValue: string,
  intervalValue: string,
  intervalUnit: RecurringCashIntervalUnit,
) {
  const normalizedAmount = amountValue.trim();
  const normalizedInterval = intervalValue.trim();
  if (!normalizedAmount && !normalizedInterval) {
    return emptyAutoParticipantRecurringCashPayload;
  }
  const parsed = autoParticipantRecurringCashSchema.safeParse({
    amount: normalizedAmount,
    intervalValue: normalizedInterval,
    intervalUnit,
  });
  if (!parsed.success) {
    return null;
  }
  return {
    recurringCashAmount: parsed.data.amount,
    recurringCashIntervalValue: parsed.data.intervalValue,
    recurringCashIntervalUnit: parsed.data.amount > 0 ? parsed.data.intervalUnit : null,
  };
}

export function buildAutoParticipantPayload(draft: AutoParticipantDraftInput): AdminPayloadResult<{
  ok: true;
  userKey: string;
  payload: AutoParticipantPayload;
}> {
  const parsedBase = autoParticipantBaseSchema.safeParse(draft);
  if (!parsedBase.success) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_REQUIRED_MESSAGE,
    };
  }
  const recurringCashPayload = parsedBase.data.profileType === "DIVIDEND_REINVESTOR"
    ? emptyAutoParticipantRecurringCashPayload
    : parseAutoParticipantRecurringCashDraft(
        draft.recurringCashAmount,
        draft.recurringCashIntervalValue,
        draft.recurringCashIntervalUnit,
      );
  if (recurringCashPayload === null) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_RECURRING_CASH_MESSAGE,
    };
  }

  return {
    ok: true,
    userKey: parsedBase.data.userKey,
    payload: {
      displayName: parsedBase.data.displayName,
      enabled: parsedBase.data.enabled,
      profileType: parsedBase.data.profileType,
      ...recurringCashPayload,
    },
  };
}
