"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import DataTableViewport from "@/app/components/DataTableViewport";
import { upsertLiquidityProviderMandateQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { adminCreateLiquidityProviderLiveMutationOptions } from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  AdminEntitySelector,
  type AdminEntitySelectorTone,
} from "@/app/supply-demand/admin/AdminEntitySelector";
import { AdminLiquidityProviderMandateCard } from "@/app/supply-demand/admin/AdminLiquidityProviderMandateCard";
import {
  formatCompactWon,
  formatCount,
  formatInteger,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import { formatMarketRoleCode } from "@/app/supply-demand/admin/adminMarketRoleFormatters";
import type { LiquidityProviderMandate, LiquidityProviderRecommendation } from "@/app/types/stock";

export function AdminLiquidityProviderPanel({
  accessToken,
  mandates,
  recommendation,
  loading,
  error,
  onRefresh,
}: {
  accessToken: string | null;
  mandates: LiquidityProviderMandate[];
  recommendation: LiquidityProviderRecommendation | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const provisionMutation = useMutation(adminCreateLiquidityProviderLiveMutationOptions());
  const [symbol, setSymbol] = useState("");
  const [referenceVolumePercent, setReferenceVolumePercent] = useState("3.0");
  const [seedInventoryPercent, setSeedInventoryPercent] = useState("0.5");
  const [cashMultiplier, setCashMultiplier] = useState("1.0");
  const [changeReason, setChangeReason] = useState("축소 시장용 종목 전용 LP 실운영 전환");
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedMandateSymbol, setSelectedMandateSymbol] = useState("");
  const summary = useMemo(() => summarizeMandates(mandates), [mandates]);
  const selectedMandate = mandates.find(
    (mandate) => mandate.symbol === selectedMandateSymbol,
  ) ?? mandates[0] ?? null;
  const selectorItems = useMemo(
    () => mandates.map((mandate) => {
      const reviewCount = countMandateReviewSignals(mandate);
      return {
        key: mandate.symbol,
        title: mandate.symbol,
        subtitle: mandate.mandateCode,
        statusLabel: formatMarketRoleCode(mandate.status),
        statusTone: liquidityProviderStatusTone(mandate.status),
        metricLabel: "NAV · 점검",
        metricValue: `${mandate.dailyState ? formatCompactWon(mandate.dailyState.currentNetAssetValue) : "상태 없음"} · ${formatCount(reviewCount, "건")}`,
      };
    }),
    [mandates],
  );
  const normalizedSymbol = symbol.trim().toUpperCase();
  const referenceVolumeRate = Number(referenceVolumePercent) / 100;
  const seedInventoryRate = Number(seedInventoryPercent) / 100;
  const normalizedCashMultiplier = Number(cashMultiplier);
  const selectedRecommendation = recommendation?.symbols.find(
    (item) => item.symbol === normalizedSymbol,
  );
  const minReferenceVolumeRate = recommendation?.minReferenceDailyVolumeRate ?? 0.005;
  const maxReferenceVolumeRate = recommendation?.maxReferenceDailyVolumeRate ?? 2;
  const canProvision = Boolean(accessToken)
    && !loading
    && !error
    && confirmed
    && /^[A-Z0-9]{2,20}$/.test(normalizedSymbol)
    && !mandates.some((mandate) => mandate.symbol === normalizedSymbol)
    && selectedRecommendation?.creationEligible === true
    && Number.isFinite(referenceVolumeRate)
    && referenceVolumeRate >= minReferenceVolumeRate
    && referenceVolumeRate <= maxReferenceVolumeRate
    && Number.isFinite(seedInventoryRate)
    && seedInventoryRate >= 0.001
    && seedInventoryRate <= 0.02
    && Number.isFinite(normalizedCashMultiplier)
    && normalizedCashMultiplier >= 0.5
    && normalizedCashMultiplier <= 2;

  const createLive = async () => {
    if (!canProvision || !accessToken || provisionMutation.isPending) {
      return;
    }
    setFeedback(null);
    try {
      const result = await provisionMutation.mutateAsync({
        token: accessToken,
        symbol: normalizedSymbol,
        payload: {
          referenceDailyVolumeRate: referenceVolumeRate,
          seedInventoryRate,
          initialCashToInventoryValue: normalizedCashMultiplier,
          changeReason: changeReason.trim() || undefined,
        },
      });
      const provisioned = getAdminActionData(
        result,
        "LP 실운영 생성을 완료하지 못했습니다.",
      );
      if (!provisioned.ok) {
        setFeedback({ tone: "error", message: provisioned.message });
        return;
      }
      upsertLiquidityProviderMandateQueryData(queryClient, provisioned.data);
      setSelectedMandateSymbol(provisioned.data.symbol);
      setConfirmed(false);
      setFeedback({
        tone: "success",
        message: `${provisioned.data.symbol} 전용 LP 계정과 시드 자산을 준비했습니다. ${provisioned.data.scheduledPolicy?.effectiveBusinessDate ?? "다음 개장일"} 장전부터 활성화됩니다.`,
      });
      onRefresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error && error.message.trim()
          ? error.message
          : "LP 실운영 생성을 완료하지 못했습니다.",
      });
    }
  };

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black">전용 LP 계약·위험 감사</h2>
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-[10px] font-black text-admin-accent-soft">
              신규 구조
            </span>
          </div>
          <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            LP는 발행·인수나 방향성 투자 없이 지정 종목의 제한된 양방향 호가만 담당합니다. 기준 거래량, 외부 5호가 깊이, 재고 밴드, 일일 제출·체결·손실 한도를 동시에 적용합니다.
          </p>
          <p className="mt-1 max-w-4xl text-[11px] font-bold leading-5 text-admin-quiet">
            실행 중에도 생성할 수 있습니다. 시드 재고와 현금, 전용 계정과 계약은 한 트랜잭션으로 준비하고 주문과 시장 활성화는 표시된 다음 개장일 장전에 반영합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          {loading ? <span className="rounded-md bg-white/10 px-2 py-1 text-admin-accent-soft">조회 중</span> : null}
          {error ? <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-admin-danger">조회 실패</span> : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-9 rounded-md bg-stock-surface-strong px-3 py-1.5 text-xs font-black text-stock-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "조회 중" : "새로고침"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric label="LP 계약" value={formatCount(mandates.length, "개")} tone="blue" />
        <ProfileMiniMetric label="실운영 중" value={formatCount(summary.activeLiveCount, "개")} tone={summary.activeLiveCount > 0 ? "blue" : "muted"} />
        <ProfileMiniMetric label="현재 LP NAV" value={formatCompactWon(summary.currentNetAssetValue)} tone="muted" />
        <ProfileMiniMetric label="오늘 체결" value={formatCount(summary.executedQuantity, "주")} tone="muted" />
        <ProfileMiniMetric label="오늘 제출" value={formatCount(summary.submittedQuantity, "주")} tone="muted" />
        <ProfileMiniMetric label="점검 신호" value={formatCount(summary.reviewCount, "건")} tone={summary.reviewCount > 0 ? "red" : "green"} />
      </div>

      {feedback ? (
        <p
          role="status"
          className={[
            "mt-4 rounded-md border px-3 py-3 text-xs font-bold leading-5",
            feedback.tone === "success"
              ? "border-admin-success/25 bg-admin-success-surface text-admin-success"
              : "border-admin-danger/25 bg-admin-danger-surface text-admin-danger",
          ].join(" ")}
        >
          {feedback.message}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-admin-danger/25 bg-admin-danger-surface px-3 py-3 text-xs font-bold leading-5 text-admin-danger">
          LP 계약 또는 거래일 요약을 읽지 못했습니다. 새 계약을 만들거나 정책을 변경하지 마세요.
        </p>
      ) : null}

      {!loading && mandates.length === 0 ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-4 py-5">
          <p className="text-sm font-black text-white">아직 전용 LP 계약이 없습니다.</p>
          <p className="mt-2 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            아래에서 종목별 계정과 시드 자산을 준비할 수 있습니다. 생성 직후에는 활성화 대기 상태이며 실패하면 계정·계약·시드 이전을 함께 롤백합니다.
          </p>
        </div>
      ) : null}

      <LiquidityProvisioningForm
        recommendation={recommendation}
        symbol={symbol}
        referenceVolumePercent={referenceVolumePercent}
        seedInventoryPercent={seedInventoryPercent}
        cashMultiplier={cashMultiplier}
        changeReason={changeReason}
        confirmed={confirmed}
        pending={provisionMutation.isPending}
        canProvision={canProvision}
        onSymbolChange={(value) => {
          setSymbol(value);
          const selected = recommendation?.symbols.find(
            (item) => item.symbol === value.trim().toUpperCase(),
          );
          if (selected) {
            setReferenceVolumePercent(String(
              selected.recommendedReferenceDailyVolumeRate * 100,
            ));
          }
        }}
        onReferenceVolumePercentChange={setReferenceVolumePercent}
        onSeedInventoryPercentChange={setSeedInventoryPercent}
        onCashMultiplierChange={setCashMultiplier}
        onChangeReasonChange={setChangeReason}
        onConfirmedChange={setConfirmed}
        onApplyRecommendation={() => {
          const recommendedReferenceRate = selectedRecommendation
            ? selectedRecommendation.recommendedReferenceDailyVolumeRate
            : recommendation?.recommendedReferenceDailyVolumeRate ?? 0.03;
          setReferenceVolumePercent(String(
            recommendedReferenceRate * 100,
          ));
          setSeedInventoryPercent(String(
            (recommendation?.recommendedSeedInventoryRate ?? 0.005) * 100,
          ));
          setCashMultiplier(String(
            recommendation?.recommendedInitialCashMultiplier ?? 1,
          ));
        }}
        onProvision={() => void createLive()}
      />

      {selectedMandate ? (
        <div className="mt-5 grid min-w-0 gap-5 border-t border-white/10 pt-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <AdminEntitySelector
            ariaLabel="유동성 공급자 선택"
            heading="LP 선택"
            hint={`${formatCount(mandates.length, "개")} 계약`}
            mobileLabel="관리할 LP"
            items={selectorItems}
            selectedKey={selectedMandate.symbol}
            onSelect={setSelectedMandateSymbol}
          />
          <div className="min-w-0">
            <AdminLiquidityProviderMandateCard
              key={selectedMandate.mandateId}
              accessToken={accessToken}
              mandate={selectedMandate}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      ) : null}

    </section>
  );
}

