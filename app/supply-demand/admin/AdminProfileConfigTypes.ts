import type { AutoParticipantBehaviorModelVersion, AutoParticipantProfileExitMode, AutoParticipantProfileInventoryMode, AutoParticipantProfilePricingMode, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type ProfileConfigDraft = {
  behaviorModelVersion: AutoParticipantBehaviorModelVersion;
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
  decisionFrequencyMultiplier: string;
  ordersPerDecisionMultiplier: string;
  aggressionMultiplier: string;
  pricePressureSensitivity: string;
  orderTtlMultiplier: string;
  quantityMultiplier: string;
  holdingPatienceWeight: string;
  deepLossHoldWeight: string;
  profitTakingWeight: string;
  pricingMode: AutoParticipantProfilePricingMode;
  exitMode: AutoParticipantProfileExitMode;
  inventoryMode: AutoParticipantProfileInventoryMode;
  recurringDepositAmount: string;
  recurringDepositIntervalValue: string;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
};

export type ProfileConfigDraftWithType = ProfileConfigDraft & {
  profileType: AutoParticipantProfileType;
};

export type ProfileConfigDraftSetters = {
  setBehaviorModelVersion: (value: AutoParticipantBehaviorModelVersion) => void;
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
  setDecisionFrequencyMultiplier: (value: string) => void;
  setOrdersPerDecisionMultiplier: (value: string) => void;
  setAggressionMultiplier: (value: string) => void;
  setPricePressureSensitivity: (value: string) => void;
  setOrderTtlMultiplier: (value: string) => void;
  setQuantityMultiplier: (value: string) => void;
  setHoldingPatienceWeight: (value: string) => void;
  setDeepLossHoldWeight: (value: string) => void;
  setProfitTakingWeight: (value: string) => void;
  setPricingMode: (value: AutoParticipantProfilePricingMode) => void;
  setExitMode: (value: AutoParticipantProfileExitMode) => void;
  setInventoryMode: (value: AutoParticipantProfileInventoryMode) => void;
  setRecurringDepositAmount: (value: string) => void;
  setRecurringDepositIntervalValue: (value: string) => void;
  setRecurringDepositIntervalUnit: (value: RecurringCashIntervalUnit) => void;
};
