import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { DEFAULT_RECURRING_CASH_INTERVAL_UNIT } from "@/app/supply-demand/admin/AdminConstants";
import {
  formatNumber,
  formatRecurringCashIntervalUnit,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import type {
  AutoParticipant,
  AutoParticipantHolding,
  AutoParticipantOverview,
  AutoParticipantProfileConfig,
  AutoParticipantProfileOverview,
  AutoParticipantProfileType,
  AutoParticipantSymbolConfig,
  AutoMarketConfig,
  CorporateActionType,
  ListingAutoAccount,
  ListingAutoPosition,
  OrderBookMarketStatus,
  OrderBookInstrument,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";

export type RecurringCashPolicyResolution = {
  payable: boolean;
  source: "PARTICIPANT" | "PROFILE";
  sourceLabel: string;
  amount: number;
  intervalValue: number | null;
  intervalUnit: RecurringCashIntervalUnit | null;
  reason: string;
};

export type SalaryEligibilityRow = {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  recurringPolicy: RecurringCashPolicyResolution;
  accountStatus: string | null;
  canReceive: boolean;
  blockers: string[];
};

export type ParticipantProfileOverviewSummary = AutoParticipantProfileOverview & {
  profileType: AutoParticipantProfileType;
  label: string;
  description: string;
  behavior: string;
};

export type CorporateActionPayload = {
  actionType: CorporateActionType;
  shareQuantity?: number;
  issuePrice?: number;
  splitFrom?: number;
  splitTo?: number;
  exRightsDate?: string;
  paymentDate?: string;
  listingDate?: string;
  delistingDate?: string;
  dividendAmount?: number;
  description?: string;
};

export type CorporateActionDraftInput = {
  actionType: CorporateActionType;
  actionShares: string;
  actionIssuePrice: string;
  actionDividendAmount: string;
  exRightsDate: string;
  paymentDate: string;
  listingDate: string;
  delistingDate: string;
  splitFrom: string;
  splitTo: string;
  actionDescription: string;
};

export type AutoMarketConfigPayload = {
  enabled: boolean;
  intensity: number;
  maxOrderQuantity: number;
  orderTtlSeconds: number;
};

export type AutoMarketConfigDraftInput = {
  symbol: string;
  enabled: boolean;
  intensity: string;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
};

export type ListingAutoAccountConfigPayload = {
  displayName?: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  maxOrderQuantity: number;
  orderTtlSeconds: number;
  priceOffsetTicks: number;
};

export type ListingAutoAccountConfigDraftInput = {
  symbol: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  priceOffsetTicks: string;
};

export type ProfileConfigPayload = {
  newsWeight: number;
  momentumWeight: number;
  contrarianWeight: number;
  lossAversionWeight: number;
  herdingWeight: number;
  marketMakingWeight: number;
  overconfidenceWeight: number;
  noiseWeight: number;
  panicSellWeight: number;
  dipBuyWeight: number;
  orderMultiplier: number;
  aggressionMultiplier: number;
  orderTtlMultiplier: number;
  quantityMultiplier: number;
  holdingPatienceWeight: number;
  deepLossHoldWeight: number;
  profitTakingWeight: number;
  recurringDepositAmount: number;
  recurringDepositIntervalValue: number;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
};

export type ProfileConfigDraftInput = {
  profileType: AutoParticipantProfileType;
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

export type ProfileConfigDraftValues = {
  profileType: AutoParticipantProfileType;
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

export type AutoParticipantGenerateRequest = {
  userKey: string;
  displayName: string;
  profileType: AutoParticipantProfileType;
};

export type AutoParticipantGenerateDraftInput = {
  count: string;
  keyPrefix: string;
  displayPrefix: string;
  profileMode: "ROTATE" | "SINGLE";
  profileType: AutoParticipantProfileType;
  existingUserKeys: string[];
  fallbackKeyPrefix: string;
  fallbackDisplayPrefix: string;
  fallbackProfileType: AutoParticipantProfileType;
};

export type AutoParticipantPayload = {
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: number | null;
  recurringCashIntervalValue: number | null;
  recurringCashIntervalUnit: RecurringCashIntervalUnit | null;
};

export type CashAdjustmentPayload = {
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  amount: number;
};

export type InstrumentReportPayload = {
  title: string;
  summary: string;
  score: number;
  riseReason: string | null;
  fallReason: string | null;
};

export type InstrumentReportDraftInput = {
  symbol: string;
  title: string;
  summary: string;
  score: string;
  riseReason: string;
  fallReason: string;
};

export type CashAdjustmentDraftInput = {
  userKey: string | null;
  amount: string;
  adjustmentType: "DEPOSIT" | "WITHDRAW";
  invalidMessage: string;
};

export type AutoParticipantDraftInput = {
  userKey: string | null;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalValue: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
};

export type AutoParticipantEditValues = {
  userKey: string;
  displayName: string;
  enabled: boolean;
  profileType: AutoParticipantProfileType;
  recurringCashAmount: string;
  recurringCashIntervalValue: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  cashAdjustmentAmount: string;
};

export type AutoParticipantStrategyDraftValues = {
  editingKey: string | null;
  userKey: string;
  symbol: string;
  enabled: boolean;
  intensity: string;
};

export type AutoParticipantStrategyPayload = {
  enabled: boolean;
  intensity: number;
};

export type AutoParticipantSelectionDraft = {
  participant: AutoParticipantEditValues;
  strategy: AutoParticipantStrategyDraftValues;
};

export type PaginationWindow = {
  totalPages: number;
  boundedPage: number;
  pageStart: number;
  pageEnd: number;
};

export function resolvePaginationWindow(totalCount: number, page: number, pageSize: number): PaginationWindow {
  const totalPages = Math.ceil(totalCount / pageSize);
  const boundedPage = totalPages === 0 ? 0 : Math.min(page, totalPages - 1);
  const pageStart = totalCount === 0 ? 0 : boundedPage * pageSize + 1;
  const pageEnd = Math.min(totalCount, (boundedPage + 1) * pageSize);
  return {
    totalPages,
    boundedPage,
    pageStart,
    pageEnd,
  };
}

export function resolvePaginatedItems<T>(items: T[], pagination: Pick<PaginationWindow, "boundedPage">, pageSize: number) {
  return items.slice(
    pagination.boundedPage * pageSize,
    pagination.boundedPage * pageSize + pageSize,
  );
}

export function optionalText(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function resolveAutoMarketConfigDraft(config: AutoMarketConfig): AutoMarketConfigDraftInput {
  return {
    symbol: config.symbol,
    enabled: config.enabled,
    intensity: String(config.intensity),
    maxOrderQuantity: String(config.maxOrderQuantity),
    orderTtlSeconds: String(config.orderTtlSeconds),
  };
}

export function resolveListingAutoAccountConfigDraft(config: ListingAutoAccount): ListingAutoAccountConfigDraftInput {
  return {
    symbol: config.symbol,
    displayName: config.displayName,
    enabled: config.enabled,
    positionSide: config.positionSide,
    maxOrderQuantity: String(config.maxOrderQuantity),
    orderTtlSeconds: String(config.orderTtlSeconds),
    priceOffsetTicks: String(config.priceOffsetTicks),
  };
}

export function buildAutoMarketConfigPayload(draft: AutoMarketConfigDraftInput): {
  ok: true;
  symbol: string;
  payload: AutoMarketConfigPayload;
} | {
  ok: false;
  message: string;
} {
  const symbol = draft.symbol.trim().toUpperCase();
  const intensity = Number.parseInt(draft.intensity, 10);
  const maxOrderQuantity = Number.parseInt(draft.maxOrderQuantity, 10);
  const orderTtlSeconds = Number.parseInt(draft.orderTtlSeconds, 10);

  if (
    !symbol
    || !Number.isInteger(intensity)
    || intensity < 1
    || intensity > 10
    || !Number.isInteger(maxOrderQuantity)
    || maxOrderQuantity <= 0
    || !Number.isInteger(orderTtlSeconds)
    || orderTtlSeconds <= 0
  ) {
    return {
      ok: false,
      message: "자동장 대상 종목, 기본 방향 강도 1-10, 1회 주문 최대 수량, 미체결 호가 TTL을 올바르게 입력해 주세요.",
    };
  }

  return {
    ok: true,
    symbol,
    payload: {
      enabled: draft.enabled,
      intensity,
      maxOrderQuantity,
      orderTtlSeconds,
    },
  };
}

export function buildListingAutoAccountConfigPayload(draft: ListingAutoAccountConfigDraftInput): {
  ok: true;
  symbol: string;
  payload: ListingAutoAccountConfigPayload;
} | {
  ok: false;
  message: string;
} {
  const symbol = draft.symbol.trim().toUpperCase();
  const maxOrderQuantity = Number.parseInt(draft.maxOrderQuantity, 10);
  const orderTtlSeconds = Number.parseInt(draft.orderTtlSeconds, 10);
  const priceOffsetTicks = Number.parseInt(draft.priceOffsetTicks, 10);

  if (
    !symbol
    || !Number.isInteger(maxOrderQuantity)
    || maxOrderQuantity <= 0
    || !Number.isInteger(orderTtlSeconds)
    || orderTtlSeconds <= 0
    || !Number.isInteger(priceOffsetTicks)
    || priceOffsetTicks < 0
  ) {
    return {
      ok: false,
      message: "상장주관사 종목, 최대 수량, TTL, 가격 분산 틱을 올바르게 입력해 주세요.",
    };
  }

  return {
    ok: true,
    symbol,
    payload: {
      displayName: optionalText(draft.displayName) ?? undefined,
      enabled: draft.enabled,
      positionSide: draft.positionSide,
      maxOrderQuantity,
      orderTtlSeconds,
      priceOffsetTicks,
    },
  };
}

export function buildCorporateActionPayload(draft: CorporateActionDraftInput): {
  ok: true;
  payload: CorporateActionPayload;
} | {
  ok: false;
  message: string;
} {
  const payload: CorporateActionPayload = { actionType: draft.actionType };

  if (draft.actionType === "INITIAL_ISSUE") {
    return {
      ok: false,
      message: "신규 상장은 종목 생성 흐름으로 처리해 주세요.",
    };
  }

  if (draft.actionType === "DELISTING") {
    if (!draft.delistingDate) {
      return {
        ok: false,
        message: "상장폐지는 상장폐지일이 필요합니다.",
      };
    }
    payload.delistingDate = draft.delistingDate;
  } else if (draft.actionType === "STOCK_SPLIT") {
    const parsedSplitFrom = Number.parseInt(draft.splitFrom, 10);
    const parsedSplitTo = Number.parseInt(draft.splitTo, 10);
    if (!Number.isInteger(parsedSplitFrom) || !Number.isInteger(parsedSplitTo) || parsedSplitFrom <= 0 || parsedSplitTo <= parsedSplitFrom) {
      return {
        ok: false,
        message: "액면분할 비율을 올바르게 입력해 주세요.",
      };
    }
    if (!draft.listingDate) {
      return {
        ok: false,
        message: "액면분할은 효력일이 필요합니다.",
      };
    }
    payload.splitFrom = parsedSplitFrom;
    payload.splitTo = parsedSplitTo;
    payload.listingDate = draft.listingDate;
  } else if (draft.actionType === "CASH_DIVIDEND") {
    const parsedDividendAmount = Number.parseFloat(draft.actionDividendAmount);
    if (!Number.isFinite(parsedDividendAmount) || parsedDividendAmount <= 0) {
      return {
        ok: false,
        message: "1주당 배당금을 0보다 큰 숫자로 입력해 주세요.",
      };
    }
    if (!draft.exRightsDate || !draft.paymentDate) {
      return {
        ok: false,
        message: "현금배당은 배당락일과 지급일이 필요합니다.",
      };
    }
    if (draft.paymentDate < draft.exRightsDate) {
      return {
        ok: false,
        message: "현금배당 지급일은 배당락일 이후여야 합니다.",
      };
    }
    payload.dividendAmount = parsedDividendAmount;
    payload.exRightsDate = draft.exRightsDate;
    payload.paymentDate = draft.paymentDate;
  } else {
    const parsedShares = Number.parseInt(draft.actionShares, 10);
    const parsedIssuePrice = Number.parseFloat(draft.actionIssuePrice);
    if (!Number.isInteger(parsedShares) || parsedShares <= 0) {
      return {
        ok: false,
        message: "발행 주식수를 입력해 주세요.",
      };
    }
    if (draft.actionType === "PAID_IN_CAPITAL_INCREASE") {
      if (!Number.isFinite(parsedIssuePrice) || parsedIssuePrice <= 0) {
        return {
          ok: false,
          message: "발행가는 0보다 큰 숫자로 입력해 주세요.",
        };
      }
      if (!draft.exRightsDate || !draft.paymentDate || !draft.listingDate) {
        return {
          ok: false,
          message: "유상증자는 권리락일, 납입일, 신주상장일이 필요합니다.",
        };
      }
      if (draft.paymentDate < draft.exRightsDate || draft.listingDate < draft.paymentDate) {
        return {
          ok: false,
          message: "유상증자 일정은 권리락일, 납입일, 신주상장일 순서여야 합니다.",
        };
      }
      payload.exRightsDate = draft.exRightsDate;
      payload.paymentDate = draft.paymentDate;
      payload.listingDate = draft.listingDate;
    }
    if (draft.actionType === "ADDITIONAL_ISSUE") {
      if (!Number.isFinite(parsedIssuePrice) || parsedIssuePrice <= 0) {
        return {
          ok: false,
          message: "발행가는 0보다 큰 숫자로 입력해 주세요.",
        };
      }
      if (!draft.listingDate) {
        return {
          ok: false,
          message: "추가발행은 신주상장일이 필요합니다.",
        };
      }
      payload.listingDate = draft.listingDate;
    }
    if (draft.actionType === "BONUS_ISSUE" || draft.actionType === "STOCK_DIVIDEND") {
      if (!draft.exRightsDate || !draft.listingDate) {
        return {
          ok: false,
          message: "무상증자와 주식배당은 권리락일과 신주상장일이 필요합니다.",
        };
      }
      if (draft.listingDate < draft.exRightsDate) {
        return {
          ok: false,
          message: "신주상장일은 권리락일 이후여야 합니다.",
        };
      }
      payload.exRightsDate = draft.exRightsDate;
      payload.listingDate = draft.listingDate;
    }
    payload.shareQuantity = parsedShares;
    if ((draft.actionType === "PAID_IN_CAPITAL_INCREASE" || draft.actionType === "ADDITIONAL_ISSUE") && Number.isFinite(parsedIssuePrice) && parsedIssuePrice > 0) {
      payload.issuePrice = parsedIssuePrice;
    }
  }

  if (draft.actionDescription.trim()) {
    payload.description = draft.actionDescription.trim();
  }

  return {
    ok: true,
    payload,
  };
}

export function buildProfileConfigPayload(draft: ProfileConfigDraftInput): {
  ok: true;
  payload: ProfileConfigPayload;
} | {
  ok: false;
  message: string;
} {
  const isDividendReinvestorProfile = draft.profileType === "DIVIDEND_REINVESTOR";
  const payload: ProfileConfigPayload = {
    newsWeight: Number(draft.newsWeight),
    momentumWeight: Number(draft.momentumWeight),
    contrarianWeight: Number(draft.contrarianWeight),
    lossAversionWeight: Number(draft.lossAversionWeight),
    herdingWeight: Number(draft.herdingWeight),
    marketMakingWeight: Number(draft.marketMakingWeight),
    overconfidenceWeight: Number(draft.overconfidenceWeight),
    noiseWeight: Number(draft.noiseWeight),
    panicSellWeight: Number(draft.panicSellWeight),
    dipBuyWeight: Number(draft.dipBuyWeight),
    orderMultiplier: Number(draft.orderMultiplier),
    aggressionMultiplier: Number(draft.aggressionMultiplier),
    orderTtlMultiplier: Number(draft.orderTtlMultiplier),
    quantityMultiplier: Number(draft.quantityMultiplier),
    holdingPatienceWeight: Number(draft.holdingPatienceWeight),
    deepLossHoldWeight: Number(draft.deepLossHoldWeight),
    profitTakingWeight: Number(draft.profitTakingWeight),
    recurringDepositAmount: isDividendReinvestorProfile ? 0 : Number(draft.recurringDepositAmount),
    recurringDepositIntervalValue: isDividendReinvestorProfile ? 0 : Number(draft.recurringDepositIntervalValue),
    recurringDepositIntervalUnit: isDividendReinvestorProfile
      ? DEFAULT_RECURRING_CASH_INTERVAL_UNIT
      : draft.recurringDepositIntervalUnit,
  };

  const valid =
    isRangeNumber(payload.newsWeight, 0, 1)
    && isRangeNumber(payload.momentumWeight, 0, 1)
    && isRangeNumber(payload.contrarianWeight, 0, 1)
    && isRangeNumber(payload.lossAversionWeight, 0, 1)
    && isRangeNumber(payload.herdingWeight, 0, 1)
    && isRangeNumber(payload.marketMakingWeight, 0, 1)
    && isRangeNumber(payload.overconfidenceWeight, 0, 1)
    && isRangeNumber(payload.noiseWeight, 0, 1)
    && isRangeNumber(payload.panicSellWeight, 0, 1)
    && isRangeNumber(payload.dipBuyWeight, 0, 1)
    && isRangeNumber(payload.orderMultiplier, 0, 5)
    && isRangeNumber(payload.aggressionMultiplier, 0, 5)
    && isRangeNumber(payload.orderTtlMultiplier, 0.1, 10)
    && isRangeNumber(payload.quantityMultiplier, 0, 5)
    && isRangeNumber(payload.holdingPatienceWeight, 0, 1)
    && isRangeNumber(payload.deepLossHoldWeight, 0, 1)
    && isRangeNumber(payload.profitTakingWeight, 0, 1)
    && isRangeNumber(payload.recurringDepositAmount, 0, 1000000000000)
    && isRangeNumber(payload.recurringDepositIntervalValue, 0, 1000)
    && (payload.recurringDepositAmount <= 0 || payload.recurringDepositIntervalValue > 0);

  if (!valid) {
    return {
      ok: false,
      message: "프로필 행동 설정 숫자 범위를 확인해 주세요.",
    };
  }

  return {
    ok: true,
    payload,
  };
}

export function resolveProfileConfigDraft(
  config: AutoParticipantProfileConfig,
  defaultRecurringCashIntervalUnit: RecurringCashIntervalUnit,
): ProfileConfigDraftValues {
  return {
    profileType: config.profileType,
    newsWeight: String(config.newsWeight),
    momentumWeight: String(config.momentumWeight),
    contrarianWeight: String(config.contrarianWeight),
    lossAversionWeight: String(config.lossAversionWeight),
    herdingWeight: String(config.herdingWeight),
    marketMakingWeight: String(config.marketMakingWeight),
    overconfidenceWeight: String(config.overconfidenceWeight),
    noiseWeight: String(config.noiseWeight),
    panicSellWeight: String(config.panicSellWeight),
    dipBuyWeight: String(config.dipBuyWeight),
    orderMultiplier: String(config.orderMultiplier),
    aggressionMultiplier: String(config.aggressionMultiplier),
    orderTtlMultiplier: String(config.orderTtlMultiplier),
    quantityMultiplier: String(config.quantityMultiplier),
    holdingPatienceWeight: String(config.holdingPatienceWeight),
    deepLossHoldWeight: String(config.deepLossHoldWeight),
    profitTakingWeight: String(config.profitTakingWeight),
    recurringDepositAmount: String(config.recurringDepositAmount),
    recurringDepositIntervalValue: String(config.recurringDepositIntervalValue ?? config.recurringDepositIntervalDays),
    recurringDepositIntervalUnit: config.recurringDepositIntervalUnit ?? defaultRecurringCashIntervalUnit,
  };
}

export function buildAutoParticipantGenerateRequests(draft: AutoParticipantGenerateDraftInput): {
  ok: true;
  requests: AutoParticipantGenerateRequest[];
  profileMode: "ROTATE" | "SINGLE";
  profileType: AutoParticipantProfileType;
} | {
  ok: false;
  message: string;
} {
  const count = Number.parseInt(draft.count, 10);
  const keyPrefix = draft.keyPrefix.trim() || draft.fallbackKeyPrefix;
  const displayPrefix = draft.displayPrefix.trim() || draft.fallbackDisplayPrefix;
  if (!Number.isSafeInteger(count) || count <= 0 || count > 100) {
    return {
      ok: false,
      message: "자동 생성 인원은 1명 이상 100명 이하로 입력해 주세요.",
    };
  }
  if (keyPrefix.length > 40) {
    return {
      ok: false,
      message: "참여자 키 접두어는 40자 이하로 입력해 주세요.",
    };
  }
  if (displayPrefix.length > 60) {
    return {
      ok: false,
      message: "표시명 접두어는 60자 이하로 입력해 주세요.",
    };
  }

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
    const displayName = `${displayPrefix} ${formatAutoParticipantSerial(nextSerial - 1)}`;
    existingKeys.add(userKey);
    requests.push({ userKey, displayName, profileType });
  }

  return {
    ok: true,
    requests,
    profileMode: draft.profileMode,
    profileType: draft.profileType,
  };
}

export function parseAutoParticipantRecurringCashDraft(
  amountValue: string,
  intervalValue: string,
  intervalUnit: RecurringCashIntervalUnit,
) {
  const normalizedAmount = amountValue.trim();
  const normalizedInterval = intervalValue.trim();
  if (!normalizedAmount && !normalizedInterval) {
    return {
      recurringCashAmount: null,
      recurringCashIntervalValue: null,
      recurringCashIntervalUnit: null,
    };
  }
  const recurringCashAmount = normalizedAmount ? Number(normalizedAmount) : 0;
  const recurringCashIntervalValue = normalizedInterval ? Number(normalizedInterval) : 0;
  if (!isRangeNumber(recurringCashAmount, 0, 1000000000000) || !isRangeNumber(recurringCashIntervalValue, 0, 1000)) {
    return null;
  }
  if (recurringCashAmount > 0 && recurringCashIntervalValue <= 0) {
    return null;
  }
  return {
    recurringCashAmount,
    recurringCashIntervalValue,
    recurringCashIntervalUnit: recurringCashAmount > 0 ? intervalUnit : null,
  };
}

export function buildAutoParticipantPayload(draft: AutoParticipantDraftInput): {
  ok: true;
  userKey: string;
  payload: AutoParticipantPayload;
} | {
  ok: false;
  message: string;
} {
  const normalizedUserKey = draft.userKey?.trim() ?? "";
  const displayName = draft.displayName.trim();
  if (!normalizedUserKey || !displayName) {
    return {
      ok: false,
      message: "자동 참여자 키와 표시명을 입력해 주세요.",
    };
  }
  const recurringCashPayload = draft.profileType === "DIVIDEND_REINVESTOR"
    ? emptyAutoParticipantRecurringCashPayload()
    : parseAutoParticipantRecurringCashDraft(
        draft.recurringCashAmount,
        draft.recurringCashIntervalValue,
        draft.recurringCashIntervalUnit,
      );
  if (recurringCashPayload === null) {
    return {
      ok: false,
      message: "참여자별 월급/정기 현금은 금액 0 이상, 주기 0 초과 1000 이하로 입력해 주세요. 비워두면 프로필 기본값을 사용합니다.",
    };
  }

  return {
    ok: true,
    userKey: normalizedUserKey,
    payload: {
      displayName,
      enabled: draft.enabled,
      profileType: draft.profileType,
      ...recurringCashPayload,
    },
  };
}

export function buildCashAdjustmentPayload(draft: CashAdjustmentDraftInput): {
  ok: true;
  userKey: string;
  payload: CashAdjustmentPayload;
} | {
  ok: false;
  message: string;
} {
  const userKey = draft.userKey?.trim() ?? "";
  const amount = Number.parseFloat(draft.amount);
  if (!userKey || !Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      message: draft.invalidMessage,
    };
  }

  return {
    ok: true,
    userKey,
    payload: {
      adjustmentType: draft.adjustmentType,
      amount,
    },
  };
}

export function buildInstrumentReportPayload(draft: InstrumentReportDraftInput): {
  ok: true;
  symbol: string;
  payload: InstrumentReportPayload;
} | {
  ok: false;
  message: string;
} {
  const symbol = draft.symbol.trim().toUpperCase();
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const score = Number.parseInt(draft.score, 10);

  if (!symbol || !title || !summary || !Number.isInteger(score) || score < 1 || score > 10) {
    return {
      ok: false,
      message: "보고서 종목, 제목, 요약, 점수 1-10을 입력해 주세요.",
    };
  }

  return {
    ok: true,
    symbol,
    payload: {
      title,
      summary,
      score,
      riseReason: optionalText(draft.riseReason),
      fallReason: optionalText(draft.fallReason),
    },
  };
}

export function buildAutoParticipantStrategyPayload(draft: AutoParticipantStrategyDraftValues): {
  ok: true;
  userKey: string;
  symbol: string;
  payload: AutoParticipantStrategyPayload;
} | {
  ok: false;
  message: string;
} {
  const userKey = draft.userKey.trim();
  const symbol = draft.symbol.trim().toUpperCase();
  const intensity = Number.parseInt(draft.intensity, 10);

  if (!userKey || !symbol || !Number.isInteger(intensity) || intensity < 1 || intensity > 10) {
    return {
      ok: false,
      message: "참여자, 종목, 강도 1-10을 올바르게 입력해 주세요.",
    };
  }

  return {
    ok: true,
    userKey,
    symbol,
    payload: {
      enabled: draft.enabled,
      intensity,
    },
  };
}

export function resolveAutoParticipantSelectionDraft(options: {
  participant: AutoParticipant;
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  autoMarketConfigs: AutoMarketConfig[];
  defaultRecurringCashIntervalUnit: RecurringCashIntervalUnit;
  defaultStrategyIntensity: string;
}): AutoParticipantSelectionDraft {
  const firstParticipantStrategy = options.participantSymbolConfigs.find((config) => config.userKey === options.participant.userKey) ?? null;
  const firstAutoConfig = options.autoMarketConfigs[0] ?? null;
  const strategy = firstParticipantStrategy
    ? toStrategyDraft(firstParticipantStrategy)
    : {
        editingKey: null,
        userKey: options.participant.userKey,
        symbol: firstAutoConfig?.symbol ?? "",
        enabled: true,
        intensity: String(firstAutoConfig?.intensity ?? options.defaultStrategyIntensity),
      };

  return {
    participant: {
      userKey: options.participant.userKey,
      displayName: options.participant.displayName,
      enabled: options.participant.enabled,
      profileType: options.participant.profileType,
      recurringCashAmount: options.participant.recurringCashAmount == null ? "" : String(options.participant.recurringCashAmount),
      recurringCashIntervalValue: options.participant.recurringCashIntervalValue == null ? "" : String(options.participant.recurringCashIntervalValue),
      recurringCashIntervalUnit: options.participant.recurringCashIntervalUnit ?? options.defaultRecurringCashIntervalUnit,
      cashAdjustmentAmount: "",
    },
    strategy,
  };
}

export function resolveParticipantStrategySymbolDraft(options: {
  userKey: string;
  symbol: string;
  participantSymbolConfigs: AutoParticipantSymbolConfig[];
  autoMarketConfigs: AutoMarketConfig[];
  defaultStrategyIntensity: string;
}): AutoParticipantStrategyDraftValues {
  const existingConfig = options.participantSymbolConfigs.find((config) => config.userKey === options.userKey && config.symbol === options.symbol) ?? null;
  if (existingConfig) {
    return toStrategyDraft(existingConfig);
  }
  return {
    editingKey: null,
    userKey: options.userKey,
    symbol: options.symbol,
    enabled: true,
    intensity: String(options.autoMarketConfigs.find((config) => config.symbol === options.symbol)?.intensity ?? options.defaultStrategyIntensity),
  };
}

export function toStrategyDraft(config: AutoParticipantSymbolConfig): AutoParticipantStrategyDraftValues {
  return {
    editingKey: `${config.userKey}:${config.symbol}`,
    userKey: config.userKey,
    symbol: config.symbol,
    enabled: config.enabled,
    intensity: String(config.intensity),
  };
}

export function emptyAutoParticipantRecurringCashPayload() {
  return {
    recurringCashAmount: null,
    recurringCashIntervalValue: null,
    recurringCashIntervalUnit: null,
  };
}

export function buildSymbolMap<T extends { symbol: string }>(items: T[]) {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(item.symbol, item);
  });
  return map;
}

export function buildProfileConfigMap(configs: AutoParticipantProfileConfig[]) {
  return new Map<AutoParticipantProfileType, AutoParticipantProfileConfig>(
    configs.map((config) => [config.profileType, config]),
  );
}

export function resolveSelectedProfileConfig(configs: AutoParticipantProfileConfig[], profileType: string | null) {
  if (profileType === null) {
    return null;
  }
  return configs.find((config) => config.profileType === profileType) ?? null;
}

export function buildAutoParticipantOverviewMap(overviews: AutoParticipantOverview[]) {
  return new Map(overviews.map((overview) => [overview.userKey, overview]));
}

export function resolveSelectedListingAutoAccount(accounts: ListingAutoAccount[], symbol: string) {
  return accounts.find((account) => account.symbol === symbol) ?? null;
}

export function resolveSelectedAutoParticipant(participants: AutoParticipant[], userKey: string | null) {
  if (userKey === null) {
    return null;
  }
  return participants.find((participant) => participant.userKey === userKey) ?? null;
}

export function resolveSelectedAutoParticipantSymbolConfigs(
  configs: AutoParticipantSymbolConfig[],
  participant: AutoParticipant | null,
) {
  if (participant === null) {
    return [];
  }
  return configs.filter((config) => config.userKey === participant.userKey);
}

export function resolveParticipantStrategyKey(participant: AutoParticipant | null, symbol: string) {
  return participant === null ? "" : `${participant.userKey}:${symbol}`;
}

export function resolveOpenOrderBookConfigCount(options: {
  summary: OrderBookMarketStatus | null;
  fallback: OrderBookMarketStatus | null;
  configs: OrderBookMarketStatus["configs"];
}) {
  return options.summary?.openConfigCount
    ?? options.fallback?.openConfigCount
    ?? options.configs.filter((config) => config.enabled && config.marketStatus === "OPEN").length;
}

export function resolveOrderBookInstrumentCount(options: {
  summary: OrderBookMarketStatus | null;
  fallback: OrderBookMarketStatus | null;
  instruments: OrderBookInstrument[];
}) {
  return options.summary?.instrumentCount
    ?? options.fallback?.instrumentCount
    ?? options.instruments.length;
}

export function resolveParticipantUserKeys(participants: AutoParticipant[]) {
  return participants.map((participant) => participant.userKey);
}

export function formatParticipantRecurringCash(participant: AutoParticipant) {
  if (participant.profileType === "DIVIDEND_REINVESTOR") {
    return "배당 이벤트만 사용";
  }
  if (participant.recurringCashAmount == null) {
    return "프로필 기본값";
  }
  if (participant.recurringCashAmount <= 0) {
    return "개별 지급 없음";
  }
  return `${formatWon(participant.recurringCashAmount)} / ${formatNumber(participant.recurringCashIntervalValue)}${formatRecurringCashIntervalUnit(participant.recurringCashIntervalUnit)}`;
}

export function resolveAutoParticipantHoldingPreview(holdings: AutoParticipantHolding[]) {
  const visibleHoldings = holdings
    .filter((holding) => holding.quantity > 0 || holding.reservedQuantity > 0)
    .sort((left, right) => right.marketValue - left.marketValue);
  const preview = visibleHoldings.slice(0, 3).map((holding) => `${holding.symbol} ${formatNumber(holding.quantity)}주`);
  const hiddenCount = visibleHoldings.length - preview.length;
  return hiddenCount > 0 ? [...preview, `외 ${hiddenCount.toLocaleString("ko-KR")}종목`] : preview;
}

export function resolveParticipantProfileOverviewSummaries(
  overviews: AutoParticipantProfileOverview[],
): ParticipantProfileOverviewSummary[] {
  const overviewByProfile = new Map(overviews.map((overview) => [overview.profileType, overview]));
  return AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => {
    const overview = overviewByProfile.get(profile.value);
    return {
      profileType: profile.value,
      label: profile.label,
      description: profile.description,
      behavior: profile.behavior,
      totalCount: overview?.totalCount ?? 0,
      enabledCount: overview?.enabledCount ?? 0,
      disabledCount: overview?.disabledCount ?? 0,
      accountCount: overview?.accountCount ?? 0,
      availableCash: overview?.availableCash ?? 0,
      reservedBuyCash: overview?.reservedBuyCash ?? 0,
      holdingMarketValue: overview?.holdingMarketValue ?? 0,
      estimatedTotalAsset: overview?.estimatedTotalAsset ?? 0,
      netCashFlow: overview?.netCashFlow ?? 0,
      totalProfit: overview?.totalProfit ?? 0,
      returnRate: overview?.returnRate ?? 0,
      holdingCount: overview?.holdingCount ?? 0,
      totalHoldingQuantity: overview?.totalHoldingQuantity ?? 0,
      reservedSellQuantity: overview?.reservedSellQuantity ?? 0,
      openOrderCount: overview?.openOrderCount ?? 0,
      openBuyOrderCount: overview?.openBuyOrderCount ?? 0,
      openSellOrderCount: overview?.openSellOrderCount ?? 0,
      openBuyQuantity: overview?.openBuyQuantity ?? 0,
      openSellQuantity: overview?.openSellQuantity ?? 0,
      todayExecutionCount: overview?.todayExecutionCount ?? 0,
      todayBuyQuantity: overview?.todayBuyQuantity ?? 0,
      todaySellQuantity: overview?.todaySellQuantity ?? 0,
      todayGrossAmount: overview?.todayGrossAmount ?? 0,
      strategyCount: overview?.strategyCount ?? 0,
      enabledStrategyCount: overview?.enabledStrategyCount ?? 0,
      lastOrderAt: overview?.lastOrderAt ?? null,
      lastExecutionAt: overview?.lastExecutionAt ?? null,
      symbolHoldings: overview?.symbolHoldings ?? [],
    };
  });
}

