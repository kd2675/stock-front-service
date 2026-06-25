"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import TradingTopBar from "@/app/components/TradingTopBar";
import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { bootstrapAccessToken, ensureAccessToken, getUserFromToken, isAdminRole } from "@/app/lib/auth";
import { createOrderBookInstrumentMutationOptions } from "@/app/lib/react-query/stockMutations";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { adjustAutoParticipantCash, adjustUserAccountCash, applyCorporateAction, deleteInstrumentReport, getAutoMarketStatus, getBatchJobRuntimeControls, getCorporateActions, getInstrumentReports, getOrderBookInstruments, getOrderBookMarketStatus, getVirtualMarketStatus, publishInstrumentReport, runAutoParticipantCashFlow, updateAutoMarketConfig, updateAutoParticipantProfileConfig, updateAutoParticipantSymbolConfig, updateBatchJobRuntimeControl, updateInstrumentReport, updateListingAutoAccountConfig, updateMarketStatus, upsertAutoParticipant, withdrawAutoParticipant } from "@/app/lib/stock";
import { createInstrumentSchema, type CreateInstrumentFormValues } from "@/app/lib/validation/adminSchemas";
import type { AutoMarketConfig, AutoMarketStatus, AutoParticipant, AutoParticipantProfileConfig, AutoParticipantProfileType, AutoParticipantSymbolConfig, BatchJobRuntimeStatus, CorporateAction, CorporateActionStatus, CorporateActionType, InstrumentReport, ListingAutoAccount, ListingAutoPosition, MarketSessionStatus, OrderBookInstrument, OrderBookMarketStatus, RecurringCashIntervalUnit, StockBatchJobRun, VirtualMarketStatus } from "@/app/types/stock";

const RECURRING_CASH_INTERVAL_UNIT_OPTIONS: { value: RecurringCashIntervalUnit; label: string }[] = [
  { value: "SECOND", label: "초" },
  { value: "MINUTE", label: "분" },
  { value: "HOUR", label: "시간" },
  { value: "DAY", label: "일" },
  { value: "MONTH", label: "월" },
  { value: "YEAR", label: "년" },
];

const BATCH_JOB_RUNTIME_LABELS: Record<string, { label: string; description: string }> = {
  "market-data-refresh": {
    label: "시세 갱신",
    description: "외부/내부 가격 데이터를 주기적으로 갱신합니다.",
  },
  "virtual-price-execution": {
    label: "특정가격 자동주문체결",
    description: "가상 가격 시장 주문 체결 배치를 실행합니다.",
  },
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
    description: "자동참여자와 종목 알고리즘 기준으로 호가를 냅니다.",
  },
  "auto-participant-cash-flow": {
    label: "월급 지급",
    description: "가동 자동참여자와 ACTIVE 계좌에 반복 현금을 지급합니다.",
  },
  "market-close-rollover": {
    label: "장마감 롤오버",
    description: "장마감 기준 가격/일중 지표를 다음 기준으로 넘깁니다.",
  },
  "portfolio-settlement": {
    label: "포트폴리오 정산",
    description: "계좌 보유/손익 스냅샷을 정산합니다.",
  },
};

