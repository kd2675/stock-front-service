import {
  EMPTY_AUTO_MARKET_CONFIGS,
  EMPTY_AUTO_PARTICIPANTS,
  EMPTY_AUTO_PARTICIPANT_PROFILE_CONFIGS,
  EMPTY_AUTO_PARTICIPANT_SYMBOL_CONFIGS,
  EMPTY_BATCH_JOB_RUNTIME_CONTROLS,
  EMPTY_CORPORATE_ACTIONS,
  EMPTY_INSTRUMENT_REPORTS,
  EMPTY_LISTING_AUTO_ACCOUNTS,
  EMPTY_ORDER_BOOK_CONFIGS,
  EMPTY_ORDER_BOOK_INSTRUMENTS,
} from "@/app/supply-demand/admin/AdminConstants";
import type { ParticipantProfileOverviewSummary } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import {
  resolveOpenOrderBookConfigCount,
  resolveOrderBookInstrumentCount,
} from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type {
  AdminCashFlowPage,
  AdminFlowOverview,
  AdminSymbolFlowList,
  AutoMarketConfig,
  AutoMarketStatus,
  AutoParticipant,
  AutoParticipantProfileConfig,
  AutoParticipantSymbolConfig,
  BatchJobRuntimeStatus,
  CorporateAction,
  FundFlow,
  InstrumentReport,
  ListingAutoAccount,
  OrderBookInstrument,
  OrderBookMarketStatus,
} from "@/app/types/stock";

const EMPTY_PARTICIPANT_PROFILE_OVERVIEW_SUMMARIES: ParticipantProfileOverviewSummary[] = [];

type AdminPageQueryResultInput = {
  adminCashFlowPage: AdminCashFlowPage | null | undefined;
  adminFlowOverview: AdminFlowOverview | null | undefined;
  adminSymbolFlowList: AdminSymbolFlowList | null | undefined;
  autoMarketDetails: AutoMarketStatus | null | undefined;
  autoMarketSummary: AutoMarketStatus | null | undefined;
  autoParticipants: AutoParticipant[] | null | undefined;
  autoParticipantProfileOverviewSummaries: ParticipantProfileOverviewSummary[] | null | undefined;
  batchJobRuntimeControls: BatchJobRuntimeStatus[] | null | undefined;
  corporateActions: CorporateAction[] | null | undefined;
  instrumentReports: InstrumentReport[] | null | undefined;
  instruments: OrderBookInstrument[] | null | undefined;
  orderBookMarketConfig: OrderBookMarketStatus | null | undefined;
  orderBookMarketSummary: OrderBookMarketStatus | null | undefined;
  userFundFlow: FundFlow | null | undefined;
};

export type AdminPageQueryResultData = {
  adminCashFlowPage: AdminCashFlowPage | null;
  adminFlowOverview: AdminFlowOverview | null;
  adminSymbolFlowList: AdminSymbolFlowList | null;
  autoMarketConfigs: AutoMarketConfig[];
  autoMarketSummary: AutoMarketStatus | null;
  autoParticipantProfileOverviewSummaries: ParticipantProfileOverviewSummary[];
  autoParticipants: AutoParticipant[];
  autoParticipantSymbolConfigs: AutoParticipantSymbolConfig[];
  batchJobRuntimeControls: BatchJobRuntimeStatus[];
  corporateActions: CorporateAction[];
  instrumentReports: InstrumentReport[];
  instruments: OrderBookInstrument[];
  listingAutoAccounts: ListingAutoAccount[];
  openOrderBookConfigCount: number;
  orderBookConfigs: OrderBookMarketStatus["configs"];
  orderBookInstrumentCount: number;
  orderBookMarketSummary: OrderBookMarketStatus | null;
  profileConfigs: AutoParticipantProfileConfig[];
  status: AutoMarketStatus | null;
  userFundFlow: FundFlow | null;
};

export function normalizeAdminPageQueryResults(input: AdminPageQueryResultInput): AdminPageQueryResultData {
  const instruments = input.instruments ?? EMPTY_ORDER_BOOK_INSTRUMENTS;
  const status = input.autoMarketDetails ?? null;
  const orderBookMarketConfig = input.orderBookMarketConfig ?? null;
  const orderBookMarketSummary = input.orderBookMarketSummary ?? null;
  const orderBookConfigs = orderBookMarketConfig?.configs ?? EMPTY_ORDER_BOOK_CONFIGS;

  return {
    adminCashFlowPage: input.adminCashFlowPage ?? null,
    adminFlowOverview: input.adminFlowOverview ?? null,
    adminSymbolFlowList: input.adminSymbolFlowList ?? null,
    autoMarketConfigs: status?.configs ?? EMPTY_AUTO_MARKET_CONFIGS,
    autoMarketSummary: input.autoMarketSummary ?? null,
    autoParticipantProfileOverviewSummaries: input.autoParticipantProfileOverviewSummaries ?? EMPTY_PARTICIPANT_PROFILE_OVERVIEW_SUMMARIES,
    autoParticipants: input.autoParticipants ?? status?.participants ?? EMPTY_AUTO_PARTICIPANTS,
    autoParticipantSymbolConfigs: status?.participantSymbolConfigs ?? EMPTY_AUTO_PARTICIPANT_SYMBOL_CONFIGS,
    batchJobRuntimeControls: input.batchJobRuntimeControls ?? EMPTY_BATCH_JOB_RUNTIME_CONTROLS,
    corporateActions: input.corporateActions ?? EMPTY_CORPORATE_ACTIONS,
    instrumentReports: input.instrumentReports ?? EMPTY_INSTRUMENT_REPORTS,
    instruments,
    listingAutoAccounts: status?.listingAutoAccounts ?? EMPTY_LISTING_AUTO_ACCOUNTS,
    openOrderBookConfigCount: resolveOpenOrderBookConfigCount({
      summary: orderBookMarketSummary,
      fallback: orderBookMarketConfig,
      configs: orderBookConfigs,
    }),
    orderBookConfigs,
    orderBookInstrumentCount: resolveOrderBookInstrumentCount({
      summary: orderBookMarketSummary,
      fallback: orderBookMarketConfig,
      instruments,
    }),
    orderBookMarketSummary,
    profileConfigs: status?.participantProfileConfigs ?? EMPTY_AUTO_PARTICIPANT_PROFILE_CONFIGS,
    status,
    userFundFlow: input.userFundFlow ?? null,
  };
}
