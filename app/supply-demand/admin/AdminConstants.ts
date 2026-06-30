import type {
  AutoMarketStatus,
  AutoParticipantOverview,
  AutoParticipantProfileType,
  AutoParticipantProfileOverview,
  BatchJobRuntimeStatus,
  CorporateAction,
  CorporateActionType,
  InstrumentReport,
  ListingAutoPosition,
  OrderBookInstrument,
  OrderBookMarketStatus,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";
import type { CreateInstrumentFormValues } from "@/app/lib/validation/adminSchemas";

export const RECURRING_CASH_INTERVAL_UNIT_OPTIONS: { value: RecurringCashIntervalUnit; label: string }[] = [
  { value: "SECOND", label: "초" },
  { value: "MINUTE", label: "분" },
  { value: "HOUR", label: "시간" },
  { value: "DAY", label: "일" },
  { value: "MONTH", label: "월" },
  { value: "YEAR", label: "년" },
];

export const BATCH_JOB_RUNTIME_LABELS: Record<string, { label: string; description: string }> = {
  "order-book-execution": {
    label: "수요와 공급 주문 체결",
    description: "호가장 미체결 주문을 가격/시간 우선으로 체결합니다.",
  },
  "corporate-actions": {
    label: "주식 이벤트 처리",
    description: "배당, 증자, 분할, 상장폐지 같은 이벤트를 반영합니다.",
  },
  "auto-market": {
    label: "자동장 주문 생성",
    description: "자동참여자와 종목별 자동장 기본값 기준으로 호가를 냅니다.",
  },
  "auto-participant-cash-flow": {
    label: "월급 지급",
    description: "가동 자동참여자와 ACTIVE 계좌에 반복 현금을 지급합니다.",
  },
  "portfolio-settlement": {
    label: "포트폴리오 정산",
    description: "계좌 보유/손익 스냅샷을 정산합니다.",
  },
};

export const SUPPLY_DEMAND_BATCH_JOB_NAMES = new Set([
  "order-book-execution",
  "auto-market",
  "auto-participant-cash-flow",
  "corporate-actions",
  "portfolio-settlement",
]);

export const ADMIN_CASH_FLOW_PAGE_SIZE = 20;
export const ADMIN_SYMBOL_FLOW_PREVIEW_SIZE = 8;
export const ADMIN_PARTICIPANT_PAGE_SIZE = 12;
export const ADMIN_SALARY_PAGE_SIZE = 20;
export const ADMIN_LIVE_SUMMARY_REFETCH_MS = 2_000;
export const ADMIN_PARTICIPANT_DETAIL_REFETCH_MS = 10_000;
export const ADMIN_PROFILE_OVERVIEW_REFETCH_MS = 15_000;
export const ADMIN_AUTO_GENERATE_CONCURRENCY = 5;

export const DEFAULT_CREATE_INSTRUMENT_FORM_VALUES: CreateInstrumentFormValues = {
  symbol: "",
  name: "",
  market: "ORDERBOOK",
  initialPrice: "",
  issuedShares: "",
  tickSize: "100",
  priceLimitRate: "30",
  listingAutoDisplayName: "",
  listingAutoEnabled: "true",
  listingAutoPositionSide: "SELL_ONLY",
  listingAutoMaxOrderQuantity: "100",
  listingAutoOrderTtlSeconds: "30",
  listingAutoPriceOffsetTicks: "3",
};

export const DEFAULT_STOCK_EVENT_ACTION_TYPE: CorporateActionType = "INITIAL_ISSUE";
export const DEFAULT_STOCK_SPLIT_FROM = "1";
export const DEFAULT_STOCK_SPLIT_TO = "5";
export const DEFAULT_REPORT_SCORE = "5";
export const DEFAULT_AUTO_MARKET_INTENSITY = "5";
export const DEFAULT_AUTO_MARKET_MAX_ORDER_QUANTITY = "4";
export const DEFAULT_AUTO_MARKET_ORDER_TTL_SECONDS = "15";
export const DEFAULT_LISTING_AUTO_POSITION_SIDE: ListingAutoPosition = "SELL_ONLY";
export const DEFAULT_LISTING_AUTO_MAX_ORDER_QUANTITY = "100";
export const DEFAULT_LISTING_AUTO_ORDER_TTL_SECONDS = "30";
export const DEFAULT_LISTING_AUTO_PRICE_OFFSET_TICKS = "3";
export const DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE: AutoParticipantProfileType = "NOISE_TRADER";
export const DEFAULT_RECURRING_CASH_INTERVAL_UNIT: RecurringCashIntervalUnit = "DAY";
export const DEFAULT_AUTO_GENERATE_COUNT = "5";
export const DEFAULT_AUTO_GENERATE_KEY_PREFIX = "stock-auto-";
export const DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX = "자동 참여자";
export const DEFAULT_AUTO_GENERATE_PROFILE_MODE = "ROTATE";
export const DEFAULT_STRATEGY_INTENSITY = "5";
export const DEFAULT_PROFILE_WEIGHT = "0";
export const DEFAULT_PROFILE_MULTIPLIER = "1";
export const DEFAULT_PROFILE_RECURRING_DEPOSIT_INTERVAL_VALUE = "30";

export const EMPTY_ORDER_BOOK_CONFIGS: OrderBookMarketStatus["configs"] = [];
export const EMPTY_AUTO_MARKET_CONFIGS: AutoMarketStatus["configs"] = [];
export const EMPTY_AUTO_PARTICIPANTS: AutoMarketStatus["participants"] = [];
export const EMPTY_AUTO_PARTICIPANT_SYMBOL_CONFIGS: AutoMarketStatus["participantSymbolConfigs"] = [];
export const EMPTY_AUTO_PARTICIPANT_PROFILE_CONFIGS: AutoMarketStatus["participantProfileConfigs"] = [];
export const EMPTY_LISTING_AUTO_ACCOUNTS: AutoMarketStatus["listingAutoAccounts"] = [];
export const EMPTY_AUTO_PARTICIPANT_OVERVIEWS: AutoParticipantOverview[] = [];
export const EMPTY_AUTO_PARTICIPANT_PROFILE_OVERVIEWS: AutoParticipantProfileOverview[] = [];
export const EMPTY_ORDER_BOOK_INSTRUMENTS: OrderBookInstrument[] = [];
export const EMPTY_CORPORATE_ACTIONS: CorporateAction[] = [];
export const EMPTY_INSTRUMENT_REPORTS: InstrumentReport[] = [];
export const EMPTY_BATCH_JOB_RUNTIME_CONTROLS: BatchJobRuntimeStatus[] = [];