type Feedback = {
  tone: "success" | "error";
  message: string;
};

function LiquidityProvisioningForm({
  recommendation,
  symbol,
  referenceVolumePercent,
  seedInventoryPercent,
  cashMultiplier,
  changeReason,
  confirmed,
  pending,
  canProvision,
  onSymbolChange,
  onReferenceVolumePercentChange,
  onSeedInventoryPercentChange,
  onCashMultiplierChange,
  onChangeReasonChange,
  onConfirmedChange,
  onApplyRecommendation,
  onProvision,
}: {
  recommendation: LiquidityProviderRecommendation | null;
  symbol: string;
  referenceVolumePercent: string;
  seedInventoryPercent: string;
  cashMultiplier: string;
  changeReason: string;
  confirmed: boolean;
  pending: boolean;
  canProvision: boolean;
  onSymbolChange: (value: string) => void;
  onReferenceVolumePercentChange: (value: string) => void;
  onSeedInventoryPercentChange: (value: string) => void;
  onCashMultiplierChange: (value: string) => void;
  onChangeReasonChange: (value: string) => void;
  onConfirmedChange: (value: boolean) => void;
  onApplyRecommendation: () => void;
  onProvision: () => void;
}) {
  const selectedRecommendation = recommendation?.symbols.find(
    (item) => item.symbol === symbol.trim().toUpperCase(),
  );

  return (
    <div className="mt-4 rounded-md border border-admin-accent/25 bg-admin-accent-surface/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">종목별 LP 실운영 생성</h3>
          <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            유통 대기·인수 계정에서 권장 시드 재고를 옮기고 같은 평가액 수준의 운영 현금을 초기 자금 지급 원장으로 기록합니다. 과거 자동 유동성 계좌는 운영 이전에서 종목별 LP로 현금·주식을 전량 이관하고 0잔고 종료 감사 계좌로 보존합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-black text-admin-accent-soft">
            권장 {recommendation ? `${recommendation.currentProviderCount}/${recommendation.recommendedProviderCount}개` : "조회 대기"}
          </span>
          <button
            type="button"
            onClick={onApplyRecommendation}
            disabled={!selectedRecommendation}
            className="min-h-8 rounded-md bg-white/10 px-3 text-[10px] font-black text-white disabled:opacity-40"
          >
            권장 비율 적용
          </button>
        </div>
      </div>
      {recommendation ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MandateMetric label="권장 LP 수" value={`${formatInteger(recommendation.recommendedProviderCount)}개`} />
          <MandateMetric label="추가 권장" value={`${formatInteger(recommendation.recommendedRemainingCount)}개`} />
          <MandateMetric label="무이력 기준 거래량" value={formatPercent(recommendation.recommendedReferenceDailyVolumeRate)} />
          <MandateMetric label="권장 시드 재고" value={formatPercent(recommendation.recommendedSeedInventoryRate)} />
        </div>
      ) : null}
      {recommendation?.symbols.length ? (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-black text-admin-quiet">종목별 LP 권장 실수량</p>
          <DataTableViewport label="종목별 LP 권장 실수량" tone="dark">
            <table className="min-w-[820px] w-full text-left text-xs">
              <thead className="bg-white/[0.045] text-[10px] font-black text-admin-quiet">
                <tr>
                  <th className="px-3 py-2">종목</th>
                  <th className="px-3 py-2 text-right">유통주식</th>
                  <th className="px-3 py-2 text-right">기준 거래량</th>
                  <th className="px-3 py-2 text-right">시드 재고</th>
                  <th className="px-3 py-2 text-right">초기 현금</th>
                  <th className="px-3 py-2">생성 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recommendation.symbols.map((item) => (
                  <tr key={item.symbol}>
                    <td className="px-3 py-2 font-black text-white">{item.symbol}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(item.tradableShares)}주</td>
                    <td className="px-3 py-2 text-right font-black text-admin-accent-soft">
                      <p>{formatNumber(item.recommendedReferenceDailyVolume)}주</p>
                      <p className="mt-0.5 text-[9px] text-admin-quiet">
                        {item.referenceVolumeSource === "COMPLETED_20_DAY_ADV"
                          ? `완료 ${item.referenceVolumeHistoryDays}일 ADV`
                          : "무이력 유통주식 기준"}
                        {" · "}
                        {formatPercent(item.recommendedReferenceDailyVolumeRate)}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right">{formatNumber(item.recommendedSeedInventoryQuantity)}주</td>
                    <td className="px-3 py-2 text-right">{formatWon(item.recommendedInitialCash)}</td>
                    <td className={item.creationEligible ? "px-3 py-2 text-admin-success" : "px-3 py-2 text-admin-warning"}>
                      {item.creationEligible
                        ? "생성 가능"
                        : formatMarketRoleCode(item.eligibilityReason, "생성 조건 확인 필요")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableViewport>
        </div>
      ) : null}
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          종목 코드
          <select
            value={symbol}
            onChange={(event) => onSymbolChange(event.target.value.toUpperCase())}
            className="min-h-10 rounded-md border border-white/10 bg-black/25 px-3 text-xs font-black uppercase text-white outline-none focus:border-admin-accent/60"
          >
            <option value="">종목 선택</option>
            {(recommendation?.symbols ?? []).map((item) => (
              <option key={item.symbol} value={item.symbol} disabled={!item.creationEligible}>
                {item.symbol} · {item.creationEligible
                  ? "생성 가능"
                  : formatMarketRoleCode(item.eligibilityReason, "생성 조건 확인 필요")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          기준 거래량 / 유통주식
          <div className="flex min-h-10 items-center rounded-md border border-white/10 bg-black/25 px-3">
            <input
              type="number"
              min={(recommendation?.minReferenceDailyVolumeRate ?? 0.005) * 100}
              max={(recommendation?.maxReferenceDailyVolumeRate ?? 2) * 100}
              step="0.1"
              value={referenceVolumePercent}
              onChange={(event) => onReferenceVolumePercentChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs font-black text-white outline-none"
            />
            <span className="text-xs font-black text-admin-quiet">%</span>
          </div>
        </label>
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          시드 재고 / 유통주식
          <div className="flex min-h-10 items-center rounded-md border border-white/10 bg-black/25 px-3">
            <input
              type="number"
              min="0.1"
              max="2"
              step="0.1"
              value={seedInventoryPercent}
              onChange={(event) => onSeedInventoryPercentChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs font-black text-white outline-none"
            />
            <span className="text-xs font-black text-admin-quiet">%</span>
          </div>
        </label>
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          현금 / 시드 평가액
          <div className="flex min-h-10 items-center rounded-md border border-white/10 bg-black/25 px-3">
            <input
              type="number"
              min="0.5"
              max="2"
              step="0.1"
              value={cashMultiplier}
              onChange={(event) => onCashMultiplierChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs font-black text-white outline-none"
            />
            <span className="text-xs font-black text-admin-quiet">배</span>
          </div>
        </label>
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          변경 사유
          <input
            value={changeReason}
            onChange={(event) => onChangeReasonChange(event.target.value)}
            maxLength={500}
            className="min-h-10 rounded-md border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none focus:border-admin-accent/60"
          />
        </label>
      </div>
      {selectedRecommendation ? (
        <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-stock-subtle">
          <span className="font-black text-white">{selectedRecommendation.symbol} 권장 실수량</span>
          <span className="ml-3">기준 거래량 {formatNumber(selectedRecommendation.recommendedReferenceDailyVolume)}주</span>
          <span className="ml-3">
            {selectedRecommendation.referenceVolumeSource === "COMPLETED_20_DAY_ADV"
              ? `완료 ${selectedRecommendation.referenceVolumeHistoryDays}일 ADV`
              : "무이력 유통주식 기준"}
          </span>
          <span className="ml-3">시드 {formatNumber(selectedRecommendation.recommendedSeedInventoryQuantity)}주</span>
          <span className="ml-3">초기 현금 {formatWon(selectedRecommendation.recommendedInitialCash)}</span>
          {!selectedRecommendation.creationEligible ? (
            <span className="ml-3 text-admin-danger">
              {formatMarketRoleCode(
                selectedRecommendation.eligibilityReason,
                "생성 조건 확인 필요",
              )}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex max-w-4xl items-start gap-2 text-xs font-bold leading-5 text-stock-subtle">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1"
          />
          시드 주식 이전·시드 현금 유입·전용 LP 계정과 계약 준비는 즉시 처리되고, 주문과 시장 활성화는 다음 안전한 개장 준비 단계에서 처리됨을 확인했습니다.
        </label>
        <button
          type="button"
          onClick={onProvision}
          disabled={!canProvision || pending}
          className="min-h-10 rounded-md bg-admin-accent px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "준비 중" : "LP 생성·활성화 예약"}
        </button>
      </div>
    </div>
  );
}

function MandateMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-bold text-admin-quiet">{label}</p>
      <p className="mt-1 truncate text-xs font-black tabular-nums text-white" title={value}>{value}</p>
    </div>
  );
}

function summarizeMandates(mandates: LiquidityProviderMandate[]) {
  return {
    activeLiveCount: mandates.filter(
      (mandate) => mandate.executionMode === "LIVE" && mandate.status === "ACTIVE",
    ).length,
    currentNetAssetValue: mandates.reduce(
      (sum, mandate) => sum + (mandate.dailyState?.currentNetAssetValue ?? 0),
      0,
    ),
    executedQuantity: mandates.reduce(
      (sum, mandate) => sum
        + (mandate.dailyState?.executedBuyQuantity ?? 0)
        + (mandate.dailyState?.executedSellQuantity ?? 0),
      0,
    ),
    submittedQuantity: mandates.reduce(
      (sum, mandate) => sum
        + (mandate.dailyState?.submittedBuyQuantity ?? 0)
        + (mandate.dailyState?.submittedSellQuantity ?? 0),
      0,
    ),
    reviewCount: mandates.reduce(
      (sum, mandate) => sum + countMandateReviewSignals(mandate),
      0,
    ),
  };
}

function countMandateReviewSignals(mandate: LiquidityProviderMandate) {
  return [
    !mandate.transition,
    !mandate.roleEligible,
    !mandate.policy.passiveOnly,
    mandate.status !== "ACTIVE" && mandate.status !== "SUSPENDED",
    !mandate.dailyState,
    mandate.dailyState?.limitBreached === true,
    mandate.dailyState?.stateStatus === "ERROR",
    mandate.dailyState != null && mandate.dailyState.policyVersion !== mandate.policyVersion,
  ].filter(Boolean).length;
}

function liquidityProviderStatusTone(
  status: LiquidityProviderMandate["status"],
): AdminEntitySelectorTone {
  if (status === "ACTIVE") {
    return "success";
  }
  if (status === "PENDING") {
    return "accent";
  }
  if (status === "SUSPENDED") {
    return "warning";
  }
  return "muted";
}

function formatPercent(value: number) {
  return `${formatNumber(value * 100)}%`;
}
