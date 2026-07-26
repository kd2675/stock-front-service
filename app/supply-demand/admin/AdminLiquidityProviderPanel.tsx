"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import DataTableViewport from "@/app/components/DataTableViewport";
import { upsertLiquidityProviderMandateQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import {
  adminActivateLiquidityProviderMutationOptions,
  adminProvisionScaledLiquidityShadowMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  formatCompactWon,
  formatCount,
  formatDateTime,
  formatInteger,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type {
  LiquidityProviderDailyState,
  LiquidityProviderMandate,
} from "@/app/types/stock";

export function AdminLiquidityProviderPanel({
  accessToken,
  mandates,
  loading,
  error,
  onRefresh,
}: {
  accessToken: string | null;
  mandates: LiquidityProviderMandate[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const provisionMutation = useMutation(adminProvisionScaledLiquidityShadowMutationOptions());
  const activationMutation = useMutation(adminActivateLiquidityProviderMutationOptions());
  const [symbol, setSymbol] = useState("");
  const [referenceVolumePercent, setReferenceVolumePercent] = useState("3.0");
  const [seedInventoryPercent, setSeedInventoryPercent] = useState("0.5");
  const [cashMultiplier, setCashMultiplier] = useState("1.0");
  const [changeReason, setChangeReason] = useState("축소 시장용 종목 전용 LP shadow 준비");
  const [confirmed, setConfirmed] = useState(false);
  const [activatingSymbol, setActivatingSymbol] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const summary = useMemo(() => summarizeMandates(mandates), [mandates]);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const referenceVolumeRate = Number(referenceVolumePercent) / 100;
  const seedInventoryRate = Number(seedInventoryPercent) / 100;
  const normalizedCashMultiplier = Number(cashMultiplier);
  const canProvision = Boolean(accessToken)
    && !loading
    && !error
    && confirmed
    && /^[A-Z0-9]{2,20}$/.test(normalizedSymbol)
    && !mandates.some((mandate) => mandate.symbol === normalizedSymbol)
    && Number.isFinite(referenceVolumeRate)
    && referenceVolumeRate >= 0.005
    && referenceVolumeRate <= 0.08
    && Number.isFinite(seedInventoryRate)
    && seedInventoryRate >= 0.001
    && seedInventoryRate <= 0.02
    && Number.isFinite(normalizedCashMultiplier)
    && normalizedCashMultiplier >= 0.5
    && normalizedCashMultiplier <= 2;

  const provisionShadow = async () => {
    if (!canProvision || !accessToken || provisionMutation.isPending) {
      return;
    }
    setFeedback(null);
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
      "LP shadow 계정과 시드 자산을 준비하지 못했습니다.",
    );
    if (!provisioned.ok) {
      setFeedback({ tone: "error", message: provisioned.message });
      return;
    }
    upsertLiquidityProviderMandateQueryData(queryClient, provisioned.data);
    setConfirmed(false);
    setFeedback({
      tone: "success",
      message: `${provisioned.data.symbol} 전용 LP를 SHADOW_READY로 준비했습니다. 레거시 호가는 아직 중지되지 않았고 실제 LP 주문도 생성되지 않습니다.`,
    });
  };

  const activateMandate = async (mandate: LiquidityProviderMandate) => {
    if (!accessToken
      || loading
      || error
      || activationMutation.isPending
      || mandate.transition?.stage !== "SHADOW_READY") {
      return;
    }
    const approved = window.confirm(
      `${mandate.symbol}의 전용 LP를 LIVE로 전환합니다. 기존 상장주관사 경로가 있으면 미체결 주문을 취소하고 자동호가를 끄며, 역할 분리형 신규 상장이 CLOSED 대기 중이면 다음 장 개장 대상으로 활성화합니다.\n\n시뮬레이션이 일시정지된 장전 상태인지 확인했습니까?`,
    );
    if (!approved) {
      return;
    }
    setActivatingSymbol(mandate.symbol);
    setFeedback(null);
    try {
      const result = await activationMutation.mutateAsync({
        token: accessToken,
        symbol: mandate.symbol,
        payload: {
          changeReason: "관리자 검토 완료 후 종목 단위 LP LIVE 전환",
        },
      });
      const activated = getAdminActionData(
        result,
        "레거시 호가 종료와 LP 활성화를 완료하지 못했습니다.",
      );
      if (!activated.ok) {
        setFeedback({ tone: "error", message: activated.message });
        return;
      }
      upsertLiquidityProviderMandateQueryData(queryClient, activated.data);
      setFeedback({
        tone: "success",
        message: `${activated.data.symbol}의 전용 LP를 LIVE로 전환했습니다. 레거시 호가는 종료됐으며 역할 분리형 신규 상장이 CLOSED 대기 중이었다면 다음 장 개장 대상으로 활성화됐습니다.`,
      });
    } finally {
      setActivatingSymbol(null);
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
            SHADOW와 PILOT은 현재 감사 계획만 저장하고 실제 주문을 만들지 않습니다. LIVE는 같은 종목의 기존 상장주관사 자동계정이 켜져 있으면 자동 중단됩니다.
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
        <ProfileMiniMetric label="LIVE" value={formatCount(summary.liveCount, "개")} tone={summary.liveCount > 0 ? "blue" : "muted"} />
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
          LP 계약 또는 거래일 요약을 읽지 못했습니다. 레거시 유동성 계정을 전환하거나 LIVE로 올리지 마세요.
        </p>
      ) : null}

      {!loading && mandates.length === 0 ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-4 py-5">
          <p className="text-sm font-black text-white">아직 전용 LP 계약이 없습니다.</p>
          <p className="mt-2 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            아래에서 종목을 하나씩 SHADOW로 준비할 수 있습니다. 준비 단계에서는 시드 자산만 감사 원장으로 분리하며 기존 호가를 끄거나 실제 LP 주문을 만들지 않습니다.
          </p>
        </div>
      ) : null}

      <LiquidityProvisioningForm
        symbol={symbol}
        referenceVolumePercent={referenceVolumePercent}
        seedInventoryPercent={seedInventoryPercent}
        cashMultiplier={cashMultiplier}
        changeReason={changeReason}
        confirmed={confirmed}
        pending={provisionMutation.isPending}
        canProvision={canProvision}
        onSymbolChange={setSymbol}
        onReferenceVolumePercentChange={setReferenceVolumePercent}
        onSeedInventoryPercentChange={setSeedInventoryPercent}
        onCashMultiplierChange={setCashMultiplier}
        onChangeReasonChange={setChangeReason}
        onConfirmedChange={setConfirmed}
        onProvision={() => void provisionShadow()}
      />

      <div className="mt-4 grid gap-3">
        {mandates.map((mandate) => (
          <LiquidityMandateCard
            key={mandate.mandateId}
            mandate={mandate}
            activating={activatingSymbol === mandate.symbol}
            canActivate={Boolean(accessToken)
              && !loading
              && !error
              && mandate.transition?.stage === "SHADOW_READY"
              && mandate.roleEligible}
            onActivate={() => void activateMandate(mandate)}
          />
        ))}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs font-black text-admin-danger">전환 전 레거시 상장주관사 자동계정</p>
        <p className="mt-1 text-[11px] font-bold leading-5 text-admin-quiet">
          아래 설정은 발행·재고회수·유동성 공급이 섞인 기존 구조입니다. 종목별 LP 전환이 끝날 때까지만 유지하며, 같은 종목의 전용 LP LIVE와 동시에 가동할 수 없습니다.
        </p>
      </div>
    </section>
  );
}

type Feedback = {
  tone: "success" | "error";
  message: string;
};

function LiquidityProvisioningForm({
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
  onProvision,
}: {
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
  onProvision: () => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-admin-accent/25 bg-admin-accent-surface/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">종목별 LP SHADOW 준비</h3>
          <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            유통주식의 일부만 시드 재고로 인수·상장주관 계정에서 옮기고, 같은 평가액 수준의 운영 현금을 명시적 OPENING_GRANT로 기록합니다. 법적 LP 기관은 하나지만 계정과 계약은 종목별로 분리됩니다.
          </p>
        </div>
        <span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-black text-admin-accent-soft">
          일시정지 · 장전 전용
        </span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          종목 코드
          <input
            value={symbol}
            onChange={(event) => onSymbolChange(event.target.value.toUpperCase())}
            placeholder="DEMO001"
            className="min-h-10 rounded-md border border-white/10 bg-black/25 px-3 text-xs font-black uppercase text-white outline-none focus:border-admin-accent/60"
          />
        </label>
        <label className="grid gap-1 text-[10px] font-black text-admin-quiet">
          기준 거래량 / 유통주식
          <div className="flex min-h-10 items-center rounded-md border border-white/10 bg-black/25 px-3">
            <input
              type="number"
              min="0.5"
              max="8"
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
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex max-w-4xl items-start gap-2 text-xs font-bold leading-5 text-stock-subtle">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1"
          />
          현재 시뮬레이션이 일시정지된 장전이며, 시드 주식 이전과 시드 현금 유입이 전체 자산 규모를 바꾸는 감사 대상 작업임을 확인했습니다.
        </label>
        <button
          type="button"
          onClick={onProvision}
          disabled={!canProvision || pending}
          className="min-h-10 rounded-md bg-admin-accent px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "준비 중" : "SHADOW 준비"}
        </button>
      </div>
    </div>
  );
}

function LiquidityMandateCard({
  mandate,
  activating,
  canActivate,
  onActivate,
}: {
  mandate: LiquidityProviderMandate;
  activating: boolean;
  canActivate: boolean;
  onActivate: () => void;
}) {
  const state = mandate.dailyState;
  const reviewReasons = mandateReviewReasons(mandate);
  const executionUsage = state
    ? safeRate(state.executedBuyQuantity + state.executedSellQuantity, state.executionQuantityLimit)
    : 0;
  const submissionUsage = state
    ? safeRate(state.submittedBuyQuantity + state.submittedSellQuantity, state.submissionQuantityLimit)
    : 0;

  return (
    <article className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{mandate.symbol}</h3>
            <span className={modeClassName(mandate.executionMode)}>{formatMode(mandate.executionMode)}</span>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-stock-subtle">
              {mandate.status}
            </span>
            <span className={stateClassName(state)}>
              {state?.stateStatus ?? "미실행"}
            </span>
          </div>
          <p className="mt-1 break-all text-xs font-bold text-stock-subtle">
            {mandate.mandateCode} · 계약 #{mandate.mandateId} · 정책 v{mandate.policyVersion}
          </p>
          <p className="mt-1 break-all text-[11px] font-bold text-admin-quiet">
            {mandate.account.participantCode} · 계좌 {mandate.account.accountCode ?? `#${mandate.account.accountId}`} · STP {mandate.account.accountSelfTradeGroupId ?? "미설정"}
          </p>
        </div>
        <div className="text-right text-[10px] font-bold text-admin-quiet">
          <p>계약 {mandate.contractStartDate} ~ {mandate.contractEndDate ?? "종료일 미정"}</p>
          <p className="mt-1">다음 판단 {formatDateTime(mandate.nextQuoteAt)}</p>
          {mandate.transition?.stage === "SHADOW_READY" ? (
            <button
              type="button"
              onClick={onActivate}
              disabled={!canActivate || activating}
              className="mt-2 min-h-9 rounded-md bg-admin-warning px-3 text-[11px] font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {activating ? "전환 중" : "LP LIVE 전환"}
            </button>
          ) : null}
        </div>
      </div>

      {mandate.transition ? (
        <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] font-bold text-stock-subtle md:grid-cols-4">
          <p><span className="text-admin-quiet">전환</span><br /><strong className="text-white">{mandate.transition.stage} · v{mandate.transition.policyVersion}</strong></p>
          <p><span className="text-admin-quiet">시드 출발 → LP</span><br /><strong className="text-white">#{mandate.transition.sourceAccountId} → #{mandate.account.accountId}</strong></p>
          <p><span className="text-admin-quiet">시드 재고 · 현금</span><br /><strong className="text-white">{formatInteger(mandate.transition.seedInventoryQuantity)}주 · {formatCompactWon(mandate.transition.seedCashAmount)}</strong></p>
          <p><span className="text-admin-quiet">활성 시각</span><br /><strong className="text-white">{formatDateTime(mandate.transition.activatedAt)}</strong></p>
        </div>
      ) : null}

      {reviewReasons.length > 0 ? (
        <ul className="mt-3 grid gap-1 rounded-md border border-admin-danger/20 bg-admin-danger-surface/60 px-3 py-2 text-xs font-bold leading-5 text-admin-danger">
          {reviewReasons.map((reason) => <li key={reason}>· {reason}</li>)}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-admin-success/20 bg-admin-success-surface px-3 py-2 text-xs font-bold text-admin-success">
          역할·계정·자기체결 그룹과 현재 거래일 위험 상태가 정상입니다.
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <MandateMetric label="가용 현금" value={formatCompactWon(mandate.account.availableCash)} />
        <MandateMetric label="보유 평가액" value={formatCompactWon(mandate.account.holdingMarketValue)} />
        <MandateMetric label="현재 / 예상 재고" value={`${formatInteger(state?.lastInventoryQuantity ?? mandate.account.holdingQuantity)} / ${formatInteger(state?.lastProjectedInventoryQuantity ?? mandate.account.holdingQuantity)}주`} />
        <MandateMetric label="목표 ± 밴드" value={`${formatInteger(mandate.policy.targetInventoryQuantity)} ± ${formatInteger(mandate.policy.inventoryBandQuantity)}주`} />
        <MandateMetric label="기준 거래량" value={formatCount(mandate.policy.referenceDailyVolume, "주")} />
        <MandateMetric label="체결 한도 사용" value={formatPercent(executionUsage)} />
        <MandateMetric label="제출 한도 사용" value={formatPercent(submissionUsage)} />
        <MandateMetric label="일일 위험손익" value={formatSignedWon(state?.riskProfit ?? 0)} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MandateInfo
          label="호가·외부 깊이"
          primary={state ? `매수 ${formatWon(state.lastBidPrice)} · 매도 ${formatWon(state.lastAskPrice)}` : "오늘 판단 전"}
          secondary={state ? `외부 ${formatNumber(state.externalBuyDepthQuantity)} / ${formatNumber(state.externalSellDepthQuantity)}주 · 목표 스프레드 ${mandate.policy.targetSpreadTicks}틱` : `외부 ${mandate.policy.externalDepthLevels}호가의 ${formatPercent(mandate.policy.maxExternalDepthParticipationRate)} 이내`}
        />
        <MandateInfo
          label="미체결 목표 / 실제"
          primary={state ? `목표 ${formatNumber(state.targetBuyOpenQuantity)} / ${formatNumber(state.targetSellOpenQuantity)}주` : "오늘 판단 전"}
          secondary={state ? `실제 ${formatNumber(state.lastOpenBuyQuantity)} / ${formatNumber(state.lastOpenSellQuantity)}주` : `한 방향 목표 ${formatPercent(mandate.policy.targetOpenParticipationRate)} · 최대 ${formatPercent(mandate.policy.maxOpenParticipationRate)}`}
        />
        <MandateInfo
          label="NAV·손익"
          primary={state ? `${formatCompactWon(state.openingNetAssetValue)} → ${formatCompactWon(state.currentNetAssetValue)}` : "오늘 기준 NAV 없음"}
          secondary={state ? `실현 ${formatSignedWon(state.realizedProfit)} · 미실현 ${formatSignedWon(state.unrealizedProfit)} · 손실 한도 ${formatCompactWon(mandate.policy.dailyLossLimitAmount)}` : `손실 한도 ${formatCompactWon(mandate.policy.dailyLossLimitAmount)}`}
        />
      </div>

      <DataTableViewport label={`${mandate.symbol} LP 정책·거래일 감사`} tone="dark" className="mt-3">
        <table className="min-w-[1120px] w-full text-left text-xs">
          <thead className="bg-white/[0.045] text-[10px] font-black uppercase tracking-wide text-admin-quiet">
            <tr>
              <th className="px-3 py-2">실행 상태</th>
              <th className="px-3 py-2">제출 매수 / 매도</th>
              <th className="px-3 py-2">체결 매수 / 매도</th>
              <th className="px-3 py-2">취소 매수 / 매도</th>
              <th className="px-3 py-2">혼합 레짐</th>
              <th className="px-3 py-2">주문 제약</th>
              <th className="px-3 py-2">갱신</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top text-admin-muted">
              <td className="px-3 py-3">
                <p className="font-black text-white">{state?.gateReason ?? "NOT_RUN"}</p>
                <p className="mt-1 text-[10px] text-admin-quiet">run {formatInteger(state?.quoteRunCount ?? 0)} · state v{formatInteger(state?.version ?? 0)}</p>
              </td>
              <td className="px-3 py-3 tabular-nums">
                <p className="font-black text-white">{formatNumber(state?.submittedBuyQuantity ?? 0)} / {formatNumber(state?.submittedSellQuantity ?? 0)}주</p>
                <p className="mt-1 text-[10px] text-admin-quiet">{formatCompactWon(state?.submittedBuyAmount ?? 0)} / {formatCompactWon(state?.submittedSellAmount ?? 0)}</p>
              </td>
              <td className="px-3 py-3 tabular-nums">
                <p className="font-black text-white">{formatNumber(state?.executedBuyQuantity ?? 0)} / {formatNumber(state?.executedSellQuantity ?? 0)}주</p>
                <p className="mt-1 text-[10px] text-admin-quiet">{formatCompactWon(state?.executedBuyAmount ?? 0)} / {formatCompactWon(state?.executedSellAmount ?? 0)}</p>
              </td>
              <td className="px-3 py-3 tabular-nums">
                <p className="font-black text-white">{formatNumber(state?.cancelledBuyQuantity ?? 0)} / {formatNumber(state?.cancelledSellQuantity ?? 0)}주</p>
              </td>
              <td className="px-3 py-3 tabular-nums">
                <p className="font-black text-white">가격 {formatPressure(state?.blendedPricePressure)}</p>
                <p className="mt-1 text-[10px] text-admin-quiet">변동 {formatPressure(state?.blendedVolatilityPressure)} · 유동 {formatPressure(state?.blendedLiquidityPressure)}</p>
              </td>
              <td className="px-3 py-3">
                <p className="font-black text-white">건당 ≤ {formatNumber(mandate.policy.maxOrderQuantity)}주 · 기준량 {formatPercent(mandate.policy.maxSingleOrderParticipationRate)}</p>
                <p className="mt-1 text-[10px] text-admin-quiet">TTL {mandate.policy.orderTtlSeconds}초 · 최소 유지 {mandate.policy.minimumQuoteLifetimeSeconds}초 · 재호가 {mandate.policy.repriceThresholdTicks}틱</p>
              </td>
              <td className="px-3 py-3">
                <p className="font-black text-white">{formatDateTime(state?.updatedAt)}</p>
                <p className="mt-1 text-[10px] text-admin-quiet">state 정책 v{formatInteger(state?.policyVersion ?? 0)}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </DataTableViewport>
    </article>
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

function MandateInfo({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2">
      <p className="text-[10px] font-black text-admin-quiet">{label}</p>
      <p className="mt-1 break-words text-xs font-black text-white">{primary}</p>
      <p className="mt-1 break-words text-[10px] font-bold text-stock-subtle">{secondary}</p>
    </div>
  );
}

function summarizeMandates(mandates: LiquidityProviderMandate[]) {
  return {
    liveCount: mandates.filter((mandate) => mandate.executionMode === "LIVE").length,
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
      (sum, mandate) => sum + mandateReviewReasons(mandate).length,
      0,
    ),
  };
}

function mandateReviewReasons(mandate: LiquidityProviderMandate) {
  const reasons: string[] = [];
  if (!mandate.transition) {
    reasons.push("종목 단위 전환 감사 기록이 없습니다. 자동 LIVE 전환 대상이 아닙니다.");
  }
  if (!mandate.roleEligible) {
    reasons.push(`전용 계정 역할 검증 실패: ${mandate.roleEligibilityIssue ?? "UNKNOWN"}`);
  }
  if (mandate.legacyListingLiquidityEnabled) {
    reasons.push("같은 종목의 레거시 상장주관사 자동계정이 가동 중입니다. LIVE 주문은 중단됩니다.");
  }
  if (!mandate.policy.passiveOnly) {
    reasons.push("공격 주문 정책은 현재 LP 엔진에서 허용하지 않습니다.");
  }
  if (mandate.status !== "ACTIVE") {
    reasons.push(`계약 상태가 ${mandate.status}입니다.`);
  }
  if (!mandate.dailyState) {
    reasons.push("현재 거래일 LP 판단 기록이 아직 없습니다.");
  } else {
    if (mandate.dailyState.limitBreached) {
      reasons.push(`일일 위험 게이트가 중단되었습니다: ${mandate.dailyState.gateReason}`);
    }
    if (mandate.dailyState.stateStatus === "ERROR") {
      reasons.push("최근 LP 판단이 오류로 종료되었습니다.");
    }
    if (mandate.dailyState.policyVersion !== mandate.policyVersion) {
      reasons.push(`실행 정책 v${mandate.dailyState.policyVersion}와 현재 정책 v${mandate.policyVersion}이 다릅니다.`);
    }
  }
  return reasons;
}

function modeClassName(mode: LiquidityProviderMandate["executionMode"]) {
  const tone = mode === "LIVE"
    ? "bg-admin-danger-surface text-admin-danger"
    : mode === "PILOT"
      ? "bg-admin-warning-surface text-admin-warning"
      : "bg-admin-accent-surface text-admin-accent-soft";
  return `rounded-md px-2 py-1 text-[10px] font-black ${tone}`;
}

function stateClassName(state: LiquidityProviderDailyState | null) {
  const tone = state?.stateStatus === "HALTED" || state?.stateStatus === "ERROR"
    ? "bg-admin-danger-surface text-admin-danger"
    : state?.stateStatus === "QUOTING"
      ? "bg-admin-success-surface text-admin-success"
      : "bg-white/10 text-stock-subtle";
  return `rounded-md px-2 py-1 text-[10px] font-black ${tone}`;
}

function formatMode(mode: LiquidityProviderMandate["executionMode"]) {
  return mode === "PILOT" ? "PILOT · 감사" : mode;
}

function safeRate(value: number, limit: number) {
  if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) {
    return 0;
  }
  return Math.max(0, value / limit);
}

function formatPercent(value: number) {
  return `${formatNumber(value * 100)}%`;
}

function formatPressure(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }
  const score = value * 100;
  return `${score > 0 ? "+" : ""}${formatNumber(score)}`;
}

function formatSignedWon(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatWon(value)}`;
}
