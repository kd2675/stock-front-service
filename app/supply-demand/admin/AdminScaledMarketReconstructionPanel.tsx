"use client";

import { type ReactNode, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiResult } from "@/app/lib/api";
import {
  createScaledMarketPriceCapitalRebasePlan,
  createScaledMarketRoleCapacityPlan,
  createScaledMarketShareRebasePlan,
  getScaledMarketPriceCapitalRebasePlan,
  getScaledMarketRoleCapacityPlan,
  getScaledMarketShareRebasePlan,
  promoteScaledMarketSymbolMature,
  scheduleScaledMarketContract,
  scheduleScaledMarketPriceCapitalRebasePlan,
  scheduleScaledMarketRoleCapacityPlan,
  scheduleScaledMarketShareRebasePlan,
} from "@/app/lib/stock";
import {
  scaledMarketOverviewQueryOptions,
  scaledMarketRebasePreviewQueryOptions,
} from "@/app/lib/react-query/stockAdminQueries";
import { invalidateScaledMarketReconstructionQueries } from "@/app/lib/react-query/stockInvalidations";
import {
  getAdminActionData,
  getAdminUnknownErrorMessage,
} from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  formatCompactWon,
  formatCount,
  formatInteger,
  formatNumber,
  formatSignedPercent,
} from "@/app/supply-demand/admin/AdminFormatters";
import type {
  ScaledMarketContract,
  ScaledMarketOverview,
  ScaledMarketPriceCapitalRebasePlan,
  ScaledMarketRoleCapacityPlan,
  ScaledMarketShareRebasePlan,
} from "@/app/types/stock";

type Props = {
  accessToken: string | null;
};

type Feedback = {
  tone: "success" | "error";
  message: string;
};

const INPUT_CLASS =
  "min-h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-admin-accent/60";
const ACTION_CLASS =
  "min-h-11 rounded-md bg-admin-accent px-4 text-sm font-black text-admin-canvas disabled:cursor-not-allowed disabled:opacity-40";
const SECONDARY_ACTION_CLASS =
  "min-h-11 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40";

