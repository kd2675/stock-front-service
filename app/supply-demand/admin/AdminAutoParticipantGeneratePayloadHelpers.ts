import { z } from "zod";

import { AUTO_PARTICIPANT_PROFILE_OPTIONS } from "@/app/lib/autoParticipantProfiles";
import { numberFromBlankZero } from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";
import { parseAutoParticipantRecurringCashDraft } from "@/app/supply-demand/admin/AdminAutoParticipantMutationPayloadHelpers";
import type { AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

const AUTO_PARTICIPANT_GENERATE_COUNT_MESSAGE = "자동 생성 인원은 1명 이상 100명 이하로 입력해 주세요.";
const AUTO_PARTICIPANT_GENERATE_KEY_PREFIX_MESSAGE = "참여자 키 접두어는 40자 이하로 입력해 주세요.";
const AUTO_PARTICIPANT_GENERATE_DISPLAY_PREFIX_MESSAGE = "표시명 접두어는 60자 이하로 입력해 주세요.";
const AUTO_PARTICIPANT_GENERATE_INITIAL_CASH_MESSAGE = "초기 현금은 0 이상 1조 이하로 입력해 주세요.";
const AUTO_PARTICIPANT_GENERATE_RECURRING_CASH_MESSAGE = "정기 자금은 금액 0 이상, 주기 0 초과 1000 이하로 입력해 주세요. 비워두면 프로필 기본값을 사용합니다.";

const autoParticipantGenerateCountSchema = z.string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .refine((value) => Number.isSafeInteger(value) && value >= 1 && value <= 100);
const autoParticipantGenerateKeyPrefixSchema = z.string().max(40);
const autoParticipantGenerateDisplayPrefixSchema = z.string().max(60);
const autoParticipantGenerateInitialCashSchema = numberFromBlankZero({ min: 0, max: 1000000000000 });

const emptyAutoParticipantRecurringCashPayload = {
  recurringCashAmount: null,
  recurringCashIntervalValue: null,
  recurringCashIntervalUnit: null,
};

export type AutoParticipantGenerateRequest = {
  userKey: string;
  displayName: string;
  profileType: AutoParticipantProfileType;
  createAccount: boolean;
  initialCashAmount: number | null;
  recurringCashAmount: number | null;
  recurringCashIntervalValue: number | null;
  recurringCashIntervalUnit: RecurringCashIntervalUnit | null;
};

export type AutoParticipantGenerateDraftInput = {
  count: string;
  createAccount: boolean;
  keyPrefix: string;
  displayPrefix: string;
  initialCashAmount: string;
  profileMode: "ROTATE" | "SINGLE";
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashIntervalValue: string;
  existingUserKeys: string[];
  fallbackKeyPrefix: string;
  fallbackDisplayPrefix: string;
  fallbackProfileType: AutoParticipantProfileType;
};

export function buildAutoParticipantGenerateRequests(draft: AutoParticipantGenerateDraftInput): AdminPayloadResult<{
  ok: true;
  requests: AutoParticipantGenerateRequest[];
  profileMode: "ROTATE" | "SINGLE";
  profileType: AutoParticipantProfileType;
}> {
  const countResult = autoParticipantGenerateCountSchema.safeParse(draft.count);
  const keyPrefix = draft.keyPrefix.trim() || draft.fallbackKeyPrefix;
  const displayPrefix = draft.displayPrefix.trim() || draft.fallbackDisplayPrefix;
  if (!countResult.success) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_GENERATE_COUNT_MESSAGE,
    };
  }
  if (!autoParticipantGenerateKeyPrefixSchema.safeParse(keyPrefix).success) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_GENERATE_KEY_PREFIX_MESSAGE,
    };
  }
  if (!autoParticipantGenerateDisplayPrefixSchema.safeParse(displayPrefix).success) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_GENERATE_DISPLAY_PREFIX_MESSAGE,
    };
  }
  const initialCashResult = autoParticipantGenerateInitialCashSchema.safeParse(draft.initialCashAmount);
  if (!initialCashResult.success) {
    return {
      ok: false,
      message: AUTO_PARTICIPANT_GENERATE_INITIAL_CASH_MESSAGE,
    };
  }

  const count = countResult.data;
  const initialCashAmount = initialCashResult.data;
  const existingKeys = new Set(draft.existingUserKeys);
  const profileTypes = AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => profile.value);
  let nextSerial = nextAutoParticipantSerial(existingKeys, keyPrefix);
  const requests: AutoParticipantGenerateRequest[] = [];
  while (requests.length < count) {
    const userKey = `${keyPrefix}${formatAutoParticipantSerial(nextSerial)}`;
    nextSerial += 1;
    if (existingKeys.has(userKey)) {
      continue;
    }
    const profileType = draft.profileMode === "SINGLE"
      ? draft.profileType
      : profileTypes[requests.length % profileTypes.length] ?? draft.fallbackProfileType;
    const recurringCashPayload = buildRecurringCashPayload(
      profileType,
      draft.recurringCashAmount,
      draft.recurringCashIntervalValue,
      draft.recurringCashIntervalUnit,
    );
    if (recurringCashPayload === null) {
      return {
        ok: false,
        message: AUTO_PARTICIPANT_GENERATE_RECURRING_CASH_MESSAGE,
      };
    }
    const displayName = `${displayPrefix} ${formatAutoParticipantSerial(nextSerial - 1)}`;
    existingKeys.add(userKey);
    requests.push({
      userKey,
      displayName,
      profileType,
      createAccount: draft.createAccount || initialCashAmount > 0,
      initialCashAmount: initialCashAmount > 0 ? initialCashAmount : null,
      ...recurringCashPayload,
    });
  }

  return {
    ok: true,
    requests,
    profileMode: draft.profileMode,
    profileType: draft.profileType,
  };
}

function nextAutoParticipantSerial(existingKeys: Set<string>, keyPrefix: string) {
  let maxSerial = 0;
  existingKeys.forEach((key) => {
    if (!key.startsWith(keyPrefix)) {
      return;
    }
    const suffix = key.slice(keyPrefix.length);
    if (!/^\d+$/.test(suffix)) {
      return;
    }
    const parsed = Number(suffix);
    if (Number.isSafeInteger(parsed)) {
      maxSerial = Math.max(maxSerial, parsed);
    }
  });
  return maxSerial + 1;
}

function formatAutoParticipantSerial(value: number) {
  return String(value).padStart(3, "0");
}

function buildRecurringCashPayload(
  profileType: AutoParticipantProfileType,
  amountValue: string,
  intervalValue: string,
  intervalUnit: RecurringCashIntervalUnit,
) {
  if (profileType === "DIVIDEND_REINVESTOR") {
    return emptyAutoParticipantRecurringCashPayload;
  }
  return parseAutoParticipantRecurringCashDraft(amountValue, intervalValue, intervalUnit);
}
