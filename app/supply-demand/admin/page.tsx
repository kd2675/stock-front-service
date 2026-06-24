"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { bootstrapAccessToken, ensureAccessToken, getUserFromToken, isAdminRole } from "@/app/lib/auth";
import { createOrderBookInstrumentMutationOptions } from "@/app/lib/react-query/stockMutations";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import { adjustAutoParticipantCash, applyCorporateAction, deleteInstrumentReport, getAutoMarketStatus, getCorporateActions, getInstrumentReports, getOrderBookInstruments, getOrderBookMarketStatus, getVirtualMarketStatus, publishInstrumentReport, updateAutoMarketConfig, updateAutoParticipantSymbolConfig, updateInstrumentReport, updateMarketStatus, upsertAutoParticipant, withdrawAutoParticipant } from "@/app/lib/stock";
import { createInstrumentSchema, type CreateInstrumentFormValues } from "@/app/lib/validation/adminSchemas";
import type { AutoMarketConfig, AutoMarketStatus, AutoParticipant, AutoParticipantSymbolConfig, CorporateAction, CorporateActionStatus, CorporateActionType, InstrumentReport, MarketSessionStatus, OrderBookInstrument, OrderBookMarketStatus, VirtualMarketStatus } from "@/app/types/stock";

export default function SupplyDemandAdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [adminStatus, setAdminStatus] = useState<"checking" | "allowed" | "denied">("checking");
  const [status, setStatus] = useState<AutoMarketStatus | null>(null);
  const [virtualMarket, setVirtualMarket] = useState<VirtualMarketStatus | null>(null);
  const [orderBookMarket, setOrderBookMarket] = useState<OrderBookMarketStatus | null>(null);
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
    },
  });
  const [actionSymbol, setActionSymbol] = useState("");
  const [actionType, setActionType] = useState<CorporateActionType>("PAID_IN_CAPITAL_INCREASE");
  const [actionShares, setActionShares] = useState("");
  const [actionIssuePrice, setActionIssuePrice] = useState("");
  const [actionDividendAmount, setActionDividendAmount] = useState("");
  const [exRightsDate, setExRightsDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [listingDate, setListingDate] = useState("");
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
  const [autoConfigEnabled, setAutoConfigEnabled] = useState(true);
  const [autoIntensity, setAutoIntensity] = useState("5");
  const [autoMaxOrderQuantity, setAutoMaxOrderQuantity] = useState("4");
  const [autoOrderTtlSeconds, setAutoOrderTtlSeconds] = useState("15");
  const [updatingAutoConfig, setUpdatingAutoConfig] = useState(false);
  const [togglingAutoConfigSymbol, setTogglingAutoConfigSymbol] = useState<string | null>(null);
  const [editingAutoParticipantUserKey, setEditingAutoParticipantUserKey] = useState<string | null>(null);
  const [autoParticipantUserKey, setAutoParticipantUserKey] = useState("");
  const [autoParticipantDisplayName, setAutoParticipantDisplayName] = useState("");
  const [autoParticipantEnabled, setAutoParticipantEnabled] = useState(true);
  const [savingAutoParticipant, setSavingAutoParticipant] = useState(false);
  const [togglingAutoParticipantUserKey, setTogglingAutoParticipantUserKey] = useState<string | null>(null);
  const [withdrawingAutoParticipantUserKey, setWithdrawingAutoParticipantUserKey] = useState<string | null>(null);
  const [cashAdjustmentAmount, setCashAdjustmentAmount] = useState("");
  const [adjustingCashType, setAdjustingCashType] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [strategyUserKey, setStrategyUserKey] = useState("");
  const [strategySymbol, setStrategySymbol] = useState("");
  const [strategyEnabled, setStrategyEnabled] = useState(true);
  const [strategyIntensity, setStrategyIntensity] = useState("5");
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [togglingStrategyKey, setTogglingStrategyKey] = useState<string | null>(null);

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
  }, [autoConfigSymbol, reportSymbol, strategySymbol, strategyUserKey]);

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
      });
      setActionSymbol(instrument.symbol);
      setReportSymbol(instrument.symbol);
      setCorporateActions([]);
      setInstrumentReports([]);
      setMessage("주문장 종목을 생성하고 초기 상장 매도 호가를 공급했습니다.");
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
      return;
    }
    if (actionSymbol.trim()) {
      loadCorporateActions(actionSymbol);
    }
  }, [actionSymbol, adminStatus, loadCorporateActions]);

  useEffect(() => {
    if (adminStatus !== "allowed") {
      return;
    }
    if (reportSymbol.trim()) {
      loadInstrumentReports(reportSymbol);
    }
  }, [adminStatus, loadInstrumentReports, reportSymbol]);

  const submitInstrument = createInstrumentForm.handleSubmit((values) => {
    const parsed = createInstrumentSchema.safeParse(values);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "종목 입력값을 확인해 주세요.");
      return;
    }
    createInstrumentMutation.mutate({
      ...parsed.data,
      market: parsed.data.market || "ORDERBOOK",
    });
  });

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
    if (!normalizedSymbol || !reportTitle.trim() || !reportSummary.trim() || !Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 10 || !reportRiseReason.trim() || !reportFallReason.trim()) {
      setMessage("보고서 종목, 제목, 요약, 점수 1-10, 상승/하락 이유를 모두 입력해 주세요.");
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
        riseReason: reportRiseReason.trim(),
        fallReason: reportFallReason.trim(),
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
    const payload: {
      actionType: CorporateActionType;
      shareQuantity?: number;
      issuePrice?: number;
      splitFrom?: number;
      splitTo?: number;
      exRightsDate?: string;
      paymentDate?: string;
      listingDate?: string;
      dividendAmount?: number;
      description?: string;
    } = { actionType };

    if (actionType === "STOCK_SPLIT") {
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

  const selectAutoParticipantDraft = (participant: AutoParticipant) => {
    setEditingAutoParticipantUserKey(participant.userKey);
    setAutoParticipantUserKey(participant.userKey);
    setAutoParticipantDisplayName(participant.displayName);
    setAutoParticipantEnabled(participant.enabled);
    setCashAdjustmentAmount("");
  };

  const resetAutoParticipantDraft = () => {
    setEditingAutoParticipantUserKey(null);
    setAutoParticipantUserKey("");
    setAutoParticipantDisplayName("");
    setAutoParticipantEnabled(true);
    setCashAdjustmentAmount("");
  };

  const selectAutoStrategyDraft = (config: AutoParticipantSymbolConfig) => {
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
      });
      if (!result.ok) {
        setMessage(result.message ?? "자동 참여자 저장에 실패했습니다.");
        return;
      }
      setMessage("자동 참여자를 저장했습니다.");
      loadStatus();
    } finally {
      setSavingAutoParticipant(false);
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
      loadStatus();
    } finally {
      setAdjustingCashType(null);
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
      loadStatus();
    } finally {
      setSavingStrategy(false);
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
  const selectedAutoParticipant = editingAutoParticipantUserKey ? autoParticipantByUserKey.get(editingAutoParticipantUserKey) : undefined;
  const isEditingAutoParticipant = editingAutoParticipantUserKey !== null;

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
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold text-[#64a8ff]">AUTO MARKET CONFIG</p>
            <h1 className="mt-1 text-2xl font-black">자동장 설정 현황</h1>
          </div>
          <Link href="/supply-demand" className="rounded-md bg-white px-3 py-2 text-sm font-black text-[#101418]">
            자동장
          </Link>
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
                  <tr key={config.symbol}>
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
                        선택
                      </button>
                    </td>
                  </tr>
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
                  return (
                    <tr key={`${config.userKey}:${config.symbol}`}>
                      <td className="px-3 py-2">
                        <p className="font-black">{participant?.displayName ?? config.userKey}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{config.userKey}</p>
                      </td>
                      <td className="px-3 py-2 font-black">{config.symbol}</td>
                      <td className="px-3 py-2">
                        <EnabledToggleButton
                          enabled={config.enabled}
                          disabled={togglingStrategyKey === `${config.userKey}:${config.symbol}`}
                          onToggle={() => void toggleAutoStrategyEnabled(config)}
                        />
	                      </td>
	                      <td className="px-3 py-2">{formatAutoIntensityDirection(config.intensity)}</td>
	                      <td className="px-3 py-2 tabular-nums">{config.intensity}/10</td>
	                      <td className="px-3 py-2">
                        <button type="button" onClick={() => selectAutoStrategyDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                          선택
                        </button>
                      </td>
                    </tr>
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
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.2fr_0.8fr_auto]">
            <DarkInput label="참여자 키" value={autoParticipantUserKey} onChange={setAutoParticipantUserKey} placeholder="stock-auto-001" disabled={isEditingAutoParticipant} />
            <DarkInput label="표시명" value={autoParticipantDisplayName} onChange={setAutoParticipantDisplayName} placeholder="자동 참여자 1" />
            <DarkSelect label="상태" value={autoParticipantEnabled ? "true" : "false"} onChange={(value) => setAutoParticipantEnabled(value === "true")}>
              <option value="true">가동</option>
              <option value="false">정지</option>
            </DarkSelect>
            <button type="button" onClick={submitAutoParticipant} disabled={savingAutoParticipant} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
              {savingAutoParticipant ? "저장 중" : isEditingAutoParticipant ? "상태 저장" : "등록"}
            </button>
          </div>
          {selectedAutoParticipant ? (
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 rounded-lg border border-[#3182f6]/20 bg-[#10233a] p-3 sm:grid-cols-[1.2fr_1fr_auto_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold text-[#8b95a1]">선택 참여자 실제 계좌</p>
                  <button type="button" onClick={resetAutoParticipantDraft} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                    신규 등록으로 전환
                  </button>
                </div>
                <p className="mt-1 break-all text-sm font-black text-white">{selectedAutoParticipant.displayName} · {selectedAutoParticipant.userKey}</p>
                <p className="mt-1 text-xs font-bold text-[#b8c2cc]">
                  현재 현금 {selectedAutoParticipant.cashBalance == null ? "계좌 미개설" : formatWon(selectedAutoParticipant.cashBalance)}
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
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
            <table className="min-w-[880px] w-full border-collapse text-sm">
              <thead className="bg-white/10 text-left text-[#b8c2cc]">
                <tr>
                  <th className="px-3 py-2">참여자</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">현재 현금</th>
                  <th className="px-3 py-2">수정일</th>
                  <th className="px-3 py-2">수정</th>
                  <th className="px-3 py-2">탈퇴</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(status?.participants ?? []).map((participant) => (
                  <tr key={participant.userKey}>
                    <td className="px-3 py-2">
                      <p className="font-black">{participant.displayName}</p>
                      <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{participant.userKey}</p>
                    </td>
                    <td className="px-3 py-2">
                      <EnabledToggleButton
                        enabled={participant.enabled}
                        disabled={togglingAutoParticipantUserKey === participant.userKey}
                        onToggle={() => void toggleAutoParticipantEnabled(participant)}
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums">{participant.cashBalance == null ? "계좌 미개설" : formatWon(participant.cashBalance)}</td>
                    <td className="px-3 py-2 text-[#b8c2cc]">{formatDateTime(participant.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => selectAutoParticipantDraft(participant)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                        선택
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
                ))}
                {(status?.participants ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-[#8b95a1]">등록된 자동 참여자가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <h2 className="text-base font-black">수요와 공급 종목 생성</h2>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DarkFormInput label="종목 코드" registration={createInstrumentForm.register("symbol")} placeholder="예: ZQ001" error={createInstrumentForm.formState.errors.symbol?.message} />
            <DarkFormInput label="종목명" registration={createInstrumentForm.register("name")} placeholder="예: 제로큐 주문장" error={createInstrumentForm.formState.errors.name?.message} className="sm:col-span-2 lg:col-span-2" />
            <DarkFormInput label="시장" registration={createInstrumentForm.register("market")} placeholder="ORDERBOOK" error={createInstrumentForm.formState.errors.market?.message} />
            <DarkFormInput label="초기 가격" registration={createInstrumentForm.register("initialPrice")} placeholder="70000" error={createInstrumentForm.formState.errors.initialPrice?.message} />
            <DarkFormInput label="발행주식수" registration={createInstrumentForm.register("issuedShares")} placeholder="100000" error={createInstrumentForm.formState.errors.issuedShares?.message} />
            <DarkFormInput label="호가 단위" registration={createInstrumentForm.register("tickSize")} placeholder="1" error={createInstrumentForm.formState.errors.tickSize?.message} />
            <DarkFormInput label="가격제한폭(%)" registration={createInstrumentForm.register("priceLimitRate")} placeholder="30" error={createInstrumentForm.formState.errors.priceLimitRate?.message} />
            <button type="button" onClick={() => void submitInstrument()} disabled={createInstrumentMutation.isPending} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
              {createInstrumentMutation.isPending ? "생성 중" : "생성"}
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <h2 className="text-base font-black">주식 이벤트 적용</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr_1fr_1fr_1.4fr_auto]">
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
            <DarkSelect label="이벤트" value={actionType} onChange={(value) => setActionType(value as CorporateActionType)}>
              <option value="PAID_IN_CAPITAL_INCREASE">유상증자</option>
              <option value="ADDITIONAL_ISSUE">추가발행</option>
              <option value="STOCK_SPLIT">액면분할</option>
              <option value="CASH_DIVIDEND">현금배당</option>
              <option value="BONUS_ISSUE">무상증자</option>
              <option value="STOCK_DIVIDEND">주식배당</option>
            </DarkSelect>
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
            ) : (
              <>
                <DarkInput label="발행수" value={actionShares} onChange={setActionShares} placeholder="50000" />
                <DarkInput label="발행가" value={actionIssuePrice} onChange={setActionIssuePrice} placeholder="50000" />
                <div />
              </>
            )}
            <DarkInput label="메모" value={actionDescription} onChange={setActionDescription} placeholder="선택 입력" />
            <button type="button" onClick={submitCorporateAction} disabled={applyingAction} className="rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
              {applyingAction ? "적용 중" : "적용"}
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
            <DarkInput label="상승 이유" value={reportRiseReason} onChange={setReportRiseReason} placeholder="가격이 오를 수 있는 이유" />
            <DarkInput label="하락 이유" value={reportFallReason} onChange={setReportFallReason} placeholder="가격이 떨어질 수 있는 이유" />
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-bold text-[#b8c2cc]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#64a8ff]"
      >
        {children}
      </select>
    </label>
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

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
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

function formatDateTime(value: string) {
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
  }
}

function formatCorporateActionValue(action: CorporateAction): string {
  if (action.actionType === "STOCK_SPLIT") {
    return `${action.splitFrom ?? "-"}:${action.splitTo ?? "-"}`;
  }
  if (action.actionType === "CASH_DIVIDEND") {
    return formatWon(action.dividendAmount ?? 0);
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