export default function SupplyDemandAdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [adminStatus, setAdminStatus] = useState<"checking" | "allowed" | "denied">("checking");
  const [status, setStatus] = useState<AutoMarketStatus | null>(null);
  const [virtualMarket, setVirtualMarket] = useState<VirtualMarketStatus | null>(null);
  const [orderBookMarket, setOrderBookMarket] = useState<OrderBookMarketStatus | null>(null);
  const [lastCashFlowRun, setLastCashFlowRun] = useState<StockBatchJobRun | null>(null);
  const [instruments, setInstruments] = useState<OrderBookInstrument[]>([]);
  const [corporateActions, setCorporateActions] = useState<CorporateAction[]>([]);
  const [instrumentReports, setInstrumentReports] = useState<InstrumentReport[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const createInstrumentForm = useForm<CreateInstrumentFormValues>({
    resolver: zodResolver(createInstrumentSchema),
    defaultValues: {
      symbol: "",
      name: "",
      market: "ORDERBOOK",
      initialPrice: "",
      issuedShares: "",
      tickSize: "1",
      priceLimitRate: "30",
      listingAutoDisplayName: "",
      listingAutoEnabled: "true",
      listingAutoPositionSide: "SELL_ONLY",
      listingAutoMaxOrderQuantity: "100",
      listingAutoOrderTtlSeconds: "30",
      listingAutoPriceOffsetTicks: "3",
    },
  });
  const [actionSymbol, setActionSymbol] = useState("");
  const [actionType, setActionType] = useState<CorporateActionType>("INITIAL_ISSUE");
  const [actionShares, setActionShares] = useState("");
  const [actionIssuePrice, setActionIssuePrice] = useState("");
  const [actionDividendAmount, setActionDividendAmount] = useState("");
  const [exRightsDate, setExRightsDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [listingDate, setListingDate] = useState("");
  const [delistingDate, setDelistingDate] = useState("");
  const [splitFrom, setSplitFrom] = useState("1");
  const [splitTo, setSplitTo] = useState("5");
  const [actionDescription, setActionDescription] = useState("");
  const [applyingAction, setApplyingAction] = useState(false);
  const [reportSymbol, setReportSymbol] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportScore, setReportScore] = useState("5");
  const [reportRiseReason, setReportRiseReason] = useState("");
  const [reportFallReason, setReportFallReason] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);
  const [updatingStatusSymbol, setUpdatingStatusSymbol] = useState<string | null>(null);
  const [autoConfigSymbol, setAutoConfigSymbol] = useState("");
  const [editingAutoConfigSymbol, setEditingAutoConfigSymbol] = useState<string | null>(null);
  const [autoConfigEnabled, setAutoConfigEnabled] = useState(true);
  const [autoIntensity, setAutoIntensity] = useState("5");
  const [autoMaxOrderQuantity, setAutoMaxOrderQuantity] = useState("4");
  const [autoOrderTtlSeconds, setAutoOrderTtlSeconds] = useState("15");
  const [updatingAutoConfig, setUpdatingAutoConfig] = useState(false);
  const [togglingAutoConfigSymbol, setTogglingAutoConfigSymbol] = useState<string | null>(null);
  const [listingAutoSymbol, setListingAutoSymbol] = useState("");
  const [editingListingAutoSymbol, setEditingListingAutoSymbol] = useState<string | null>(null);
  const [listingAutoDisplayName, setListingAutoDisplayName] = useState("");
  const [listingAutoEnabled, setListingAutoEnabled] = useState(true);
  const [listingAutoPositionSide, setListingAutoPositionSide] = useState<ListingAutoPosition>("SELL_ONLY");
  const [listingAutoMaxOrderQuantity, setListingAutoMaxOrderQuantity] = useState("100");
  const [listingAutoOrderTtlSeconds, setListingAutoOrderTtlSeconds] = useState("30");
  const [listingAutoPriceOffsetTicks, setListingAutoPriceOffsetTicks] = useState("3");
  const [updatingListingAutoAccount, setUpdatingListingAutoAccount] = useState(false);
  const [editingAutoParticipantUserKey, setEditingAutoParticipantUserKey] = useState<string | null>(null);
  const [autoParticipantUserKey, setAutoParticipantUserKey] = useState("");
  const [autoParticipantDisplayName, setAutoParticipantDisplayName] = useState("");
  const [autoParticipantEnabled, setAutoParticipantEnabled] = useState(true);
  const [autoParticipantProfileType, setAutoParticipantProfileType] = useState<AutoParticipantProfileType>("NOISE_TRADER");
  const [autoParticipantRecurringCashAmount, setAutoParticipantRecurringCashAmount] = useState("");
  const [autoParticipantRecurringCashIntervalValue, setAutoParticipantRecurringCashIntervalValue] = useState("");
  const [autoParticipantRecurringCashIntervalUnit, setAutoParticipantRecurringCashIntervalUnit] = useState<RecurringCashIntervalUnit>("DAY");
  const [savingAutoParticipant, setSavingAutoParticipant] = useState(false);
  const [autoGenerateCount, setAutoGenerateCount] = useState("5");
  const [autoGenerateKeyPrefix, setAutoGenerateKeyPrefix] = useState("stock-auto-");
  const [autoGenerateDisplayPrefix, setAutoGenerateDisplayPrefix] = useState("자동 참여자");
  const [autoGenerateProfileMode, setAutoGenerateProfileMode] = useState<"ROTATE" | "SINGLE">("ROTATE");
  const [autoGenerateProfileType, setAutoGenerateProfileType] = useState<AutoParticipantProfileType>("NOISE_TRADER");
  const [generatingAutoParticipants, setGeneratingAutoParticipants] = useState(false);
  const [togglingAutoParticipantUserKey, setTogglingAutoParticipantUserKey] = useState<string | null>(null);
  const [withdrawingAutoParticipantUserKey, setWithdrawingAutoParticipantUserKey] = useState<string | null>(null);
  const [cashAdjustmentAmount, setCashAdjustmentAmount] = useState("");
  const [adjustingCashType, setAdjustingCashType] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [userCashAdjustmentUserKey, setUserCashAdjustmentUserKey] = useState("");
  const [userCashAdjustmentAmount, setUserCashAdjustmentAmount] = useState("");
  const [adjustingUserCashType, setAdjustingUserCashType] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [runningCashFlow, setRunningCashFlow] = useState(false);
  const [batchJobRuntimeControls, setBatchJobRuntimeControls] = useState<BatchJobRuntimeStatus[]>([]);
  const [loadingBatchJobRuntimeControls, setLoadingBatchJobRuntimeControls] = useState(false);
  const [updatingBatchJobName, setUpdatingBatchJobName] = useState<string | null>(null);
  const [strategyUserKey, setStrategyUserKey] = useState("");
  const [strategySymbol, setStrategySymbol] = useState("");
  const [editingStrategyKey, setEditingStrategyKey] = useState<string | null>(null);
  const [strategyEnabled, setStrategyEnabled] = useState(true);
  const [strategyIntensity, setStrategyIntensity] = useState("5");
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [togglingStrategyKey, setTogglingStrategyKey] = useState<string | null>(null);
  const [editingProfileType, setEditingProfileType] = useState<AutoParticipantProfileType | null>(null);
  const [profileNewsWeight, setProfileNewsWeight] = useState("0");
  const [profileMomentumWeight, setProfileMomentumWeight] = useState("0");
  const [profileContrarianWeight, setProfileContrarianWeight] = useState("0");
  const [profileLossAversionWeight, setProfileLossAversionWeight] = useState("0");
  const [profileHerdingWeight, setProfileHerdingWeight] = useState("0");
  const [profileMarketMakingWeight, setProfileMarketMakingWeight] = useState("0");
  const [profileOverconfidenceWeight, setProfileOverconfidenceWeight] = useState("0");
  const [profileNoiseWeight, setProfileNoiseWeight] = useState("0");
  const [profilePanicSellWeight, setProfilePanicSellWeight] = useState("0");
  const [profileDipBuyWeight, setProfileDipBuyWeight] = useState("0");
  const [profileOrderMultiplier, setProfileOrderMultiplier] = useState("1");
  const [profileAggressionMultiplier, setProfileAggressionMultiplier] = useState("1");
  const [profileOrderTtlMultiplier, setProfileOrderTtlMultiplier] = useState("1");
  const [profileQuantityMultiplier, setProfileQuantityMultiplier] = useState("1");
  const [profileHoldingPatienceWeight, setProfileHoldingPatienceWeight] = useState("0");
  const [profileDeepLossHoldWeight, setProfileDeepLossHoldWeight] = useState("0");
  const [profileProfitTakingWeight, setProfileProfitTakingWeight] = useState("0");
  const [profileRecurringDepositAmount, setProfileRecurringDepositAmount] = useState("0");
  const [profileRecurringDepositIntervalValue, setProfileRecurringDepositIntervalValue] = useState("30");
  const [profileRecurringDepositIntervalUnit, setProfileRecurringDepositIntervalUnit] = useState<RecurringCashIntervalUnit>("DAY");
  const [savingProfileConfig, setSavingProfileConfig] = useState(false);

  const loadCorporateActions = useCallback((targetSymbol: string) => {
    const normalizedSymbol = targetSymbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      return;
    }
    getCorporateActions(normalizedSymbol).then((result) => {
      if (result.ok && result.data) {
        setCorporateActions(result.data);
      }
    });
  }, []);

  const loadInstrumentReports = useCallback((targetSymbol: string) => {
    const normalizedSymbol = targetSymbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      return;
    }
    getInstrumentReports(normalizedSymbol).then((result) => {
      if (result.ok && result.data) {
        setInstrumentReports(result.data);
      }
    });
  }, []);

  const loadStatus = useCallback(() => {
    let cancelled = false;
    Promise.all([getAutoMarketStatus(), getVirtualMarketStatus(), getOrderBookMarketStatus(), getOrderBookInstruments()]).then(([autoResult, virtualResult, orderBookResult, instrumentResult]) => {
      if (cancelled) {
        return;
      }
      if (autoResult.ok && autoResult.data) {
        setStatus(autoResult.data);
        if (!autoConfigSymbol && autoResult.data.configs.length > 0) {
          const firstConfig = autoResult.data.configs[0];
          setAutoConfigSymbol(firstConfig.symbol);
          setAutoConfigEnabled(firstConfig.enabled);
          setAutoIntensity(String(firstConfig.intensity));
          setAutoMaxOrderQuantity(String(firstConfig.maxOrderQuantity));
          setAutoOrderTtlSeconds(String(firstConfig.orderTtlSeconds));
        }
        if (!listingAutoSymbol && autoResult.data.listingAutoAccounts.length > 0) {
          const firstListingAutoAccount = autoResult.data.listingAutoAccounts[0];
          setListingAutoSymbol(firstListingAutoAccount.symbol);
          setListingAutoDisplayName(firstListingAutoAccount.displayName);
          setListingAutoEnabled(firstListingAutoAccount.enabled);
          setListingAutoPositionSide(firstListingAutoAccount.positionSide);
          setListingAutoMaxOrderQuantity(String(firstListingAutoAccount.maxOrderQuantity));
          setListingAutoOrderTtlSeconds(String(firstListingAutoAccount.orderTtlSeconds));
          setListingAutoPriceOffsetTicks(String(firstListingAutoAccount.priceOffsetTicks));
        }
        const firstStrategy = autoResult.data.participantSymbolConfigs[0];
        if (!strategyUserKey && firstStrategy) {
          setStrategyUserKey(firstStrategy.userKey);
          setStrategySymbol(firstStrategy.symbol);
          setStrategyEnabled(firstStrategy.enabled);
          setStrategyIntensity(String(firstStrategy.intensity));
        } else if (!strategyUserKey && autoResult.data.participants.length > 0) {
          setStrategyUserKey(autoResult.data.participants[0].userKey);
        }
        if (!firstStrategy && !strategySymbol && autoResult.data.configs.length > 0) {
          setStrategySymbol(autoResult.data.configs[0].symbol);
          setStrategyIntensity(String(autoResult.data.configs[0].intensity));
        }
      }
      if (virtualResult.ok && virtualResult.data) {
        setVirtualMarket(virtualResult.data);
      }
      if (orderBookResult.ok && orderBookResult.data) {
        setOrderBookMarket(orderBookResult.data);
      }
      if (instrumentResult.ok && instrumentResult.data) {
        setInstruments(instrumentResult.data);
        if (!reportSymbol && instrumentResult.data.length > 0) {
          setReportSymbol(instrumentResult.data[0].symbol);
        }
      }
      if (autoResult.ok && virtualResult.ok && orderBookResult.ok && instrumentResult.ok) {
        setMessage(null);
        return;
      }
      setMessage(autoResult.message ?? virtualResult.message ?? orderBookResult.message ?? instrumentResult.message ?? "시장 설정을 조회하지 못했습니다.");
    });
    return () => {
      cancelled = true;
    };
  }, [autoConfigSymbol, listingAutoSymbol, reportSymbol, strategySymbol, strategyUserKey]);

  const loadBatchJobRuntimeControls = useCallback(async (showError = false) => {
    setLoadingBatchJobRuntimeControls(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        if (showError) {
          setMessage("관리자 로그인 후 배치 자동 실행 상태를 조회할 수 있습니다.");
        }
        return;
      }
      const result = await getBatchJobRuntimeControls(token);
      if (!result.ok || !result.data) {
        if (showError) {
          setMessage(result.message ?? "배치 자동 실행 상태를 조회하지 못했습니다.");
        }
        return;
      }
      setBatchJobRuntimeControls(result.data);
    } finally {
      setLoadingBatchJobRuntimeControls(false);
    }
  }, []);

  const createInstrumentMutation = useMutation({
    ...createOrderBookInstrumentMutationOptions(),
    onSuccess: async (instrument) => {
      createInstrumentForm.reset({
        symbol: "",
        name: "",
        market: "ORDERBOOK",
        initialPrice: "",
        issuedShares: "",
        tickSize: "1",
        priceLimitRate: "30",
        listingAutoDisplayName: "",
        listingAutoEnabled: "true",
        listingAutoPositionSide: "SELL_ONLY",
        listingAutoMaxOrderQuantity: "100",
        listingAutoOrderTtlSeconds: "30",
        listingAutoPriceOffsetTicks: "3",
      });
      setActionSymbol(instrument.symbol);
      setReportSymbol(instrument.symbol);
      setCorporateActions([]);
      setInstrumentReports([]);
      setMessage("주식 이벤트를 적용했습니다. 신규 상장과 상장주관사 자동계정을 생성했습니다.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBookInstruments() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBook(instrument.symbol) }),
        queryClient.invalidateQueries({ queryKey: stockKeys.autoMarketStatus() }),
        queryClient.invalidateQueries({ queryKey: stockKeys.orderBookMarketStatus() }),
      ]);
      loadStatus();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "주문장 종목 생성에 실패했습니다.");
    },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await bootstrapAccessToken();
      if (cancelled) {
        return;
      }
      if (!token) {
        router.replace("/login");
        return;
      }
      const user = getUserFromToken(token);
      setAdminStatus(isAdminRole(user?.role) ? "allowed" : "denied");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (adminStatus !== "allowed") {
      return undefined;
    }
    return loadStatus();
  }, [adminStatus, loadStatus]);

  useEffect(() => {
    if (adminStatus !== "allowed") {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void loadBatchJobRuntimeControls(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [adminStatus, loadBatchJobRuntimeControls]);

  useEffect(() => {
    if (adminStatus !== "allowed") {
      return;
    }
    if (isKnownOrderBookSymbol(instruments, actionSymbol)) {
      loadCorporateActions(actionSymbol);
    }
  }, [actionSymbol, adminStatus, instruments, loadCorporateActions]);

  useEffect(() => {
    if (adminStatus !== "allowed") {
      return;
    }
    if (isKnownOrderBookSymbol(instruments, reportSymbol)) {
      loadInstrumentReports(reportSymbol);
    }
  }, [adminStatus, instruments, loadInstrumentReports, reportSymbol]);

  const submitInstrument = createInstrumentForm.handleSubmit((values) => {
    const parsed = createInstrumentSchema.safeParse(values);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "종목 입력값을 확인해 주세요.");
      return;
    }
    createInstrumentMutation.mutate({
      symbol: parsed.data.symbol,
      name: parsed.data.name,
      market: parsed.data.market || "ORDERBOOK",
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
    const normalizedSymbol = reportSymbol.trim().toUpperCase();
    const parsedScore = Number.parseInt(reportScore, 10);
    if (!normalizedSymbol || !reportTitle.trim() || !reportSummary.trim() || !Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      setMessage("보고서 종목, 제목, 요약, 점수 1-10을 입력해 주세요.");
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, normalizedSymbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    setSavingReport(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 평가 보고서를 저장할 수 있습니다.");
        return;
      }
      const payload = {
        title: reportTitle.trim(),
        summary: reportSummary.trim(),
        score: parsedScore,
        riseReason: optionalText(reportRiseReason),
        fallReason: optionalText(reportFallReason),
      };
      const result = mode === "publish"
        ? await publishInstrumentReport(token, normalizedSymbol, payload)
        : await updateInstrumentReport(token, normalizedSymbol, payload);
      if (!result.ok) {
        setMessage(result.message ?? "평가 보고서 저장에 실패했습니다.");
        return;
      }
      setMessage(mode === "publish" ? "평가 보고서를 발행했습니다." : "평가 보고서를 수정 이벤트로 저장했습니다.");
      loadInstrumentReports(normalizedSymbol);
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 평가 보고서를 삭제할 수 있습니다.");
        return;
      }
      const result = await deleteInstrumentReport(token, normalizedSymbol);
      if (!result.ok) {
        setMessage(result.message ?? "평가 보고서 삭제에 실패했습니다.");
        return;
      }
      setMessage("평가 보고서를 삭제 이벤트로 처리했습니다.");
      loadInstrumentReports(normalizedSymbol);
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
    const payload: {
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
    } = { actionType };

    if (actionType === "DELISTING") {
      if (!delistingDate) {
        setMessage("상장폐지는 상장폐지일이 필요합니다.");
        return;
      }
      payload.delistingDate = delistingDate;
    } else if (actionType === "STOCK_SPLIT") {
      const parsedSplitFrom = Number.parseInt(splitFrom, 10);
      const parsedSplitTo = Number.parseInt(splitTo, 10);
      if (!Number.isInteger(parsedSplitFrom) || !Number.isInteger(parsedSplitTo) || parsedSplitFrom <= 0 || parsedSplitTo <= parsedSplitFrom) {
        setMessage("액면분할 비율을 올바르게 입력해 주세요.");
        return;
      }
      if (!listingDate) {
        setMessage("액면분할은 효력일이 필요합니다.");
        return;
      }
      payload.splitFrom = parsedSplitFrom;
      payload.splitTo = parsedSplitTo;
      payload.listingDate = listingDate;
    } else if (actionType === "CASH_DIVIDEND") {
      const parsedDividendAmount = Number.parseFloat(actionDividendAmount);
      if (!Number.isFinite(parsedDividendAmount) || parsedDividendAmount <= 0) {
        setMessage("1주당 배당금을 0보다 큰 숫자로 입력해 주세요.");
        return;
      }
      if (!exRightsDate || !paymentDate) {
        setMessage("현금배당은 배당락일과 지급일이 필요합니다.");
        return;
      }
      if (paymentDate < exRightsDate) {
        setMessage("현금배당 지급일은 배당락일 이후여야 합니다.");
        return;
      }
      payload.dividendAmount = parsedDividendAmount;
      payload.exRightsDate = exRightsDate;
      payload.paymentDate = paymentDate;
    } else {
      const parsedShares = Number.parseInt(actionShares, 10);
      const parsedIssuePrice = Number.parseFloat(actionIssuePrice);
      if (!Number.isInteger(parsedShares) || parsedShares <= 0) {
        setMessage("발행 주식수를 입력해 주세요.");
        return;
      }
      if (actionType === "PAID_IN_CAPITAL_INCREASE") {
        if (!Number.isFinite(parsedIssuePrice) || parsedIssuePrice <= 0) {
          setMessage("발행가는 0보다 큰 숫자로 입력해 주세요.");
          return;
        }
        if (!exRightsDate || !paymentDate || !listingDate) {
          setMessage("유상증자는 권리락일, 납입일, 신주상장일이 필요합니다.");
          return;
        }
        if (paymentDate < exRightsDate || listingDate < paymentDate) {
          setMessage("유상증자 일정은 권리락일, 납입일, 신주상장일 순서여야 합니다.");
          return;
        }
        payload.exRightsDate = exRightsDate;
        payload.paymentDate = paymentDate;
        payload.listingDate = listingDate;
      }
      if (actionType === "ADDITIONAL_ISSUE") {
        if (!Number.isFinite(parsedIssuePrice) || parsedIssuePrice <= 0) {
          setMessage("발행가는 0보다 큰 숫자로 입력해 주세요.");
          return;
        }
        if (!listingDate) {
          setMessage("추가발행은 신주상장일이 필요합니다.");
          return;
        }
        payload.listingDate = listingDate;
      }
      if (actionType === "BONUS_ISSUE" || actionType === "STOCK_DIVIDEND") {
        if (!exRightsDate || !listingDate) {
          setMessage("무상증자와 주식배당은 권리락일과 신주상장일이 필요합니다.");
          return;
        }
        if (listingDate < exRightsDate) {
          setMessage("신주상장일은 권리락일 이후여야 합니다.");
          return;
        }
        payload.exRightsDate = exRightsDate;
        payload.listingDate = listingDate;
      }
      payload.shareQuantity = parsedShares;
      if ((actionType === "PAID_IN_CAPITAL_INCREASE" || actionType === "ADDITIONAL_ISSUE") && Number.isFinite(parsedIssuePrice) && parsedIssuePrice > 0) {
        payload.issuePrice = parsedIssuePrice;
      }
    }
    if (actionDescription.trim()) {
      payload.description = actionDescription.trim();
    }

    setApplyingAction(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 주식 이벤트를 적용할 수 있습니다.");
        return;
      }
      const result = await applyCorporateAction(token, normalizedSymbol, payload);
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
      loadStatus();
      loadCorporateActions(normalizedSymbol);
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 장 상태를 변경할 수 있습니다.");
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
      setMessage("장 상태를 변경했습니다.");
      loadStatus();
    } finally {
      setUpdatingStatusSymbol(null);
    }
  };

  const selectAutoConfigDraft = (config: AutoMarketConfig) => {
    setEditingAutoConfigSymbol(config.symbol);
    setAutoConfigSymbol(config.symbol);
    setAutoConfigEnabled(config.enabled);
    setAutoIntensity(String(config.intensity));
    setAutoMaxOrderQuantity(String(config.maxOrderQuantity));
    setAutoOrderTtlSeconds(String(config.orderTtlSeconds));
  };

  const submitAutoConfig = async () => {
    if (updatingAutoConfig) {
      return;
    }
    const normalizedSymbol = autoConfigSymbol.trim().toUpperCase();
    const parsedIntensity = Number.parseInt(autoIntensity, 10);
    const parsedMaxOrderQuantity = Number.parseInt(autoMaxOrderQuantity, 10);
    const parsedOrderTtlSeconds = Number.parseInt(autoOrderTtlSeconds, 10);
    if (!normalizedSymbol || !Number.isInteger(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 10 || !Number.isInteger(parsedMaxOrderQuantity) || parsedMaxOrderQuantity <= 0 || !Number.isInteger(parsedOrderTtlSeconds) || parsedOrderTtlSeconds <= 0) {
      setMessage("자동장 종목, 강도 1-10, 최대 수량, TTL을 올바르게 입력해 주세요.");
      return;
    }
    setUpdatingAutoConfig(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동장 설정을 변경할 수 있습니다.");
        return;
      }
      const result = await updateAutoMarketConfig(token, normalizedSymbol, {
        enabled: autoConfigEnabled,
        intensity: parsedIntensity,
        maxOrderQuantity: parsedMaxOrderQuantity,
        orderTtlSeconds: parsedOrderTtlSeconds,
      });
      if (!result.ok) {
        setMessage(result.message ?? "자동장 설정 변경에 실패했습니다.");
        return;
      }
      setMessage("자동장 알고리즘 설정을 변경했습니다.");
      setEditingAutoConfigSymbol(null);
      loadStatus();
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동장 가동 상태를 변경할 수 있습니다.");
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
      setMessage(nextEnabled ? "자동장 종목을 가동했습니다." : "자동장 종목을 정지했습니다.");
      loadStatus();
    } finally {
      setTogglingAutoConfigSymbol(null);
    }
  };

  const selectListingAutoAccountDraft = (config: ListingAutoAccount) => {
    setEditingListingAutoSymbol(config.symbol);
    setListingAutoSymbol(config.symbol);
    setListingAutoDisplayName(config.displayName);
    setListingAutoEnabled(config.enabled);
    setListingAutoPositionSide(config.positionSide);
    setListingAutoMaxOrderQuantity(String(config.maxOrderQuantity));
    setListingAutoOrderTtlSeconds(String(config.orderTtlSeconds));
    setListingAutoPriceOffsetTicks(String(config.priceOffsetTicks));
  };

  const submitListingAutoAccountConfig = async () => {
    if (updatingListingAutoAccount) {
      return;
    }
    const normalizedSymbol = listingAutoSymbol.trim().toUpperCase();
    const parsedMaxOrderQuantity = Number.parseInt(listingAutoMaxOrderQuantity, 10);
    const parsedOrderTtlSeconds = Number.parseInt(listingAutoOrderTtlSeconds, 10);
    const parsedPriceOffsetTicks = Number.parseInt(listingAutoPriceOffsetTicks, 10);
    if (!normalizedSymbol || !Number.isInteger(parsedMaxOrderQuantity) || parsedMaxOrderQuantity <= 0 || !Number.isInteger(parsedOrderTtlSeconds) || parsedOrderTtlSeconds <= 0 || !Number.isInteger(parsedPriceOffsetTicks) || parsedPriceOffsetTicks < 0) {
      setMessage("상장주관사 종목, 최대 수량, TTL, 가격 분산 틱을 올바르게 입력해 주세요.");
      return;
    }
    setUpdatingListingAutoAccount(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 상장주관사 자동계정을 변경할 수 있습니다.");
        return;
      }
      const result = await updateListingAutoAccountConfig(token, normalizedSymbol, {
        displayName: optionalText(listingAutoDisplayName) ?? undefined,
        enabled: listingAutoEnabled,
        positionSide: listingAutoPositionSide,
        maxOrderQuantity: parsedMaxOrderQuantity,
        orderTtlSeconds: parsedOrderTtlSeconds,
        priceOffsetTicks: parsedPriceOffsetTicks,
      });
      if (!result.ok) {
        setMessage(result.message ?? "상장주관사 자동계정 설정 변경에 실패했습니다.");
        return;
      }
      setMessage("상장주관사 자동계정 설정을 변경했습니다.");
      setEditingListingAutoSymbol(null);
      loadStatus();
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 배치 자동 실행 상태를 변경할 수 있습니다.");
        return;
      }
      const result = await updateBatchJobRuntimeControl(token, jobName, { runtimeEnabled });
      if (!result.ok || !result.data) {
        setMessage(result.message ?? "배치 자동 실행 상태 변경에 실패했습니다.");
        return;
      }
      const nextControl = result.data;
      setBatchJobRuntimeControls((controls) => controls.map((control) => (control.jobName === jobName ? nextControl : control)));
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 월급 지급 배치를 실행할 수 있습니다.");
        return;
      }
      const result = await runAutoParticipantCashFlow(token);
      if (!result.ok || !result.data) {
        setMessage(result.message ?? "월급 지급 배치 실행에 실패했습니다.");
        return;
      }
      setLastCashFlowRun(result.data);
      setMessage(`월급 지급 배치를 실행했습니다. 처리 ${result.data.processedCount.toLocaleString("ko-KR")}건`);
      void loadBatchJobRuntimeControls(false);
      loadStatus();
    } finally {
      setRunningCashFlow(false);
    }
  };

  const selectAutoParticipantDraft = (participant: AutoParticipant) => {
    setEditingAutoParticipantUserKey(participant.userKey);
    setAutoParticipantUserKey(participant.userKey);
    setAutoParticipantDisplayName(participant.displayName);
    setAutoParticipantEnabled(participant.enabled);
    setAutoParticipantProfileType(participant.profileType);
    setAutoParticipantRecurringCashAmount(participant.recurringCashAmount == null ? "" : String(participant.recurringCashAmount));
    setAutoParticipantRecurringCashIntervalValue(participant.recurringCashIntervalValue == null ? "" : String(participant.recurringCashIntervalValue));
    setAutoParticipantRecurringCashIntervalUnit(participant.recurringCashIntervalUnit ?? "DAY");
    setCashAdjustmentAmount("");
  };

  const resetAutoParticipantDraft = () => {
    setEditingAutoParticipantUserKey(null);
    setAutoParticipantUserKey("");
    setAutoParticipantDisplayName("");
    setAutoParticipantEnabled(true);
    setAutoParticipantProfileType("NOISE_TRADER");
    setAutoParticipantRecurringCashAmount("");
    setAutoParticipantRecurringCashIntervalValue("");
    setAutoParticipantRecurringCashIntervalUnit("DAY");
    setCashAdjustmentAmount("");
  };

  const selectAutoStrategyDraft = (config: AutoParticipantSymbolConfig) => {
    setEditingStrategyKey(`${config.userKey}:${config.symbol}`);
    setStrategyUserKey(config.userKey);
    setStrategySymbol(config.symbol);
    setStrategyEnabled(config.enabled);
    setStrategyIntensity(String(config.intensity));
  };

  const submitAutoParticipant = async () => {
    if (savingAutoParticipant) {
      return;
    }
    const normalizedUserKey = editingAutoParticipantUserKey ?? autoParticipantUserKey.trim();
    const displayName = autoParticipantDisplayName.trim();
    if (!normalizedUserKey || !displayName) {
      setMessage("자동 참여자 키와 표시명을 입력해 주세요.");
      return;
    }
    const recurringCashPayload = parseAutoParticipantRecurringCashDraft(
      autoParticipantRecurringCashAmount,
      autoParticipantRecurringCashIntervalValue,
      autoParticipantRecurringCashIntervalUnit,
    );
    if (recurringCashPayload === null) {
      setMessage("참여자별 월급/정기 현금은 금액 0 이상, 주기 0 초과 1000 이하로 입력해 주세요. 비워두면 프로필 기본값을 사용합니다.");
      return;
    }
    setSavingAutoParticipant(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동 참여자를 저장할 수 있습니다.");
        return;
      }
      const result = await upsertAutoParticipant(token, normalizedUserKey, {
        displayName,
        enabled: autoParticipantEnabled,
        profileType: autoParticipantProfileType,
        ...recurringCashPayload,
      });
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 저장에 실패했습니다.");
        return;
      }
      setMessage("자동 참여자를 저장했습니다.");
      if (editingAutoParticipantUserKey) {
        resetAutoParticipantDraft();
      }
      loadStatus();
    } finally {
      setSavingAutoParticipant(false);
    }
  };

  const generateAutoParticipants = async () => {
    if (generatingAutoParticipants || savingAutoParticipant) {
      return;
    }
    const count = Number.parseInt(autoGenerateCount, 10);
    const keyPrefix = autoGenerateKeyPrefix.trim() || "stock-auto-";
    const displayPrefix = autoGenerateDisplayPrefix.trim() || "자동 참여자";
    if (!Number.isSafeInteger(count) || count <= 0 || count > 100) {
      setMessage("자동 생성 인원은 1명 이상 100명 이하로 입력해 주세요.");
      return;
    }
    if (keyPrefix.length > 40) {
      setMessage("참여자 키 접두어는 40자 이하로 입력해 주세요.");
      return;
    }
    if (displayPrefix.length > 60) {
      setMessage("표시명 접두어는 60자 이하로 입력해 주세요.");
      return;
    }

    setGeneratingAutoParticipants(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동 참여자를 생성할 수 있습니다.");
        return;
      }

      const existingKeys = new Set((status?.participants ?? []).map((participant) => participant.userKey));
      const profileTypes = AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => profile.value);
      let nextSerial = nextAutoParticipantSerial(existingKeys, keyPrefix);
      let created = 0;
      while (created < count) {
        const userKey = `${keyPrefix}${formatAutoParticipantSerial(nextSerial)}`;
        nextSerial += 1;
        if (existingKeys.has(userKey)) {
          continue;
        }
        const profileType = autoGenerateProfileMode === "SINGLE"
          ? autoGenerateProfileType
          : profileTypes[created % profileTypes.length] ?? "NOISE_TRADER";
        const displayName = `${displayPrefix} ${formatAutoParticipantSerial(nextSerial - 1)}`;
        const result = await upsertAutoParticipant(token, userKey, {
          displayName,
          enabled: true,
          profileType,
          recurringCashAmount: null,
          recurringCashIntervalValue: null,
          recurringCashIntervalUnit: null,
        });
        if (!result.ok) {
          setMessage(result.message ?? `${userKey} 자동 참여자 생성에 실패했습니다.`);
          return;
        }
        existingKeys.add(userKey);
        created += 1;
      }
      resetAutoParticipantDraft();
      setMessage(autoGenerateProfileMode === "SINGLE"
        ? `자동 참여자 ${created.toLocaleString("ko-KR")}명을 ${formatAutoParticipantProfile(autoGenerateProfileType)} 프로필로 생성했습니다.`
        : `자동 참여자 ${created.toLocaleString("ko-KR")}명을 생성했습니다. 프로필은 순서대로 분산 적용했습니다.`);
      loadStatus();
    } finally {
      setGeneratingAutoParticipants(false);
    }
  };

  const adjustAutoParticipantCashBalance = async (adjustmentType: "DEPOSIT" | "WITHDRAW") => {
    if (adjustingCashType) {
      return;
    }
    const normalizedUserKey = editingAutoParticipantUserKey ?? autoParticipantUserKey.trim();
    const amount = Number.parseFloat(cashAdjustmentAmount);
    if (!normalizedUserKey || !Number.isFinite(amount) || amount <= 0) {
      setMessage("입금/회수할 자동 참여자와 금액을 확인해 주세요.");
      return;
    }
    setAdjustingCashType(adjustmentType);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동 참여자 현금을 조정할 수 있습니다.");
        return;
      }
      const result = await adjustAutoParticipantCash(token, normalizedUserKey, {
        adjustmentType,
        amount,
      });
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 현금 조정에 실패했습니다.");
        return;
      }
      setCashAdjustmentAmount("");
      setMessage(adjustmentType === "DEPOSIT" ? "자동 참여자 계좌에 입금했습니다." : "자동 참여자 계좌에서 회수했습니다.");
      await queryClient.invalidateQueries({ queryKey: stockKeys.autoParticipantOverviews() });
      loadStatus();
    } finally {
      setAdjustingCashType(null);
    }
  };

  const adjustUserCashBalance = async (adjustmentType: "DEPOSIT" | "WITHDRAW") => {
    if (adjustingUserCashType) {
      return;
    }
    const normalizedUserKey = userCashAdjustmentUserKey.trim();
    const amount = Number.parseFloat(userCashAdjustmentAmount);
    if (!normalizedUserKey || !Number.isFinite(amount) || amount <= 0) {
      setMessage("입금/회수할 실제 유저 식별키와 금액을 확인해 주세요.");
      return;
    }
    setAdjustingUserCashType(adjustmentType);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 실제 유저 계좌 현금을 조정할 수 있습니다.");
        return;
      }
      const result = await adjustUserAccountCash(token, normalizedUserKey, {
        adjustmentType,
        amount,
      });
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
    } finally {
      setAdjustingUserCashType(null);
    }
  };

  const toggleAutoParticipantEnabled = async (participant: AutoParticipant) => {
    if (togglingAutoParticipantUserKey) {
      return;
    }
    const nextEnabled = !participant.enabled;
    setTogglingAutoParticipantUserKey(participant.userKey);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동 참여자 상태를 변경할 수 있습니다.");
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
      loadStatus();
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 자동 참여자를 탈퇴 처리할 수 있습니다.");
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
      loadStatus();
    } finally {
      setWithdrawingAutoParticipantUserKey(null);
    }
  };

  const submitAutoStrategy = async () => {
    if (savingStrategy) {
      return;
    }
    const normalizedUserKey = strategyUserKey.trim();
    const normalizedSymbol = strategySymbol.trim().toUpperCase();
    const parsedIntensity = Number.parseInt(strategyIntensity, 10);
    if (!normalizedUserKey || !normalizedSymbol || !Number.isInteger(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 10) {
      setMessage("참여자, 종목, 강도 1-10을 올바르게 입력해 주세요.");
      return;
    }
    setSavingStrategy(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 참여자별 종목 전략을 저장할 수 있습니다.");
        return;
      }
      const result = await updateAutoParticipantSymbolConfig(token, normalizedUserKey, normalizedSymbol, {
        enabled: strategyEnabled,
        intensity: parsedIntensity,
      });
      if (!result.ok) {
        setMessage(result.message ?? "참여자별 종목 전략 저장에 실패했습니다.");
        return;
      }
      setMessage("참여자별 종목 전략을 저장했습니다.");
      setEditingStrategyKey(null);
      loadStatus();
    } finally {
      setSavingStrategy(false);
    }
  };

  const selectProfileConfigDraft = (config: AutoParticipantProfileConfig) => {
    setEditingProfileType(config.profileType);
    setProfileNewsWeight(String(config.newsWeight));
    setProfileMomentumWeight(String(config.momentumWeight));
    setProfileContrarianWeight(String(config.contrarianWeight));
    setProfileLossAversionWeight(String(config.lossAversionWeight));
    setProfileHerdingWeight(String(config.herdingWeight));
    setProfileMarketMakingWeight(String(config.marketMakingWeight));
    setProfileOverconfidenceWeight(String(config.overconfidenceWeight));
    setProfileNoiseWeight(String(config.noiseWeight));
    setProfilePanicSellWeight(String(config.panicSellWeight));
    setProfileDipBuyWeight(String(config.dipBuyWeight));
    setProfileOrderMultiplier(String(config.orderMultiplier));
    setProfileAggressionMultiplier(String(config.aggressionMultiplier));
    setProfileOrderTtlMultiplier(String(config.orderTtlMultiplier));
    setProfileQuantityMultiplier(String(config.quantityMultiplier));
    setProfileHoldingPatienceWeight(String(config.holdingPatienceWeight));
    setProfileDeepLossHoldWeight(String(config.deepLossHoldWeight));
    setProfileProfitTakingWeight(String(config.profitTakingWeight));
    setProfileRecurringDepositAmount(String(config.recurringDepositAmount));
    setProfileRecurringDepositIntervalValue(String(config.recurringDepositIntervalValue ?? config.recurringDepositIntervalDays));
    setProfileRecurringDepositIntervalUnit(config.recurringDepositIntervalUnit ?? "DAY");
  };

  const submitProfileConfig = async () => {
    if (savingProfileConfig || editingProfileType === null) {
      return;
    }
    const orderMultiplier = Number(profileOrderMultiplier);
    const newsWeight = Number(profileNewsWeight);
    const momentumWeight = Number(profileMomentumWeight);
    const contrarianWeight = Number(profileContrarianWeight);
    const lossAversionWeight = Number(profileLossAversionWeight);
    const herdingWeight = Number(profileHerdingWeight);
    const marketMakingWeight = Number(profileMarketMakingWeight);
    const overconfidenceWeight = Number(profileOverconfidenceWeight);
    const noiseWeight = Number(profileNoiseWeight);
    const panicSellWeight = Number(profilePanicSellWeight);
    const dipBuyWeight = Number(profileDipBuyWeight);
    const aggressionMultiplier = Number(profileAggressionMultiplier);
    const orderTtlMultiplier = Number(profileOrderTtlMultiplier);
    const quantityMultiplier = Number(profileQuantityMultiplier);
    const holdingPatienceWeight = Number(profileHoldingPatienceWeight);
    const deepLossHoldWeight = Number(profileDeepLossHoldWeight);
    const profitTakingWeight = Number(profileProfitTakingWeight);
    const recurringDepositAmount = Number(profileRecurringDepositAmount);
    const recurringDepositIntervalValue = Number(profileRecurringDepositIntervalValue);
    if (!isRangeNumber(newsWeight, 0, 1) || !isRangeNumber(momentumWeight, 0, 1) || !isRangeNumber(contrarianWeight, 0, 1) || !isRangeNumber(lossAversionWeight, 0, 1) || !isRangeNumber(herdingWeight, 0, 1) || !isRangeNumber(marketMakingWeight, 0, 1) || !isRangeNumber(overconfidenceWeight, 0, 1) || !isRangeNumber(noiseWeight, 0, 1) || !isRangeNumber(panicSellWeight, 0, 1) || !isRangeNumber(dipBuyWeight, 0, 1) || !isRangeNumber(orderMultiplier, 0, 5) || !isRangeNumber(aggressionMultiplier, 0, 5) || !isRangeNumber(orderTtlMultiplier, 0.1, 10) || !isRangeNumber(quantityMultiplier, 0, 5) || !isRangeNumber(holdingPatienceWeight, 0, 1) || !isRangeNumber(deepLossHoldWeight, 0, 1) || !isRangeNumber(profitTakingWeight, 0, 1) || !isRangeNumber(recurringDepositAmount, 0, 1000000000000) || !isRangeNumber(recurringDepositIntervalValue, 0, 1000) || (recurringDepositAmount > 0 && recurringDepositIntervalValue <= 0)) {
      setMessage("프로필 행동 설정 숫자 범위를 확인해 주세요.");
      return;
    }
    setSavingProfileConfig(true);
    try {
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 프로필 행동 설정을 저장할 수 있습니다.");
        return;
      }
      const result = await updateAutoParticipantProfileConfig(token, editingProfileType, {
        newsWeight,
        momentumWeight,
        contrarianWeight,
        lossAversionWeight,
        herdingWeight,
        marketMakingWeight,
        overconfidenceWeight,
        noiseWeight,
        panicSellWeight,
        dipBuyWeight,
        orderMultiplier,
        aggressionMultiplier,
        orderTtlMultiplier,
        quantityMultiplier,
        holdingPatienceWeight,
        deepLossHoldWeight,
        profitTakingWeight,
        recurringDepositAmount,
        recurringDepositIntervalValue,
        recurringDepositIntervalUnit: profileRecurringDepositIntervalUnit,
      });
      if (!result.ok) {
        setMessage(result.message ?? "프로필 행동 설정 저장에 실패했습니다.");
        return;
      }
      setMessage("프로필 행동 설정을 저장했습니다.");
      loadStatus();
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
      const token = await ensureAccessToken();
      if (!token) {
        setMessage("관리자 로그인 후 참여자별 종목 전략 상태를 변경할 수 있습니다.");
        return;
      }
      const result = await updateAutoParticipantSymbolConfig(token, config.userKey, config.symbol, {
        enabled: nextEnabled,
        intensity: config.intensity,
      });
      if (!result.ok) {
        setMessage(result.message ?? "참여자별 종목 전략 상태 변경에 실패했습니다.");
        return;
      }
      if (strategyUserKey === config.userKey && strategySymbol === config.symbol) {
        setStrategyEnabled(nextEnabled);
      }
      setMessage(nextEnabled ? "참여자별 종목 전략을 가동했습니다." : "참여자별 종목 전략을 정지했습니다.");
      loadStatus();
    } finally {
      setTogglingStrategyKey(null);
    }
  };

  const orderBookConfigBySymbol = new Map((orderBookMarket?.configs ?? []).map((config) => [config.symbol, config]));
  const autoParticipantByUserKey = new Map((status?.participants ?? []).map((participant) => [participant.userKey, participant]));
  const autoConfigBySymbol = new Map((status?.configs ?? []).map((config) => [config.symbol, config]));
  const isEditingAutoParticipant = editingAutoParticipantUserKey !== null;
  const selectedListingAutoAccount = status?.listingAutoAccounts.find((item) => item.symbol === listingAutoSymbol) ?? null;
  const profileConfigs = status?.participantProfileConfigs ?? [];
  const selectedProfileConfig = editingProfileType === null ? null : profileConfigs.find((config) => config.profileType === editingProfileType) ?? null;
  const selectedProfileOption = selectedProfileConfig === null ? null : AUTO_PARTICIPANT_PROFILE_OPTIONS.find((profile) => profile.value === selectedProfileConfig.profileType) ?? null;
  const batchRuntimeSummary = summarizeBatchRuntimeControls(batchJobRuntimeControls);

  const selectProfileConfigByType = (profileType: string) => {
    const config = profileConfigs.find((item) => item.profileType === profileType);
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
            <Link href="/supply-demand/admin/participants" className="inline-flex h-11 items-center rounded-md bg-[#f2f4f6] px-3 text-sm font-bold text-[#333d4b]">
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

        <div className="grid gap-4 sm:grid-cols-3">
          <DarkMetric label="현재가 시장" value={virtualMarket?.enabled ? "가동" : "정지"} />
          <DarkMetric label="주문장 시장" value={orderBookMarket?.enabled ? "가동" : "정지"} />
          <DarkMetric label="자동 유동성" value={status?.enabled ? "가동" : "정지"} />
          <DarkMetric label="현재가 대기 주문" value={virtualMarket ? `${virtualMarket.openOrderCount}건` : "-"} />
          <DarkMetric label="주문장 대기 주문" value={orderBookMarket ? `${orderBookMarket.openOrderCount}건` : "-"} />
          <DarkMetric label="자동 참여자" value={status ? `${status.enabledParticipantCount}명` : "-"} />
        </div>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">실제 유저 계좌 현금</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동참여자가 아닌 로그인 유저의 모의투자 계좌에 입금하거나 회수합니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">stock_account_cash_flow 원장 기록</span>
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto]">
            <DarkInput label="유저 식별키" value={userCashAdjustmentUserKey} onChange={setUserCashAdjustmentUserKey} placeholder="userKey" />
            <DarkInput label="입금/회수 금액" value={userCashAdjustmentAmount} onChange={setUserCashAdjustmentAmount} placeholder="1000000" />
            <button
              type="button"
              onClick={() => void adjustUserCashBalance("DEPOSIT")}
              disabled={adjustingUserCashType !== null}
              className="min-h-11 rounded-md bg-[#f04452] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {adjustingUserCashType === "DEPOSIT" ? "입금 중" : "입금"}
            </button>
            <button
              type="button"
              onClick={() => void adjustUserCashBalance("WITHDRAW")}
              disabled={adjustingUserCashType !== null}
              className="min-h-11 rounded-md bg-[#3182f6] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {adjustingUserCashType === "WITHDRAW" ? "회수 중" : "회수"}
            </button>
          </div>
        </section>

        <AutoSignalGuide />

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">프로필 행동 설정</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동 참여자 심리 프로필별 주문 빈도, 호가 공격성, 주문 유지 시간, 수량, 보유 성향, 주기적 현금 유입을 조정합니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">{status?.participantProfileConfigs.length ?? 0}개 프로필</span>
          </div>
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
            <div className="rounded-md border border-white/10 bg-black/15 p-3">
              <DarkSelect label="프로필 선택" value={editingProfileType ?? ""} onChange={selectProfileConfigByType}>
                <option value="">프로필을 선택하세요</option>
                {profileConfigs.map((config) => (
                  <option key={config.profileType} value={config.profileType}>
                    {formatAutoParticipantProfile(config.profileType)}
                  </option>
                ))}
              </DarkSelect>
              <div className="mt-3 grid gap-2 text-xs font-bold text-[#8b95a1]">
                <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
                  <span>전체 프로필</span>
                  <span className="font-black text-white">{profileConfigs.length}개</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
                  <span>선택 상태</span>
                  <span className="font-black text-[#64a8ff]">{selectedProfileConfig ? (selectedProfileConfig.customized ? "커스텀" : "기본값") : "미선택"}</span>
                </div>
	              </div>
            </div>
            {selectedProfileConfig ? (
              <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-black">{selectedProfileOption?.label ?? formatAutoParticipantProfile(selectedProfileConfig.profileType)}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{selectedProfileOption?.description ?? formatAutoParticipantProfileDescription(selectedProfileConfig.profileType)}</p>
                    <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-[#b8c2cc]">{selectedProfileOption?.behavior ?? formatAutoParticipantProfileBehavior(selectedProfileConfig.profileType)}</p>
                  </div>
                  <span className={["rounded-md px-2 py-1 text-xs font-black", selectedProfileConfig.customized ? "bg-[#19324a] text-[#64a8ff]" : "bg-white/10 text-[#b8c2cc]"].join(" ")}>
                    {selectedProfileConfig.customized ? "커스텀" : "기본값"}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-xs font-bold text-[#b8c2cc] sm:grid-cols-2 lg:grid-cols-5">
                  <ProfileMetric label="뉴스" value={formatNumber(selectedProfileConfig.newsWeight)} />
                  <ProfileMetric label="추세" value={formatNumber(selectedProfileConfig.momentumWeight)} />
                  <ProfileMetric label="역추세" value={formatNumber(selectedProfileConfig.contrarianWeight)} />
                  <ProfileMetric label="손실" value={formatNumber(selectedProfileConfig.lossAversionWeight)} />
                  <ProfileMetric label="군중" value={formatNumber(selectedProfileConfig.herdingWeight)} />
                  <ProfileMetric label="조성" value={formatNumber(selectedProfileConfig.marketMakingWeight)} />
                  <ProfileMetric label="과신" value={formatNumber(selectedProfileConfig.overconfidenceWeight)} />
                  <ProfileMetric label="노이즈" value={formatNumber(selectedProfileConfig.noiseWeight)} />
                  <ProfileMetric label="패닉" value={formatNumber(selectedProfileConfig.panicSellWeight)} />
                  <ProfileMetric label="저가매수" value={formatNumber(selectedProfileConfig.dipBuyWeight)} />
                  <ProfileMetric label="주문 빈도" value={`${formatNumber(selectedProfileConfig.orderMultiplier)}배`} />
                  <ProfileMetric label="호가 공격성" value={`${formatNumber(selectedProfileConfig.aggressionMultiplier)}배`} />
                  <ProfileMetric label="TTL" value={`${formatNumber(selectedProfileConfig.orderTtlMultiplier)}배`} />
                  <ProfileMetric label="수량" value={`${formatNumber(selectedProfileConfig.quantityMultiplier)}배`} />
                  <ProfileMetric label="익절" value={formatNumber(selectedProfileConfig.profitTakingWeight)} />
                  <ProfileMetric label="보유 인내" value={formatNumber(selectedProfileConfig.holdingPatienceWeight)} />
	                  <ProfileMetric label="손실 보유" value={formatNumber(selectedProfileConfig.deepLossHoldWeight)} />
	                  <ProfileMetric label="주기 입금" value={formatWon(selectedProfileConfig.recurringDepositAmount)} />
	                  <ProfileMetric label="입금 주기" value={`${formatNumber(selectedProfileConfig.recurringDepositIntervalValue)}${formatRecurringCashIntervalUnit(selectedProfileConfig.recurringDepositIntervalUnit)}`} />
	                  <ProfileMetric label="수정일" value={selectedProfileConfig.updatedAt ? selectedProfileConfig.updatedAt.slice(0, 10) : "-"} />
                </div>
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <DarkInput label="뉴스 민감(0-1)" value={profileNewsWeight} onChange={setProfileNewsWeight} placeholder="0.6" />
                  <DarkInput label="추세 추종(0-1)" value={profileMomentumWeight} onChange={setProfileMomentumWeight} placeholder="0.6" />
                  <DarkInput label="역추세(0-1)" value={profileContrarianWeight} onChange={setProfileContrarianWeight} placeholder="0.6" />
                  <DarkInput label="손실 회피(0-1)" value={profileLossAversionWeight} onChange={setProfileLossAversionWeight} placeholder="0.7" />
                  <DarkInput label="군중 추종(0-1)" value={profileHerdingWeight} onChange={setProfileHerdingWeight} placeholder="0.6" />
                  <DarkInput label="시장 조성(0-1)" value={profileMarketMakingWeight} onChange={setProfileMarketMakingWeight} placeholder="0.9" />
                  <DarkInput label="과신(0-1)" value={profileOverconfidenceWeight} onChange={setProfileOverconfidenceWeight} placeholder="0.6" />
                  <DarkInput label="노이즈(0-1)" value={profileNoiseWeight} onChange={setProfileNoiseWeight} placeholder="0.8" />
                  <DarkInput label="패닉 매도(0-1)" value={profilePanicSellWeight} onChange={setProfilePanicSellWeight} placeholder="0.5" />
                  <DarkInput label="저가 매수(0-1)" value={profileDipBuyWeight} onChange={setProfileDipBuyWeight} placeholder="0.5" />
                  <DarkInput label="주문 빈도(0-5)" value={profileOrderMultiplier} onChange={setProfileOrderMultiplier} placeholder="1" />
                  <DarkInput label="호가 공격성(0-5)" value={profileAggressionMultiplier} onChange={setProfileAggressionMultiplier} placeholder="1" />
                  <DarkInput label="TTL 배율(0.1-10)" value={profileOrderTtlMultiplier} onChange={setProfileOrderTtlMultiplier} placeholder="1" />
                  <DarkInput label="수량 배율(0-5)" value={profileQuantityMultiplier} onChange={setProfileQuantityMultiplier} placeholder="1" />
                  <DarkInput label="보유 인내(0-1)" value={profileHoldingPatienceWeight} onChange={setProfileHoldingPatienceWeight} placeholder="0.5" />
	                  <DarkInput label="손실 보유(0-1)" value={profileDeepLossHoldWeight} onChange={setProfileDeepLossHoldWeight} placeholder="0.5" />
	                  <DarkInput label="익절 성향(0-1)" value={profileProfitTakingWeight} onChange={setProfileProfitTakingWeight} placeholder="0.8" />
	                  <DarkInput label="주기 입금" value={profileRecurringDepositAmount} onChange={setProfileRecurringDepositAmount} placeholder="300000" />
	                  <DarkInput label="입금 주기 값" value={profileRecurringDepositIntervalValue} onChange={setProfileRecurringDepositIntervalValue} placeholder="30" />
	                  <DarkSelect label="입금 주기 단위" value={profileRecurringDepositIntervalUnit} onChange={(value) => setProfileRecurringDepositIntervalUnit(value as RecurringCashIntervalUnit)}>
	                    {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
	                      <option key={option.value} value={option.value}>{option.label}</option>
	                    ))}
	                  </DarkSelect>
	                  <div className="grid grid-cols-2 gap-2 self-end lg:col-span-2">
                    <button type="button" onClick={submitProfileConfig} disabled={savingProfileConfig} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                      {savingProfileConfig ? "저장 중" : "저장"}
                    </button>
                    <button type="button" onClick={() => setEditingProfileType(null)} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                      선택 해제
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs font-bold text-[#8b95a1]">심리 행동 가중치는 0-1 사이이며 실제 매수/매도 판단 방향에 직접 들어갑니다. 주문 빈도, 호가 공격성, TTL, 수량은 행동 결과의 빈도와 크기를 조정하고, 주기 입금은 외부 현금 유입을 시뮬레이션합니다.</p>
              </div>
            ) : (
              <div className="grid min-h-[220px] place-items-center rounded-md border border-dashed border-white/15 bg-black/15 px-4 py-8 text-center">
                <p className="text-sm font-bold text-[#8b95a1]">수정할 프로필을 하나 선택하세요.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">종목별 자동 알고리즘</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">강도 10은 매수 우위로 상승 압력, 강도 1은 매도 우위로 하락 압력을 만듭니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">batch 자동 주문 생성 기준</span>
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
            <DarkSelect label="종목" value={autoConfigSymbol} onChange={(value) => {
              const config = status?.configs.find((item) => item.symbol === value);
              if (config) {
                selectAutoConfigDraft(config);
                return;
              }
              setAutoConfigSymbol(value);
            }}>
              <option value="">선택</option>
              {(status?.configs ?? []).map((config) => (
                <option key={config.symbol} value={config.symbol}>{config.symbol}</option>
              ))}
            </DarkSelect>
            <DarkSelect label="자동장" value={autoConfigEnabled ? "true" : "false"} onChange={(value) => setAutoConfigEnabled(value === "true")}>
              <option value="true">가동</option>
              <option value="false">정지</option>
            </DarkSelect>
            <DarkInput label="강도(1-10)" value={autoIntensity} onChange={setAutoIntensity} placeholder="10" />
            <DarkInput label="최대 수량" value={autoMaxOrderQuantity} onChange={setAutoMaxOrderQuantity} placeholder="4" />
            <DarkInput label="호가 TTL(초)" value={autoOrderTtlSeconds} onChange={setAutoOrderTtlSeconds} placeholder="15" />
            <button type="button" onClick={submitAutoConfig} disabled={updatingAutoConfig} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
              {updatingAutoConfig ? "저장 중" : "저장"}
            </button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">종목</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">가격 방향</th>
                  <th className="px-3 py-2">강도</th>
                  <th className="px-3 py-2">최대 수량</th>
                  <th className="px-3 py-2">TTL</th>
                  <th className="px-3 py-2">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(status?.configs ?? []).map((config) => (
                  <Fragment key={config.symbol}>
                    <tr>
                      <td className="px-3 py-2 font-black">{config.symbol}</td>
                      <td className="px-3 py-2">
                        <EnabledToggleButton
                          enabled={config.enabled}
                          disabled={togglingAutoConfigSymbol === config.symbol}
                          onToggle={() => void toggleAutoConfigEnabled(config)}
                        />
                      </td>
                      <td className="px-3 py-2">{formatAutoIntensityDirection(config.intensity)}</td>
                      <td className="px-3 py-2 tabular-nums">{config.intensity}/10</td>
                      <td className="px-3 py-2 tabular-nums">{config.maxOrderQuantity}주</td>
                      <td className="px-3 py-2 tabular-nums">{config.orderTtlSeconds}초</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => selectAutoConfigDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                          수정
                        </button>
                      </td>
                    </tr>
                    {editingAutoConfigSymbol === config.symbol ? (
                      <tr>
                        <td colSpan={7} className="bg-black/20 px-3 py-3">
                          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[0.9fr_0.9fr_0.9fr_auto_auto]">
                            <DarkSelect label="자동장" value={autoConfigEnabled ? "true" : "false"} onChange={(value) => setAutoConfigEnabled(value === "true")}>
                              <option value="true">가동</option>
                              <option value="false">정지</option>
                            </DarkSelect>
                            <DarkInput label="강도(1-10)" value={autoIntensity} onChange={setAutoIntensity} placeholder="10" />
                            <DarkInput label="최대 수량" value={autoMaxOrderQuantity} onChange={setAutoMaxOrderQuantity} placeholder="4" />
                            <DarkInput label="호가 TTL(초)" value={autoOrderTtlSeconds} onChange={setAutoOrderTtlSeconds} placeholder="15" />
                            <div className="grid grid-cols-2 gap-2 self-end">
                              <button type="button" onClick={submitAutoConfig} disabled={updatingAutoConfig} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                                {updatingAutoConfig ? "저장 중" : "저장"}
                              </button>
                              <button type="button" onClick={() => setEditingAutoConfigSymbol(null)} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                                닫기
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
                {(status?.configs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-[#8b95a1]">자동장 설정 대상 종목이 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">상장주관사 자동계정</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">상장 때 받은 물량을 소량 매도하거나, 매수 전용으로 바꿔 자사주 매입 흐름처럼 운용합니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">{status?.listingAutoAccounts.length ?? 0}개 계정</span>
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
            <DarkSelect label="종목" value={listingAutoSymbol} onChange={(value) => {
              const config = status?.listingAutoAccounts.find((item) => item.symbol === value);
              if (config) {
                selectListingAutoAccountDraft(config);
                return;
              }
              setListingAutoSymbol(value);
            }}>
              <option value="">선택</option>
              {(status?.listingAutoAccounts ?? []).map((config) => (
                <option key={config.symbol} value={config.symbol}>{config.symbol}</option>
              ))}
            </DarkSelect>
            <DarkInput label="표시명" value={listingAutoDisplayName} onChange={setListingAutoDisplayName} placeholder="상장주관사" />
            <DarkSelect label="상태" value={listingAutoEnabled ? "true" : "false"} onChange={(value) => setListingAutoEnabled(value === "true")}>
              <option value="true">가동</option>
              <option value="false">정지</option>
            </DarkSelect>
            <DarkSelect label="포지션" value={listingAutoPositionSide} onChange={(value) => setListingAutoPositionSide(value as ListingAutoPosition)}>
              <option value="SELL_ONLY">매도 전용</option>
              <option value="BUY_ONLY">매수 전용</option>
            </DarkSelect>
            <DarkInput label="최대 수량" value={listingAutoMaxOrderQuantity} onChange={setListingAutoMaxOrderQuantity} placeholder="100" />
            <DarkInput label="TTL(초)" value={listingAutoOrderTtlSeconds} onChange={setListingAutoOrderTtlSeconds} placeholder="30" />
            <DarkInput label="분산 틱" value={listingAutoPriceOffsetTicks} onChange={setListingAutoPriceOffsetTicks} placeholder="3" />
            <button type="button" onClick={submitListingAutoAccountConfig} disabled={updatingListingAutoAccount} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
              {updatingListingAutoAccount ? "저장 중" : "저장"}
            </button>
          </div>
          {selectedListingAutoAccount ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DarkMetric label="주관사 보유 주식" value={`${formatNumber(selectedListingAutoAccount.holdingQuantity)}주`} />
              <DarkMetric label="예약 매도 수량" value={`${formatNumber(selectedListingAutoAccount.reservedQuantity)}주`} />
              <DarkMetric label="가용 매도 수량" value={`${formatNumber(selectedListingAutoAccount.availableQuantity)}주`} />
              <DarkMetric label="주관사 현금" value={formatWon(selectedListingAutoAccount.cashBalance)} />
              <DarkMetric label="평균단가" value={formatWon(selectedListingAutoAccount.averagePrice)} />
              <DarkMetric label="현재가" value={formatWon(selectedListingAutoAccount.currentPrice)} />
              <DarkMetric label="보유 평가액" value={formatWon(selectedListingAutoAccount.marketValue)} />
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-[#8b95a1]">
              종목을 선택하면 상장주관사 자동계정의 실제 보유 주식, 예약 수량, 가용 수량, 현금, 평가액을 확인할 수 있습니다.
            </div>
          )}
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[1180px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">종목</th>
                  <th className="px-3 py-2">계정</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">보유/예약</th>
                  <th className="px-3 py-2">가용</th>
                  <th className="px-3 py-2">현금</th>
                  <th className="px-3 py-2">평가액</th>
                  <th className="px-3 py-2">운용 설정</th>
                  <th className="px-3 py-2">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(status?.listingAutoAccounts ?? []).map((config) => (
                  <Fragment key={config.symbol}>
                    <tr>
                      <td className="px-3 py-2 font-black">{config.symbol}</td>
                      <td className="px-3 py-2">
                        <p className="font-black">{config.displayName}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{config.userKey}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#5f6b76]">계좌 ID {config.accountId ?? "-"}</p>
                      </td>
                      <td className="px-3 py-2">{config.enabled ? "가동" : "정지"}</td>
                      <td className="px-3 py-2 tabular-nums">
                        <p className="font-black">{formatNumber(config.holdingQuantity)}주</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">예약 {formatNumber(config.reservedQuantity)}주</p>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{formatNumber(config.availableQuantity)}주</td>
                      <td className="px-3 py-2 tabular-nums">{formatWon(config.cashBalance)}</td>
                      <td className="px-3 py-2 tabular-nums">
                        <p className="font-black">{formatWon(config.marketValue)}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">현재가 {formatWon(config.currentPrice)}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-black">{formatListingAutoPosition(config.positionSide)}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                          최대 {formatNumber(config.maxOrderQuantity)}주 · {config.orderTtlSeconds}초 · {config.priceOffsetTicks}틱
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => selectListingAutoAccountDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                          수정
                        </button>
                      </td>
                    </tr>
                    {editingListingAutoSymbol === config.symbol ? (
                      <tr>
                        <td colSpan={9} className="bg-black/20 px-3 py-3">
                          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
                            <DarkInput label="표시명" value={listingAutoDisplayName} onChange={setListingAutoDisplayName} placeholder="상장주관사" />
                            <DarkSelect label="상태" value={listingAutoEnabled ? "true" : "false"} onChange={(value) => setListingAutoEnabled(value === "true")}>
                              <option value="true">가동</option>
                              <option value="false">정지</option>
                            </DarkSelect>
                            <DarkSelect label="포지션" value={listingAutoPositionSide} onChange={(value) => setListingAutoPositionSide(value as ListingAutoPosition)}>
                              <option value="SELL_ONLY">매도 전용</option>
                              <option value="BUY_ONLY">매수 전용</option>
                            </DarkSelect>
                            <DarkInput label="최대 수량" value={listingAutoMaxOrderQuantity} onChange={setListingAutoMaxOrderQuantity} placeholder="100" />
                            <DarkInput label="TTL(초)" value={listingAutoOrderTtlSeconds} onChange={setListingAutoOrderTtlSeconds} placeholder="30" />
                            <DarkInput label="분산 틱" value={listingAutoPriceOffsetTicks} onChange={setListingAutoPriceOffsetTicks} placeholder="3" />
                            <div className="grid grid-cols-2 gap-2 self-end">
                              <button type="button" onClick={submitListingAutoAccountConfig} disabled={updatingListingAutoAccount} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                                {updatingListingAutoAccount ? "저장 중" : "저장"}
                              </button>
                              <button type="button" onClick={() => setEditingListingAutoSymbol(null)} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                                닫기
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
                {(status?.listingAutoAccounts ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-[#8b95a1]">상장주관사 자동계정이 없습니다. 상장 이벤트를 먼저 적용하세요.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">참여자별 종목 전략</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">같은 종목이라도 참여자마다 강도 1-10을 다르게 설정합니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">{status?.participantSymbolConfigs.length ?? 0}개 전략</span>
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto]">
            <DarkSelect label="참여자" value={strategyUserKey} onChange={(value) => {
              setStrategyUserKey(value);
            }}>
              <option value="">선택</option>
              {(status?.participants ?? []).map((participant) => (
                <option key={participant.userKey} value={participant.userKey}>{participant.displayName}</option>
              ))}
            </DarkSelect>
            <DarkSelect label="종목" value={strategySymbol} onChange={(value) => {
              setStrategySymbol(value);
              const config = autoConfigBySymbol.get(value);
              if (config) {
                setStrategyIntensity(String(config.intensity));
              }
            }}>
              <option value="">선택</option>
              {(status?.configs ?? []).map((config) => (
                <option key={config.symbol} value={config.symbol}>{config.symbol}</option>
              ))}
            </DarkSelect>
            <DarkSelect label="전략" value={strategyEnabled ? "true" : "false"} onChange={(value) => setStrategyEnabled(value === "true")}>
              <option value="true">가동</option>
              <option value="false">정지</option>
            </DarkSelect>
            <DarkInput label="강도(1-10)" value={strategyIntensity} onChange={setStrategyIntensity} placeholder="10" />
            <button type="button" onClick={submitAutoStrategy} disabled={savingStrategy} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
              {savingStrategy ? "저장 중" : "저장"}
            </button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">참여자</th>
                  <th className="px-3 py-2">종목</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">가격 방향</th>
                  <th className="px-3 py-2">강도</th>
                  <th className="px-3 py-2">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(status?.participantSymbolConfigs ?? []).map((config) => {
                  const participant = autoParticipantByUserKey.get(config.userKey);
                  const rowKey = `${config.userKey}:${config.symbol}`;
                  return (
                    <Fragment key={rowKey}>
                      <tr>
                        <td className="px-3 py-2">
                          <p className="font-black">{participant?.displayName ?? config.userKey}</p>
                          <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{config.userKey}</p>
                        </td>
                        <td className="px-3 py-2 font-black">{config.symbol}</td>
                        <td className="px-3 py-2">
                          <EnabledToggleButton
                            enabled={config.enabled}
                            disabled={togglingStrategyKey === rowKey}
                            onToggle={() => void toggleAutoStrategyEnabled(config)}
                          />
                        </td>
                        <td className="px-3 py-2">{formatAutoIntensityDirection(config.intensity)}</td>
                        <td className="px-3 py-2 tabular-nums">{config.intensity}/10</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => selectAutoStrategyDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                            수정
                          </button>
                        </td>
                      </tr>
                      {editingStrategyKey === rowKey ? (
                        <tr>
                          <td colSpan={6} className="bg-black/20 px-3 py-3">
                            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_auto]">
                              <DarkSelect label="전략" value={strategyEnabled ? "true" : "false"} onChange={(value) => setStrategyEnabled(value === "true")}>
                                <option value="true">가동</option>
                                <option value="false">정지</option>
                              </DarkSelect>
                              <DarkInput label="강도(1-10)" value={strategyIntensity} onChange={setStrategyIntensity} placeholder="10" />
                              <div className="grid gap-1 text-xs font-bold text-[#b8c2cc]">
                                대상
                                <div className="rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-black text-white">
                                  {participant?.displayName ?? config.userKey} · {config.symbol}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 self-end">
                                <button type="button" onClick={submitAutoStrategy} disabled={savingStrategy} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                                  {savingStrategy ? "저장 중" : "저장"}
                                </button>
                                <button type="button" onClick={() => setEditingStrategyKey(null)} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                                  닫기
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {(status?.participantSymbolConfigs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-[#8b95a1]">아직 참여자별 종목 전략이 없습니다. 참여자와 종목을 선택해 먼저 저장하세요.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">배치 자동 실행 제어</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">
                배치 서버는 실행 직전에 DB 런타임 값을 읽습니다. 스케줄러 설정은 서버 설정값이고, DB 런타임은 운영 중 중지/재개 값입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadBatchJobRuntimeControls(true)}
              disabled={loadingBatchJobRuntimeControls}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white disabled:cursor-wait disabled:opacity-55"
            >
              {loadingBatchJobRuntimeControls ? "조회 중" : "전체 상태 새로고침"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <BatchRuntimeMetric label="전체 배치" value={`${batchRuntimeSummary.total.toLocaleString("ko-KR")}개`} tone="neutral" />
            <BatchRuntimeMetric label="자동 실행" value={`${batchRuntimeSummary.effective.toLocaleString("ko-KR")}개`} tone="good" />
            <BatchRuntimeMetric label="DB 중지" value={`${batchRuntimeSummary.runtimeOff.toLocaleString("ko-KR")}개`} tone="danger" />
            <BatchRuntimeMetric label="설정 OFF" value={`${batchRuntimeSummary.schedulerOff.toLocaleString("ko-KR")}개`} tone="muted" />
          </div>

          {batchJobRuntimeControls.length > 0 ? (
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
              {batchJobRuntimeControls.map((control) => {
                const label = BATCH_JOB_RUNTIME_LABELS[control.jobName] ?? { label: control.jobName, description: "등록된 배치 자동 실행 제어입니다." };
                const updating = updatingBatchJobName === control.jobName;
                return (
                  <BatchRuntimeControlCard
                    key={control.jobName}
                    control={control}
                    label={label.label}
                    description={label.description}
                    updating={updating}
                    onStart={() => void setBatchJobRuntime(control.jobName, true)}
                    onStop={() => void setBatchJobRuntime(control.jobName, false)}
                    manualAction={control.jobName === "auto-participant-cash-flow" ? {
                      label: "수동 월급 지급",
                      busyLabel: "지급 실행 중",
                      description: "자동 실행이 중지되어 있어도 관리자가 명시적으로 한 번 지급할 때 사용합니다. 대상은 가동 자동참여자와 ACTIVE 계좌입니다.",
                      running: runningCashFlow,
                      resultText: lastCashFlowRun ? `${lastCashFlowRun.status} · ${lastCashFlowRun.processedCount.toLocaleString("ko-KR")}건` : "-",
                      onRun: () => void runAutoParticipantCashFlowNow(),
                    } : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#8b95a1]">
              배치 자동 실행 상태를 아직 조회하지 않았습니다. 배치 서버가 켜져 있으면 전체 상태 새로고침으로 현재 스케줄러 설정과 DB 런타임 값을 확인할 수 있습니다.
            </div>
          )}
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">자동 참여자</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">
                {isEditingAutoParticipant
                  ? "선택한 참여자의 프로필과 가동 상태를 수정 중입니다. 새 참여자는 신규 등록으로 전환해 입력합니다."
                  : "참여자 등록은 프로필과 가동 상태만 저장하고, 운용 현금은 선택 후 입금/회수로 조정합니다."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isEditingAutoParticipant ? (
                <button type="button" onClick={resetAutoParticipantDraft} className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white">
                  신규 등록
                </button>
              ) : null}
              <span className="text-xs font-bold text-[#64a8ff]">{status?.participants.length ?? 0}명 등록</span>
            </div>
          </div>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.2fr_1.1fr_0.8fr_0.9fr_0.75fr_0.75fr_auto]">
            <DarkInput label="참여자 키" value={autoParticipantUserKey} onChange={setAutoParticipantUserKey} placeholder="stock-auto-001" disabled={isEditingAutoParticipant} />
            <DarkInput label="표시명" value={autoParticipantDisplayName} onChange={setAutoParticipantDisplayName} placeholder="자동 참여자 1" />
            <DarkSelect label="심리 프로필" value={autoParticipantProfileType} onChange={(value) => setAutoParticipantProfileType(value as AutoParticipantProfileType)}>
              {AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => (
                <option key={profile.value} value={profile.value}>{profile.label}</option>
              ))}
            </DarkSelect>
            <DarkSelect label="상태" value={autoParticipantEnabled ? "true" : "false"} onChange={(value) => setAutoParticipantEnabled(value === "true")}>
              <option value="true">가동</option>
              <option value="false">정지</option>
            </DarkSelect>
            <DarkInput label="개별 월급/현금" value={autoParticipantRecurringCashAmount} onChange={setAutoParticipantRecurringCashAmount} placeholder="비우면 프로필" />
            <DarkInput label="주기 값" value={autoParticipantRecurringCashIntervalValue} onChange={setAutoParticipantRecurringCashIntervalValue} placeholder="0.5" />
            <DarkSelect label="주기 단위" value={autoParticipantRecurringCashIntervalUnit} onChange={(value) => setAutoParticipantRecurringCashIntervalUnit(value as RecurringCashIntervalUnit)}>
              {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </DarkSelect>
            <button type="button" onClick={submitAutoParticipant} disabled={savingAutoParticipant} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
              {savingAutoParticipant ? "저장 중" : isEditingAutoParticipant ? "상태 저장" : "등록"}
            </button>
          </div>
          <div className="mt-3 rounded-md bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-[#b8c2cc]">
            <span className="text-white">{formatAutoParticipantProfile(autoParticipantProfileType)}</span>
            <span className="mx-2 text-[#5a6572]">/</span>
            <span>{formatAutoParticipantProfileDescription(autoParticipantProfileType)}</span>
            <span className="mx-2 text-[#5a6572]">/</span>
            <span>{formatAutoParticipantProfileBehavior(autoParticipantProfileType)}</span>
          </div>
	          {!isEditingAutoParticipant ? (
	            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
	              <div className="flex flex-wrap items-start justify-between gap-3">
	                <div>
	                  <p className="text-sm font-black text-white">자동 생성</p>
	                  <p className="mt-1 text-xs font-bold text-[#8b95a1]">다음 번호부터 참여자를 여러 명 만들고, 심리 프로필을 순서대로 분산하거나 하나의 프로필로 고정합니다.</p>
	                </div>
	                <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#64a8ff]">계좌/현금은 기존 흐름 유지</span>
	              </div>
	              <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[0.7fr_1fr_1fr_0.9fr_1.2fr_auto]">
	                <DarkInput label="생성 인원" value={autoGenerateCount} onChange={setAutoGenerateCount} placeholder="5" />
	                <DarkInput label="키 접두어" value={autoGenerateKeyPrefix} onChange={setAutoGenerateKeyPrefix} placeholder="stock-auto-" />
	                <DarkInput label="표시명 접두어" value={autoGenerateDisplayPrefix} onChange={setAutoGenerateDisplayPrefix} placeholder="자동 참여자" />
	                <DarkSelect label="프로필 적용" value={autoGenerateProfileMode} onChange={(value) => setAutoGenerateProfileMode(value as "ROTATE" | "SINGLE")}>
	                  <option value="ROTATE">순서 분산</option>
	                  <option value="SINGLE">단일 프로필</option>
	                </DarkSelect>
	                <DarkSelect
	                  label="단일 프로필"
	                  value={autoGenerateProfileType}
	                  onChange={(value) => setAutoGenerateProfileType(value as AutoParticipantProfileType)}
	                  disabled={autoGenerateProfileMode !== "SINGLE"}
	                >
	                  {AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => (
	                    <option key={profile.value} value={profile.value}>{profile.label}</option>
	                  ))}
	                </DarkSelect>
	                <button
	                  type="button"
	                  onClick={() => void generateAutoParticipants()}
	                  disabled={generatingAutoParticipants || savingAutoParticipant}
	                  className="min-h-11 self-end rounded-md bg-[#3182f6] px-3 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-55 sm:col-span-2 lg:col-span-1"
	                >
	                  {generatingAutoParticipants ? "생성 중" : "자동 등록"}
	                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[1120px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">참여자</th>
	                  <th className="px-3 py-2">프로필</th>
	                  <th className="px-3 py-2">상태</th>
	                  <th className="px-3 py-2">개별 월급/현금</th>
	                  <th className="px-3 py-2">현재 현금</th>
                  <th className="px-3 py-2">수정일</th>
                  <th className="px-3 py-2">수정</th>
                  <th className="px-3 py-2">탈퇴</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(status?.participants ?? []).map((participant) => (
                  <Fragment key={participant.userKey}>
                    <tr>
                      <td className="px-3 py-2">
                        <p className="font-black">{participant.displayName}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{participant.userKey}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-black">{formatAutoParticipantProfile(participant.profileType)}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{formatAutoParticipantProfileDescription(participant.profileType)}</p>
                        <p className="mt-1 max-w-[340px] text-xs font-bold leading-5 text-[#b8c2cc]">{formatAutoParticipantProfileBehavior(participant.profileType)}</p>
                      </td>
                      <td className="px-3 py-2">
                        <EnabledToggleButton
                          enabled={participant.enabled}
                          disabled={togglingAutoParticipantUserKey === participant.userKey}
                          onToggle={() => void toggleAutoParticipantEnabled(participant)}
	                        />
	                      </td>
	                      <td className="px-3 py-2 text-[#b8c2cc]">{formatParticipantRecurringCash(participant)}</td>
	                      <td className="px-3 py-2 tabular-nums">{participant.cashBalance == null ? "계좌 미개설" : formatWon(participant.cashBalance)}</td>
                      <td className="px-3 py-2 text-[#b8c2cc]">{formatDateTime(participant.updatedAt)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => selectAutoParticipantDraft(participant)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                          수정
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void withdrawAutoParticipantRow(participant)}
                          disabled={withdrawingAutoParticipantUserKey === participant.userKey}
                          className="rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8] disabled:cursor-wait disabled:opacity-55"
                        >
                          {withdrawingAutoParticipantUserKey === participant.userKey ? "처리 중" : "탈퇴"}
                        </button>
                      </td>
                    </tr>
                    {editingAutoParticipantUserKey === participant.userKey ? (
                      <tr>
	                        <td colSpan={8} className="bg-black/20 px-3 py-3">
	                          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_0.8fr_0.9fr_0.75fr_0.75fr_auto]">
	                            <DarkInput label="표시명" value={autoParticipantDisplayName} onChange={setAutoParticipantDisplayName} placeholder="자동 참여자 1" />
	                            <DarkSelect label="심리 프로필" value={autoParticipantProfileType} onChange={(value) => setAutoParticipantProfileType(value as AutoParticipantProfileType)}>
                              {AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => (
                                <option key={profile.value} value={profile.value}>{profile.label}</option>
                              ))}
                            </DarkSelect>
                            <DarkSelect label="상태" value={autoParticipantEnabled ? "true" : "false"} onChange={(value) => setAutoParticipantEnabled(value === "true")}>
	                              <option value="true">가동</option>
	                              <option value="false">정지</option>
	                            </DarkSelect>
	                            <DarkInput label="개별 월급/현금" value={autoParticipantRecurringCashAmount} onChange={setAutoParticipantRecurringCashAmount} placeholder="비우면 프로필" />
	                            <DarkInput label="주기 값" value={autoParticipantRecurringCashIntervalValue} onChange={setAutoParticipantRecurringCashIntervalValue} placeholder="0.5" />
	                            <DarkSelect label="주기 단위" value={autoParticipantRecurringCashIntervalUnit} onChange={(value) => setAutoParticipantRecurringCashIntervalUnit(value as RecurringCashIntervalUnit)}>
	                              {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
	                                <option key={option.value} value={option.value}>{option.label}</option>
	                              ))}
	                            </DarkSelect>
	                            <div className="grid grid-cols-2 gap-2 self-end">
                              <button type="button" onClick={submitAutoParticipant} disabled={savingAutoParticipant} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                                {savingAutoParticipant ? "저장 중" : "저장"}
                              </button>
                              <button type="button" onClick={resetAutoParticipantDraft} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                                닫기
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 border-t border-white/10 pt-3 sm:grid-cols-[1.2fr_1fr_auto_auto]">
                            <div className="min-w-0 self-center">
                              <p className="text-xs font-bold text-[#8b95a1]">선택 참여자 실제 계좌</p>
                              <p className="mt-1 break-all text-sm font-black text-white">{participant.displayName} · {participant.userKey}</p>
                              <p className="mt-1 text-xs font-bold text-[#b8c2cc]">
                                {formatAutoParticipantProfile(participant.profileType)} · 현재 현금 {participant.cashBalance == null ? "계좌 미개설" : formatWon(participant.cashBalance)}
                              </p>
                            </div>
                            <DarkInput label="입금/회수 금액" value={cashAdjustmentAmount} onChange={setCashAdjustmentAmount} placeholder="1000000" />
                            <button
                              type="button"
                              onClick={() => void adjustAutoParticipantCashBalance("DEPOSIT")}
                              disabled={Boolean(adjustingCashType)}
                              className="min-h-11 self-end rounded-md bg-[#3182f6] px-3 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-55"
                            >
                              {adjustingCashType === "DEPOSIT" ? "입금 중" : "입금"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void adjustAutoParticipantCashBalance("WITHDRAW")}
                              disabled={Boolean(adjustingCashType)}
                              className="min-h-11 self-end rounded-md bg-[#3a1f1b] px-3 py-3 text-sm font-black text-[#ffb4a8] disabled:cursor-wait disabled:opacity-55"
                            >
                              {adjustingCashType === "WITHDRAW" ? "회수 중" : "회수"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
                {(status?.participants ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-[#8b95a1]">등록된 자동 참여자가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">주식 이벤트 발생</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">신규 상장과 상장 후 이벤트를 같은 흐름에서 적용합니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">{actionType === "INITIAL_ISSUE" ? "신규 종목" : "기존 종목"}</span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_2fr]">
            <DarkSelect label="이벤트 종류" value={actionType} onChange={(value) => setActionType(value as CorporateActionType)}>
              <option value="INITIAL_ISSUE">신규 상장</option>
              <option value="PAID_IN_CAPITAL_INCREASE">유상증자</option>
              <option value="ADDITIONAL_ISSUE">추가발행</option>
              <option value="STOCK_SPLIT">액면분할</option>
              <option value="CASH_DIVIDEND">현금배당</option>
              <option value="BONUS_ISSUE">무상증자</option>
              <option value="STOCK_DIVIDEND">주식배당</option>
              <option value="DELISTING">상장폐지</option>
            </DarkSelect>
            {actionType === "INITIAL_ISSUE" ? (
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#8b95a1]">
                종목과 INITIAL_ISSUE 원장, 상장주관사 자동계정을 함께 생성합니다.
              </div>
            ) : (
              <DarkSelect label="종목" value={actionSymbol} onChange={(value) => {
                setActionSymbol(value);
                if (!value) {
                  setCorporateActions([]);
                }
              }}>
                <option value="">선택</option>
                {instruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>{instrument.symbol}</option>
                ))}
              </DarkSelect>
            )}
            {actionType === "DELISTING" ? (
              <div className="rounded-md border border-[#f04452]/30 bg-[#3a1f1b] px-3 py-2 text-xs font-bold text-[#ffb4a8]">
                ZERO_VALUE: 상장폐지일에 거래를 중단하고 보유 평가금액을 0원으로 반영합니다.
              </div>
            ) : (
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#8b95a1]">
                {actionType === "INITIAL_ISSUE" ? "초기 전량 매도벽 없이 주관사 자동계정이 호가를 공급합니다." : "가격과 수량을 조정하는 이벤트는 열린 주문 정책을 먼저 검증합니다."}
              </div>
            )}
          </div>

          {actionType === "INITIAL_ISSUE" ? (
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DarkFormInput label="종목 코드" registration={createInstrumentForm.register("symbol")} placeholder="예: DEMO001" error={createInstrumentForm.formState.errors.symbol?.message} />
              <DarkFormInput label="종목명" registration={createInstrumentForm.register("name")} placeholder="예: 제로큐 주문장" error={createInstrumentForm.formState.errors.name?.message} className="sm:col-span-2 lg:col-span-2" />
              <DarkFormInput label="시장" registration={createInstrumentForm.register("market")} placeholder="ORDERBOOK" error={createInstrumentForm.formState.errors.market?.message} />
              <DarkFormInput label="초기 가격" registration={createInstrumentForm.register("initialPrice")} placeholder="70000" error={createInstrumentForm.formState.errors.initialPrice?.message} />
              <DarkFormInput label="발행주식수" registration={createInstrumentForm.register("issuedShares")} placeholder="100000" error={createInstrumentForm.formState.errors.issuedShares?.message} />
              <DarkFormInput label="호가 단위" registration={createInstrumentForm.register("tickSize")} placeholder="1" error={createInstrumentForm.formState.errors.tickSize?.message} />
              <DarkFormInput label="가격제한폭(%)" registration={createInstrumentForm.register("priceLimitRate")} placeholder="30" error={createInstrumentForm.formState.errors.priceLimitRate?.message} />
              <DarkFormInput label="주관사 표시명" registration={createInstrumentForm.register("listingAutoDisplayName")} placeholder="미입력 시 자동 생성" error={createInstrumentForm.formState.errors.listingAutoDisplayName?.message} className="sm:col-span-2" />
              <DarkFormSelect label="주관사 상태" registration={createInstrumentForm.register("listingAutoEnabled")}>
                <option value="true">가동</option>
                <option value="false">정지</option>
              </DarkFormSelect>
              <DarkFormSelect label="주관사 포지션" registration={createInstrumentForm.register("listingAutoPositionSide")}>
                <option value="SELL_ONLY">매도 전용</option>
                <option value="BUY_ONLY">매수 전용</option>
              </DarkFormSelect>
              <DarkFormInput label="주관사 최대 수량" registration={createInstrumentForm.register("listingAutoMaxOrderQuantity")} placeholder="100" error={createInstrumentForm.formState.errors.listingAutoMaxOrderQuantity?.message} />
              <DarkFormInput label="주관사 호가 TTL(초)" registration={createInstrumentForm.register("listingAutoOrderTtlSeconds")} placeholder="30" error={createInstrumentForm.formState.errors.listingAutoOrderTtlSeconds?.message} />
              <DarkFormInput label="가격 분산 틱" registration={createInstrumentForm.register("listingAutoPriceOffsetTicks")} placeholder="3" error={createInstrumentForm.formState.errors.listingAutoPriceOffsetTicks?.message} />
              <button type="button" onClick={submitStockEvent} disabled={createInstrumentMutation.isPending} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
                {createInstrumentMutation.isPending ? "적용 중" : "이벤트 적용"}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
                {actionType === "STOCK_SPLIT" ? (
                  <>
                    <DarkInput label="분할 전" value={splitFrom} onChange={setSplitFrom} placeholder="1" />
                    <DarkInput label="분할 후" value={splitTo} onChange={setSplitTo} placeholder="5" />
                    <div />
                  </>
                ) : actionType === "CASH_DIVIDEND" ? (
                  <>
                    <DarkInput label="1주당 배당금" value={actionDividendAmount} onChange={setActionDividendAmount} placeholder="1000" />
                    <div />
                    <div />
                  </>
                ) : actionType === "BONUS_ISSUE" || actionType === "STOCK_DIVIDEND" ? (
                  <>
                    <DarkInput label="배정 주식수" value={actionShares} onChange={setActionShares} placeholder="10000" />
                    <div />
                    <div />
                  </>
                ) : actionType === "DELISTING" ? (
                  <>
                    <DarkInput label="상장폐지일" value={delistingDate} onChange={setDelistingDate} placeholder="2026-06-26" type="date" />
                    <div />
                    <div />
                  </>
                ) : (
                  <>
                    <DarkInput label="발행수" value={actionShares} onChange={setActionShares} placeholder="50000" />
                    <DarkInput label="발행가" value={actionIssuePrice} onChange={setActionIssuePrice} placeholder="50000" />
                    <div />
                  </>
                )}
                <DarkInput label="메모" value={actionDescription} onChange={setActionDescription} placeholder="선택 입력" />
                <button type="button" onClick={submitStockEvent} disabled={applyingAction} className="rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                  {applyingAction ? "적용 중" : "이벤트 적용"}
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {actionType === "PAID_IN_CAPITAL_INCREASE" ? (
                  <>
                    <DarkInput label="권리락일" value={exRightsDate} onChange={setExRightsDate} placeholder="2026-06-22" type="date" />
                    <DarkInput label="납입일" value={paymentDate} onChange={setPaymentDate} placeholder="2026-06-24" type="date" />
                    <DarkInput label="신주상장일" value={listingDate} onChange={setListingDate} placeholder="2026-06-26" type="date" />
                  </>
                ) : null}
                {actionType === "ADDITIONAL_ISSUE" ? (
                  <DarkInput label="신주상장일" value={listingDate} onChange={setListingDate} placeholder="2026-06-26" type="date" />
                ) : null}
                {actionType === "STOCK_SPLIT" ? (
                  <DarkInput label="효력일" value={listingDate} onChange={setListingDate} placeholder="2026-06-26" type="date" />
                ) : null}
                {actionType === "CASH_DIVIDEND" ? (
                  <>
                    <DarkInput label="배당락일" value={exRightsDate} onChange={setExRightsDate} placeholder="2026-06-22" type="date" />
                    <DarkInput label="지급일" value={paymentDate} onChange={setPaymentDate} placeholder="2026-06-26" type="date" />
                  </>
                ) : null}
                {actionType === "BONUS_ISSUE" || actionType === "STOCK_DIVIDEND" ? (
                  <>
                    <DarkInput label="권리락일" value={exRightsDate} onChange={setExRightsDate} placeholder="2026-06-22" type="date" />
                    <DarkInput label="신주상장일" value={listingDate} onChange={setListingDate} placeholder="2026-06-26" type="date" />
                  </>
                ) : null}
              </div>
            </>
          )}
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">종목 평가 보고서</h2>
              <p className="mt-1 text-xs font-bold text-[#8b95a1]">최신 보고서 점수는 자동 참여자 성향과 함께 자동장 매수/매도 압력에 반영됩니다.</p>
            </div>
            <span className="text-xs font-bold text-[#64a8ff]">{instrumentReports.length}개 이벤트</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.3fr_0.6fr]">
            <DarkSelect label="종목" value={reportSymbol} onChange={(value) => {
              setReportSymbol(value);
              if (!value) {
                setInstrumentReports([]);
              }
            }}>
              <option value="">선택</option>
              {instruments.map((instrument) => (
                <option key={instrument.symbol} value={instrument.symbol}>{instrument.symbol}</option>
              ))}
            </DarkSelect>
            <DarkInput label="제목" value={reportTitle} onChange={setReportTitle} placeholder="예: 수요 회복에 따른 상향 보고서" />
            <DarkInput label="점수(1-10)" value={reportScore} onChange={setReportScore} placeholder="8" />
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <DarkInput label="요약" value={reportSummary} onChange={setReportSummary} placeholder="핵심 투자 판단을 입력" className="lg:col-span-3" />
            <DarkInput label="상승 이유(선택)" value={reportRiseReason} onChange={setReportRiseReason} placeholder="가격이 오를 수 있는 이유" />
            <DarkInput label="하락 이유(선택)" value={reportFallReason} onChange={setReportFallReason} placeholder="가격이 떨어질 수 있는 이유" />
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => void submitInstrumentReport("publish")} disabled={savingReport} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                {savingReport ? "저장 중" : "발행"}
              </button>
              <button type="button" onClick={() => void submitInstrumentReport("update")} disabled={savingReport} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white disabled:opacity-50">
                수정
              </button>
              <button type="button" onClick={() => void removeInstrumentReport()} disabled={deletingReport} className="min-h-11 rounded-md bg-[#3a1f1b] px-3 py-3 text-sm font-black text-[#ffb4a8] disabled:opacity-50">
                {deletingReport ? "삭제 중" : "삭제"}
              </button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[900px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">이벤트</th>
                  <th className="px-3 py-2">보고서</th>
                  <th className="px-3 py-2">점수</th>
                  <th className="px-3 py-2">상승/하락 이유</th>
                  <th className="px-3 py-2">등록</th>
                  <th className="px-3 py-2">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {instrumentReports.map((report, index) => (
                  <tr key={report.id}>
                    <td className="px-3 py-2">
                      <p className="font-black">{formatReportEventType(report.eventType)}</p>
                      {index === 0 ? <p className="mt-0.5 text-xs font-bold text-[#64a8ff]">최신 기준</p> : null}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-black">{report.title ?? report.deleteReason ?? "-"}</p>
                      <p className="mt-1 max-h-10 overflow-hidden text-xs font-semibold text-[#b8c2cc]">{report.summary ?? "-"}</p>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{report.score ? `${report.score}/10` : "-"}</td>
                    <td className="px-3 py-2 text-xs text-[#b8c2cc]">
                      <p>상승: {report.riseReason ?? "-"}</p>
                      <p className="mt-1">하락: {report.fallReason ?? "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-[#b8c2cc]">
                      <p>{formatDateTime(report.createdAt)}</p>
                      <p className="mt-0.5 text-xs">{report.createdBy ?? "-"}</p>
                    </td>
                    <td className="px-3 py-2">
                      {report.eventType !== "DELETE" ? (
                        <button type="button" onClick={() => fillReportDraft(report)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                          선택
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-[#8b95a1]">삭제 이벤트</span>
                      )}
                    </td>
                  </tr>
                ))}
                {instrumentReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-[#8b95a1]">선택한 종목의 평가 보고서가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-black">선택 종목 이벤트 이력</h2>
            <span className="text-xs font-bold text-[#8b95a1]">{actionSymbol || "종목 선택 필요"}</span>
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[720px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">이벤트</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">수량/금액</th>
                  <th className="px-3 py-2">가격 조정</th>
                  <th className="px-3 py-2">일정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {corporateActions.map((action) => (
                  <tr key={action.id}>
                    <td className="px-3 py-2 font-black">{formatCorporateActionType(action.actionType)}</td>
                    <td className="px-3 py-2">{formatCorporateActionStatus(action.status)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatCorporateActionValue(action)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatCorporateActionPrice(action)}</td>
                    <td className="px-3 py-2 text-[#b8c2cc]">{formatCorporateActionSchedule(action)}</td>
                  </tr>
                ))}
                {corporateActions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-[#8b95a1]">선택한 종목의 이벤트 이력이 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-5 overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-[900px] w-full border-collapse text-sm">
            <thead className="bg-white/10 text-left text-[#b8c2cc]">
              <tr>
                <th className="px-4 py-3">주문장 종목</th>
                <th className="px-4 py-3">시장</th>
                <th className="px-4 py-3">장 상태</th>
                <th className="px-4 py-3">발행주식수</th>
                <th className="px-4 py-3">유통주식수</th>
                <th className="px-4 py-3">현재가</th>
                <th className="px-4 py-3">기준가</th>
                <th className="px-4 py-3">호가/제한폭</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {instruments.map((instrument) => {
                const config = orderBookConfigBySymbol.get(instrument.symbol);
                const marketStatus = config?.marketStatus ?? "OPEN";
                return (
                  <tr key={instrument.symbol}>
                    <td className="px-4 py-3 font-black">{instrument.name} · {instrument.symbol}</td>
                    <td className="px-4 py-3">{instrument.market}</td>
                    <td className="px-4 py-3">
                      <select
                        value={marketStatus}
                        onChange={(event) => void changeOrderBookMarketStatus(instrument.symbol, event.target.value as MarketSessionStatus)}
                        disabled={updatingStatusSymbol === instrument.symbol}
                        className="rounded-md border border-white/10 bg-[#161b21] px-2 py-2 text-xs font-black text-white disabled:opacity-50"
                      >
                        <option value="OPEN">정규장</option>
                        <option value="CLOSED">마감</option>
                        <option value="HALTED">거래정지</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{instrument.issuedShares.toLocaleString("ko-KR")}주</td>
                    <td className="px-4 py-3 tabular-nums">{instrument.tradableShares.toLocaleString("ko-KR")}주</td>
                    <td className="px-4 py-3 tabular-nums">{formatWon(instrument.currentPrice)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatWon(instrument.initialPrice)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(instrument.tickSize)}원 / {formatNumber(instrument.priceLimitRate)}%</td>
                  </tr>
                );
              })}
              {instruments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-5 text-[#8b95a1]">아직 생성된 수요와 공급 종목이 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function DarkSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`grid min-w-0 gap-1 text-xs font-bold ${disabled ? "text-[#66717d]" : "text-[#b8c2cc]"}`}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#64a8ff] disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-[#101418] disabled:text-[#66717d]"
      >
        {children}
      </select>
    </label>
  );
}

function RuntimeBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span className={active ? "inline-flex rounded-md bg-[#123820] px-2 py-1 text-xs font-black text-[#6ee7a8]" : "inline-flex rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8]"}>
      {active ? activeText : inactiveText}
    </span>
  );
}

function BatchRuntimeMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "good" | "danger" | "muted";
}) {
  const toneClassName = {
    neutral: "border-white/10 bg-black/20 text-white",
    good: "border-[#1f6f45]/40 bg-[#123820]/60 text-[#6ee7a8]",
    danger: "border-[#7c2c22]/50 bg-[#3a1f1b]/80 text-[#ffb4a8]",
    muted: "border-white/10 bg-white/[0.04] text-[#b8c2cc]",
  }[tone];

  return (
    <div className={`min-w-0 rounded-md border p-3 ${toneClassName}`}>
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function BatchRuntimeControlCard({
  control,
  label,
  description,
  updating,
  onStart,
  onStop,
  manualAction,
}: {
  control: BatchJobRuntimeStatus;
  label: string;
  description: string;
  updating: boolean;
  onStart: () => void;
  onStop: () => void;
  manualAction?: {
    label: string;
    busyLabel: string;
    description: string;
    running: boolean;
    resultText: string;
    onRun: () => void;
  };
}) {
  return (
    <article className="grid min-w-0 gap-4 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{label}</h3>
            <RuntimeBadge active={control.effectiveEnabled} activeText="자동실행" inactiveText="스킵" />
          </div>
          <p className="mt-1 break-all font-mono text-[11px] font-bold text-[#6f7a86]">{control.jobName}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#b8c2cc]">{description}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <BatchRuntimeState label="스케줄러 설정" active={control.schedulerConfigured} activeText="ON" inactiveText="OFF" />
        <BatchRuntimeState label="DB 런타임" active={control.runtimeEnabled} activeText="ON" inactiveText="OFF" />
        <BatchRuntimeState label="실제 자동실행" active={control.effectiveEnabled} activeText="실행" inactiveText="스킵" />
      </div>

      <div className="rounded-md bg-white/[0.04] px-3 py-2">
        <p className="text-xs font-bold leading-5 text-[#b8c2cc]">{formatRuntimeReason(control)}</p>
        <p className="mt-1 text-[11px] font-bold text-[#6f7a86]">
          수정 {formatDateTime(control.updatedAt)} · {control.updatedBy ?? "-"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={updating || control.runtimeEnabled}
          className="min-h-11 rounded-md bg-[#123820] px-3 py-3 text-sm font-black text-[#6ee7a8] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {updating && !control.runtimeEnabled ? "재개 중" : "재개"}
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={updating || !control.runtimeEnabled}
          className="min-h-11 rounded-md bg-[#3a1f1b] px-3 py-3 text-sm font-black text-[#ffb4a8] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {updating && control.runtimeEnabled ? "중지 중" : "중지"}
        </button>
      </div>

      {manualAction ? (
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-bold leading-5 text-[#b8c2cc]">{manualAction.description}</p>
          <button
            type="button"
            onClick={manualAction.onRun}
            disabled={manualAction.running}
            className="mt-3 min-h-11 w-full rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:cursor-wait disabled:opacity-55"
          >
            {manualAction.running ? manualAction.busyLabel : manualAction.label}
          </button>
          <p className="mt-2 text-xs font-bold text-[#8b95a1]">
            마지막 수동 실행 {manualAction.resultText}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function BatchRuntimeState({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3">
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className={active ? "mt-1 text-sm font-black text-[#6ee7a8]" : "mt-1 text-sm font-black text-[#ffb4a8]"}>
        {activeText}
      </p>
      {!active ? <p className="mt-0.5 text-[11px] font-bold text-[#6f7a86]">{inactiveText}</p> : null}
    </div>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

function DarkInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={["grid min-w-0 gap-1 text-xs font-bold text-[#b8c2cc]", className].filter(Boolean).join(" ")}>
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#5f6b76] disabled:cursor-not-allowed disabled:bg-[#11161b] disabled:text-[#6b7682] focus:border-[#64a8ff]"
      />
    </label>
  );
}

function DarkFormInput({
  label,
  registration,
  placeholder,
  className = "",
  error,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  className?: string;
  error?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-bold text-[#8b95a1]">{label}</span>
      <input
        {...registration}
        placeholder={placeholder}
        className="mt-1 w-full min-w-0 rounded-md border border-[#2b333f] bg-[#101418] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#3182f6]"
      />
      {error ? <span className="mt-1 block text-xs font-bold text-[#ff8a80]">{error}</span> : null}
    </label>
  );
}

function DarkFormSelect({
  label,
  registration,
  children,
  className = "",
}: {
  label: string;
  registration: UseFormRegisterReturn;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-bold text-[#8b95a1]">{label}</span>
      <select
        {...registration}
        className="mt-1 w-full min-w-0 rounded-md border border-[#2b333f] bg-[#101418] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#3182f6]"
      >
        {children}
      </select>
    </label>
  );
}

function EnabledToggleButton({
  enabled,
  disabled = false,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "inline-flex h-8 min-w-20 items-center justify-between gap-2 rounded-md border px-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-55",
        enabled
          ? "border-[#3182f6]/50 bg-[#12345a] text-[#d8ecff]"
          : "border-white/10 bg-white/[0.06] text-[#b8c2cc]",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          enabled ? "bg-[#64a8ff]" : "bg-[#5f6b76]",
        ].join(" ")}
      />
      <span>{disabled ? "처리 중" : enabled ? "가동" : "정지"}</span>
    </button>
  );
}

function AutoSignalGuide() {
  return (
    <section className="mt-5 rounded-lg border border-[#3182f6]/20 bg-[#10233a] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#64a8ff]">AUTO SIGNAL FLOW</p>
          <h2 className="mt-1 text-base font-black">자동장 강도 계산 기준</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-[#b8c2cc]">
            자동 주문은 종목 기본 강도, 참여자별 종목 전략, 최신 평가 보고서 점수를 순서대로 반영해 최종 매수/매도 압력과 호가 공격성을 정합니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#d8ecff]">1-10 척도</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SignalGuideCard
          label="종목별 자동 알고리즘 강도"
          title="종목 기본 분위기"
          body="참여자별 전략이 없을 때 쓰는 기본값입니다. 10에 가까우면 매수 우위, 1에 가까우면 매도 우위로 동작합니다."
        />
        <SignalGuideCard
          label="참여자별 종목 전략 강도"
          title="참여자 실제 성향"
          body="같은 종목이라도 참여자마다 다르게 줄 수 있는 우선값입니다. 저장된 전략이 있으면 종목 기본 강도보다 먼저 적용됩니다."
        />
        <SignalGuideCard
          label="종목 평가 보고서 점수"
          title="최신 관리자 신호"
          body="주문을 직접 만들지는 않고 참여자 전략을 보정합니다. 뉴스 민감형은 크게 반응하고 관망형은 작게 반응합니다."
        />
      </div>

      <div className="mt-4 rounded-md bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-[#b8c2cc]">
        최종 강도는 참여자별 전략 강도를 기본으로 하되, 자동 참여자의 심리 프로필에 따라 최신 보고서 점수 반영 비율이 달라집니다. 참여자별 전략이 없으면 종목별 자동 알고리즘 강도가 참여자 전략의 기본값이 됩니다.
      </div>
    </section>
  );
}

function SignalGuideCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[11px] font-black text-[#64a8ff]">{label}</p>
      <h3 className="mt-1 text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-xs font-bold leading-5 text-[#b8c2cc]">{body}</p>
    </div>
  );
}

function formatWon(value: number | null | undefined) {
  const normalizedValue = Number.isFinite(value) ? Number(value) : 0;
  return `${Math.round(normalizedValue).toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number | null | undefined) {
  const normalizedValue = Number.isFinite(value) ? Number(value) : 0;
  return normalizedValue.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function optionalText(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseAutoParticipantRecurringCashDraft(
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

function formatRecurringCashIntervalUnit(value: RecurringCashIntervalUnit | null | undefined) {
  return RECURRING_CASH_INTERVAL_UNIT_OPTIONS.find((option) => option.value === value)?.label ?? "-";
}

function formatParticipantRecurringCash(participant: AutoParticipant) {
  if (participant.recurringCashAmount == null) {
    return "프로필 기본값";
  }
  if (participant.recurringCashAmount <= 0) {
    return "개별 지급 없음";
  }
  return `${formatWon(participant.recurringCashAmount)} / ${formatNumber(participant.recurringCashIntervalValue)}${formatRecurringCashIntervalUnit(participant.recurringCashIntervalUnit)}`;
}

function isKnownOrderBookSymbol(instruments: OrderBookInstrument[], symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  return Boolean(normalizedSymbol) && instruments.some((instrument) => instrument.symbol === normalizedSymbol);
}

function summarizeBatchRuntimeControls(controls: BatchJobRuntimeStatus[]) {
  return controls.reduce(
    (summary, control) => ({
      total: summary.total + 1,
      effective: summary.effective + (control.effectiveEnabled ? 1 : 0),
      runtimeOff: summary.runtimeOff + (!control.runtimeEnabled ? 1 : 0),
      schedulerOff: summary.schedulerOff + (!control.schedulerConfigured ? 1 : 0),
    }),
    {
      total: 0,
      effective: 0,
      runtimeOff: 0,
      schedulerOff: 0,
    },
  );
}

function formatRuntimeUpdateMessage(label: string, requestedRuntimeEnabled: boolean, effectiveEnabled: boolean) {
  if (!requestedRuntimeEnabled) {
    return `${label}을 중지했습니다.`;
  }
  if (!effectiveEnabled) {
    return `${label} DB 런타임은 ON이지만 배치 서버 설정이 OFF라 자동 실행은 아직 스킵됩니다.`;
  }
  return `${label}을 재개했습니다.`;
}

function formatRuntimeReason(control: Pick<BatchJobRuntimeStatus, "schedulerConfigured" | "runtimeEnabled" | "effectiveEnabled">) {
  if (control.effectiveEnabled) {
    return "스케줄러 설정과 DB 런타임이 모두 ON입니다.";
  }
  if (!control.schedulerConfigured && control.runtimeEnabled) {
    return "배치 서버 설정이 OFF라 DB ON이어도 자동 실행하지 않습니다.";
  }
  if (control.schedulerConfigured && !control.runtimeEnabled) {
    return "DB 런타임이 OFF라 스케줄러가 실행을 건너뜁니다.";
  }
  return "배치 서버 설정과 DB 런타임이 모두 OFF입니다.";
}

function isRangeNumber(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
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
    maxSerial = Math.max(maxSerial, Number.parseInt(suffix, 10));
  });
  return maxSerial + 1;
}

function formatAutoParticipantSerial(value: number) {
  return String(value).padStart(3, "0");
}

function formatAutoIntensityDirection(intensity: number): string {
  if (intensity >= 8) {
    return "강한 상승";
  }
  if (intensity >= 6) {
    return "상승";
  }
  if (intensity <= 3) {
    return "하락";
  }
  return "중립";
}

function formatListingAutoPosition(positionSide: ListingAutoPosition): string {
  if (positionSide === "BUY_ONLY") {
    return "매수 전용";
  }
  return "매도 전용";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCorporateActionType(actionType: CorporateActionType): string {
  switch (actionType) {
    case "INITIAL_ISSUE":
      return "초기 발행";
    case "PAID_IN_CAPITAL_INCREASE":
      return "유상증자";
    case "ADDITIONAL_ISSUE":
      return "추가발행";
    case "STOCK_SPLIT":
      return "액면분할";
    case "CASH_DIVIDEND":
      return "현금배당";
    case "BONUS_ISSUE":
      return "무상증자";
    case "STOCK_DIVIDEND":
      return "주식배당";
    case "DELISTING":
      return "상장폐지";
  }
}

function formatCorporateActionStatus(status: CorporateActionStatus): string {
  switch (status) {
    case "ANNOUNCED":
      return "공시";
    case "EX_RIGHTS_APPLIED":
      return "권리락 반영";
    case "PAID":
      return "지급 완료";
    case "LISTED":
      return "상장 반영";
    case "DELISTED":
      return "상장폐지";
  }
}

function formatCorporateActionValue(action: CorporateAction): string {
  if (action.actionType === "STOCK_SPLIT") {
    return `${action.splitFrom ?? "-"}:${action.splitTo ?? "-"}`;
  }
  if (action.actionType === "CASH_DIVIDEND") {
    return formatWon(action.dividendAmount ?? 0);
  }
  if (action.actionType === "DELISTING") {
    return action.delistingTreatment === "ZERO_VALUE" ? "가치 0원 처리" : "상장폐지";
  }
  if (action.shareQuantity) {
    const issuePrice = action.issuePrice ? ` · ${formatWon(action.issuePrice)}` : "";
    return `${action.shareQuantity.toLocaleString("ko-KR")}주${issuePrice}`;
  }
  return "-";
}

function formatCorporateActionPrice(action: CorporateAction): string {
  if (!action.basePrice || !action.theoreticalExRightsPrice) {
    return "-";
  }
  return `${formatWon(action.basePrice)} -> ${formatWon(action.theoreticalExRightsPrice)}`;
}

function formatCorporateActionSchedule(action: CorporateAction): string {
  const dates = [
    action.exRightsDate ? `권리락 ${action.exRightsDate}` : null,
    action.paymentDate ? `지급 ${action.paymentDate}` : null,
    action.listingDate ? `상장 ${action.listingDate}` : null,
    action.delistingDate ? `폐지 ${action.delistingDate}` : null,
  ].filter(Boolean);
  return dates.length ? dates.join(" / ") : "-";
}

function formatReportEventType(eventType: InstrumentReport["eventType"]): string {
  switch (eventType) {
    case "PUBLISH":
      return "발행";
    case "UPDATE":
      return "수정";
    case "DELETE":
      return "삭제";
  }
}
