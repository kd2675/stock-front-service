"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import TradingTopBar from "@/app/components/TradingTopBar";
import useAdminAccess from "@/app/hooks/useAdminAccess";
import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { ensureAccessToken } from "@/app/lib/auth";
import { createOrderBookInstrumentMutationOptions } from "@/app/lib/react-query/stockMutations";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { adminCashFlowsQueryOptions, adminFlowOverviewQueryOptions, adminFundFlowSummaryQueryOptions, adminSymbolFlowsQueryOptions, adminUserFundFlowQueryOptions, autoMarketStatusQueryOptions, autoMarketSummaryStatusQueryOptions, autoParticipantOverviewsQueryOptions, autoParticipantProfileOverviewsQueryOptions, batchJobRuntimeControlsQueryOptions, corporateActionsQueryOptions, instrumentReportsQueryOptions, orderBookInstrumentsQueryOptions, orderBookMarketStatusQueryOptions } from "@/app/lib/react-query/stockQueries";
import { adjustAutoParticipantCash, adjustUserAccountCash, applyCorporateAction, deleteInstrumentReport, publishInstrumentReport, runAutoParticipantCashFlow, updateAutoMarketConfig, updateAutoParticipantProfileConfig, updateAutoParticipantSymbolConfig, updateBatchJobRuntimeControl, updateInstrumentReport, updateListingAutoAccountConfig, updateMarketStatus, upsertAutoParticipant, withdrawAutoParticipant } from "@/app/lib/stock";
import { createInstrumentSchema, type CreateInstrumentFormValues } from "@/app/lib/validation/adminSchemas";
import { AdminAutoMarketConfigPanel, type AutoMarketConfigDraft, type AutoMarketConfigDraftSetters } from "@/app/supply-demand/admin/AdminAutoMarketConfigPanel";
import { type AutoParticipantEditDraft, type AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantCards";
import { AdminAutoParticipantManagementPanel } from "@/app/supply-demand/admin/AdminAutoParticipantManagementPanel";
import { AdminBatchRuntimeControlPanel } from "@/app/supply-demand/admin/AdminBatchRuntimeControls";
import { AdminCashFlowLedgerPanel, AdminUserCashAdjustmentPanel } from "@/app/supply-demand/admin/AdminCashPanels";
import { AdminCorporateActionHistoryPanel } from "@/app/supply-demand/admin/AdminCorporateActionHistoryPanel";
import { formatRuntimeUpdateMessage } from "@/app/supply-demand/admin/AdminFormatters";
import {
  ADMIN_AUTO_GENERATE_CONCURRENCY,
  ADMIN_CASH_FLOW_PAGE_SIZE,
  ADMIN_LIVE_SUMMARY_REFETCH_MS,
  ADMIN_PARTICIPANT_DETAIL_REFETCH_MS,
  ADMIN_PARTICIPANT_PAGE_SIZE,
  ADMIN_PROFILE_OVERVIEW_REFETCH_MS,
  ADMIN_SALARY_PAGE_SIZE,
  ADMIN_SYMBOL_FLOW_PREVIEW_SIZE,
  BATCH_JOB_RUNTIME_LABELS,
  DEFAULT_AUTO_GENERATE_COUNT,
  DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX,
  DEFAULT_AUTO_GENERATE_KEY_PREFIX,
  DEFAULT_AUTO_GENERATE_PROFILE_MODE,
  DEFAULT_AUTO_MARKET_INTENSITY,
  DEFAULT_AUTO_MARKET_MAX_ORDER_QUANTITY,
  DEFAULT_AUTO_MARKET_ORDER_TTL_SECONDS,
  DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
  DEFAULT_CREATE_INSTRUMENT_FORM_VALUES,
  DEFAULT_LISTING_AUTO_MAX_ORDER_QUANTITY,
  DEFAULT_LISTING_AUTO_ORDER_TTL_SECONDS,
  DEFAULT_LISTING_AUTO_POSITION_SIDE,
  DEFAULT_LISTING_AUTO_PRICE_OFFSET_TICKS,
  DEFAULT_PROFILE_MULTIPLIER,
  DEFAULT_PROFILE_RECURRING_DEPOSIT_INTERVAL_VALUE,
  DEFAULT_PROFILE_WEIGHT,
  DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
  DEFAULT_REPORT_SCORE,
  DEFAULT_STOCK_EVENT_ACTION_TYPE,
  DEFAULT_STOCK_SPLIT_FROM,
  DEFAULT_STOCK_SPLIT_TO,
  DEFAULT_STRATEGY_INTENSITY,
  EMPTY_AUTO_MARKET_CONFIGS,
  EMPTY_AUTO_PARTICIPANTS,
  EMPTY_AUTO_PARTICIPANT_OVERVIEWS,
  EMPTY_AUTO_PARTICIPANT_PROFILE_CONFIGS,
  EMPTY_AUTO_PARTICIPANT_PROFILE_OVERVIEWS,
  EMPTY_AUTO_PARTICIPANT_SYMBOL_CONFIGS,
  EMPTY_BATCH_JOB_RUNTIME_CONTROLS,
  EMPTY_CORPORATE_ACTIONS,
  EMPTY_INSTRUMENT_REPORTS,
  EMPTY_LISTING_AUTO_ACCOUNTS,
  EMPTY_ORDER_BOOK_CONFIGS,
  EMPTY_ORDER_BOOK_INSTRUMENTS,
} from "@/app/supply-demand/admin/AdminConstants";
import {
  buildAutoMarketConfigPayload,
  buildAutoParticipantStrategyPayload,
  buildCashAdjustmentPayload,
  buildCorporateActionPayload,
  buildInstrumentReportPayload,
  buildAutoParticipantGenerateRequests,
  buildAutoParticipantPayload,
  buildListingAutoAccountConfigPayload,
  buildProfileConfigPayload,
  buildAutoParticipantOverviewMap,
  buildSymbolMap,
  buildProfileConfigMap,
  filterAutoParticipants,
  isKnownOrderBookSymbol,
  optionalText,
  resolveAutoMarketConfigDraft,
  resolvePaginatedItems,
  resolveAutoParticipantSelectionDraft,
  resolveListingAutoAccountConfigDraft,
  resolveParticipantStrategySymbolDraft,
  resolveParticipantStrategyKey,
  resolvePaginationWindow,
  resolveOpenOrderBookConfigCount,
  resolveOrderBookInstrumentCount,
  resolveParticipantProfileOverviewSummaries,
  resolveParticipantUserKeys,
  resolveProfileConfigDraft,
  resolveSalaryEligibilityRows,
  resolveSelectedAutoParticipant,
  resolveSelectedAutoParticipantSymbolConfigs,
  resolveSelectedListingAutoAccount,
  resolveSelectedProfileConfig,
  summarizeSalaryEligibilityRows,
  toStrategyDraft,
  type AutoParticipantStrategyDraftValues,
} from "@/app/supply-demand/admin/AdminHelpers";
import { AdminFlowOverviewPanel } from "@/app/supply-demand/admin/AdminFlowPanels";
import { AdminInstrumentReportPanel, type InstrumentReportDraft, type InstrumentReportDraftSetters } from "@/app/supply-demand/admin/AdminInstrumentReportPanel";
import { AdminListingAutoAccountPanel, type ListingAutoAccountDraft, type ListingAutoAccountDraftSetters } from "@/app/supply-demand/admin/AdminListingAutoAccountPanel";
import { AdminMarketSummaryPanel } from "@/app/supply-demand/admin/AdminMarketSummaryPanel";
import { AdminOrderBookInstrumentTable } from "@/app/supply-demand/admin/AdminOrderBookInstrumentTable";
import AutoSignalGuide from "@/app/supply-demand/admin/AdminSignalGuide";
import {
  ACCOUNT_SUB_TABS,
  ADMIN_TABS,
  AUTOMATION_SUB_TABS,
  AdminSubTabNav,
  AdminTabNav,
  resolveAdminSectionFromPath,
  resolveAdminTabFromPath,
} from "@/app/supply-demand/admin/AdminNavigation";
import { ParticipantProfileOverviewPanel } from "@/app/supply-demand/admin/AdminParticipantOverviewPanels";
import { AdminProfileConfigPanel, type ProfileConfigDraft, type ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigPanel";
import { SalaryEligibilityPanel } from "@/app/supply-demand/admin/AdminSalaryPanels";
import { AdminStockEventPanel, type StockEventDraft, type StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventPanel";
import type { AutoMarketConfig, AutoParticipant, AutoParticipantProfileConfig, AutoParticipantProfileType, AutoParticipantSymbolConfig, BatchJobRuntimeStatus, CorporateActionType, InstrumentReport, ListingAutoAccount, ListingAutoPosition, MarketSessionStatus, OrderBookMarketStatus, RecurringCashIntervalUnit, StockBatchJobRun } from "@/app/types/stock";

export default function SupplyDemandAdminPage() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const activeAdminTab = resolveAdminTabFromPath(pathname);
  const activeAdminSection = resolveAdminSectionFromPath(pathname);
  const { accessToken, adminStatus } = useAdminAccess();
  const [adminCashFlowPageIndex, setAdminCashFlowPageIndex] = useState(0);
  const [lastCashFlowRun, setLastCashFlowRun] = useState<StockBatchJobRun | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const createInstrumentForm = useForm<CreateInstrumentFormValues>({
    resolver: zodResolver(createInstrumentSchema),
    defaultValues: DEFAULT_CREATE_INSTRUMENT_FORM_VALUES,
  });
  const [actionSymbol, setActionSymbol] = useState("");
  const [actionType, setActionType] = useState<CorporateActionType>(DEFAULT_STOCK_EVENT_ACTION_TYPE);
  const [actionShares, setActionShares] = useState("");
  const [actionIssuePrice, setActionIssuePrice] = useState("");
  const [actionDividendAmount, setActionDividendAmount] = useState("");
  const [exRightsDate, setExRightsDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [listingDate, setListingDate] = useState("");
  const [delistingDate, setDelistingDate] = useState("");
  const [splitFrom, setSplitFrom] = useState(DEFAULT_STOCK_SPLIT_FROM);
  const [splitTo, setSplitTo] = useState(DEFAULT_STOCK_SPLIT_TO);
  const [actionDescription, setActionDescription] = useState("");
  const [applyingAction, setApplyingAction] = useState(false);
  const [reportSymbol, setReportSymbol] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportScore, setReportScore] = useState(DEFAULT_REPORT_SCORE);
  const [reportRiseReason, setReportRiseReason] = useState("");
  const [reportFallReason, setReportFallReason] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);
  const [updatingStatusSymbol, setUpdatingStatusSymbol] = useState<string | null>(null);
  const [autoConfigSymbol, setAutoConfigSymbol] = useState("");
  const autoConfigSymbolRef = useRef("");
  const [editingAutoConfigSymbol, setEditingAutoConfigSymbol] = useState<string | null>(null);
  const [autoConfigEnabled, setAutoConfigEnabled] = useState(true);
  const [autoIntensity, setAutoIntensity] = useState(DEFAULT_AUTO_MARKET_INTENSITY);
  const [autoMaxOrderQuantity, setAutoMaxOrderQuantity] = useState(DEFAULT_AUTO_MARKET_MAX_ORDER_QUANTITY);
  const [autoOrderTtlSeconds, setAutoOrderTtlSeconds] = useState(DEFAULT_AUTO_MARKET_ORDER_TTL_SECONDS);
  const [updatingAutoConfig, setUpdatingAutoConfig] = useState(false);
  const [togglingAutoConfigSymbol, setTogglingAutoConfigSymbol] = useState<string | null>(null);
  const [listingAutoSymbol, setListingAutoSymbol] = useState("");
  const listingAutoSymbolRef = useRef("");
  const [editingListingAutoSymbol, setEditingListingAutoSymbol] = useState<string | null>(null);
  const [listingAutoDisplayName, setListingAutoDisplayName] = useState("");
  const [listingAutoEnabled, setListingAutoEnabled] = useState(true);
  const [listingAutoPositionSide, setListingAutoPositionSide] = useState<ListingAutoPosition>(DEFAULT_LISTING_AUTO_POSITION_SIDE);
  const [listingAutoMaxOrderQuantity, setListingAutoMaxOrderQuantity] = useState(DEFAULT_LISTING_AUTO_MAX_ORDER_QUANTITY);
  const [listingAutoOrderTtlSeconds, setListingAutoOrderTtlSeconds] = useState(DEFAULT_LISTING_AUTO_ORDER_TTL_SECONDS);
  const [listingAutoPriceOffsetTicks, setListingAutoPriceOffsetTicks] = useState(DEFAULT_LISTING_AUTO_PRICE_OFFSET_TICKS);
  const [updatingListingAutoAccount, setUpdatingListingAutoAccount] = useState(false);
  const [editingAutoParticipantUserKey, setEditingAutoParticipantUserKey] = useState<string | null>(null);
  const [autoParticipantUserKey, setAutoParticipantUserKey] = useState("");
  const [autoParticipantDisplayName, setAutoParticipantDisplayName] = useState("");
  const [autoParticipantEnabled, setAutoParticipantEnabled] = useState(true);
  const [autoParticipantProfileType, setAutoParticipantProfileType] = useState<AutoParticipantProfileType>(DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE);
  const [autoParticipantRecurringCashAmount, setAutoParticipantRecurringCashAmount] = useState("");
  const [autoParticipantRecurringCashIntervalValue, setAutoParticipantRecurringCashIntervalValue] = useState("");
  const [autoParticipantRecurringCashIntervalUnit, setAutoParticipantRecurringCashIntervalUnit] = useState<RecurringCashIntervalUnit>(DEFAULT_RECURRING_CASH_INTERVAL_UNIT);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantStatusFilter, setParticipantStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [participantProfileFilter, setParticipantProfileFilter] = useState<"ALL" | AutoParticipantProfileType>("ALL");
  const [participantPage, setParticipantPage] = useState(0);
  const [salaryPage, setSalaryPage] = useState(0);
  const [savingAutoParticipant, setSavingAutoParticipant] = useState(false);
  const [autoGenerateCount, setAutoGenerateCount] = useState(DEFAULT_AUTO_GENERATE_COUNT);
  const [autoGenerateKeyPrefix, setAutoGenerateKeyPrefix] = useState(DEFAULT_AUTO_GENERATE_KEY_PREFIX);
  const [autoGenerateDisplayPrefix, setAutoGenerateDisplayPrefix] = useState(DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX);
  const [autoGenerateProfileMode, setAutoGenerateProfileMode] = useState<"ROTATE" | "SINGLE">(DEFAULT_AUTO_GENERATE_PROFILE_MODE);
  const [autoGenerateProfileType, setAutoGenerateProfileType] = useState<AutoParticipantProfileType>(DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE);
  const [generatingAutoParticipants, setGeneratingAutoParticipants] = useState(false);
  const [togglingAutoParticipantUserKey, setTogglingAutoParticipantUserKey] = useState<string | null>(null);
  const [withdrawingAutoParticipantUserKey, setWithdrawingAutoParticipantUserKey] = useState<string | null>(null);
  const [cashAdjustmentAmount, setCashAdjustmentAmount] = useState("");
  const [adjustingCashType, setAdjustingCashType] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [userCashAdjustmentUserKey, setUserCashAdjustmentUserKey] = useState("");
  const [userCashAdjustmentAmount, setUserCashAdjustmentAmount] = useState("");
  const [adjustingUserCashType, setAdjustingUserCashType] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [userFundFlowUserKey, setUserFundFlowUserKey] = useState<string | null>(null);
  const [runningCashFlow, setRunningCashFlow] = useState(false);
  const [updatingBatchJobName, setUpdatingBatchJobName] = useState<string | null>(null);
  const [strategyUserKey, setStrategyUserKey] = useState("");
  const [strategySymbol, setStrategySymbol] = useState("");
  const [editingStrategyKey, setEditingStrategyKey] = useState<string | null>(null);
  const [strategyEnabled, setStrategyEnabled] = useState(true);
  const [strategyIntensity, setStrategyIntensity] = useState(DEFAULT_STRATEGY_INTENSITY);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [togglingStrategyKey, setTogglingStrategyKey] = useState<string | null>(null);
  const autoParticipantStrategySeedRef = useRef<string | null>(null);
  const [editingProfileType, setEditingProfileType] = useState<AutoParticipantProfileType | null>(null);
  const [profileNewsWeight, setProfileNewsWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileMomentumWeight, setProfileMomentumWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileContrarianWeight, setProfileContrarianWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileLossAversionWeight, setProfileLossAversionWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileHerdingWeight, setProfileHerdingWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileMarketMakingWeight, setProfileMarketMakingWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileOverconfidenceWeight, setProfileOverconfidenceWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileNoiseWeight, setProfileNoiseWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profilePanicSellWeight, setProfilePanicSellWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileDipBuyWeight, setProfileDipBuyWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileOrderMultiplier, setProfileOrderMultiplier] = useState(DEFAULT_PROFILE_MULTIPLIER);
  const [profileAggressionMultiplier, setProfileAggressionMultiplier] = useState(DEFAULT_PROFILE_MULTIPLIER);
  const [profileOrderTtlMultiplier, setProfileOrderTtlMultiplier] = useState(DEFAULT_PROFILE_MULTIPLIER);
  const [profileQuantityMultiplier, setProfileQuantityMultiplier] = useState(DEFAULT_PROFILE_MULTIPLIER);
  const [profileHoldingPatienceWeight, setProfileHoldingPatienceWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileDeepLossHoldWeight, setProfileDeepLossHoldWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileProfitTakingWeight, setProfileProfitTakingWeight] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileRecurringDepositAmount, setProfileRecurringDepositAmount] = useState(DEFAULT_PROFILE_WEIGHT);
  const [profileRecurringDepositIntervalValue, setProfileRecurringDepositIntervalValue] = useState(DEFAULT_PROFILE_RECURRING_DEPOSIT_INTERVAL_VALUE);
  const [profileRecurringDepositIntervalUnit, setProfileRecurringDepositIntervalUnit] = useState<RecurringCashIntervalUnit>(DEFAULT_RECURRING_CASH_INTERVAL_UNIT);
  const [savingProfileConfig, setSavingProfileConfig] = useState(false);
  const reportSymbolRef = useRef("");
  const shouldLoadInstrumentDetails = activeAdminSection === "market" || activeAdminSection === "events";
  const shouldLoadAdminFlowOverview = activeAdminSection === "market";
  const includeParticipants = activeAdminSection === "salary" || activeAdminSection === "participants";
  const includeParticipantStrategyDetails = activeAdminSection === "participants" && editingAutoParticipantUserKey !== null;
  const includeConfigs = activeAdminSection === "auto-symbols" || includeParticipantStrategyDetails;
  const includeParticipantSymbolConfigs = activeAdminSection === "participants" && editingAutoParticipantUserKey !== null;
  const includeParticipantProfileConfigs = activeAdminSection === "salary"
    || activeAdminSection === "profiles";
  const includeListingAutoAccounts = activeAdminSection === "listing-auto";
  const shouldLoadAutoMarketDetails = includeParticipants
    || includeConfigs
    || includeParticipantSymbolConfigs
    || includeParticipantProfileConfigs
    || includeListingAutoAccounts;
  const shouldLoadAutoParticipantProfileOverviews = activeAdminSection === "profile-overview";
  const autoParticipantProfileOverviewsQuery = useQuery(autoParticipantProfileOverviewsQueryOptions(accessToken, {
    enabled: adminStatus === "allowed" && shouldLoadAutoParticipantProfileOverviews,
    refetchIntervalMs: ADMIN_PROFILE_OVERVIEW_REFETCH_MS,
  }));
  const autoParticipantProfileOverviews = autoParticipantProfileOverviewsQuery.data ?? EMPTY_AUTO_PARTICIPANT_PROFILE_OVERVIEWS;
  const orderBookInstrumentsQuery = useQuery({
    ...orderBookInstrumentsQueryOptions(),
    enabled: adminStatus === "allowed" && shouldLoadInstrumentDetails,
  });
  const instruments = orderBookInstrumentsQuery.data ?? EMPTY_ORDER_BOOK_INSTRUMENTS;
  const corporateActionSymbol = isKnownOrderBookSymbol(instruments, actionSymbol) ? actionSymbol : "";
  const instrumentReportSymbol = isKnownOrderBookSymbol(instruments, reportSymbol) ? reportSymbol : "";
  const corporateActionsQuery = useQuery({
    ...corporateActionsQueryOptions(corporateActionSymbol),
    enabled: adminStatus === "allowed" && activeAdminSection === "events" && Boolean(corporateActionSymbol),
  });
  const instrumentReportsQuery = useQuery({
    ...instrumentReportsQueryOptions(instrumentReportSymbol),
    enabled: adminStatus === "allowed" && activeAdminSection === "events" && Boolean(instrumentReportSymbol),
  });
  const corporateActions = corporateActionsQuery.data ?? EMPTY_CORPORATE_ACTIONS;
  const instrumentReports = instrumentReportsQuery.data ?? EMPTY_INSTRUMENT_REPORTS;
  const autoMarketDetailsQuery = useQuery(autoMarketStatusQueryOptions({
    enabled: adminStatus === "allowed" && shouldLoadAutoMarketDetails,
    includeConfigs,
    includeParticipants,
    includeParticipantSymbolConfigs,
    includeParticipantProfileConfigs,
    includeListingAutoAccounts,
    includeRuntimeMetrics: false,
    includeSalaryEligibility: false,
    participantSymbolConfigUserKey: includeParticipantSymbolConfigs ? editingAutoParticipantUserKey ?? undefined : undefined,
    refetchIntervalMs: false,
  }));
  const status = autoMarketDetailsQuery.data ?? null;
  const adminFundFlowSummaryQuery = useQuery(adminFundFlowSummaryQueryOptions(accessToken, {
    enabled: adminStatus === "allowed" && activeAdminSection === "market",
  }));
  const adminFlowOverviewQuery = useQuery(adminFlowOverviewQueryOptions(accessToken, {
    enabled: adminStatus === "allowed" && shouldLoadAdminFlowOverview,
    includeFundFlow: false,
    includeSymbolFlows: true,
    symbolFlowLimit: ADMIN_SYMBOL_FLOW_PREVIEW_SIZE,
  }));
  const adminFlowOverview = adminFlowOverviewQuery.data ?? null;
  const adminSymbolFlowsQuery = useQuery(adminSymbolFlowsQueryOptions(accessToken, {
    enabled: false,
  }));
  const adminSymbolFlowList = adminSymbolFlowsQuery.data ?? null;
  const adminCashFlowPageQuery = useQuery(adminCashFlowsQueryOptions(accessToken, adminCashFlowPageIndex, ADMIN_CASH_FLOW_PAGE_SIZE, {
    enabled: adminStatus === "allowed" && activeAdminSection === "cash-flow-ledger",
  }));
  const adminCashFlowPage = adminCashFlowPageQuery.data ?? null;
  const userFundFlowQuery = useQuery(adminUserFundFlowQueryOptions(accessToken, userFundFlowUserKey ?? "", {
    enabled: false,
  }));
  const userFundFlow = userFundFlowQuery.data ?? null;
  const batchJobRuntimeControlsQuery = useQuery(batchJobRuntimeControlsQueryOptions(accessToken, {
    enabled: adminStatus === "allowed" && activeAdminSection === "batch",
  }));
  const batchJobRuntimeControls = batchJobRuntimeControlsQuery.data ?? EMPTY_BATCH_JOB_RUNTIME_CONTROLS;
  const shouldLoadAutoMarketSummary = activeAdminTab === "market";
  const shouldLoadMarketSummary = activeAdminTab === "market";
  const autoMarketSummaryQuery = useQuery(autoMarketSummaryStatusQueryOptions({
    enabled: adminStatus === "allowed" && shouldLoadAutoMarketSummary,
    includeRuntimeMetrics: false,
    includeSalaryEligibility: false,
    refetchIntervalMs: ADMIN_LIVE_SUMMARY_REFETCH_MS,
  }));
  const orderBookMarketSummaryQuery = useQuery({
    ...orderBookMarketStatusQueryOptions({
      includeConfigs: false,
      includeTodayExecution: true,
      refetchIntervalMs: ADMIN_LIVE_SUMMARY_REFETCH_MS,
    }),
    enabled: adminStatus === "allowed" && shouldLoadMarketSummary,
  });
  const orderBookMarketConfigQuery = useQuery({
    ...orderBookMarketStatusQueryOptions({
      includeConfigs: true,
      includeTodayExecution: false,
      refetchIntervalMs: false,
    }),
    enabled: adminStatus === "allowed" && shouldLoadMarketSummary,
  });

  const applyAutoMarketConfigDraft = useCallback((draft: ReturnType<typeof resolveAutoMarketConfigDraft>) => {
    setAutoConfigSymbol(draft.symbol);
    setAutoConfigEnabled(draft.enabled);
    setAutoIntensity(draft.intensity);
    setAutoMaxOrderQuantity(draft.maxOrderQuantity);
    setAutoOrderTtlSeconds(draft.orderTtlSeconds);
  }, []);

  const applyListingAutoAccountConfigDraft = useCallback((draft: ReturnType<typeof resolveListingAutoAccountConfigDraft>) => {
    setListingAutoSymbol(draft.symbol);
    setListingAutoDisplayName(draft.displayName);
    setListingAutoEnabled(draft.enabled);
    setListingAutoPositionSide(draft.positionSide);
    setListingAutoMaxOrderQuantity(draft.maxOrderQuantity);
    setListingAutoOrderTtlSeconds(draft.orderTtlSeconds);
    setListingAutoPriceOffsetTicks(draft.priceOffsetTicks);
  }, []);

  const applyProfileConfigDraft = useCallback((draft: ReturnType<typeof resolveProfileConfigDraft>) => {
    setEditingProfileType(draft.profileType);
    setProfileNewsWeight(draft.newsWeight);
    setProfileMomentumWeight(draft.momentumWeight);
    setProfileContrarianWeight(draft.contrarianWeight);
    setProfileLossAversionWeight(draft.lossAversionWeight);
    setProfileHerdingWeight(draft.herdingWeight);
    setProfileMarketMakingWeight(draft.marketMakingWeight);
    setProfileOverconfidenceWeight(draft.overconfidenceWeight);
    setProfileNoiseWeight(draft.noiseWeight);
    setProfilePanicSellWeight(draft.panicSellWeight);
    setProfileDipBuyWeight(draft.dipBuyWeight);
    setProfileOrderMultiplier(draft.orderMultiplier);
    setProfileAggressionMultiplier(draft.aggressionMultiplier);
    setProfileOrderTtlMultiplier(draft.orderTtlMultiplier);
    setProfileQuantityMultiplier(draft.quantityMultiplier);
    setProfileHoldingPatienceWeight(draft.holdingPatienceWeight);
    setProfileDeepLossHoldWeight(draft.deepLossHoldWeight);
    setProfileProfitTakingWeight(draft.profitTakingWeight);
    setProfileRecurringDepositAmount(draft.recurringDepositAmount);
    setProfileRecurringDepositIntervalValue(draft.recurringDepositIntervalValue);
    setProfileRecurringDepositIntervalUnit(draft.recurringDepositIntervalUnit);
  }, []);

  useEffect(() => {
    autoConfigSymbolRef.current = autoConfigSymbol;
  }, [autoConfigSymbol]);

  useEffect(() => {
    listingAutoSymbolRef.current = listingAutoSymbol;
  }, [listingAutoSymbol]);

  useEffect(() => {
    reportSymbolRef.current = reportSymbol;
  }, [reportSymbol]);

  useEffect(() => {
    if (!shouldLoadInstrumentDetails || reportSymbolRef.current || instruments.length === 0) {
      return undefined;
    }
    const firstSymbol = instruments[0].symbol;
    reportSymbolRef.current = firstSymbol;
    const timer = window.setTimeout(() => {
      setReportSymbol(firstSymbol);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [instruments, shouldLoadInstrumentDetails]);

  useEffect(() => {
    if (!status) {
      return;
    }
    if (!autoConfigSymbolRef.current && status.configs.length > 0) {
      const firstConfig = status.configs[0];
      const draft = resolveAutoMarketConfigDraft(firstConfig);
      autoConfigSymbolRef.current = draft.symbol;
      applyAutoMarketConfigDraft(draft);
    }
    if (!listingAutoSymbolRef.current && status.listingAutoAccounts.length > 0) {
      const firstListingAutoAccount = status.listingAutoAccounts[0];
      const draft = resolveListingAutoAccountConfigDraft(firstListingAutoAccount);
      listingAutoSymbolRef.current = draft.symbol;
      applyListingAutoAccountConfigDraft(draft);
    }
  }, [applyAutoMarketConfigDraft, applyListingAutoAccountConfigDraft, status]);

  const reloadAutoParticipantState = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: stockKeys.autoMarketStatus() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.autoParticipantOverviewsRoot() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.autoParticipantProfileOverviews() });
  }, [queryClient]);

  const reloadAdminCashFlowState = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: stockKeys.adminCashFlowsRoot() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.adminFundFlowSummary() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.adminFlowOverviewRoot() });
  }, [queryClient]);

  const reloadOrderBookMarketState = useCallback(() => {
    queryClient.removeQueries({ queryKey: stockKeys.adminSymbolFlowsRoot() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatusRoot() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.orderBookInstruments() });
    void queryClient.invalidateQueries({ queryKey: stockKeys.adminFlowOverviewRoot() });
  }, [queryClient]);

  const requireAdminToken = useCallback(async (missingTokenMessage: string) => {
    const token = await ensureAccessToken();
    if (!token) {
      setMessage(missingTokenMessage);
    }
    return token;
  }, []);

  const loadAllAdminSymbolFlows = useCallback(async () => {
    const token = await requireAdminToken("관리자 로그인 후 전체 종목 흐름을 조회할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await adminSymbolFlowsQuery.refetch();
    if (result.isError) {
      setMessage(result.error instanceof Error ? result.error.message : "전체 종목 흐름 조회에 실패했습니다.");
    }
  }, [adminSymbolFlowsQuery, requireAdminToken]);

  const createInstrumentMutation = useMutation({
    ...createOrderBookInstrumentMutationOptions(),
    onSuccess: async (instrument) => {
      createInstrumentForm.reset(DEFAULT_CREATE_INSTRUMENT_FORM_VALUES);
      setActionSymbol(instrument.symbol);
      reportSymbolRef.current = instrument.symbol;
      setReportSymbol(instrument.symbol);
      setMessage("주식 이벤트를 적용했습니다. 신규 상장과 상장주관사 자동계정을 생성했습니다.");
      queryClient.removeQueries({ queryKey: stockKeys.adminSymbolFlowsRoot() });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBookInstruments() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBook(instrument.symbol) }),
        queryClient.invalidateQueries({ queryKey: stockKeys.autoMarketStatus() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatusRoot() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.adminFlowOverviewRoot() }),
      ]);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문장 종목 생성에 실패했습니다.");
    },
  });

  const submitInstrument = createInstrumentForm.handleSubmit((values) => {
    const parsed = createInstrumentSchema.safeParse(values);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "종목 입력값을 확인해 주세요.");
      return;
    }
    createInstrumentMutation.mutate({
      symbol: parsed.data.symbol,
      name: parsed.data.name,
      market: parsed.data.market || DEFAULT_CREATE_INSTRUMENT_FORM_VALUES.market,
      initialPrice: parsed.data.initialPrice,
      issuedShares: parsed.data.issuedShares,
      tickSize: parsed.data.tickSize,
      priceLimitRate: parsed.data.priceLimitRate,
      listingAutoAccount: {
        displayName: optionalText(parsed.data.listingAutoDisplayName ?? "") ?? undefined,
        enabled: parsed.data.listingAutoEnabled === "true",
        positionSide: parsed.data.listingAutoPositionSide,
        maxOrderQuantity: parsed.data.listingAutoMaxOrderQuantity,
        orderTtlSeconds: parsed.data.listingAutoOrderTtlSeconds,
        priceOffsetTicks: parsed.data.listingAutoPriceOffsetTicks,
      },
    });
  });

  const submitStockEvent = () => {
    if (actionType === "INITIAL_ISSUE") {
      void submitInstrument();
      return;
    }
    void submitCorporateAction();
  };

  const fillReportDraft = (report: InstrumentReport) => {
    if (report.eventType === "DELETE") {
      return;
    }
    setReportSymbol(report.symbol);
    setReportTitle(report.title ?? "");
    setReportSummary(report.summary ?? "");
    setReportScore(String(report.score ?? 5));
    setReportRiseReason(report.riseReason ?? "");
    setReportFallReason(report.fallReason ?? "");
  };

  const submitInstrumentReport = async (mode: "publish" | "update") => {
    if (savingReport) {
      return;
    }
    const reportPayload = buildInstrumentReportPayload({
      symbol: reportSymbol,
      title: reportTitle,
      summary: reportSummary,
      score: reportScore,
      riseReason: reportRiseReason,
      fallReason: reportFallReason,
    });
    if (!reportPayload.ok) {
      setMessage(reportPayload.message);
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, reportPayload.symbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    setSavingReport(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 평가 보고서를 저장할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = mode === "publish"
        ? await publishInstrumentReport(token, reportPayload.symbol, reportPayload.payload)
        : await updateInstrumentReport(token, reportPayload.symbol, reportPayload.payload);
      if (!result.ok) {
        setMessage(result.message ?? "평가 보고서 저장에 실패했습니다.");
        return;
      }
      setMessage(mode === "publish" ? "평가 보고서를 발행했습니다." : "평가 보고서를 수정 이벤트로 저장했습니다.");
      await queryClient.invalidateQueries({ queryKey: stockKeys.instrumentReports(reportPayload.symbol) });
    } finally {
      setSavingReport(false);
    }
  };

  const removeInstrumentReport = async () => {
    if (deletingReport) {
      return;
    }
    const normalizedSymbol = reportSymbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      setMessage("삭제할 보고서 종목을 선택해 주세요.");
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, normalizedSymbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    const confirmed = window.confirm(`${normalizedSymbol} 최신 평가 보고서를 삭제 이벤트로 처리할까요?`);
    if (!confirmed) {
      return;
    }
    setDeletingReport(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 평가 보고서를 삭제할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await deleteInstrumentReport(token, normalizedSymbol);
      if (!result.ok) {
        setMessage(result.message ?? "평가 보고서 삭제에 실패했습니다.");
        return;
      }
      setMessage("평가 보고서를 삭제 이벤트로 처리했습니다.");
      await queryClient.invalidateQueries({ queryKey: stockKeys.instrumentReports(normalizedSymbol) });
    } finally {
      setDeletingReport(false);
    }
  };

  const submitCorporateAction = async () => {
    if (applyingAction) {
      return;
    }
    const normalizedSymbol = actionSymbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      setMessage("액션을 적용할 종목을 선택해 주세요.");
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, normalizedSymbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    const corporateActionPayload = buildCorporateActionPayload({
      actionType,
      actionShares,
      actionIssuePrice,
      actionDividendAmount,
      exRightsDate,
      paymentDate,
      listingDate,
      delistingDate,
      splitFrom,
      splitTo,
      actionDescription,
    });
    if (!corporateActionPayload.ok) {
      setMessage(corporateActionPayload.message);
      return;
    }

    setApplyingAction(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 주식 이벤트를 적용할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await applyCorporateAction(token, normalizedSymbol, corporateActionPayload.payload);
      if (!result.ok) {
        setMessage(result.message ?? "주식 이벤트 적용에 실패했습니다.");
        return;
      }
      setActionShares("");
      setActionIssuePrice("");
      setActionDividendAmount("");
      setExRightsDate("");
      setPaymentDate("");
      setListingDate("");
      setDelistingDate("");
      setActionDescription("");
      setMessage("주식 이벤트를 적용했습니다.");
      queryClient.removeQueries({ queryKey: stockKeys.adminSymbolFlowsRoot() });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockKeys.corporateActions(normalizedSymbol) }),
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBookInstruments() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatusRoot() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.adminFlowOverviewRoot() }),
      ]);
    } finally {
      setApplyingAction(false);
    }
  };

  const changeOrderBookMarketStatus = async (targetSymbol: string, marketStatus: MarketSessionStatus) => {
    if (updatingStatusSymbol) {
      return;
    }
    setUpdatingStatusSymbol(targetSymbol);
    try {
      const token = await requireAdminToken("관리자 로그인 후 장 상태를 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateMarketStatus(token, "ORDER_BOOK", targetSymbol, {
        enabled: true,
        marketStatus,
      });
      if (!result.ok) {
        setMessage(result.message ?? "장 상태 변경에 실패했습니다.");
        return;
      }
      setMessage(marketStatus === "CLOSED"
        ? "장마감을 실행했습니다. 해당 종목의 미체결 주문 정리, 예약 해제, 보유 스냅샷, 기준가 롤오버가 처리되었습니다."
        : "장 상태를 변경했습니다.");
      reloadOrderBookMarketState();
    } finally {
      setUpdatingStatusSymbol(null);
    }
  };

  const selectAutoConfigDraft = (config: AutoMarketConfig) => {
    const draft = resolveAutoMarketConfigDraft(config);
    setEditingAutoConfigSymbol(draft.symbol);
    applyAutoMarketConfigDraft(draft);
  };

  const submitAutoConfig = async () => {
    if (updatingAutoConfig) {
      return;
    }
    const autoConfigPayload = buildAutoMarketConfigPayload({
      symbol: autoConfigSymbol,
      enabled: autoConfigEnabled,
      intensity: autoIntensity,
      maxOrderQuantity: autoMaxOrderQuantity,
      orderTtlSeconds: autoOrderTtlSeconds,
    });
    if (!autoConfigPayload.ok) {
      setMessage(autoConfigPayload.message);
      return;
    }
    setUpdatingAutoConfig(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동장 설정을 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateAutoMarketConfig(token, autoConfigPayload.symbol, autoConfigPayload.payload);
      if (!result.ok) {
        setMessage(result.message ?? "자동장 설정 변경에 실패했습니다.");
        return;
      }
      setMessage("자동장 알고리즘 설정을 변경했습니다.");
      setEditingAutoConfigSymbol(null);
      reloadAutoParticipantState();
    } finally {
      setUpdatingAutoConfig(false);
    }
  };

  const toggleAutoConfigEnabled = async (config: AutoMarketConfig) => {
    if (togglingAutoConfigSymbol) {
      return;
    }
    const nextEnabled = !config.enabled;
    setTogglingAutoConfigSymbol(config.symbol);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동장 가동 상태를 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateAutoMarketConfig(token, config.symbol, {
        enabled: nextEnabled,
        intensity: config.intensity,
        maxOrderQuantity: config.maxOrderQuantity,
        orderTtlSeconds: config.orderTtlSeconds,
      });
      if (!result.ok) {
        setMessage(result.message ?? "자동장 가동 상태 변경에 실패했습니다.");
        return;
      }
      if (autoConfigSymbol === config.symbol) {
        setAutoConfigEnabled(nextEnabled);
      }
      setMessage(nextEnabled ? "종목 자동 주문 생성을 가동했습니다." : "종목 자동 주문 생성을 정지했습니다.");
      reloadAutoParticipantState();
    } finally {
      setTogglingAutoConfigSymbol(null);
    }
  };

  const selectListingAutoAccountDraft = (config: ListingAutoAccount) => {
    const draft = resolveListingAutoAccountConfigDraft(config);
    setEditingListingAutoSymbol(draft.symbol);
    applyListingAutoAccountConfigDraft(draft);
  };

  const submitListingAutoAccountConfig = async () => {
    if (updatingListingAutoAccount) {
      return;
    }
    const listingAutoAccountPayload = buildListingAutoAccountConfigPayload({
      symbol: listingAutoSymbol,
      displayName: listingAutoDisplayName,
      enabled: listingAutoEnabled,
      positionSide: listingAutoPositionSide,
      maxOrderQuantity: listingAutoMaxOrderQuantity,
      orderTtlSeconds: listingAutoOrderTtlSeconds,
      priceOffsetTicks: listingAutoPriceOffsetTicks,
    });
    if (!listingAutoAccountPayload.ok) {
      setMessage(listingAutoAccountPayload.message);
      return;
    }
    setUpdatingListingAutoAccount(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 상장주관사 자동계정을 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateListingAutoAccountConfig(
        token,
        listingAutoAccountPayload.symbol,
        listingAutoAccountPayload.payload,
      );
      if (!result.ok) {
        setMessage(result.message ?? "상장주관사 자동계정 설정 변경에 실패했습니다.");
        return;
      }
      setMessage("상장주관사 자동계정 설정을 변경했습니다.");
      setEditingListingAutoSymbol(null);
      reloadAutoParticipantState();
    } finally {
      setUpdatingListingAutoAccount(false);
    }
  };

  const setBatchJobRuntime = async (jobName: string, runtimeEnabled: boolean) => {
    if (updatingBatchJobName) {
      return;
    }
    setUpdatingBatchJobName(jobName);
    try {
      const token = await requireAdminToken("관리자 로그인 후 배치 자동 실행 상태를 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateBatchJobRuntimeControl(token, jobName, { runtimeEnabled });
      if (!result.ok || !result.data) {
        setMessage(result.message ?? "배치 자동 실행 상태 변경에 실패했습니다.");
        return;
      }
      const nextControl = result.data;
      queryClient.setQueryData<BatchJobRuntimeStatus[]>(
        stockKeys.batchJobRuntimeControls(),
        (controls) => controls?.map((control) => (control.jobName === jobName ? nextControl : control)) ?? [nextControl],
      );
      void queryClient.invalidateQueries({ queryKey: stockKeys.batchJobRuntimeControls() });
      setMessage(formatRuntimeUpdateMessage(BATCH_JOB_RUNTIME_LABELS[jobName]?.label ?? "배치 자동 실행", runtimeEnabled, nextControl.effectiveEnabled));
    } finally {
      setUpdatingBatchJobName(null);
    }
  };

  const runAutoParticipantCashFlowNow = async () => {
    if (runningCashFlow) {
      return;
    }
    setRunningCashFlow(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 월급 지급 배치를 실행할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await runAutoParticipantCashFlow(token);
      if (!result.ok || !result.data) {
        setMessage(result.message ?? "월급 지급 배치 실행에 실패했습니다.");
        return;
      }
      setLastCashFlowRun(result.data);
      setMessage(`월급 지급 배치를 실행했습니다. 처리 ${result.data.processedCount.toLocaleString("ko-KR")}건`);
      reloadAdminCashFlowState();
      void queryClient.invalidateQueries({ queryKey: stockKeys.batchJobRuntimeControls() });
      reloadAutoParticipantState();
    } finally {
      setRunningCashFlow(false);
    }
  };

  const applyAutoStrategyDraft = (draft: AutoParticipantStrategyDraftValues) => {
    setEditingStrategyKey(draft.editingKey);
    setStrategyUserKey(draft.userKey);
    setStrategySymbol(draft.symbol);
    setStrategyEnabled(draft.enabled);
    setStrategyIntensity(draft.intensity);
  };

  const selectAutoParticipantDraft = (participant: AutoParticipant) => {
    autoParticipantStrategySeedRef.current = null;
    const draft = resolveAutoParticipantSelectionDraft({
      participant,
      participantSymbolConfigs: status?.participantSymbolConfigs ?? [],
      autoMarketConfigs: status?.configs ?? [],
      defaultRecurringCashIntervalUnit: DEFAULT_RECURRING_CASH_INTERVAL_UNIT,
      defaultStrategyIntensity: DEFAULT_STRATEGY_INTENSITY,
    });
    setEditingAutoParticipantUserKey(draft.participant.userKey);
    setAutoParticipantUserKey(draft.participant.userKey);
    setAutoParticipantDisplayName(draft.participant.displayName);
    setAutoParticipantEnabled(draft.participant.enabled);
    setAutoParticipantProfileType(draft.participant.profileType);
    setAutoParticipantRecurringCashAmount(draft.participant.recurringCashAmount);
    setAutoParticipantRecurringCashIntervalValue(draft.participant.recurringCashIntervalValue);
    setAutoParticipantRecurringCashIntervalUnit(draft.participant.recurringCashIntervalUnit);
    setCashAdjustmentAmount(draft.participant.cashAdjustmentAmount);
    applyAutoStrategyDraft(draft.strategy);
  };

  const resetAutoParticipantDraft = () => {
    autoParticipantStrategySeedRef.current = null;
    setEditingAutoParticipantUserKey(null);
    setAutoParticipantUserKey("");
    setAutoParticipantDisplayName("");
    setAutoParticipantEnabled(true);
    setAutoParticipantProfileType(DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE);
    setAutoParticipantRecurringCashAmount("");
    setAutoParticipantRecurringCashIntervalValue("");
    setAutoParticipantRecurringCashIntervalUnit(DEFAULT_RECURRING_CASH_INTERVAL_UNIT);
    setCashAdjustmentAmount("");
    setEditingStrategyKey(null);
    setStrategyUserKey("");
    setStrategySymbol("");
    setStrategyEnabled(true);
    setStrategyIntensity(DEFAULT_STRATEGY_INTENSITY);
  };

  const selectAutoStrategyDraft = (config: AutoParticipantSymbolConfig) => {
    applyAutoStrategyDraft(toStrategyDraft(config));
  };

  const selectParticipantStrategySymbolDraft = (participantUserKey: string, symbol: string) => {
    applyAutoStrategyDraft(resolveParticipantStrategySymbolDraft({
      userKey: participantUserKey,
      symbol,
      participantSymbolConfigs: status?.participantSymbolConfigs ?? [],
      autoMarketConfigs: status?.configs ?? [],
      defaultStrategyIntensity: DEFAULT_STRATEGY_INTENSITY,
    }));
  };

  const submitAutoParticipant = async () => {
    if (savingAutoParticipant) {
      return;
    }
    const participantDraft = buildAutoParticipantPayload({
      userKey: editingAutoParticipantUserKey ?? autoParticipantUserKey,
      displayName: autoParticipantDisplayName,
      enabled: autoParticipantEnabled,
      profileType: autoParticipantProfileType,
      recurringCashAmount: autoParticipantRecurringCashAmount,
      recurringCashIntervalValue: autoParticipantRecurringCashIntervalValue,
      recurringCashIntervalUnit: autoParticipantRecurringCashIntervalUnit,
    });
    if (!participantDraft.ok) {
      setMessage(participantDraft.message);
      return;
    }
    setSavingAutoParticipant(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동 참여자를 저장할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await upsertAutoParticipant(token, participantDraft.userKey, participantDraft.payload);
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 저장에 실패했습니다.");
        return;
      }
      setMessage("자동 참여자를 저장했습니다.");
      if (editingAutoParticipantUserKey) {
        resetAutoParticipantDraft();
      }
      reloadAutoParticipantState();
    } finally {
      setSavingAutoParticipant(false);
    }
  };

  const generateAutoParticipants = async () => {
    if (generatingAutoParticipants || savingAutoParticipant) {
      return;
    }
    const generateDraft = buildAutoParticipantGenerateRequests({
      count: autoGenerateCount,
      keyPrefix: autoGenerateKeyPrefix,
      displayPrefix: autoGenerateDisplayPrefix,
      profileMode: autoGenerateProfileMode,
      profileType: autoGenerateProfileType,
      existingUserKeys: resolveParticipantUserKeys(status?.participants ?? []),
      fallbackKeyPrefix: DEFAULT_AUTO_GENERATE_KEY_PREFIX,
      fallbackDisplayPrefix: DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX,
      fallbackProfileType: DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
    });
    if (!generateDraft.ok) {
      setMessage(generateDraft.message);
      return;
    }

    setGeneratingAutoParticipants(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동 참여자를 생성할 수 있습니다.");
      if (!token) {
        return;
      }

      let created = 0;
      for (let index = 0; index < generateDraft.requests.length; index += ADMIN_AUTO_GENERATE_CONCURRENCY) {
        const chunk = generateDraft.requests.slice(index, index + ADMIN_AUTO_GENERATE_CONCURRENCY);
        const results = await Promise.all(chunk.map((request) => upsertAutoParticipant(token, request.userKey, {
          displayName: request.displayName,
          enabled: true,
          profileType: request.profileType,
          recurringCashAmount: null,
          recurringCashIntervalValue: null,
          recurringCashIntervalUnit: null,
        })));
        const failedIndex = results.findIndex((result) => !result.ok);
        if (failedIndex >= 0) {
          const failedRequest = chunk[failedIndex];
          const failedResult = results[failedIndex];
          setMessage(failedResult.message ?? `${failedRequest.userKey} 자동 참여자 생성에 실패했습니다.`);
          return;
        }
        created += chunk.length;
      }
      resetAutoParticipantDraft();
      setMessage(generateDraft.profileMode === "SINGLE"
        ? `자동 참여자 ${created.toLocaleString("ko-KR")}명을 ${formatAutoParticipantProfile(generateDraft.profileType)} 프로필로 생성했습니다.`
        : `자동 참여자 ${created.toLocaleString("ko-KR")}명을 생성했습니다. 프로필은 순서대로 분산 적용했습니다.`);
      reloadAutoParticipantState();
    } finally {
      setGeneratingAutoParticipants(false);
    }
  };

  const adjustAutoParticipantCashBalance = async (adjustmentType: "DEPOSIT" | "WITHDRAW") => {
    if (adjustingCashType) {
      return;
    }
    const cashAdjustment = buildCashAdjustmentPayload({
      userKey: editingAutoParticipantUserKey ?? autoParticipantUserKey,
      amount: cashAdjustmentAmount,
      adjustmentType,
      invalidMessage: "입금/회수할 자동 참여자와 금액을 확인해 주세요.",
    });
    if (!cashAdjustment.ok) {
      setMessage(cashAdjustment.message);
      return;
    }
    setAdjustingCashType(adjustmentType);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동 참여자 현금을 조정할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await adjustAutoParticipantCash(token, cashAdjustment.userKey, cashAdjustment.payload);
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 현금 조정에 실패했습니다.");
        return;
      }
      setCashAdjustmentAmount("");
      setMessage(adjustmentType === "DEPOSIT" ? "자동 참여자 계좌에 입금했습니다." : "자동 참여자 계좌에서 회수했습니다.");
      reloadAdminCashFlowState();
      reloadAutoParticipantState();
    } finally {
      setAdjustingCashType(null);
    }
  };

  const adjustUserCashBalance = async (adjustmentType: "DEPOSIT" | "WITHDRAW") => {
    if (adjustingUserCashType) {
      return;
    }
    const cashAdjustment = buildCashAdjustmentPayload({
      userKey: userCashAdjustmentUserKey,
      amount: userCashAdjustmentAmount,
      adjustmentType,
      invalidMessage: "입금/회수할 실제 유저 식별키와 금액을 확인해 주세요.",
    });
    if (!cashAdjustment.ok) {
      setMessage(cashAdjustment.message);
      return;
    }
    setAdjustingUserCashType(adjustmentType);
    try {
      const token = await requireAdminToken("관리자 로그인 후 실제 유저 계좌 현금을 조정할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await adjustUserAccountCash(token, cashAdjustment.userKey, cashAdjustment.payload);
      if (!result.ok) {
        setMessage(result.message ?? "실제 유저 계좌 현금 조정에 실패했습니다.");
        return;
      }
      setUserCashAdjustmentAmount("");
      setMessage(adjustmentType === "DEPOSIT" ? "실제 유저 계좌에 입금했습니다." : "실제 유저 계좌에서 회수했습니다.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockKeys.account() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.portfolio() }),
      ]);
      reloadAdminCashFlowState();
      if (userFundFlowUserKey === cashAdjustment.userKey) {
        await queryClient.invalidateQueries({ queryKey: stockKeys.adminUserFundFlow(cashAdjustment.userKey) });
        await loadUserFundFlow(false);
      }
    } finally {
      setAdjustingUserCashType(null);
    }
  };

  const loadUserFundFlow = async (showSuccessMessage = true) => {
    if (userFundFlowQuery.isFetching) {
      return;
    }
    const normalizedUserKey = userCashAdjustmentUserKey.trim();
    if (!normalizedUserKey) {
      if (showSuccessMessage) {
        setMessage("자금 흐름을 조회할 유저 식별키를 입력해 주세요.");
      }
      return;
    }
    try {
      const token = await requireAdminToken("관리자 로그인 후 자금 흐름을 조회할 수 있습니다.");
      if (!token) {
        return;
      }
      setUserFundFlowUserKey(normalizedUserKey);
      await queryClient.fetchQuery(adminUserFundFlowQueryOptions(token, normalizedUserKey, {
        enabled: true,
      }));
      if (showSuccessMessage) {
        setMessage(`${normalizedUserKey} 자금 흐름을 조회했습니다.`);
      }
    } catch (error) {
      setUserFundFlowUserKey(null);
      setMessage(error instanceof Error ? error.message : "자금 흐름 조회에 실패했습니다.");
    }
  };

  const toggleAutoParticipantEnabled = async (participant: AutoParticipant) => {
    if (togglingAutoParticipantUserKey) {
      return;
    }
    const nextEnabled = !participant.enabled;
    setTogglingAutoParticipantUserKey(participant.userKey);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동 참여자 상태를 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await upsertAutoParticipant(token, participant.userKey, {
        displayName: participant.displayName,
        enabled: nextEnabled,
        profileType: participant.profileType,
        recurringCashAmount: participant.recurringCashAmount ?? null,
        recurringCashIntervalValue: participant.recurringCashIntervalValue ?? null,
        recurringCashIntervalUnit: participant.recurringCashIntervalUnit ?? null,
      });
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 상태 변경에 실패했습니다.");
        return;
      }
      if (editingAutoParticipantUserKey === participant.userKey) {
        setAutoParticipantEnabled(nextEnabled);
      }
      setMessage(nextEnabled ? "자동 참여자를 가동했습니다." : "자동 참여자를 정지했습니다.");
      reloadAutoParticipantState();
    } finally {
      setTogglingAutoParticipantUserKey(null);
    }
  };

  const withdrawAutoParticipantRow = async (participant: AutoParticipant) => {
    if (withdrawingAutoParticipantUserKey) {
      return;
    }
    const confirmed = window.confirm(`${participant.displayName} 자동 참여자를 탈퇴 처리할까요? 미체결 자동 주문은 취소됩니다.`);
    if (!confirmed) {
      return;
    }
    setWithdrawingAutoParticipantUserKey(participant.userKey);
    try {
      const token = await requireAdminToken("관리자 로그인 후 자동 참여자를 탈퇴 처리할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await withdrawAutoParticipant(token, participant.userKey);
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 탈퇴 처리에 실패했습니다.");
        return;
      }
      if (editingAutoParticipantUserKey === participant.userKey) {
        resetAutoParticipantDraft();
      }
      setMessage("자동 참여자를 탈퇴 처리했습니다.");
      reloadAutoParticipantState();
    } finally {
      setWithdrawingAutoParticipantUserKey(null);
    }
  };

  const submitAutoStrategy = async () => {
    if (savingStrategy) {
      return;
    }
    const strategyPayload = buildAutoParticipantStrategyPayload({
      editingKey: editingStrategyKey,
      userKey: strategyUserKey,
      symbol: strategySymbol,
      enabled: strategyEnabled,
      intensity: strategyIntensity,
    });
    if (!strategyPayload.ok) {
      setMessage(strategyPayload.message);
      return;
    }
    setSavingStrategy(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 참여자 종목별 가격 방향/강도를 저장할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateAutoParticipantSymbolConfig(token, strategyPayload.userKey, strategyPayload.symbol, strategyPayload.payload);
      if (!result.ok) {
        setMessage(result.message ?? "참여자 종목별 가격 방향/강도 저장에 실패했습니다.");
        return;
      }
      setMessage("참여자 종목별 가격 방향/강도를 저장했습니다.");
      setEditingStrategyKey(null);
      reloadAutoParticipantState();
    } finally {
      setSavingStrategy(false);
    }
  };

  const selectProfileConfigDraft = (config: AutoParticipantProfileConfig) => {
    const draft = resolveProfileConfigDraft(config, DEFAULT_RECURRING_CASH_INTERVAL_UNIT);
    applyProfileConfigDraft(draft);
  };

  const submitProfileConfig = async () => {
    if (savingProfileConfig || editingProfileType === null) {
      return;
    }
    const profileConfigPayload = buildProfileConfigPayload({
      profileType: editingProfileType,
      newsWeight: profileNewsWeight,
      momentumWeight: profileMomentumWeight,
      contrarianWeight: profileContrarianWeight,
      lossAversionWeight: profileLossAversionWeight,
      herdingWeight: profileHerdingWeight,
      marketMakingWeight: profileMarketMakingWeight,
      overconfidenceWeight: profileOverconfidenceWeight,
      noiseWeight: profileNoiseWeight,
      panicSellWeight: profilePanicSellWeight,
      dipBuyWeight: profileDipBuyWeight,
      orderMultiplier: profileOrderMultiplier,
      aggressionMultiplier: profileAggressionMultiplier,
      orderTtlMultiplier: profileOrderTtlMultiplier,
      quantityMultiplier: profileQuantityMultiplier,
      holdingPatienceWeight: profileHoldingPatienceWeight,
      deepLossHoldWeight: profileDeepLossHoldWeight,
      profitTakingWeight: profileProfitTakingWeight,
      recurringDepositAmount: profileRecurringDepositAmount,
      recurringDepositIntervalValue: profileRecurringDepositIntervalValue,
      recurringDepositIntervalUnit: profileRecurringDepositIntervalUnit,
    });
    if (!profileConfigPayload.ok) {
      setMessage(profileConfigPayload.message);
      return;
    }
    setSavingProfileConfig(true);
    try {
      const token = await requireAdminToken("관리자 로그인 후 프로필 행동 설정을 저장할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateAutoParticipantProfileConfig(token, editingProfileType, profileConfigPayload.payload);
      if (!result.ok) {
        setMessage(result.message ?? "프로필 행동 설정 저장에 실패했습니다.");
        return;
      }
      setMessage("프로필 행동 설정을 저장했습니다.");
      reloadAutoParticipantState();
    } finally {
      setSavingProfileConfig(false);
    }
  };

  const toggleAutoStrategyEnabled = async (config: AutoParticipantSymbolConfig) => {
    const key = `${config.userKey}:${config.symbol}`;
    if (togglingStrategyKey) {
      return;
    }
    const nextEnabled = !config.enabled;
    setTogglingStrategyKey(key);
    try {
      const token = await requireAdminToken("관리자 로그인 후 참여자 종목별 가격 방향/강도 상태를 변경할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await updateAutoParticipantSymbolConfig(token, config.userKey, config.symbol, {
        enabled: nextEnabled,
        intensity: config.intensity,
      });
      if (!result.ok) {
        setMessage(result.message ?? "참여자 종목별 가격 방향/강도 상태 변경에 실패했습니다.");
        return;
      }
      if (strategyUserKey === config.userKey && strategySymbol === config.symbol) {
        setStrategyEnabled(nextEnabled);
      }
      setMessage(nextEnabled ? "참여자 종목별 가격 방향/강도를 가동했습니다." : "참여자 종목별 가격 방향/강도를 정지했습니다.");
      reloadAutoParticipantState();
    } finally {
      setTogglingStrategyKey(null);
    }
  };

  const orderBookConfigs = orderBookMarketConfigQuery.data?.configs ?? EMPTY_ORDER_BOOK_CONFIGS;
  const autoMarketConfigs = status?.configs ?? EMPTY_AUTO_MARKET_CONFIGS;
  const autoParticipants = status?.participants ?? EMPTY_AUTO_PARTICIPANTS;
  const autoParticipantSymbolConfigs = status?.participantSymbolConfigs ?? EMPTY_AUTO_PARTICIPANT_SYMBOL_CONFIGS;
  const profileConfigs = status?.participantProfileConfigs ?? EMPTY_AUTO_PARTICIPANT_PROFILE_CONFIGS;
  const listingAutoAccounts = status?.listingAutoAccounts ?? EMPTY_LISTING_AUTO_ACCOUNTS;
  const orderBookConfigBySymbol = useMemo<Map<string, OrderBookMarketStatus["configs"][number]>>(
    () => buildSymbolMap(orderBookConfigs),
    [orderBookConfigs],
  );
  const isEditingAutoParticipant = editingAutoParticipantUserKey !== null;
  const selectedListingAutoAccount = useMemo(
    () => resolveSelectedListingAutoAccount(listingAutoAccounts, listingAutoSymbol),
    [listingAutoAccounts, listingAutoSymbol],
  );
  const autoMarketConfigDraft: AutoMarketConfigDraft = {
    symbol: autoConfigSymbol,
    enabled: autoConfigEnabled,
    intensity: autoIntensity,
    maxOrderQuantity: autoMaxOrderQuantity,
    orderTtlSeconds: autoOrderTtlSeconds,
  };
  const autoMarketConfigDraftSetters: AutoMarketConfigDraftSetters = {
    setSymbol: setAutoConfigSymbol,
    setEnabled: setAutoConfigEnabled,
    setIntensity: setAutoIntensity,
    setMaxOrderQuantity: setAutoMaxOrderQuantity,
    setOrderTtlSeconds: setAutoOrderTtlSeconds,
    setEditingSymbol: setEditingAutoConfigSymbol,
  };
  const listingAutoAccountDraft: ListingAutoAccountDraft = {
    symbol: listingAutoSymbol,
    displayName: listingAutoDisplayName,
    enabled: listingAutoEnabled,
    positionSide: listingAutoPositionSide,
    maxOrderQuantity: listingAutoMaxOrderQuantity,
    orderTtlSeconds: listingAutoOrderTtlSeconds,
    priceOffsetTicks: listingAutoPriceOffsetTicks,
  };
  const listingAutoAccountDraftSetters: ListingAutoAccountDraftSetters = {
    setSymbol: setListingAutoSymbol,
    setDisplayName: setListingAutoDisplayName,
    setEnabled: setListingAutoEnabled,
    setPositionSide: setListingAutoPositionSide,
    setMaxOrderQuantity: setListingAutoMaxOrderQuantity,
    setOrderTtlSeconds: setListingAutoOrderTtlSeconds,
    setPriceOffsetTicks: setListingAutoPriceOffsetTicks,
    setEditingSymbol: setEditingListingAutoSymbol,
  };
  const profileConfigByType = useMemo(
    () => buildProfileConfigMap(profileConfigs),
    [profileConfigs],
  );
  const selectedAutoParticipant = useMemo(
    () => resolveSelectedAutoParticipant(autoParticipants, editingAutoParticipantUserKey),
    [autoParticipants, editingAutoParticipantUserKey],
  );
  const selectedAutoParticipantSymbolConfigs = useMemo(
    () => resolveSelectedAutoParticipantSymbolConfigs(autoParticipantSymbolConfigs, selectedAutoParticipant),
    [autoParticipantSymbolConfigs, selectedAutoParticipant],
  );
  const selectedParticipantStrategyKey = resolveParticipantStrategyKey(selectedAutoParticipant, strategySymbol);
  useEffect(() => {
    if (editingAutoParticipantUserKey === null || selectedAutoParticipantSymbolConfigs.length === 0) {
      return;
    }
    if (autoParticipantStrategySeedRef.current === editingAutoParticipantUserKey) {
      return;
    }
    const firstStrategy = selectedAutoParticipantSymbolConfigs[0];
    autoParticipantStrategySeedRef.current = editingAutoParticipantUserKey;
    setEditingStrategyKey(`${firstStrategy.userKey}:${firstStrategy.symbol}`);
    setStrategyUserKey(firstStrategy.userKey);
    setStrategySymbol(firstStrategy.symbol);
    setStrategyEnabled(firstStrategy.enabled);
    setStrategyIntensity(String(firstStrategy.intensity));
  }, [editingAutoParticipantUserKey, selectedAutoParticipantSymbolConfigs]);

  const shouldComputeProfileOverviewRows = activeAdminSection === "profile-overview";
  const shouldComputeParticipantRows = activeAdminSection === "participants";
  const autoMarketSummary = autoMarketSummaryQuery.data ?? null;
  const orderBookMarketSummary = orderBookMarketSummaryQuery.data ?? null;
  const shouldComputeSalaryRows = activeAdminSection === "salary";
  const salaryEligibilityRows = useMemo(() => (
    shouldComputeSalaryRows
      ? resolveSalaryEligibilityRows(autoParticipants, profileConfigByType, new Map())
      : []
  ), [autoParticipants, profileConfigByType, shouldComputeSalaryRows]);
  const salaryEligibilitySummary = useMemo(
    () => summarizeSalaryEligibilityRows(salaryEligibilityRows),
    [salaryEligibilityRows],
  );
  const salaryPagination = useMemo(
    () => resolvePaginationWindow(salaryEligibilityRows.length, salaryPage, ADMIN_SALARY_PAGE_SIZE),
    [salaryEligibilityRows.length, salaryPage],
  );
  const visibleSalaryRows = useMemo(
    () => resolvePaginatedItems(salaryEligibilityRows, salaryPagination, ADMIN_SALARY_PAGE_SIZE),
    [salaryEligibilityRows, salaryPagination],
  );
  const participantProfileOverviewSummaries = useMemo(() => (
    shouldComputeProfileOverviewRows
      ? resolveParticipantProfileOverviewSummaries(autoParticipantProfileOverviews)
      : []
  ), [autoParticipantProfileOverviews, shouldComputeProfileOverviewRows]);
  const selectedProfileConfig = useMemo(
    () => resolveSelectedProfileConfig(profileConfigs, editingProfileType),
    [editingProfileType, profileConfigs],
  );
  const profileConfigDraft: ProfileConfigDraft = {
    newsWeight: profileNewsWeight,
    momentumWeight: profileMomentumWeight,
    contrarianWeight: profileContrarianWeight,
    lossAversionWeight: profileLossAversionWeight,
    herdingWeight: profileHerdingWeight,
    marketMakingWeight: profileMarketMakingWeight,
    overconfidenceWeight: profileOverconfidenceWeight,
    noiseWeight: profileNoiseWeight,
    panicSellWeight: profilePanicSellWeight,
    dipBuyWeight: profileDipBuyWeight,
    orderMultiplier: profileOrderMultiplier,
    aggressionMultiplier: profileAggressionMultiplier,
    orderTtlMultiplier: profileOrderTtlMultiplier,
    quantityMultiplier: profileQuantityMultiplier,
    holdingPatienceWeight: profileHoldingPatienceWeight,
    deepLossHoldWeight: profileDeepLossHoldWeight,
    profitTakingWeight: profileProfitTakingWeight,
    recurringDepositAmount: profileRecurringDepositAmount,
    recurringDepositIntervalValue: profileRecurringDepositIntervalValue,
    recurringDepositIntervalUnit: profileRecurringDepositIntervalUnit,
  };
  const profileConfigDraftSetters: ProfileConfigDraftSetters = {
    setNewsWeight: setProfileNewsWeight,
    setMomentumWeight: setProfileMomentumWeight,
    setContrarianWeight: setProfileContrarianWeight,
    setLossAversionWeight: setProfileLossAversionWeight,
    setHerdingWeight: setProfileHerdingWeight,
    setMarketMakingWeight: setProfileMarketMakingWeight,
    setOverconfidenceWeight: setProfileOverconfidenceWeight,
    setNoiseWeight: setProfileNoiseWeight,
    setPanicSellWeight: setProfilePanicSellWeight,
    setDipBuyWeight: setProfileDipBuyWeight,
    setOrderMultiplier: setProfileOrderMultiplier,
    setAggressionMultiplier: setProfileAggressionMultiplier,
    setOrderTtlMultiplier: setProfileOrderTtlMultiplier,
    setQuantityMultiplier: setProfileQuantityMultiplier,
    setHoldingPatienceWeight: setProfileHoldingPatienceWeight,
    setDeepLossHoldWeight: setProfileDeepLossHoldWeight,
    setProfitTakingWeight: setProfileProfitTakingWeight,
    setRecurringDepositAmount: setProfileRecurringDepositAmount,
    setRecurringDepositIntervalValue: setProfileRecurringDepositIntervalValue,
    setRecurringDepositIntervalUnit: setProfileRecurringDepositIntervalUnit,
  };
  const isAutoParticipantRecurringCashDisabled = autoParticipantProfileType === "DIVIDEND_REINVESTOR";
  const autoParticipantEditDraft: AutoParticipantEditDraft = {
    displayName: autoParticipantDisplayName,
    profileType: autoParticipantProfileType,
    enabled: autoParticipantEnabled,
    recurringCashAmount: autoParticipantRecurringCashAmount,
    recurringCashIntervalValue: autoParticipantRecurringCashIntervalValue,
    recurringCashIntervalUnit: autoParticipantRecurringCashIntervalUnit,
    recurringCashDisabled: isAutoParticipantRecurringCashDisabled,
    cashAdjustmentAmount,
  };
  const autoParticipantEditDraftSetters: AutoParticipantEditDraftSetters = {
    setDisplayName: setAutoParticipantDisplayName,
    setProfileType: setAutoParticipantProfileType,
    setEnabled: setAutoParticipantEnabled,
    setRecurringCashAmount: setAutoParticipantRecurringCashAmount,
    setRecurringCashIntervalValue: setAutoParticipantRecurringCashIntervalValue,
    setRecurringCashIntervalUnit: setAutoParticipantRecurringCashIntervalUnit,
    setCashAdjustmentAmount,
  };
  const instrumentReportDraft: InstrumentReportDraft = {
    symbol: reportSymbol,
    title: reportTitle,
    score: reportScore,
    summary: reportSummary,
    riseReason: reportRiseReason,
    fallReason: reportFallReason,
  };
  const instrumentReportDraftSetters: InstrumentReportDraftSetters = {
    setSymbol: setReportSymbol,
    setTitle: setReportTitle,
    setScore: setReportScore,
    setSummary: setReportSummary,
    setRiseReason: setReportRiseReason,
    setFallReason: setReportFallReason,
  };
  const stockEventDraft: StockEventDraft = {
    actionType,
    actionSymbol,
    actionShares,
    actionIssuePrice,
    actionDividendAmount,
    exRightsDate,
    paymentDate,
    listingDate,
    delistingDate,
    splitFrom,
    splitTo,
    actionDescription,
  };
  const stockEventDraftSetters: StockEventDraftSetters = {
    setActionType,
    setActionSymbol,
    setActionShares,
    setActionIssuePrice,
    setActionDividendAmount,
    setExRightsDate,
    setPaymentDate,
    setListingDate,
    setDelistingDate,
    setSplitFrom,
    setSplitTo,
    setActionDescription,
  };
  const openOrderBookConfigCount = resolveOpenOrderBookConfigCount({
    summary: orderBookMarketSummary,
    fallback: orderBookMarketConfigQuery.data ?? null,
    configs: orderBookConfigs,
  });
  const orderBookInstrumentCount = resolveOrderBookInstrumentCount({
    summary: orderBookMarketSummary,
    fallback: orderBookMarketConfigQuery.data ?? null,
    instruments,
  });
  const filteredParticipants = useMemo(() => (
    shouldComputeParticipantRows
      ? filterAutoParticipants(autoParticipants, {
        profileType: participantProfileFilter,
        search: participantSearch,
        status: participantStatusFilter,
      })
      : []
  ), [autoParticipants, participantProfileFilter, participantSearch, participantStatusFilter, shouldComputeParticipantRows]);
  const participantPagination = useMemo(
    () => resolvePaginationWindow(filteredParticipants.length, participantPage, ADMIN_PARTICIPANT_PAGE_SIZE),
    [filteredParticipants.length, participantPage],
  );
  const visibleParticipants = useMemo(
    () => resolvePaginatedItems(filteredParticipants, participantPagination, ADMIN_PARTICIPANT_PAGE_SIZE),
    [filteredParticipants, participantPagination],
  );
  const visibleParticipantUserKeys = useMemo(() => resolveParticipantUserKeys(visibleParticipants), [visibleParticipants]);
  const visibleParticipantOverviewsQuery = useQuery(autoParticipantOverviewsQueryOptions(accessToken, {
    enabled: adminStatus === "allowed" && shouldComputeParticipantRows && visibleParticipantUserKeys.length > 0,
    includeHoldings: true,
    refetchIntervalMs: ADMIN_PARTICIPANT_DETAIL_REFETCH_MS,
    userKeys: visibleParticipantUserKeys,
  }));
  const visibleParticipantOverviews = visibleParticipantOverviewsQuery.data ?? EMPTY_AUTO_PARTICIPANT_OVERVIEWS;
  const visibleAutoParticipantOverviewByUserKey = useMemo(
    () => buildAutoParticipantOverviewMap(visibleParticipantOverviews),
    [visibleParticipantOverviews],
  );
  const selectProfileConfigByType = (profileType: string) => {
    const config = resolveSelectedProfileConfig(profileConfigs, profileType);
    if (config) {
      selectProfileConfigDraft(config);
      return;
    }
    setEditingProfileType(null);
  };

  if (adminStatus === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101418] px-4 text-white">
        <p className="text-sm font-bold text-[#b8c2cc]">관리자 권한을 확인하고 있습니다.</p>
      </main>
    );
  }

  if (adminStatus === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101418] px-4 text-white">
        <div className="max-w-sm text-center">
          <p className="text-sm font-bold text-[#ffb4a8]">관리자 권한이 필요합니다.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-md bg-white px-3 py-2 text-sm font-black text-[#101418]">
            로그인
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101418] text-white">
      <TradingTopBar
        active="order-book"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/supply-demand/admin/accounts/participants" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
              참여자 현황
            </Link>
            <Link href="/supply-demand" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
              자동장
            </Link>
          </div>
        )}
      />
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold text-[#64a8ff]">AUTO MARKET CONFIG</p>
            <h1 className="mt-1 text-2xl font-black">자동장 설정 현황</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {message ? <p className="rounded-md bg-[#3a1f1b] px-3 py-2 text-sm font-bold text-[#ffb4a8]">{message}</p> : null}

        <AdminTabNav tabs={ADMIN_TABS} activeTab={activeAdminTab} />
        {activeAdminTab === "accounts" ? <AdminSubTabNav tabs={ACCOUNT_SUB_TABS} activeSection={activeAdminSection} /> : null}
        {activeAdminTab === "automation" ? <AdminSubTabNav tabs={AUTOMATION_SUB_TABS} activeSection={activeAdminSection} /> : null}

        {activeAdminSection === "market" ? (
          <AdminMarketSummaryPanel
            orderBookMarketSummary={orderBookMarketSummary}
            autoMarketSummary={autoMarketSummary}
            orderBookInstrumentCount={orderBookInstrumentCount}
            openOrderBookConfigCount={openOrderBookConfigCount}
          />
        ) : null}

        {activeAdminSection === "market" ? (
          <AdminFlowOverviewPanel
            overview={adminFlowOverview}
            fundFlow={adminFundFlowSummaryQuery.data ?? adminFlowOverview?.fundFlow ?? null}
            loadingFundFlow={adminFundFlowSummaryQuery.isFetching}
            fundFlowError={adminFundFlowSummaryQuery.isError}
            symbolFlowList={adminSymbolFlowList ?? {
              totalCount: adminFlowOverview?.symbolFlowTotalCount ?? 0,
              symbolFlows: adminFlowOverview?.symbolFlows ?? [],
            }}
            loadingSymbolFlows={adminFlowOverviewQuery.isFetching && adminSymbolFlowList === null}
            loadingAllSymbolFlows={adminSymbolFlowsQuery.isFetching}
            onLoadAllSymbolFlows={() => void loadAllAdminSymbolFlows()}
            onRefresh={() => {
              queryClient.removeQueries({ queryKey: stockKeys.adminSymbolFlowsRoot() });
              void queryClient.invalidateQueries({ queryKey: stockKeys.adminFlowOverviewRoot() });
              void queryClient.invalidateQueries({ queryKey: stockKeys.adminFundFlowSummary() });
            }}
          />
        ) : null}

        {activeAdminSection === "cash-flow-ledger" ? (
          <AdminCashFlowLedgerPanel
            cashFlowPage={adminCashFlowPage}
            loading={adminCashFlowPageQuery.isFetching}
            onRefresh={() => void adminCashFlowPageQuery.refetch()}
            onPageChange={setAdminCashFlowPageIndex}
          />
        ) : null}

        {activeAdminSection === "account-cash" ? (
          <AdminUserCashAdjustmentPanel
            userKey={userCashAdjustmentUserKey}
            amount={userCashAdjustmentAmount}
            loadingFundFlow={userFundFlowQuery.isFetching}
            adjustingUserCashType={adjustingUserCashType}
            fundFlow={userFundFlow}
            fundFlowUserKey={userFundFlowUserKey}
            onUserKeyChange={setUserCashAdjustmentUserKey}
            onAmountChange={setUserCashAdjustmentAmount}
            onLoadFundFlow={() => void loadUserFundFlow()}
            onAdjustCash={(adjustmentType) => void adjustUserCashBalance(adjustmentType)}
          />
        ) : null}

        {activeAdminSection === "salary" ? (
          <SalaryEligibilityPanel
            rows={visibleSalaryRows}
            totalCount={salaryEligibilityRows.length}
            pageStart={salaryPagination.pageStart}
            pageEnd={salaryPagination.pageEnd}
            currentPage={salaryPagination.boundedPage}
            totalPages={salaryPagination.totalPages}
            receivableCount={salaryEligibilitySummary.receivableCount}
            policyCount={salaryEligibilitySummary.policyCount}
            accountCheckCount={salaryEligibilitySummary.accountCheckCount}
            excludedCount={salaryEligibilitySummary.excludedCount}
            loading={false}
            error={false}
            running={runningCashFlow}
            lastRun={lastCashFlowRun}
            onPageChange={setSalaryPage}
            onRun={() => void runAutoParticipantCashFlowNow()}
          />
        ) : null}

        {activeAdminSection === "profile-overview" ? (
          <ParticipantProfileOverviewPanel
            summaries={participantProfileOverviewSummaries}
            loading={autoParticipantProfileOverviewsQuery.isFetching}
            error={autoParticipantProfileOverviewsQuery.isError}
          />
        ) : null}

        {activeAdminSection === "profiles" ? (
        <>
          <AutoSignalGuide />

          <AdminProfileConfigPanel
            profileConfigs={profileConfigs}
            editingProfileType={editingProfileType}
            selectedProfileConfig={selectedProfileConfig}
            draft={profileConfigDraft}
            draftSetters={profileConfigDraftSetters}
            saving={savingProfileConfig}
            onSelectProfile={selectProfileConfigByType}
            onSubmit={submitProfileConfig}
            onClearSelection={() => setEditingProfileType(null)}
          />

        </>
        ) : null}

        {activeAdminSection === "auto-symbols" ? (
          <AdminAutoMarketConfigPanel
            configs={autoMarketConfigs}
            draft={autoMarketConfigDraft}
            draftSetters={autoMarketConfigDraftSetters}
            editingSymbol={editingAutoConfigSymbol}
            updating={updatingAutoConfig}
            togglingSymbol={togglingAutoConfigSymbol}
            onSelectDraft={selectAutoConfigDraft}
            onSubmit={() => void submitAutoConfig()}
            onToggleEnabled={(config) => void toggleAutoConfigEnabled(config)}
          />
        ) : null}

        {activeAdminSection === "listing-auto" ? (
          <AdminListingAutoAccountPanel
            accounts={listingAutoAccounts}
            selectedAccount={selectedListingAutoAccount}
            draft={listingAutoAccountDraft}
            draftSetters={listingAutoAccountDraftSetters}
            editingSymbol={editingListingAutoSymbol}
            updating={updatingListingAutoAccount}
            onSelectDraft={selectListingAutoAccountDraft}
            onSubmit={() => void submitListingAutoAccountConfig()}
          />
        ) : null}

        {activeAdminSection === "batch" ? (
          <AdminBatchRuntimeControlPanel
            controls={batchJobRuntimeControls}
            loading={batchJobRuntimeControlsQuery.isFetching}
            error={batchJobRuntimeControlsQuery.isError}
            updatingBatchJobName={updatingBatchJobName}
            lastCashFlowRun={lastCashFlowRun}
            runningCashFlow={runningCashFlow}
            onRefresh={() => void batchJobRuntimeControlsQuery.refetch().then((result) => {
              if (result.isError) {
                setMessage(result.error instanceof Error ? result.error.message : "배치 자동 실행 상태를 조회하지 못했습니다.");
              }
            })}
            onSetRuntime={(jobName, runtimeEnabled) => void setBatchJobRuntime(jobName, runtimeEnabled)}
            onRunCashFlow={() => void runAutoParticipantCashFlowNow()}
          />
        ) : null}

        {activeAdminSection === "participants" ? (
          <AdminAutoParticipantManagementPanel
            isEditing={isEditingAutoParticipant}
            participantUserKey={autoParticipantUserKey}
            draft={autoParticipantEditDraft}
            draftSetters={autoParticipantEditDraftSetters}
            saving={savingAutoParticipant}
            selectedParticipant={selectedAutoParticipant}
            selectedSymbolConfigs={selectedAutoParticipantSymbolConfigs}
            strategySymbols={(status?.configs ?? []).map((config) => config.symbol)}
            strategyUserKey={strategyUserKey}
            strategySymbol={strategySymbol}
            strategyEnabled={strategyEnabled}
            strategyIntensity={strategyIntensity}
            editingStrategyKey={editingStrategyKey}
            selectedStrategyKey={selectedParticipantStrategyKey}
            savingStrategy={savingStrategy}
            togglingStrategyKey={togglingStrategyKey}
            autoGenerateCount={autoGenerateCount}
            autoGenerateKeyPrefix={autoGenerateKeyPrefix}
            autoGenerateDisplayPrefix={autoGenerateDisplayPrefix}
            autoGenerateProfileMode={autoGenerateProfileMode}
            autoGenerateProfileType={autoGenerateProfileType}
            generatingAutoParticipants={generatingAutoParticipants}
            participantSearch={participantSearch}
            participantStatusFilter={participantStatusFilter}
            participantProfileFilter={participantProfileFilter}
            filteredParticipantCount={filteredParticipants.length}
            totalParticipantCount={(status?.participants ?? []).length}
            participantPageStart={participantPagination.pageStart}
            participantPageEnd={participantPagination.pageEnd}
            participantTotalPages={participantPagination.totalPages}
            boundedParticipantPage={participantPagination.boundedPage}
            visibleParticipants={visibleParticipants}
            overviewByUserKey={visibleAutoParticipantOverviewByUserKey}
            editingUserKey={editingAutoParticipantUserKey}
            togglingUserKey={togglingAutoParticipantUserKey}
            withdrawingUserKey={withdrawingAutoParticipantUserKey}
            adjustingCashType={adjustingCashType}
            overviewsFetching={visibleParticipantOverviewsQuery.isFetching}
            onParticipantUserKeyChange={setAutoParticipantUserKey}
            onSubmitParticipant={() => void submitAutoParticipant()}
            onResetParticipantDraft={resetAutoParticipantDraft}
            onSelectStrategySymbol={selectParticipantStrategySymbolDraft}
            onClearStrategy={(userKey) => {
              setEditingStrategyKey(null);
              setStrategyUserKey(userKey);
              setStrategySymbol("");
              setStrategyEnabled(true);
              setStrategyIntensity(DEFAULT_STRATEGY_INTENSITY);
            }}
            onStrategyEnabledChange={setStrategyEnabled}
            onStrategyIntensityChange={setStrategyIntensity}
            onSubmitStrategy={() => void submitAutoStrategy()}
            onToggleStrategyEnabled={(config) => void toggleAutoStrategyEnabled(config)}
            onSelectStrategyDraft={selectAutoStrategyDraft}
            onAutoGenerateCountChange={setAutoGenerateCount}
            onAutoGenerateKeyPrefixChange={setAutoGenerateKeyPrefix}
            onAutoGenerateDisplayPrefixChange={setAutoGenerateDisplayPrefix}
            onAutoGenerateProfileModeChange={setAutoGenerateProfileMode}
            onAutoGenerateProfileTypeChange={setAutoGenerateProfileType}
            onGenerateParticipants={() => void generateAutoParticipants()}
            onParticipantSearchChange={(value) => {
              setParticipantSearch(value);
              setParticipantPage(0);
            }}
            onParticipantStatusFilterChange={(value) => {
              setParticipantStatusFilter(value);
              setParticipantPage(0);
            }}
            onParticipantProfileFilterChange={(value) => {
              setParticipantProfileFilter(value);
              setParticipantPage(0);
            }}
            onParticipantPageChange={setParticipantPage}
            onToggleParticipant={(participant) => void toggleAutoParticipantEnabled(participant)}
            onSelectParticipant={selectAutoParticipantDraft}
            onWithdrawParticipant={(participant) => void withdrawAutoParticipantRow(participant)}
            onAdjustCash={(adjustmentType) => void adjustAutoParticipantCashBalance(adjustmentType)}
          />
        ) : null}

        {activeAdminTab === "events" ? (
        <>
        <AdminStockEventPanel
          instruments={instruments}
          createInstrumentForm={createInstrumentForm}
          draft={stockEventDraft}
          draftSetters={stockEventDraftSetters}
          creatingInitialIssue={createInstrumentMutation.isPending}
          applyingAction={applyingAction}
          onSubmit={submitStockEvent}
        />

        <AdminInstrumentReportPanel
          instruments={instruments}
          reports={instrumentReports}
          draft={instrumentReportDraft}
          draftSetters={instrumentReportDraftSetters}
          saving={savingReport}
          deleting={deletingReport}
          onPublish={() => void submitInstrumentReport("publish")}
          onUpdate={() => void submitInstrumentReport("update")}
          onDelete={() => void removeInstrumentReport()}
          onFillDraft={fillReportDraft}
        />

        <AdminCorporateActionHistoryPanel symbol={actionSymbol} actions={corporateActions} />
        </>
        ) : null}

        {activeAdminTab === "market" ? (
        <AdminOrderBookInstrumentTable
          instruments={instruments}
          orderBookConfigBySymbol={orderBookConfigBySymbol}
          updatingStatusSymbol={updatingStatusSymbol}
          onChangeMarketStatus={(symbol, marketStatus) => void changeOrderBookMarketStatus(symbol, marketStatus)}
        />
        ) : null}
      </section>
    </main>
  );
}
