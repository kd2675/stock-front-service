import type { AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type ProfileConfigDraft = {
  newsWeight: string;
  momentumWeight: string;
  contrarianWeight: string;
  lossAversionWeight: string;
  herdingWeight: string;
  marketMakingWeight: string;
  overconfidenceWeight: string;
  noiseWeight: string;
  panicSellWeight: string;
  dipBuyWeight: string;
  orderMultiplier: string;
  aggressionMultiplier: string;
  orderTtlMultiplier: string;
  quantityMultiplier: string;
  holdingPatienceWeight: string;
  deepLossHoldWeight: string;
  profitTakingWeight: string;
  recurringDepositAmount: string;
  recurringDepositIntervalValue: string;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
};

export type ProfileConfigDraftWithType = ProfileConfigDraft & {
  profileType: AutoParticipantProfileType;
};

export type ProfileConfigDraftSetters = {
  setNewsWeight: (value: string) => void;
  setMomentumWeight: (value: string) => void;
  setContrarianWeight: (value: string) => void;
  setLossAversionWeight: (value: string) => void;
  setHerdingWeight: (value: string) => void;
  setMarketMakingWeight: (value: string) => void;
  setOverconfidenceWeight: (value: string) => void;
  setNoiseWeight: (value: string) => void;
  setPanicSellWeight: (value: string) => void;
  setDipBuyWeight: (value: string) => void;
  setOrderMultiplier: (value: string) => void;
  setAggressionMultiplier: (value: string) => void;
  setOrderTtlMultiplier: (value: string) => void;
  setQuantityMultiplier: (value: string) => void;
  setHoldingPatienceWeight: (value: string) => void;
  setDeepLossHoldWeight: (value: string) => void;
  setProfitTakingWeight: (value: string) => void;
  setRecurringDepositAmount: (value: string) => void;
  setRecurringDepositIntervalValue: (value: string) => void;
  setRecurringDepositIntervalUnit: (value: RecurringCashIntervalUnit) => void;
};