export function filterAutoParticipants(
  participants: AutoParticipant[],
  filters: {
    profileType: "ALL" | AutoParticipantProfileType;
    search: string;
    status: "ALL" | "ENABLED" | "DISABLED";
  },
) {
  const search = filters.search.trim().toLowerCase();
  return participants.filter((participant) => {
    if (filters.status === "ENABLED" && !participant.enabled) {
      return false;
    }
    if (filters.status === "DISABLED" && participant.enabled) {
      return false;
    }
    if (filters.profileType !== "ALL" && participant.profileType !== filters.profileType) {
      return false;
    }
    if (!search) {
      return true;
    }
    return [
      participant.userKey,
      participant.displayName,
      formatAutoParticipantProfile(participant.profileType),
    ].some((value) => value.toLowerCase().includes(search));
  });
}

export function resolveSalaryEligibilityRows(
  participants: AutoParticipant[],
  profileConfigByType: Map<AutoParticipantProfileType, AutoParticipantProfileConfig>,
  overviewByUserKey: Map<string, AutoParticipantOverview>,
): SalaryEligibilityRow[] {
  return participants.map((participant) => {
    const recurringPolicy = resolveRecurringCashPolicy(participant, profileConfigByType.get(participant.profileType) ?? null);
    const overview = overviewByUserKey.get(participant.userKey) ?? null;
    const accountStatus = overview?.accountStatus ?? participant.accountStatus ?? null;
    const blockers: string[] = [];
    if (!participant.enabled) {
      blockers.push("참여자 정지");
    }
    if (participant.withdrawnAt) {
      blockers.push("탈퇴 처리");
    }
    if (!recurringPolicy.payable) {
      blockers.push(recurringPolicy.reason);
    }
    if (accountStatus === null) {
      blockers.push("계좌 확인 필요");
    } else if (accountStatus !== "ACTIVE") {
      blockers.push(`계좌 ${accountStatus}`);
    }
    return {
      participant,
      overview,
      recurringPolicy,
      accountStatus,
      canReceive: blockers.length === 0,
      blockers,
    };
  }).sort((left, right) => {
    if (left.canReceive !== right.canReceive) {
      return left.canReceive ? -1 : 1;
    }
    return left.participant.userKey.localeCompare(right.participant.userKey);
  });
}

