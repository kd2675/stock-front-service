"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertInstitutionPortfolioQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { adminUpdateInstitutionPortfolioPolicyMutationOptions } from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  formatCompactWon,
  formatDateTime,
  formatInteger,
  formatNumber,
} from "@/app/supply-demand/admin/AdminFormatters";
import type {
  InstitutionInvestmentStyle,
  InstitutionPortfolio,
  InstitutionPortfolioRecommendation,
  InstitutionPortfolioStylePreset,
  InstitutionSymbolPolicy,
} from "@/app/types/stock";

type PolicyDraft = {
  displayName: string;
  investmentStyle: InstitutionInvestmentStyle;
  baseStockAllocationRate: number;
  minStockAllocationRate: number;
  maxStockAllocationRate: number;
  primaryRegimeWeight: number;
  assetPreferenceSensitivity: number;
  volatilitySensitivity: number;
  entryThresholdRate: number;
  exitThresholdRate: number;
  dailyTurnoverLimitRate: number;
  maxDecisionTurnoverRate: number;
  decisionIntervalMinutes: number;
  mandates: InstitutionSymbolPolicy[];
  changeReason: string;
};

type Feedback = {
  tone: "success" | "error";
  message: string;
};

export function AdminInstitutionPolicyEditor({
  accessToken,
  portfolio,
  recommendation,
}: {
  accessToken: string | null;
  portfolio: InstitutionPortfolio;
  recommendation: InstitutionPortfolioRecommendation | null;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation(adminUpdateInstitutionPortfolioPolicyMutationOptions());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PolicyDraft>(() => createDraft(portfolio));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const selectedStyle = recommendation?.styles.find(
    (style) => style.investmentStyle === draft.investmentStyle,
  ) ?? null;
  const currentActiveSymbols = useMemo(
    () => portfolio.mandates
      .filter((mandate) => mandate.enabled && mandate.maxPortfolioAllocationRate > 0)
      .map((mandate) => mandate.symbol),
    [portfolio.mandates],
  );
  const selectedSymbols = draft.mandates.map((mandate) => mandate.symbol);
  const selectedSymbolSet = new Set(selectedSymbols);
  const removedSymbols = currentActiveSymbols.filter(
    (symbol) => !selectedSymbolSet.has(symbol),
  );
  const pendingActivationSymbols = (recommendation?.symbols ?? [])
    .filter((symbol) => selectedSymbolSet.has(symbol.symbol)
      && symbol.marketActivationStatus === "PENDING_MARKET_ACTIVATION")
    .map((symbol) => symbol.symbol);
  const baseWeightSum = draft.mandates.reduce(
    (sum, mandate) => sum + mandate.baseSymbolWeight,
    0,
  );
  const minimumAllocationSum = draft.mandates.reduce(
    (sum, mandate) => sum + mandate.minPortfolioAllocationRate,
    0,
  );
  const maximumAllocationSum = draft.mandates.reduce(
    (sum, mandate) => sum + mandate.maxPortfolioAllocationRate,
    0,
  );
  const validationIssue = validateDraft(
    draft,
    baseWeightSum,
    minimumAllocationSum,
    maximumAllocationSum,
  );

  const openEditor = () => {
    setDraft(createDraft(portfolio));
    setFeedback(null);
    setEditing(true);
  };

  const applyRecommendations = (style: InstitutionPortfolioStylePreset) => {
    setDraft((current) => {
      const styled = applyStylePreset(current, style);
      return {
        ...styled,
        mandates: recommendedMandates(
          styled.mandates.map((mandate) => mandate.symbol),
          recommendation,
          style,
          styled.mandates,
          true,
        ),
      };
    });
  };

  const toggleSymbol = (symbol: string) => {
    setDraft((current) => {
      const exists = current.mandates.some((mandate) => mandate.symbol === symbol);
      const symbols = exists
        ? current.mandates
          .map((mandate) => mandate.symbol)
          .filter((item) => item !== symbol)
        : [...current.mandates.map((mandate) => mandate.symbol), symbol];
      const style = recommendation?.styles.find(
        (item) => item.investmentStyle === current.investmentStyle,
      ) ?? null;
      return {
        ...current,
        mandates: recommendedMandates(
          symbols,
          recommendation,
          style,
          current.mandates,
          false,
        ),
      };
    });
  };

  const recalculateSelectedSymbols = () => {
    setDraft((current) => {
      const style = recommendation?.styles.find(
        (item) => item.investmentStyle === current.investmentStyle,
      ) ?? null;
      return {
        ...current,
        mandates: recommendedMandates(
          current.mandates.map((mandate) => mandate.symbol),
          recommendation,
          style,
          current.mandates,
          false,
        ),
      };
    });
  };

  const selectAllSymbolsAndRecalculate = () => {
    setDraft((current) => {
      const style = recommendation?.styles.find(
        (item) => item.investmentStyle === current.investmentStyle,
      ) ?? null;
      return {
        ...current,
        mandates: recommendedMandates(
          (recommendation?.symbols ?? []).map((symbol) => symbol.symbol),
          recommendation,
          style,
          current.mandates,
          false,
        ),
      };
    });
  };

  const savePolicy = async () => {
    if (!accessToken || mutation.isPending || validationIssue) {
      return;
    }
    const confirmed = window.confirm(
      [
        `${portfolio.displayName}의 정책 v${portfolio.policyVersion + 1}을 다음 개장에 적용하도록 예약합니다.`,
        removedSymbols.length > 0
          ? `제외 종목 ${removedSymbols.join(", ")}은 보유 수량이 있으면 목표 0% 청산 전용으로 전환됩니다.`
          : "현재 운용 종목을 유지합니다.",
        pendingActivationSymbols.length > 0
          ? `개장 대기 종목 ${pendingActivationSymbols.join(", ")}은 시장 활성화가 완료돼야 정책에 실제 반영됩니다. 미활성 상태면 배치가 적용을 거부하고 예약 정책을 유지합니다.`
          : "선택 종목은 모두 현재 시장 활성 상태입니다.",
        "당일 주문·예산과 섞이지 않도록 개장 시점에 미체결 주문과 당일 사용 여부를 다시 검증합니다.",
      ].join("\n\n"),
    );
    if (!confirmed) {
      return;
    }
    setFeedback(null);
    const result = await mutation.mutateAsync({
      token: accessToken,
      portfolioId: portfolio.portfolioId,
      payload: draft,
    });
    const updated = getAdminActionData(
      result,
      "기관 정책 변경을 예약하지 못했습니다.",
    );
    if (!updated.ok) {
      setFeedback({ tone: "error", message: updated.message });
      return;
    }
    upsertInstitutionPortfolioQueryData(queryClient, updated.data);
    setEditing(false);
    setFeedback({
      tone: "success",
      message: updated.data.scheduledPolicy
        ? `정책 v${updated.data.scheduledPolicy.policyVersion}을 ${updated.data.scheduledPolicy.effectiveBusinessDate} 개장 적용으로 예약했습니다.`
        : "기관 정책 변경을 예약했습니다.",
    });
  };

  return (
    <div className="mt-3 rounded-md border border-admin-accent/25 bg-admin-accent-surface/15 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-black text-white">기관 운용 정책 수정</h4>
          <p className="mt-1 max-w-4xl text-[10px] font-bold leading-5 text-stock-subtle">
            AUM 현금 자체는 바꾸지 않고 목표 비중·위험 한도·결정 주기·종목 위임을 다음 개장부터 변경합니다. 종목 제외 시 보유분은 0% 목표로 질서 있게 청산합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={editing ? () => setEditing(false) : openEditor}
          disabled={!accessToken || mutation.isPending}
          className="min-h-8 rounded-md bg-admin-accent px-3 text-[10px] font-black text-admin-canvas disabled:cursor-not-allowed disabled:opacity-45"
        >
          {editing ? "수정 닫기" : "정책·종목 수정"}
        </button>
      </div>

      {portfolio.scheduledPolicy ? (
        <div className="mt-3 rounded-md border border-admin-warning/25 bg-admin-warning-surface/50 px-3 py-2 text-[10px] font-bold leading-5 text-admin-warning">
          예약 정책 v{portfolio.scheduledPolicy.policyVersion} · {portfolio.scheduledPolicy.effectiveBusinessDate} 개장 적용
          {" · "}{portfolio.scheduledPolicy.changeReason}
          {" · "}{portfolio.scheduledPolicy.changedBy}
          {" · "}{formatDateTime(portfolio.scheduledPolicy.updatedAt)}
        </div>
      ) : null}

      {feedback ? (
        <p className={[
          "mt-3 rounded-md border px-3 py-2 text-[11px] font-bold leading-5",
          feedback.tone === "success"
            ? "border-admin-success/25 bg-admin-success-surface text-admin-success"
            : "border-admin-danger/25 bg-admin-danger-surface text-admin-danger",
        ].join(" ")}>
          {feedback.message}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <PolicyTextInput
              label="기관 표시명"
              value={draft.displayName}
              onChange={(value) => setDraft((current) => ({ ...current, displayName: value }))}
            />
            <label className="grid gap-1 text-[10px] font-black text-admin-muted">
              운용 유형
              <select
                value={draft.investmentStyle}
                onChange={(event) => {
                  const investmentStyle = event.target.value as InstitutionInvestmentStyle;
                  setDraft((current) => ({ ...current, investmentStyle }));
                }}
                className="admin-control px-3 text-xs font-bold"
              >
                {(recommendation?.styles ?? []).map((style) => (
                  <option key={style.investmentStyle} value={style.investmentStyle}>
                    {style.label}
                  </option>
                ))}
              </select>
            </label>
            <PolicyNumberInput
              label="기준 주식 비중"
              value={draft.baseStockAllocationRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                baseStockAllocationRate: value,
              }))}
            />
            <PolicyNumberInput
              label="최소 주식 비중"
              value={draft.minStockAllocationRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                minStockAllocationRate: value,
              }))}
            />
            <PolicyNumberInput
              label="최대 주식 비중"
              value={draft.maxStockAllocationRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                maxStockAllocationRate: value,
              }))}
            />
            <PolicyNumberInput
              label="주 레짐 가중치"
              value={draft.primaryRegimeWeight}
              onChange={(value) => setDraft((current) => ({
                ...current,
                primaryRegimeWeight: value,
              }))}
            />
            <PolicyNumberInput
              label="자산선호 민감도"
              value={draft.assetPreferenceSensitivity}
              onChange={(value) => setDraft((current) => ({
                ...current,
                assetPreferenceSensitivity: value,
              }))}
            />
            <PolicyNumberInput
              label="변동성 민감도"
              value={draft.volatilitySensitivity}
              onChange={(value) => setDraft((current) => ({
                ...current,
                volatilitySensitivity: value,
              }))}
            />
            <PolicyNumberInput
              label="진입 임계값"
              value={draft.entryThresholdRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                entryThresholdRate: value,
              }))}
            />
            <PolicyNumberInput
              label="이탈 임계값"
              value={draft.exitThresholdRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                exitThresholdRate: value,
              }))}
            />
            <PolicyNumberInput
              label="일일 총매매 한도"
              value={draft.dailyTurnoverLimitRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                dailyTurnoverLimitRate: value,
              }))}
            />
            <PolicyNumberInput
              label="결정당 총매매 한도"
              value={draft.maxDecisionTurnoverRate}
              onChange={(value) => setDraft((current) => ({
                ...current,
                maxDecisionTurnoverRate: value,
              }))}
            />
            <PolicyNumberInput
              label="결정 주기(분)"
              value={draft.decisionIntervalMinutes}
              rate={false}
              step="1"
              onChange={(value) => setDraft((current) => ({
                ...current,
                decisionIntervalMinutes: value,
              }))}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(recommendation?.styles ?? []).map((style) => (
              <button
                key={style.investmentStyle}
                type="button"
                onClick={() => applyRecommendations(style)}
                className={[
                  "min-h-8 rounded-md border px-3 text-[10px] font-black",
                  style.investmentStyle === draft.investmentStyle
                    ? "border-admin-accent/55 bg-admin-accent-surface text-admin-accent-soft"
                    : "border-white/10 bg-white/[0.04] text-stock-subtle",
                ].join(" ")}
              >
                {style.label} 권장값·비율 적용
              </button>
            ))}
            <span className="text-[10px] font-bold text-admin-quiet">
              {selectedStyle
                ? `선택 유형 권장: 주식 ${formatRate(selectedStyle.baseStockAllocationRate)} · 일일 회전 ${formatRate(selectedStyle.dailyTurnoverLimitRate)}`
                : "운용 유형별 권장값 조회 대기"}
            </span>
          </div>

          <fieldset className="mt-3 rounded-md border border-white/10 p-3">
            <legend className="px-1 text-[11px] font-black text-white">거래 가능 종목</legend>
            <p className="text-[10px] font-bold leading-5 text-stock-subtle">
              신규 상장·개장 대기 종목을 선택하면 이 기관도 시장 활성화 후 거래합니다. 체크 해제 종목은 보유분이 있으면 청산 전용, 잔고가 없으면 비활성으로 전환됩니다.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAllSymbolsAndRecalculate}
                disabled={!recommendation?.symbols.length}
                className="min-h-8 rounded-md bg-admin-accent px-3 text-[10px] font-black text-admin-canvas disabled:opacity-45"
              >
                전체 {recommendation?.policyEligibleSymbolCount ?? 0}종목 선택·시총비중 재계산
              </button>
              <button
                type="button"
                onClick={recalculateSelectedSymbols}
                disabled={draft.mandates.length === 0}
                className="min-h-8 rounded-md bg-white/10 px-3 text-[10px] font-black text-white disabled:opacity-45"
              >
                현재 선택 종목 비중 재계산
              </button>
              <span className="text-[10px] font-bold text-admin-quiet">
                기존 민감도·참여율·상하한은 유지하고 기준 비중만 유통 시가총액으로 다시 합계 100%를 맞춥니다.
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(recommendation?.symbols ?? []).map((symbol) => (
                <label
                  key={symbol.symbol}
                  className={[
                    "flex min-h-9 items-center gap-2 rounded-md border px-3 text-[10px] font-black",
                    selectedSymbolSet.has(symbol.symbol)
                      ? "border-admin-accent/55 bg-admin-accent-surface text-admin-accent-soft"
                      : "border-white/10 bg-white/[0.03] text-stock-subtle",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymbolSet.has(symbol.symbol)}
                    onChange={() => toggleSymbol(symbol.symbol)}
                    className="size-4 accent-[var(--admin-accent)]"
                  />
                  {symbol.symbol} · {symbol.name}
                  {symbol.marketActivationStatus === "PENDING_MARKET_ACTIVATION" ? (
                    <span className="rounded bg-admin-warning-surface px-1.5 py-0.5 text-[9px] text-admin-warning">
                      개장 대기
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 grid gap-2">
            {draft.mandates.map((mandate, index) => {
              const market = recommendation?.symbols.find(
                (symbol) => symbol.symbol === mandate.symbol,
              );
              return (
                <div
                  key={mandate.symbol}
                  className="rounded-md border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-white">{mandate.symbol}</p>
                      <p className="mt-1 text-[10px] font-bold text-admin-quiet">
                        {market
                          ? `${market.name} · 유통 시가총액 ${formatCompactWon(market.currentPrice * market.tradableShares)} · 시장비중 ${formatRate(market.marketWeight)} · 권장 기준 거래량 ${formatInteger(market.recommendedReferenceDailyVolume)}주${market.marketActivationStatus === "PENDING_MARKET_ACTIVATION" ? " · 개장 대기" : ""}`
                          : "현재 추천 시장 목록에서 찾을 수 없는 종목"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSymbol(mandate.symbol)}
                      className="min-h-7 rounded-md bg-admin-danger-surface px-2 text-[9px] font-black text-admin-danger"
                    >
                      운용 제외
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <MandateNumberInput
                      label="기준 비중"
                      value={mandate.baseSymbolWeight}
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "baseSymbolWeight",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="최소 포트폴리오 비중"
                      value={mandate.minPortfolioAllocationRate}
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "minPortfolioAllocationRate",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="최대 포트폴리오 비중"
                      value={mandate.maxPortfolioAllocationRate}
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "maxPortfolioAllocationRate",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="가격 압력 민감도"
                      value={mandate.pricePressureSensitivity}
                      min="-1"
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "pricePressureSensitivity",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="모멘텀 민감도"
                      value={mandate.momentumSensitivity}
                      min="-1"
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "momentumSensitivity",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="가치 민감도"
                      value={mandate.valueSensitivity}
                      min="-1"
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "valueSensitivity",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="보고서 민감도"
                      value={mandate.reportSensitivity}
                      min="-1"
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "reportSensitivity",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="기준 일거래량(주)"
                      value={mandate.referenceDailyVolume}
                      rate={false}
                      min="1"
                      max={undefined}
                      step="1"
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "referenceDailyVolume",
                        value,
                      ))}
                    />
                    <MandateNumberInput
                      label="일일 시장 참여율"
                      value={mandate.dailyParticipationRate}
                      max="0.2"
                      onChange={(value) => setDraft((current) => updateMandate(
                        current,
                        index,
                        "dailyParticipationRate",
                        value,
                      ))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <PolicySummary label="기준 비중 합계" value={formatRate(baseWeightSum)} valid={Math.abs(baseWeightSum - 1) <= 0.0001} />
            <PolicySummary label="종목 최소 합계" value={formatRate(minimumAllocationSum)} valid={minimumAllocationSum <= draft.minStockAllocationRate} />
            <PolicySummary label="종목 최대 합계" value={formatRate(maximumAllocationSum)} valid={maximumAllocationSum >= draft.maxStockAllocationRate} />
            <PolicySummary label="제외 예정 종목" value={removedSymbols.length > 0 ? removedSymbols.join(", ") : "없음"} valid />
          </div>

          <label className="mt-3 grid gap-1 text-[10px] font-black text-admin-muted">
            변경 사유
            <input
              value={draft.changeReason}
              maxLength={500}
              onChange={(event) => setDraft((current) => ({
                ...current,
                changeReason: event.target.value,
              }))}
              className="admin-control px-3 text-xs font-bold"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className={[
              "text-[10px] font-bold leading-5",
              validationIssue ? "text-admin-danger" : "text-admin-success",
            ].join(" ")}>
              {validationIssue ?? "비율·위험 한도 검증 통과 · 다음 개장 예약 가능"}
            </p>
            <button
              type="button"
              onClick={() => void savePolicy()}
              disabled={!accessToken || mutation.isPending || Boolean(validationIssue)}
              className="min-h-9 rounded-md bg-admin-accent px-3 text-xs font-black text-admin-canvas disabled:cursor-not-allowed disabled:opacity-45"
            >
              {mutation.isPending ? "정책 예약 중" : "다음 개장 정책 예약"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function createDraft(portfolio: InstitutionPortfolio): PolicyDraft {
  const policy = portfolio.scheduledPolicy ?? portfolio;
  const mandates = portfolio.scheduledPolicy?.mandates
    ?? portfolio.mandates
      .filter((mandate) => mandate.enabled && mandate.maxPortfolioAllocationRate > 0)
      .map(toSymbolPolicy);
  return {
    displayName: policy.displayName,
    investmentStyle: policy.investmentStyle,
    baseStockAllocationRate: policy.baseStockAllocationRate,
    minStockAllocationRate: policy.minStockAllocationRate,
    maxStockAllocationRate: policy.maxStockAllocationRate,
    primaryRegimeWeight: policy.primaryRegimeWeight,
    assetPreferenceSensitivity: policy.assetPreferenceSensitivity,
    volatilitySensitivity: policy.volatilitySensitivity,
    entryThresholdRate: policy.entryThresholdRate,
    exitThresholdRate: policy.exitThresholdRate,
    dailyTurnoverLimitRate: policy.dailyTurnoverLimitRate,
    maxDecisionTurnoverRate: policy.maxDecisionTurnoverRate,
    decisionIntervalMinutes: policy.decisionIntervalMinutes,
    mandates: mandates.map((mandate) => ({ ...mandate })),
    changeReason: portfolio.scheduledPolicy?.changeReason
      ?? "시장 규모와 운용 유형 기준 기관 정책·종목 비율 재조정",
  };
}

function toSymbolPolicy(mandate: InstitutionPortfolio["mandates"][number]) {
  return {
    symbol: mandate.symbol,
    baseSymbolWeight: mandate.baseSymbolWeight,
    minPortfolioAllocationRate: mandate.minPortfolioAllocationRate,
    maxPortfolioAllocationRate: mandate.maxPortfolioAllocationRate,
    pricePressureSensitivity: mandate.pricePressureSensitivity,
    momentumSensitivity: mandate.momentumSensitivity,
    valueSensitivity: mandate.valueSensitivity,
    reportSensitivity: mandate.reportSensitivity,
    referenceDailyVolume: mandate.referenceDailyVolume,
    dailyParticipationRate: mandate.dailyParticipationRate,
  };
}

function applyStylePreset(
  draft: PolicyDraft,
  style: InstitutionPortfolioStylePreset,
): PolicyDraft {
  return {
    ...draft,
    investmentStyle: style.investmentStyle,
    baseStockAllocationRate: style.baseStockAllocationRate,
    minStockAllocationRate: style.minStockAllocationRate,
    maxStockAllocationRate: style.maxStockAllocationRate,
    primaryRegimeWeight: style.primaryRegimeWeight,
    assetPreferenceSensitivity: style.assetPreferenceSensitivity,
    volatilitySensitivity: style.volatilitySensitivity,
    entryThresholdRate: style.entryThresholdRate,
    exitThresholdRate: style.exitThresholdRate,
    dailyTurnoverLimitRate: style.dailyTurnoverLimitRate,
    maxDecisionTurnoverRate: style.maxDecisionTurnoverRate,
    decisionIntervalMinutes: style.decisionIntervalMinutes,
  };
}

function recommendedMandates(
  symbols: string[],
  recommendation: InstitutionPortfolioRecommendation | null,
  style: InstitutionPortfolioStylePreset | null,
  current: InstitutionSymbolPolicy[],
  applyStyleToExisting: boolean,
) {
  if (symbols.length === 0) {
    return [];
  }
  const marketBySymbol = new Map(
    (recommendation?.symbols ?? []).map((symbol) => [symbol.symbol, symbol]),
  );
  const currentBySymbol = new Map(current.map((mandate) => [mandate.symbol, mandate]));
  const marketCapitalizations = symbols.map((symbol) => {
    const market = marketBySymbol.get(symbol);
    return market ? market.currentPrice * market.tradableShares : 0;
  });
  const totalMarketCapitalization = marketCapitalizations.reduce(
    (sum, value) => sum + value,
    0,
  );
  const diversificationMaximum = symbols.length === 1
    ? style?.maxStockAllocationRate ?? 1
    : symbols.length <= 3
      ? 0.5
      : 0.3;
  let assignedWeight = 0;
  return symbols.map((symbol, index) => {
    const market = marketBySymbol.get(symbol);
    const existing = currentBySymbol.get(symbol);
    const baseSymbolWeight = index === symbols.length - 1
      ? roundRate(1 - assignedWeight)
      : roundRate(
        totalMarketCapitalization > 0
          ? marketCapitalizations[index] / totalMarketCapitalization
          : 1 / symbols.length,
      );
    assignedWeight += baseSymbolWeight;
    const preserveExisting = existing && !applyStyleToExisting;
    const recommendedMaximumAllocation = roundRate(Math.min(
      1,
      Math.max(
        diversificationMaximum,
        baseSymbolWeight * (style?.maxStockAllocationRate ?? 1),
      ),
    ));
    return {
      symbol,
      baseSymbolWeight,
      minPortfolioAllocationRate: preserveExisting
        ? existing.minPortfolioAllocationRate
        : 0,
      maxPortfolioAllocationRate: preserveExisting
        ? existing.maxPortfolioAllocationRate
        : recommendedMaximumAllocation,
      pricePressureSensitivity: preserveExisting
        ? existing.pricePressureSensitivity
        : style?.pricePressureSensitivity
          ?? existing?.pricePressureSensitivity
          ?? 0,
      momentumSensitivity: preserveExisting
        ? existing.momentumSensitivity
        : style?.momentumSensitivity
          ?? existing?.momentumSensitivity
          ?? 0,
      valueSensitivity: preserveExisting
        ? existing.valueSensitivity
        : style?.valueSensitivity
          ?? existing?.valueSensitivity
          ?? 0,
      reportSensitivity: preserveExisting
        ? existing.reportSensitivity
        : style?.reportSensitivity
          ?? existing?.reportSensitivity
          ?? 0,
      referenceDailyVolume: preserveExisting
        ? existing.referenceDailyVolume
        : market?.recommendedReferenceDailyVolume
          ?? existing?.referenceDailyVolume
          ?? 1,
      dailyParticipationRate: preserveExisting
        ? existing.dailyParticipationRate
        : style?.dailyParticipationRate
          ?? existing?.dailyParticipationRate
          ?? 0.01,
    };
  });
}

function updateMandate(
  draft: PolicyDraft,
  index: number,
  field: Exclude<keyof InstitutionSymbolPolicy, "symbol">,
  value: number,
) {
  return {
    ...draft,
    mandates: draft.mandates.map((mandate, mandateIndex) => mandateIndex === index
      ? { ...mandate, [field]: value }
      : mandate),
  };
}

function validateDraft(
  draft: PolicyDraft,
  baseWeightSum: number,
  minimumAllocationSum: number,
  maximumAllocationSum: number,
) {
  const numbers = [
    draft.baseStockAllocationRate,
    draft.minStockAllocationRate,
    draft.maxStockAllocationRate,
    draft.primaryRegimeWeight,
    draft.assetPreferenceSensitivity,
    draft.volatilitySensitivity,
    draft.entryThresholdRate,
    draft.exitThresholdRate,
    draft.dailyTurnoverLimitRate,
    draft.maxDecisionTurnoverRate,
    draft.decisionIntervalMinutes,
    ...draft.mandates.flatMap((mandate) => [
      mandate.baseSymbolWeight,
      mandate.minPortfolioAllocationRate,
      mandate.maxPortfolioAllocationRate,
      mandate.pricePressureSensitivity,
      mandate.momentumSensitivity,
      mandate.valueSensitivity,
      mandate.reportSensitivity,
      mandate.referenceDailyVolume,
      mandate.dailyParticipationRate,
    ]),
  ];
  if (!draft.displayName.trim()) {
    return "기관 표시명을 입력해야 합니다.";
  }
  if (numbers.some((value) => !Number.isFinite(value))) {
    return "모든 정책 숫자를 올바르게 입력해야 합니다.";
  }
  if (draft.mandates.length === 0) {
    return "최소 한 종목을 운용 대상으로 선택해야 합니다.";
  }
  if (draft.minStockAllocationRate < 0
    || draft.minStockAllocationRate > draft.baseStockAllocationRate
    || draft.baseStockAllocationRate > draft.maxStockAllocationRate
    || draft.maxStockAllocationRate > 1) {
    return "주식 비중은 최소 ≤ 기준 ≤ 최대 ≤ 100%여야 합니다.";
  }
  if (draft.exitThresholdRate < 0
    || draft.exitThresholdRate > draft.entryThresholdRate
    || draft.entryThresholdRate > 1) {
    return "이탈 임계값은 진입 임계값보다 클 수 없습니다.";
  }
  if (draft.maxDecisionTurnoverRate <= 0
    || draft.maxDecisionTurnoverRate > draft.dailyTurnoverLimitRate
    || draft.dailyTurnoverLimitRate > 1) {
    return "결정당 회전율은 일일 회전율 이하의 양수여야 합니다.";
  }
  if (!Number.isInteger(draft.decisionIntervalMinutes)
    || draft.decisionIntervalMinutes < 5
    || draft.decisionIntervalMinutes > 1440) {
    return "결정 주기는 5~1,440분의 정수여야 합니다.";
  }
  if (Math.abs(baseWeightSum - 1) > 0.0001) {
    return "종목 기준 비중 합계는 100%여야 합니다.";
  }
  if (minimumAllocationSum > draft.minStockAllocationRate) {
    return "종목별 최소 비중 합계가 포트폴리오 최소 주식 비중을 초과합니다.";
  }
  if (maximumAllocationSum < draft.maxStockAllocationRate) {
    return "종목별 최대 비중 합계가 포트폴리오 최대 주식 비중을 수용하지 못합니다.";
  }
  for (const mandate of draft.mandates) {
    if (mandate.baseSymbolWeight <= 0
      || mandate.minPortfolioAllocationRate < 0
      || mandate.maxPortfolioAllocationRate <= 0
      || mandate.minPortfolioAllocationRate > mandate.maxPortfolioAllocationRate
      || mandate.maxPortfolioAllocationRate > 1) {
      return `${mandate.symbol}의 기준·최소·최대 비중을 확인해야 합니다.`;
    }
    if (mandate.referenceDailyVolume < 1
      || mandate.dailyParticipationRate <= 0
      || mandate.dailyParticipationRate > 0.2) {
      return `${mandate.symbol}의 기준 거래량 또는 참여율을 확인해야 합니다.`;
    }
    const sensitivities = [
      mandate.pricePressureSensitivity,
      mandate.momentumSensitivity,
      mandate.valueSensitivity,
      mandate.reportSensitivity,
    ];
    if (sensitivities.some((value) => value < -1 || value > 1)) {
      return `${mandate.symbol}의 스타일 민감도는 -1~1 범위여야 합니다.`;
    }
  }
  return null;
}

function PolicyTextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black text-admin-muted">
      {label}
      <input
        value={value}
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        className="admin-control px-3 text-xs font-bold"
      />
    </label>
  );
}

function PolicyNumberInput({
  label,
  value,
  onChange,
  rate = true,
  step = "0.0001",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  rate?: boolean;
  step?: string;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-black text-admin-muted">
      {label}{rate ? " (소수, 1=100%)" : ""}
      <input
        type="number"
        min="0"
        max={rate ? "1" : undefined}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="admin-control px-3 text-xs font-bold tabular-nums"
      />
    </label>
  );
}

function MandateNumberInput({
  label,
  value,
  onChange,
  rate = true,
  min = "0",
  max = "1",
  step = "0.0001",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  rate?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="grid gap-1 text-[9px] font-black text-admin-muted">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="admin-control px-2 text-[11px] font-bold tabular-nums"
      />
      {rate ? (
        <span className="text-[9px] font-bold text-admin-quiet">
          {Number.isFinite(value) ? formatRate(value) : "입력 필요"}
        </span>
      ) : null}
    </label>
  );
}

function PolicySummary({
  label,
  value,
  valid,
}: {
  label: string;
  value: string;
  valid: boolean;
}) {
  return (
    <div className={[
      "rounded-md border px-3 py-2",
      valid
        ? "border-admin-success/20 bg-admin-success-surface/30"
        : "border-admin-danger/25 bg-admin-danger-surface/40",
    ].join(" ")}>
      <p className="text-[9px] font-black text-admin-quiet">{label}</p>
      <p className={[
        "mt-1 break-words text-[11px] font-black",
        valid ? "text-admin-success" : "text-admin-danger",
      ].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function roundRate(value: number) {
  return Number(value.toFixed(6));
}

function formatRate(value: number) {
  return `${formatNumber(value * 100)}%`;
}
