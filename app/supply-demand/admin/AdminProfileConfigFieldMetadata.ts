import {
  DEFAULT_PROFILE_MULTIPLIER,
  DEFAULT_PROFILE_RECURRING_DEPOSIT_INTERVAL_VALUE,
  DEFAULT_PROFILE_WEIGHT,
  DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
} from "@/app/supply-demand/admin/AdminConstants";
import type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";

export type ProfileConfigNumericKey = Exclude<keyof ProfileConfigDraft, "recurringDepositIntervalUnit">;
export type ProfileConfigTextSetterKey = Exclude<keyof ProfileConfigDraftSetters, "setRecurringDepositIntervalUnit">;

type ProfileConfigNumericField = {
  key: ProfileConfigNumericKey;
  setterKey: ProfileConfigTextSetterKey;
  formLabel: string;
  summaryLabel: string;
  placeholder: string;
  min: number;
  max: number;
  defaultValue: string;
  suffix?: string;
};

export const PROFILE_CONFIG_BEHAVIOR_FIELDS = [
  { key: "newsWeight", setterKey: "setNewsWeight", formLabel: "뉴스 민감(0-1)", summaryLabel: "뉴스", placeholder: "0.6", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "momentumWeight", setterKey: "setMomentumWeight", formLabel: "추세 추종(0-1)", summaryLabel: "추세", placeholder: "0.6", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "contrarianWeight", setterKey: "setContrarianWeight", formLabel: "역추세(0-1)", summaryLabel: "역추세", placeholder: "0.6", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "lossAversionWeight", setterKey: "setLossAversionWeight", formLabel: "손실 회피(0-1)", summaryLabel: "손실", placeholder: "0.7", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "herdingWeight", setterKey: "setHerdingWeight", formLabel: "군중 추종(0-1)", summaryLabel: "군중", placeholder: "0.6", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "marketMakingWeight", setterKey: "setMarketMakingWeight", formLabel: "시장 조성(0-1)", summaryLabel: "조성", placeholder: "0.9", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "overconfidenceWeight", setterKey: "setOverconfidenceWeight", formLabel: "과신(0-1)", summaryLabel: "과신", placeholder: "0.6", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "noiseWeight", setterKey: "setNoiseWeight", formLabel: "노이즈(0-1)", summaryLabel: "노이즈", placeholder: "0.8", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "panicSellWeight", setterKey: "setPanicSellWeight", formLabel: "패닉 매도(0-1)", summaryLabel: "패닉", placeholder: "0.5", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "dipBuyWeight", setterKey: "setDipBuyWeight", formLabel: "저가 매수(0-1)", summaryLabel: "저가매수", placeholder: "0.5", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "orderMultiplier", setterKey: "setOrderMultiplier", formLabel: "주문 빈도 배율(0=중지)", summaryLabel: "주문 빈도", placeholder: "1", min: 0, max: 5, defaultValue: DEFAULT_PROFILE_MULTIPLIER, suffix: "배" },
  { key: "aggressionMultiplier", setterKey: "setAggressionMultiplier", formLabel: "호가 공격성(0-5)", summaryLabel: "호가 공격성", placeholder: "1", min: 0, max: 5, defaultValue: DEFAULT_PROFILE_MULTIPLIER, suffix: "배" },
  { key: "pricePressureSensitivity", setterKey: "setPricePressureSensitivity", formLabel: "가격 압력 민감도(0-2)", summaryLabel: "가격 민감도", placeholder: "1", min: 0, max: 2, defaultValue: DEFAULT_PROFILE_MULTIPLIER, suffix: "배" },
  { key: "orderTtlMultiplier", setterKey: "setOrderTtlMultiplier", formLabel: "TTL 배율(0.1-10)", summaryLabel: "TTL", placeholder: "1", min: 0.1, max: 10, defaultValue: DEFAULT_PROFILE_MULTIPLIER, suffix: "배" },
  { key: "quantityMultiplier", setterKey: "setQuantityMultiplier", formLabel: "수량 배율(0=중지)", summaryLabel: "수량", placeholder: "1", min: 0, max: 5, defaultValue: DEFAULT_PROFILE_MULTIPLIER, suffix: "배" },
  { key: "holdingPatienceWeight", setterKey: "setHoldingPatienceWeight", formLabel: "보유 인내(0-1)", summaryLabel: "보유 인내", placeholder: "0.5", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "deepLossHoldWeight", setterKey: "setDeepLossHoldWeight", formLabel: "손실 보유(0-1)", summaryLabel: "손실 보유", placeholder: "0.5", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "profitTakingWeight", setterKey: "setProfitTakingWeight", formLabel: "익절 성향(0-1)", summaryLabel: "익절", placeholder: "0.8", min: 0, max: 1, defaultValue: DEFAULT_PROFILE_WEIGHT },
] as const satisfies ReadonlyArray<ProfileConfigNumericField>;

export const PROFILE_CONFIG_RECURRING_DEPOSIT_FIELDS = [
  { key: "recurringDepositAmount", setterKey: "setRecurringDepositAmount", formLabel: "주기 입금", summaryLabel: "주기 입금", placeholder: "0", min: 0, max: 1000000000000, defaultValue: DEFAULT_PROFILE_WEIGHT },
  { key: "recurringDepositIntervalValue", setterKey: "setRecurringDepositIntervalValue", formLabel: "입금 주기 값", summaryLabel: "입금 주기", placeholder: "0", min: 0, max: 1000, defaultValue: DEFAULT_PROFILE_RECURRING_DEPOSIT_INTERVAL_VALUE },
] as const satisfies ReadonlyArray<ProfileConfigNumericField>;

export const PROFILE_CONFIG_NUMERIC_FIELDS = [
  ...PROFILE_CONFIG_BEHAVIOR_FIELDS,
  ...PROFILE_CONFIG_RECURRING_DEPOSIT_FIELDS,
] as const satisfies ReadonlyArray<ProfileConfigNumericField>;

export function buildDefaultProfileConfigDraft(): ProfileConfigDraft {
  const numericDefaults = Object.fromEntries(
    PROFILE_CONFIG_NUMERIC_FIELDS.map((field) => [field.key, field.defaultValue]),
  ) as Pick<ProfileConfigDraft, ProfileConfigNumericKey>;

  return {
    ...numericDefaults,
    recurringDepositIntervalUnit: DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
  };
}

export function isRecurringDepositNumberKey(key: ProfileConfigNumericKey) {
  return PROFILE_CONFIG_RECURRING_DEPOSIT_FIELDS.some((field) => field.key === key);
}