export function summarizeSalaryEligibilityRows(rows: SalaryEligibilityRow[]) {
  return rows.reduce(
    (summary, row) => {
      if (row.canReceive) {
        summary.receivableCount += 1;
      } else {
        summary.excludedCount += 1;
      }
      if (row.recurringPolicy.payable) {
        summary.policyCount += 1;
      }
      if (row.recurringPolicy.payable && row.participant.enabled && !row.participant.withdrawnAt && row.accountStatus === null) {
        summary.accountCheckCount += 1;
      }
      return summary;
    },
    {
      receivableCount: 0,
      policyCount: 0,
      accountCheckCount: 0,
      excludedCount: 0,
    },
  );
}

export function resolveRecurringCashPolicy(
  participant: AutoParticipant,
  profileConfig: AutoParticipantProfileConfig | null,
): RecurringCashPolicyResolution {
  if (participant.profileType === "DIVIDEND_REINVESTOR") {
    return {
      payable: false,
      source: "PROFILE",
      sourceLabel: "배당 이벤트",
      amount: 0,
      intervalValue: null,
      intervalUnit: null,
      reason: "배당 지급 기능 사용",
    };
  }
  if (participant.recurringCashAmount != null) {
    return resolveRecurringCashValues({
      source: "PARTICIPANT",
      sourceLabel: "개별 설정",
      amount: participant.recurringCashAmount,
      intervalValue: participant.recurringCashIntervalValue ?? null,
      intervalUnit: participant.recurringCashIntervalUnit ?? null,
    });
  }
  if (!profileConfig) {
    return {
      payable: false,
      source: "PROFILE",
      sourceLabel: "프로필 기본값",
      amount: 0,
      intervalValue: null,
      intervalUnit: null,
      reason: "프로필 설정 없음",
    };
  }
  return resolveRecurringCashValues({
    source: "PROFILE",
    sourceLabel: "프로필 기본값",
    amount: profileConfig.recurringDepositAmount,
    intervalValue: profileConfig.recurringDepositIntervalValue,
    intervalUnit: profileConfig.recurringDepositIntervalUnit,
  });
}