export function AdminScaledMarketReconstructionPanel({
  accessToken,
}: Props) {
  const queryClient = useQueryClient();
  const overviewQuery = useQuery(
    scaledMarketOverviewQueryOptions(accessToken, {
      enabled: Boolean(accessToken),
    }),
  );
  const contracts = useMemo(
    () => collectContracts(overviewQuery.data),
    [overviewQuery.data],
  );
  const [selectedContractVersion, setSelectedContractVersion] =
    useState<number | null>(null);
  const selectedContract = contracts.find(
    (contract) => contract.contractVersion === selectedContractVersion,
  ) ?? contracts.find((contract) => contract.status === "DRAFT")
    ?? contracts.find((contract) => contract.status === "SCHEDULED")
    ?? contracts[0]
    ?? null;
  const contractVersion = selectedContract?.contractVersion ?? 0;
  const previewQuery = useQuery(
    scaledMarketRebasePreviewQueryOptions(
      accessToken,
      contractVersion,
      {
        enabled: Boolean(accessToken) && contractVersion > 0,
      },
    ),
  );
  const [effectiveBusinessDate, setEffectiveBusinessDate] = useState("");
  const [changeReason, setChangeReason] = useState(
    "KOSPI 보통주 1/100 목표의 단일 수치 단계 적용",
  );
  const [maturitySymbol, setMaturitySymbol] = useState("");
  const [sharePlanIdText, setSharePlanIdText] = useState("");
  const [pricePlanIdText, setPricePlanIdText] = useState("");
  const [rolePlanIdText, setRolePlanIdText] = useState("");
  const [sharePlan, setSharePlan] =
    useState<ScaledMarketShareRebasePlan | null>(null);
  const [pricePlan, setPricePlan] =
    useState<ScaledMarketPriceCapitalRebasePlan | null>(null);
  const [rolePlan, setRolePlan] =
    useState<ScaledMarketRoleCapacityPlan | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshOverview = async () => {
    await invalidateScaledMarketReconstructionQueries(
      queryClient,
      contractVersion,
    );
  };

  const promoteMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      const symbol = maturitySymbol.trim().toUpperCase();
      if (!selectedContract || !symbol) {
        throw new Error("성숙 전환할 계약과 종목을 선택하세요.");
      }
      const result = await promoteScaledMarketSymbolMature(
        token,
        selectedContract.contractVersion,
        symbol,
        { changeReason: requireReason(changeReason) },
      );
      return requireActionData(
        result,
        "종목 성숙 단계를 확정하지 못했습니다.",
      );
    },
    onSuccess: async (change) => {
      setFeedback({
        tone: "success",
        message: `${change.symbol}을 ${change.effectiveBusinessDate} 기준 MATURE로 확정했습니다.`,
      });
      setMaturitySymbol("");
      await refreshOverview();
    },
    onError: (error) => setMutationError(
      error,
      "종목 성숙 단계를 확정하지 못했습니다.",
      setFeedback,
    ),
  });

  const createSharePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!selectedContract) {
        throw new Error("주식수 재기준 계약을 선택하세요.");
      }
      const result = await createScaledMarketShareRebasePlan(
        token,
        selectedContract.contractVersion,
        { changeReason: requireReason(changeReason) },
      );
      return requireActionData(
        result,
        "발행·유통주식수 재기준 계획을 만들지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setSharePlan(plan);
      setSharePlanIdText(String(plan.planId));
      setFeedback({
        tone: "success",
        message: `주식수 계획 #${plan.planId}을 만들었습니다. 아직 DB 수치는 바뀌지 않았습니다.`,
      });
    },
    onError: (error) => setMutationError(
      error,
      "발행·유통주식수 재기준 계획을 만들지 못했습니다.",
      setFeedback,
    ),
  });

  const loadSharePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      const planId = requirePositiveInteger(
        sharePlanIdText,
        "주식수 계획 ID",
      );
      const result = await getScaledMarketShareRebasePlan(
        token,
        planId,
      );
      return requireActionData(
        result,
        "주식수 계획을 불러오지 못했습니다.",
      );
    },
    onSuccess: setSharePlan,
    onError: (error) => setMutationError(
      error,
      "주식수 계획을 불러오지 못했습니다.",
      setFeedback,
    ),
  });

  const scheduleSharePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!sharePlan) {
        throw new Error("먼저 주식수 계획을 만들거나 불러오세요.");
      }
      const result = await scheduleScaledMarketShareRebasePlan(
        token,
        sharePlan.planId,
        {
          effectiveBusinessDate: requireDate(effectiveBusinessDate),
          expectedSourceStateVersion: sharePlan.sourceStateVersion,
        },
      );
      return requireActionData(
        result,
        "주식수 계획을 예약하지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setSharePlan(plan);
      setFeedback({
        tone: "success",
        message: `주식수 계획 #${plan.planId}을 ${plan.effectiveBusinessDate ?? "-"} PRE_OPEN에 예약했습니다.`,
      });
    },
    onError: (error) => setMutationError(
      error,
      "주식수 계획을 예약하지 못했습니다.",
      setFeedback,
    ),
  });

  const createPricePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!selectedContract) {
        throw new Error("가격·시총 재기준 계약을 선택하세요.");
      }
      const result = await createScaledMarketPriceCapitalRebasePlan(
        token,
        selectedContract.contractVersion,
        { changeReason: requireReason(changeReason) },
      );
      return requireActionData(
        result,
        "가격·시총·계좌자산 재기준 계획을 만들지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setPricePlan(plan);
      setPricePlanIdText(String(plan.planId));
      setRolePlan(null);
      setRolePlanIdText("");
      setFeedback({
        tone: "success",
        message: `가격·시총 계획 #${plan.planId}을 만들었습니다. 아직 DB 수치는 바뀌지 않았습니다.`,
      });
    },
    onError: (error) => setMutationError(
      error,
      "가격·시총·계좌자산 재기준 계획을 만들지 못했습니다.",
      setFeedback,
    ),
  });

  const loadPricePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      const planId = requirePositiveInteger(
        pricePlanIdText,
        "가격·시총 계획 ID",
      );
      const result = await getScaledMarketPriceCapitalRebasePlan(
        token,
        planId,
      );
      return requireActionData(
        result,
        "가격·시총 계획을 불러오지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setPricePlan(plan);
      setRolePlan(null);
      setRolePlanIdText("");
    },
    onError: (error) => setMutationError(
      error,
      "가격·시총 계획을 불러오지 못했습니다.",
      setFeedback,
    ),
  });

  const schedulePricePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!pricePlan) {
        throw new Error("먼저 가격·시총 계획을 만들거나 불러오세요.");
      }
      const result = await scheduleScaledMarketPriceCapitalRebasePlan(
        token,
        pricePlan.planId,
        {
          effectiveBusinessDate: requireDate(effectiveBusinessDate),
          expectedSourceStateVersion: pricePlan.sourceStateVersion,
        },
      );
      return requireActionData(
        result,
        "가격·시총 계획을 예약하지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setPricePlan(plan);
      setFeedback({
        tone: "success",
        message: `가격·시총 계획 #${plan.planId}을 ${plan.effectiveBusinessDate ?? "-"} PRE_OPEN에 예약했습니다.`,
      });
    },
    onError: (error) => setMutationError(
      error,
      "가격·시총 계획을 예약하지 못했습니다.",
      setFeedback,
    ),
  });

  const createRolePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!selectedContract || !pricePlan) {
        throw new Error(
          "역할별 주문 용량을 계산할 계약과 가격·시총 계획이 필요합니다.",
        );
      }
      const result = await createScaledMarketRoleCapacityPlan(
        token,
        selectedContract.contractVersion,
        {
          priceCapitalRebasePlanId: pricePlan.planId,
          changeReason: requireReason(changeReason),
        },
      );
      return requireActionData(
        result,
        "LP·기관 주문 용량 계획을 만들지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setRolePlan(plan);
      setRolePlanIdText(String(plan.planId));
      setFeedback({
        tone: "success",
        message: `역할별 주문 용량 계획 #${plan.planId}을 만들었습니다. 아직 운영 정책은 바뀌지 않았습니다.`,
      });
    },
    onError: (error) => setMutationError(
      error,
      "LP·기관 주문 용량 계획을 만들지 못했습니다.",
      setFeedback,
    ),
  });

  const loadRolePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      const planId = requirePositiveInteger(
        rolePlanIdText,
        "역할별 주문 용량 계획 ID",
      );
      const result = await getScaledMarketRoleCapacityPlan(
        token,
        planId,
      );
      return requireActionData(
        result,
        "역할별 주문 용량 계획을 불러오지 못했습니다.",
      );
    },
    onSuccess: setRolePlan,
    onError: (error) => setMutationError(
      error,
      "역할별 주문 용량 계획을 불러오지 못했습니다.",
      setFeedback,
    ),
  });

  const scheduleRolePlanMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!rolePlan) {
        throw new Error(
          "먼저 역할별 주문 용량 계획을 만들거나 불러오세요.",
        );
      }
      const result = await scheduleScaledMarketRoleCapacityPlan(
        token,
        rolePlan.planId,
        {
          effectiveBusinessDate: requireDate(effectiveBusinessDate),
          expectedSourceStateVersion: rolePlan.sourceStateVersion,
        },
      );
      return requireActionData(
        result,
        "역할별 주문 용량 계획을 예약하지 못했습니다.",
      );
    },
    onSuccess: (plan) => {
      setRolePlan(plan);
      setFeedback({
        tone: "success",
        message: `역할별 주문 용량 계획 #${plan.planId}을 ${plan.effectiveBusinessDate ?? "-"} PRE_OPEN에 예약했습니다.`,
      });
    },
    onError: (error) => setMutationError(
      error,
      "역할별 주문 용량 계획을 예약하지 못했습니다.",
      setFeedback,
    ),
  });

  const scheduleContractMutation = useMutation({
    mutationFn: async () => {
      const token = requireToken(accessToken);
      if (!selectedContract || !sharePlan || !pricePlan || !rolePlan) {
        throw new Error(
          "계약과 주식수, 가격·시총, 역할별 주문 용량 계획이 모두 필요합니다.",
        );
      }
      const approved = window.confirm(
        `계약 #${selectedContract.contractVersion}을 ${requireDate(effectiveBusinessDate)} 개장 계약으로 고정합니다.\n\n주식수 #${sharePlan.planId}, 가격·시총 #${pricePlan.planId}, 역할 용량 #${rolePlan.planId}이 모두 정확히 대사되지 않으면 PRE_OPEN이 실패합니다. 계속할까요?`,
      );
      if (!approved) {
        throw new ActionCancelledError();
      }
      const result = await scheduleScaledMarketContract(
        token,
        selectedContract.contractVersion,
        {
          effectiveBusinessDate: requireDate(
            effectiveBusinessDate,
          ),
          shareRebasePlanId: sharePlan.planId,
          priceCapitalRebasePlanId: pricePlan.planId,
          roleCapacityPlanId: rolePlan.planId,
          changeReason: requireReason(changeReason),
        },
      );
      return requireActionData(
        result,
        "1/100 시장 계약을 예약하지 못했습니다.",
      );
    },
    onSuccess: async (contract) => {
      setFeedback({
        tone: "success",
        message: `계약 #${contract.contractVersion}을 ${contract.effectiveBusinessDate}에 예약했습니다. 가격과 역할별 주문 용량 적용 뒤 계약 활성화가 해당 PRE_OPEN에서 원자적으로 검증됩니다.`,
      });
      await refreshOverview();
    },
    onError: (error) => {
      if (!(error instanceof ActionCancelledError)) {
        setMutationError(
          error,
          "1/100 시장 계약을 예약하지 못했습니다.",
          setFeedback,
        );
      }
    },
  });

  const observed = overviewQuery.data?.observedMarket;
  const marketIndex = overviewQuery.data?.marketIndex;
  const preview = previewQuery.data;
  const selectedMaturityTarget =
    selectedContract?.symbolTargets.find(
      (target) => target.symbol === maturitySymbol,
    ) ?? null;
  const actionPending = promoteMutation.isPending
    || createSharePlanMutation.isPending
    || loadSharePlanMutation.isPending
    || scheduleSharePlanMutation.isPending
    || createPricePlanMutation.isPending
    || loadPricePlanMutation.isPending
    || schedulePricePlanMutation.isPending
    || createRolePlanMutation.isPending
    || loadRolePlanMutation.isPending
    || scheduleRolePlanMutation.isPending
    || scheduleContractMutation.isPending;

  return (
    <section className="admin-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-admin-accent">
            KOSPI common · 1/100
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            축소시장 수치 재구성
          </h2>
          <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            2027-02-09 완료장을 불변 기준으로 두고 종목 성숙, 발행·유통주식수,
            가격·시총·계좌자산, LP·기관 주문 용량을 한 단계씩 적용합니다.
            기존 7종목과 D8을 함께 재배분하며, 계획을 만드는 동작은 실제
            원장을 변경하지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshOverview()}
          disabled={overviewQuery.isFetching}
          className={SECONDARY_ACTION_CLASS}
        >
          {overviewQuery.isFetching ? "대사 중" : "수치 다시 대사"}
        </button>
      </div>

      {overviewQuery.isError ? (
        <p className="mt-4 text-sm font-bold text-admin-danger">
          1/100 시장 계약을 조회하지 못했습니다.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Metric
          label="전체 장 지수 · 기준 1,000"
          value={marketIndex ? formatNumber(marketIndex.currentValue) : "계산 대기"}
          detail={marketIndex
            ? `${formatSignedNumber(marketIndex.changeValue)} · ${formatSignedPercent(
              marketIndex.changeRate * 100,
            )} · 구성 ${formatInteger(marketIndex.constituentCount)}/${formatInteger(
              marketIndex.expectedConstituentCount,
            )}${marketIndex.complete ? "" : " · 불완전"}`
            : "활성 계약과 완료장 교집합이 필요합니다."}
        />
        <Metric
          label="최근 완료장 종목"
          value={formatCount(observed?.symbolCount, "개")}
        />
        <Metric
          label="최근 완료장 발행주식"
          value={formatCount(observed?.issuedShares, "주")}
        />
        <Metric
          label="최근 완료장 시총"
          value={formatCompactWon(observed?.marketCapitalization)}
        />
        <Metric
          label="최근 완료장 시장 거래량"
          value={formatCount(observed?.dailyVolume, "주")}
        />
      </div>

      {preview ? (
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric
            label="현재→목표 발행주식"
            value={`${formatCount(
              preview.aggregateGap.currentIssuedShares,
              "주",
            )} → ${formatCount(
              preview.aggregateGap.targetIssuedShares,
              "주",
            )}`}
            detail={`부족 ${formatCount(
              preview.aggregateGap.issuedShareGapFromCurrent,
              "주",
            )} · ${formatMultiplier(
              preview.aggregateGap.currentIssuedShareMultiplier,
            )}`}
          />
          <Metric
            label="현재→목표 유통주식"
            value={`${formatCount(
              preview.aggregateGap.currentTradableShares,
              "주",
            )} → ${formatCount(
              preview.aggregateGap.targetTradableShares,
              "주",
            )}`}
            detail={`부족 ${formatCount(
              preview.aggregateGap.tradableShareGapFromCurrent,
              "주",
            )}`}
          />
          <Metric
            label="현재→목표 시총"
            value={`${formatCompactWon(
              preview.aggregateGap.currentMarketCapitalization,
            )} → ${formatCompactWon(
              preview.aggregateGap.targetMarketCapitalization,
            )}`}
            detail={`부족 ${formatCompactWon(
              preview.aggregateGap.marketCapitalizationGapFromCurrent,
            )} · ${formatMultiplier(
              preview.aggregateGap.currentMarketCapitalizationMultiplier,
            )}`}
          />
          <Metric
            label="기준일→목표 거래량"
            value={`${formatCount(
              preview.aggregateGap.baselineDailyVolume,
              "주",
            )} → ${formatCount(
              preview.aggregateGap.targetDailyVolume,
              "주",
            )}`}
            detail={`부족 ${formatCount(
              preview.aggregateGap.dailyVolumeGapFromBaseline,
              "주",
            )} · ${formatMultiplier(
              preview.aggregateGap.dailyVolumeMultiplier,
            )}`}
          />
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <div>
          <label className="text-xs font-black text-stock-subtle">
            수치 계약
          </label>
          <select
            value={selectedContract?.contractVersion ?? ""}
            onChange={(event) => {
              setSelectedContractVersion(Number(event.target.value));
              setSharePlan(null);
              setPricePlan(null);
              setRolePlan(null);
              setSharePlanIdText("");
              setPricePlanIdText("");
              setRolePlanIdText("");
              setFeedback(null);
            }}
            className={`${INPUT_CLASS} mt-2`}
          >
            {contracts.length === 0 ? (
              <option value="">계약 없음</option>
            ) : null}
            {contracts.map((contract) => (
              <option
                key={contract.contractVersion}
                value={contract.contractVersion}
              >
                #{contract.contractVersion} · {contract.status} · 기준{" "}
                {contract.baselineBusinessDate ?? "미고정"}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-md border border-white/10 bg-black/15 px-3 py-3">
          <p className="text-[11px] font-black text-stock-subtle">
            계약 대사
          </p>
          <p className={`mt-1 text-sm font-black ${
            selectedContract?.reconciliation.reconciled
              ? "text-admin-success"
              : "text-admin-warning"
          }`}
          >
            {selectedContract?.reconciliation.reconciled
              ? "목표 합계 일치"
              : "목표 합계 미완료"}
          </p>
          <p className="mt-1 text-[11px] font-bold text-admin-quiet">
            성숙 {formatInteger(
              selectedContract?.reconciliation.matureSymbolCount,
            )}/{formatInteger(selectedContract?.targetMatureSymbolCount)}
            {" · "}계약 상태 {selectedContract?.status ?? "-"}
          </p>
        </div>
      </div>

      {selectedContract ? (
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Metric
            label="목표 종목"
            value={formatCount(
              selectedContract.targetMatureSymbolCount,
              "개",
            )}
          />
          <Metric
            label="목표 발행주식"
            value={formatCount(
              selectedContract.targetIssuedShares,
              "주",
            )}
          />
          <Metric
            label="목표 시총"
            value={formatCompactWon(
              selectedContract.targetMarketCapitalization,
            )}
          />
          <Metric
            label="목표 일거래량"
            value={formatCount(
              selectedContract.targetDailyVolume,
              "주",
            )}
          />
          <Metric
            label="목표 일거래대금"
            value={`${formatCompactWon(
              selectedContract.targetDailyTurnoverLower,
            )}~${formatCompactWon(
              selectedContract.targetDailyTurnoverUpper,
            )}`}
          />
        </div>
      ) : null}

      {previewQuery.isError ? (
        <p className="mt-4 text-sm font-bold text-admin-danger">
          선택 계약의 재기준 미리보기를 조회하지 못했습니다.
        </p>
      ) : preview ? (
        <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-stock-subtle">
              <tr>
                <th className="px-3 py-2">종목</th>
                <th className="px-3 py-2 text-right">현재/준비계약→목표 발행주식</th>
                <th className="px-3 py-2 text-right">현재/준비계약→목표 유통주식</th>
                <th className="px-3 py-2 text-right">현재/준비계약→목표 가격</th>
                <th className="px-3 py-2 text-right">현재→목표 시총</th>
                <th className="px-3 py-2 text-right">기준일→목표 거래량</th>
                <th className="px-3 py-2 text-right">인수 잔량</th>
                <th className="px-3 py-2">판정</th>
              </tr>
            </thead>
            <tbody>
              {preview.symbols.map((symbol) => (
                <tr
                  key={symbol.symbol}
                  className="border-t border-white/5 font-bold text-white"
                >
                  <td className="px-3 py-2">{symbol.symbol}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <div className="whitespace-nowrap">
                      {formatInteger(symbol.currentIssuedShares)}
                      {symbol.requiresNewListing ? (
                        <>
                          {" / "}
                          <span className="text-admin-accent">
                            {formatInteger(symbol.preRebaseIssuedShares)}
                          </span>
                        </>
                      ) : null}
                      {" → "}
                      {formatInteger(symbol.targetIssuedShares)}
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[10px] text-admin-quiet">
                      부족 {formatInteger(symbol.issuedShareGapFromCurrent)}
                      {" · "}
                      {formatMultiplier(symbol.currentIssuedShareMultiplier)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <div className="whitespace-nowrap">
                      {formatInteger(symbol.currentTradableShares)}
                      {symbol.requiresNewListing ? (
                        <>
                          {" / "}
                          <span className="text-admin-accent">
                            {formatInteger(symbol.preRebaseTradableShares)}
                          </span>
                        </>
                      ) : null}
                      {" → "}
                      {formatInteger(symbol.targetTradableShares)}
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[10px] text-admin-quiet">
                      부족 {formatInteger(symbol.tradableShareGapFromCurrent)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <div className="whitespace-nowrap">
                      {formatInteger(symbol.currentPrice)}
                      {symbol.requiresNewListing ? (
                        <>
                          {" / "}
                          <span className="text-admin-accent">
                            {formatInteger(symbol.preRebaseReferencePrice)}
                          </span>
                        </>
                      ) : null}
                      {" → "}
                      {formatInteger(symbol.targetReferencePrice)}
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[10px] text-admin-quiet">
                      {formatMultiplier(symbol.currentPriceMultiplier)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="whitespace-nowrap">
                      {formatCompactWon(symbol.currentMarketCapitalization)}
                      {" → "}
                      {formatCompactWon(symbol.targetMarketCapitalization)}
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[10px] text-admin-quiet">
                      부족 {formatCompactWon(
                        symbol.targetMarketCapitalization
                          - symbol.currentMarketCapitalization,
                      )}
                      {" · "}
                      {formatMultiplier(
                        symbol.currentMarketCapitalizationMultiplier,
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <div className="whitespace-nowrap">
                      {formatInteger(symbol.baselineDailyVolume)}
                      {" → "}
                      {formatInteger(symbol.targetDailyVolume)}
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[10px] text-admin-quiet">
                      부족 {formatInteger(
                        symbol.targetDailyVolume
                          - symbol.baselineDailyVolume,
                      )}
                      {" · "}
                      {formatMultiplier(symbol.dailyVolumeMultiplier)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCount(
                      symbol.underwriterResidualQuantity,
                      "주",
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {(symbol.currentMatchesTargetStructure
                      || symbol.currentInstrumentPresent
                      && symbol.currentIssuedShares === symbol.targetIssuedShares
                      && symbol.currentTradableShares === symbol.targetTradableShares
                      && symbol.currentInitialPrice === symbol.targetReferencePrice)
                      ? symbol.currentHoldingReconciled
                        ? "목표구조 적용 완료"
                        : "목표구조 보유 불일치"
                      : symbol.requiresNewListing
                      ? !symbol.currentInstrumentPresent
                        ? "준비상장 필요"
                        : symbol.currentMatchesExpectedSourceStructure
                          ? "준비상장 대사"
                          : "준비수치 불일치"
                      : symbol.currentHoldingReconciled
                        ? "보유 대사"
                        : "보유 불일치"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <StageCard
          stage="1"
          title="종목별 성숙 확정"
          description="D4→D7, 마지막 D8 순서로 한 거래일에 한 종목만 MATURE로 전환합니다."
        >
          <select
            value={maturitySymbol}
            onChange={(event) => setMaturitySymbol(event.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">성숙 전환 종목 선택</option>
            {selectedContract?.symbolTargets
              .filter((target) => target.lifecycleStatus !== "MATURE")
              .map((target) => (
                <option key={target.symbol} value={target.symbol}>
                  {target.symbol} · {target.lifecycleStatus} · 분산{" "}
                  {formatPercent(target.distributedTradableShareRate)}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={
              actionPending
              || !selectedMaturityTarget
              || selectedMaturityTarget.distributedTradableShareRate !== 1
            }
            onClick={() => promoteMutation.mutate()}
            className={ACTION_CLASS}
          >
            선택 종목 MATURE 확정
          </button>
        </StageCard>

        <StageCard
          stage="2"
          title="발행·유통주식수 재기준"
          description="기존 7종목과 D8의 보유원장을 최대잔여법으로 목표 577,289,815주에 맞춥니다."
        >
          <button
            type="button"
            disabled={
              actionPending
              || selectedContract?.status !== "DRAFT"
              || preview?.preconditions.shareRebaseReady !== true
            }
            onClick={() => createSharePlanMutation.mutate()}
            className={ACTION_CLASS}
          >
            읽기전용 주식수 계획 생성
          </button>
          <PlanLookup
            value={sharePlanIdText}
            onChange={setSharePlanIdText}
            onLoad={() => loadSharePlanMutation.mutate()}
            loading={loadSharePlanMutation.isPending}
            label="주식수 계획 ID"
          />
          <PlanStatus
            label="주식수 계획"
            planId={sharePlan?.planId}
            status={sharePlan?.status}
            detail={sharePlan
              ? `${formatCount(
                sharePlan.sourceHoldingQuantity,
                "주",
              )} → ${formatCount(
                sharePlan.targetHoldingQuantity,
                "주",
              )}`
              : undefined}
          />
          {sharePlan ? (
            <div className="rounded-md border border-white/10 bg-black/15 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black text-stock-subtle">
                  역할별 목표 보유가치 / AUM / 현금여유
                </p>
                <span className={`text-[11px] font-black ${
                  sharePlan.projectedCapitalCapacityReconciled
                    ? "text-admin-success"
                    : "text-admin-danger"
                }`}
                >
                  {sharePlan.projectedCapitalCapacityReconciled
                    ? "수용 가능"
                    : "수용 불가"}
                </span>
              </div>
              <div className="mt-2 grid gap-1.5">
                {sharePlan.capitalCapacity.map((capacity) => (
                  <div
                    key={capacity.participantCategory}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-[11px] font-bold"
                  >
                    <span className="text-admin-quiet">
                      {formatCapitalRole(capacity.participantCategory)}
                    </span>
                    <span className="text-right tabular-nums text-white">
                      {formatCompactWon(
                        capacity.projectedTargetHoldingMarketValue,
                      )} / {formatCompactWon(capacity.targetAum)}
                      {" · "}
                      <span className="text-admin-accent-soft">
                        {formatCompactWon(capacity.projectedCashHeadroom)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            disabled={actionPending || sharePlan?.status !== "DRAFT"}
            onClick={() => scheduleSharePlanMutation.mutate()}
            className={SECONDARY_ACTION_CLASS}
          >
            주식수 계획 PRE_OPEN 예약
          </button>
        </StageCard>

        <StageCard
          stage="3"
          title="가격·시총·계좌자산 재기준"
          description="주식수 적용 완료 뒤 가격, 시총 44.594조원, 현금과 평균단가를 같은 원장 계획으로 맞춥니다."
        >
          <button
            type="button"
            disabled={
              actionPending
              || selectedContract?.status !== "DRAFT"
              || sharePlan?.status !== "APPLIED"
            }
            onClick={() => createPricePlanMutation.mutate()}
            className={ACTION_CLASS}
          >
            읽기전용 가격·시총 계획 생성
          </button>
          <PlanLookup
            value={pricePlanIdText}
            onChange={setPricePlanIdText}
            onLoad={() => loadPricePlanMutation.mutate()}
            loading={loadPricePlanMutation.isPending}
            label="가격·시총 계획 ID"
          />
          <PlanStatus
            label="가격·시총 계획"
            planId={pricePlan?.planId}
            status={pricePlan?.status}
            detail={pricePlan
              ? `${formatCompactWon(
                pricePlan.sourceMarketCapitalization,
              )} → ${formatCompactWon(
                pricePlan.targetMarketCapitalization,
              )}`
              : undefined}
          />
          <button
            type="button"
            disabled={actionPending || pricePlan?.status !== "DRAFT"}
            onClick={() => schedulePricePlanMutation.mutate()}
            className={SECONDARY_ACTION_CLASS}
          >
            가격·시총 계획 PRE_OPEN 예약
          </button>
        </StageCard>

        <StageCard
          stage="4"
          title="자동시장·LP·기관 주문 용량 재기준"
          description="확대된 주식수·시총·일거래량에 맞춰 종목별 자동시장 최대 주문수량, LP 재고·단일주문·손실한도와 기관 4곳의 8종목 비중·참여율을 함께 맞춥니다."
        >
          <button
            type="button"
            disabled={
              actionPending
              || selectedContract?.status !== "DRAFT"
              || !pricePlan
              || !["DRAFT", "SCHEDULED"].includes(pricePlan.status)
            }
            onClick={() => createRolePlanMutation.mutate()}
            className={ACTION_CLASS}
          >
            읽기전용 역할별 주문 용량 계획 생성
          </button>
          <PlanLookup
            value={rolePlanIdText}
            onChange={setRolePlanIdText}
            onLoad={() => loadRolePlanMutation.mutate()}
            loading={loadRolePlanMutation.isPending}
            label="역할별 주문 용량 계획 ID"
          />
          <PlanStatus
            label="역할별 주문 용량 계획"
            planId={rolePlan?.planId}
            status={rolePlan?.status}
            detail={rolePlan
              ? `자동시장 ${formatInteger(
                rolePlan.targetAutoMarketConfigCount,
              )} · LP ${formatInteger(
                rolePlan.targetLiquidityMandateCount,
              )} · 기관 ${formatInteger(
                rolePlan.targetInstitutionPortfolioCount,
              )}곳/${formatInteger(
                rolePlan.targetInstitutionMandateCount,
              )}개 위임 · 기관 gross ${formatPercent(
                rolePlan.targetInstitutionGrossParticipationRate,
              )} (시장 한쪽 분모 · BUY ${formatPercent(
                rolePlan.minimumInstitutionBuyParticipationRate,
              )} · SELL ${formatPercent(
                rolePlan.minimumInstitutionSellParticipationRate,
              )} 최소) · ${formatCount(
                rolePlan.targetDailyVolume,
                "주",
              )}`
              : undefined}
          />
          <button
            type="button"
            disabled={
              actionPending
              || rolePlan?.status !== "DRAFT"
              || pricePlan?.status !== "SCHEDULED"
            }
            onClick={() => scheduleRolePlanMutation.mutate()}
            className={SECONDARY_ACTION_CLASS}
          >
            역할별 주문 용량 계획 PRE_OPEN 예약
          </button>
        </StageCard>

        <StageCard
          stage="5"
          title="정확한 계약 고정"
          description="적용된 주식수 계획과 같은 날 예약된 가격·시총·역할 용량 계획을 고정하고, PRE_OPEN에서 전 수치를 다시 대사합니다."
        >
          <input
            type="date"
            value={effectiveBusinessDate}
            onChange={(event) =>
              setEffectiveBusinessDate(event.target.value)}
            className={INPUT_CLASS}
          />
          <textarea
            value={changeReason}
            onChange={(event) => setChangeReason(event.target.value)}
            maxLength={500}
            rows={3}
            className={`${INPUT_CLASS} min-h-24 py-3`}
          />
          <button
            type="button"
            disabled={
              actionPending
              || selectedContract?.status !== "DRAFT"
              || sharePlan?.status !== "APPLIED"
              || pricePlan?.status !== "SCHEDULED"
              || rolePlan?.status !== "SCHEDULED"
              || !effectiveBusinessDate
              || !changeReason.trim()
            }
            onClick={() => scheduleContractMutation.mutate()}
            className={ACTION_CLASS}
          >
            계획 ID 고정 후 계약 예약
          </button>
        </StageCard>
      </div>

      <p className="mt-4 rounded-md border border-admin-warning/30 bg-admin-warning-surface px-3 py-2 text-xs font-bold leading-5 text-admin-warning">
        한 PRE_OPEN에는 상호 의존하는 계획 묶음을 원자적으로 적용합니다.
        계획 생성 → 확인 → 예약 → 배치 적용 → 다시 대사 순서를 건너뛰지
        않습니다. 시총과 주식수만 늘리고 자동시장·LP·기관 한도를 옛 값에
        두지 않습니다. V5 자동참여자의 15만 실제 계좌·주문·수량은 원장값 그대로 기록하며,
        계좌별 인구 배율을 행동 빈도·현금·보유·주문수량에 곱하지 않습니다.
      </p>

      {feedback ? (
        <p className={`mt-3 text-sm font-bold ${
          feedback.tone === "success"
            ? "text-admin-success"
            : "text-admin-danger"
        }`}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}

function collectContracts(
  overview: ScaledMarketOverview | undefined,
) {
  if (!overview) return [];
  const byVersion = new Map<number, ScaledMarketContract>();
  if (overview.activeContract) {
    byVersion.set(
      overview.activeContract.contractVersion,
      overview.activeContract,
    );
  }
  for (const contract of [
    ...overview.draftContracts,
    ...overview.scheduledContracts,
  ]) {
    byVersion.set(contract.contractVersion, contract);
  }
  return [...byVersion.values()].sort(
    (left, right) => right.contractVersion - left.contractVersion,
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 px-3 py-2">
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
      {detail ? (
        <p className="mt-1 text-[11px] font-bold text-admin-quiet">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function formatSignedNumber(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}`;
}

function StageCard({
  stage,
  title,
  description,
  children,
}: {
  stage: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-admin-accent-surface text-xs font-black text-admin-accent-soft">
          {stage}
        </span>
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          <p className="mt-1 text-[11px] font-bold leading-5 text-stock-subtle">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function PlanLookup({
  value,
  onChange,
  onLoad,
  loading,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onLoad: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className={INPUT_CLASS}
      />
      <button
        type="button"
        onClick={onLoad}
        disabled={loading || !value.trim()}
        className={SECONDARY_ACTION_CLASS}
      >
        {loading ? "조회 중" : "불러오기"}
      </button>
    </div>
  );
}

function PlanStatus({
  label,
  planId,
  status,
  detail,
}: {
  label: string;
  planId?: number;
  status?: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 px-3 py-2">
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <p className="mt-1 text-sm font-black text-white">
        {planId ? `#${planId} · ${status ?? "-"}` : "선택된 계획 없음"}
      </p>
      {detail ? (
        <p className="mt-1 text-[11px] font-bold text-admin-quiet">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function formatCapitalRole(category: string) {
  const labels: Record<string, string> = {
    AUTO_PARTICIPANT: "자동참여자",
    INSTITUTIONAL_INVESTOR: "기관",
    ISSUE_UNDERWRITER: "인수",
    LIQUIDITY_PROVIDER: "LP",
    MANUAL_PARTICIPANT: "수동참여자",
    SYSTEM_CUSTODY: "시스템 보관",
  };
  return labels[category] ?? category;
}

function requireToken(token: string | null) {
  if (!token) {
    throw new Error("관리자 인증이 필요합니다.");
  }
  return token;
}

function requireReason(value: string) {
  const reason = value.trim();
  if (!reason) {
    throw new Error("변경 사유를 입력하세요.");
  }
  return reason;
}

function requireDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("적용 거래일을 YYYY-MM-DD 형식으로 입력하세요.");
  }
  return value;
}

function requirePositiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label}는 양의 정수여야 합니다.`);
  }
  return parsed;
}

function requireActionData<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
) {
  const action = getAdminActionData(result, fallbackMessage);
  if (!action.ok) {
    throw new Error(action.message);
  }
  return action.data;
}

function setMutationError(
  error: unknown,
  fallbackMessage: string,
  setFeedback: (feedback: Feedback) => void,
) {
  setFeedback({
    tone: "error",
    message: getAdminUnknownErrorMessage(error, fallbackMessage),
  });
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatMultiplier(value?: number | null) {
  return value == null || !Number.isFinite(value)
    ? "배수 확인 불가"
    : `${value.toFixed(2)}배 필요`;
}

class ActionCancelledError extends Error {
  constructor() {
    super("Action cancelled");
    this.name = "ActionCancelledError";
  }
}
