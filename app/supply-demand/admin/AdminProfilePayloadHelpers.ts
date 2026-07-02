import type { StockAutoParticipantProfileConfigPayload } from "@/app/lib/stock";
import { numberFromBlankZero } from "@/app/lib/validation/zodFormSchemas";
import { DEFAULT_RECURRING_CASH_INTERVAL_UNIT } from "@/app/supply-demand/admin/AdminConstants";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";
import {
  isRecurringDepositNumberKey,
  PROFILE_CONFIG_NUMERIC_FIELDS,
  type ProfileConfigNumericKey,
} from "@/app/supply-demand/admin/AdminProfileConfigFieldMetadata";
import type { ProfileConfigDraftWithType } from "@/app/supply-demand/admin/AdminProfileConfigTypes";

export type ProfileConfigPayload = StockAutoParticipantProfileConfigPayload;
export type ProfileConfigDraftInput = ProfileConfigDraftWithType;

const PROFILE_CONFIG_MESSAGE = "프로필 행동 설정 숫자 범위를 확인해 주세요.";

export function buildProfileConfigPayload(draft: ProfileConfigDraftInput): AdminPayloadResult<{
  ok: true;
  payload: ProfileConfigPayload;
}> {
  const isDividendReinvestorProfile = draft.profileType === "DIVIDEND_REINVESTOR";
  const numberPayload = buildProfileConfigNumberPayload(draft, isDividendReinvestorProfile);
  if (numberPayload === null) {
    return {
      ok: false,
      message: PROFILE_CONFIG_MESSAGE,
    };
  }
  const payload: ProfileConfigPayload = {
    ...numberPayload,
    recurringDepositIntervalUnit: isDividendReinvestorProfile
      ? DEFAULT_RECURRING_CASH_INTERVAL_UNIT
      : draft.recurringDepositIntervalUnit,
  };

  return {
    ok: true,
    payload,
  };
}

function buildProfileConfigNumberPayload(
  draft: ProfileConfigDraftInput,
  isDividendReinvestorProfile: boolean,
) {
  const payload = {} as Pick<ProfileConfigPayload, ProfileConfigNumericKey>;
  for (const field of PROFILE_CONFIG_NUMERIC_FIELDS) {
    const value = isDividendReinvestorProfile && isRecurringDepositNumberKey(field.key)
      ? 0
      : parseProfileConfigNumber(field, draft[field.key]);
    if (value === null) {
      return null;
    }
    payload[field.key] = value;
  }
  if (payload.recurringDepositAmount > 0 && payload.recurringDepositIntervalValue <= 0) {
    return null;
  }
  return payload;
}

function parseProfileConfigNumber(
  field: (typeof PROFILE_CONFIG_NUMERIC_FIELDS)[number],
  value: string,
) {
  const parsed = numberFromBlankZero({ min: field.min, max: field.max }).safeParse(value);
  return parsed.success ? parsed.data : null;
}