function resolveRecurringCashValues(options: {
  source: "PARTICIPANT" | "PROFILE";
  sourceLabel: string;
  amount: number | null | undefined;
  intervalValue: number | null | undefined;
  intervalUnit: RecurringCashIntervalUnit | null | undefined;
}): RecurringCashPolicyResolution {
  const amount = Number(options.amount ?? 0);
  const intervalValue = options.intervalValue == null ? null : Number(options.intervalValue);
  const intervalUnit = options.intervalUnit ?? null;
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      payable: false,
      source: options.source,
      sourceLabel: options.sourceLabel,
      amount: Number.isFinite(amount) ? amount : 0,
      intervalValue,
      intervalUnit,
      reason: options.source === "PARTICIPANT" ? "개별 미지급" : "프로필 미지급",
    };
  }
  if (!Number.isFinite(intervalValue) || intervalValue === null || intervalValue <= 0 || intervalUnit === null) {
    return {
      payable: false,
      source: options.source,
      sourceLabel: options.sourceLabel,
      amount,
      intervalValue,
      intervalUnit,
      reason: "지급 주기 미설정",
    };
  }
  return {
    payable: true,
    source: options.source,
    sourceLabel: options.sourceLabel,
    amount,
    intervalValue,
    intervalUnit,
    reason: "지급 정책 유효",
  };
}

export function formatRecurringCashPolicy(policy: RecurringCashPolicyResolution) {
  if (!policy.payable) {
    return policy.reason;
  }
  return `${formatWon(policy.amount)} / ${formatNumber(policy.intervalValue)}${formatRecurringCashIntervalUnit(policy.intervalUnit)}`;
}

export function isKnownOrderBookSymbol(instruments: OrderBookInstrument[], symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  return Boolean(normalizedSymbol) && instruments.some((instrument) => instrument.symbol === normalizedSymbol);
}

export function isRangeNumber(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function nextAutoParticipantSerial(existingKeys: Set<string>, keyPrefix: string) {
  let maxSerial = 0;
  existingKeys.forEach((key) => {
    if (!key.startsWith(keyPrefix)) {
      return;
    }
    const suffix = key.slice(keyPrefix.length);
    if (!/^\d+$/.test(suffix)) {
      return;
    }
    maxSerial = Math.max(maxSerial, Number.parseInt(suffix, 10));
  });
  return maxSerial + 1;
}

export function formatAutoParticipantSerial(value: number) {
  return String(value).padStart(3, "0");
}
