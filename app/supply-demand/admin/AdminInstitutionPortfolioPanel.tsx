"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import DataTableViewport from "@/app/components/DataTableViewport";
import {
  setInstitutionPortfoliosQueryData,
  upsertInstitutionPortfolioQueryData,
} from "@/app/lib/react-query/stockCacheUpdates";
import {
  adminCreateInstitutionPortfolioMutationOptions,
  adminSuspendInstitutionMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  formatCompactWon,
  formatCount,
  formatDateTime,
  formatInteger,
  formatNumber,
} from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type {
  InstitutionDecisionAction,
  InstitutionPortfolio,
  InstitutionPortfolioRecommendation,
  InstitutionSymbolMandate,
} from "@/app/types/stock";

type Feedback = {
  tone: "success" | "error";
  message: string;
};

export function AdminInstitutionPortfolioPanel({
  accessToken,
  portfolios,
  recommendation,
  loading,
  error,
  onRefresh,
}: {
  accessToken: string | null;
  portfolios: InstitutionPortfolio[];
  recommendation: InstitutionPortfolioRecommendation | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const createPortfolioMutation = useMutation(adminCreateInstitutionPortfolioMutationOptions());
  const [portfolioCode, setPortfolioCode] = useState("INSTITUTION_1");
  const [displayName, setDisplayName] = useState("기관 투자자 1");
  const [investmentStyle, setInvestmentStyle] = useState("BALANCED_LONG_TERM");
  const [aumPercent, setAumPercent] = useState("1.0");
  const [symbolsText, setSymbolsText] = useState("");
  const [changeReason, setChangeReason] = useState("축소 시장용 기관 포트폴리오 단건 생성");
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const summary = useMemo(() => summarizePortfolios(portfolios), [portfolios]);
  const normalizedAumPercent = Number(aumPercent);
  const normalizedPortfolioCode = portfolioCode.trim().toUpperCase();
  const normalizedDisplayName = displayName.trim();
  const normalizedSymbols = normalizeSymbols(symbolsText);
  const canCreate = Boolean(accessToken)
    && !loading
    && !error
    && confirmed
    && /^[A-Z0-9_]{3,24}$/.test(normalizedPortfolioCode)
    && normalizedDisplayName.length > 0
    && normalizedDisplayName.length <= 120
    && Boolean(investmentStyle)
    && Number.isFinite(normalizedAumPercent)
    && normalizedAumPercent >= 0.1
    && normalizedAumPercent <= 2;

  const createPortfolio = async () => {
    if (!canCreate || !accessToken || createPortfolioMutation.isPending) {
      return;
    }
    setFeedback(null);
    const result = await createPortfolioMutation.mutateAsync({
      token: accessToken,
      portfolioCode: normalizedPortfolioCode,
      displayName: normalizedDisplayName,
      investmentStyle,
      institutionAumRateOfMarketCap: normalizedAumPercent / 100,
      symbols: normalizedSymbols.length > 0 ? normalizedSymbols : undefined,
      changeReason: changeReason.trim() || undefined,
    });
    const created = getAdminActionData(
      result,
      "기관 포트폴리오를 생성하지 못했습니다.",
    );
    if (!created.ok) {
      setFeedback({ tone: "error", message: created.message });
      return;
    }
    upsertInstitutionPortfolioQueryData(queryClient, created.data);
    setConfirmed(false);
    setFeedback({
      tone: "success",
      message: `${created.data.displayName}을 제한된 LIVE 모드로 생성했습니다. 다른 기관은 필요할 때 별도로 추가할 수 있습니다.`,
    });
    onRefresh();
  };

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">기관 포트폴리오·주문 감사</h2>
          <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            150명 안팎 자동 참여자와 소수 유저로 구성된 축소 시장 기준입니다. 주·보조 압력은 직접 BUY/SELL을 강제하지 않고 제한된 목표 비중 변화로만 반영합니다.
          </p>
          <p className="mt-1 max-w-4xl text-[11px] font-bold leading-5 text-admin-quiet">
            생성한 기관은 다음 개장부터 바로 LIVE로 동작합니다. 목표 도달 후 HOLD, 미체결 포함 예상 포지션, 일일 참여율, 주문 출처와 자기체결 방지를 함께 적용합니다.
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
        <ProfileMiniMetric label="기관 포트폴리오" value={formatCount(portfolios.length, "개")} tone="blue" />
        <ProfileMiniMetric label="합산 AUM" value={formatCompactWon(summary.totalAsset)} tone="blue" />
        <ProfileMiniMetric label="주식 비중" value={formatRate(summary.stockAllocationRate)} tone="muted" />
        <ProfileMiniMetric label="오늘 계획 총매매" value={formatCompactWon(summary.dailyPlannedGrossAmount)} tone="muted" />
        <ProfileMiniMetric label="최근 HOLD" value={formatCount(summary.holdCount, "종목")} tone="green" />
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
          기관·계정·포트폴리오·결정 감사 중 일부를 읽지 못했습니다. 표시된 값만으로 주문 안전성을 판단하지 마세요.
        </p>
      ) : null}

      {!loading && !error ? (
        <InstitutionPortfolioProvisioning
          recommendation={recommendation}
          portfolioCode={portfolioCode}
          displayName={displayName}
          investmentStyle={investmentStyle}
          aumPercent={aumPercent}
          symbolsText={symbolsText}
          changeReason={changeReason}
          confirmed={confirmed}
          pending={createPortfolioMutation.isPending}
          canCreate={canCreate}
          onPortfolioCodeChange={setPortfolioCode}
          onDisplayNameChange={setDisplayName}
          onInvestmentStyleChange={setInvestmentStyle}
          onAumPercentChange={setAumPercent}
          onSymbolsTextChange={setSymbolsText}
          onChangeReasonChange={setChangeReason}
          onConfirmedChange={setConfirmed}
          onApplyRecommendation={() => {
            const nextIndex = portfolios.length + 1;
            setPortfolioCode(`INSTITUTION_${nextIndex}`);
            setDisplayName(`기관 투자자 ${nextIndex}`);
            setInvestmentStyle(
              recommendation?.styles[(nextIndex - 1) % Math.max(1, recommendation.styles.length)]
                ?.investmentStyle
                ?? recommendation?.styles[0]?.investmentStyle
                ?? "BALANCED_LONG_TERM",
            );
            setAumPercent(String(
              (recommendation?.recommendedAumRateOfMarketCap ?? 0.01) * 100,
            ));
            setSymbolsText(recommendation?.symbols.map((item) => item.symbol).join(", ") ?? "");
          }}
          onCreate={() => void createPortfolio()}
        />
      ) : null}

      <div className="mt-4 grid gap-3">
        {portfolios.map((portfolio) => (
          <InstitutionPortfolioCard
            key={portfolio.portfolioId}
            accessToken={!loading && !error ? accessToken : null}
            portfolio={portfolio}
          />
        ))}
      </div>
    </section>
  );
}

function InstitutionPortfolioProvisioning({
  recommendation,
  portfolioCode,
  displayName,
  investmentStyle,
  aumPercent,
  symbolsText,
  changeReason,
  confirmed,
  pending,
  canCreate,
  onPortfolioCodeChange,
  onDisplayNameChange,
  onInvestmentStyleChange,
  onAumPercentChange,
  onSymbolsTextChange,
  onChangeReasonChange,
  onConfirmedChange,
  onApplyRecommendation,
  onCreate,
}: {
  recommendation: InstitutionPortfolioRecommendation | null;
  portfolioCode: string;
  displayName: string;
  investmentStyle: string;
  aumPercent: string;
  symbolsText: string;
  changeReason: string;
  confirmed: boolean;
  pending: boolean;
  canCreate: boolean;
  onPortfolioCodeChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onInvestmentStyleChange: (value: string) => void;
  onAumPercentChange: (value: string) => void;
  onSymbolsTextChange: (value: string) => void;
  onChangeReasonChange: (value: string) => void;
  onConfirmedChange: (value: boolean) => void;
  onApplyRecommendation: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-admin-accent/25 bg-admin-accent-surface/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">기관 투자자 개별 생성</h3>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
            한 번에 한 기관만 생성합니다. 권장 개수와 AUM은 현재 종목 수에 맞춘 참고값이며, 버튼을 눌러도 입력란만 채워지고 다른 역할이나 기관이 함께 생성되지는 않습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-black text-admin-accent-soft">
            권장 {recommendation ? `${recommendation.currentPortfolioCount}/${recommendation.recommendedPortfolioCount}개` : "조회 대기"}
          </span>
          <button
            type="button"
            onClick={onApplyRecommendation}
            disabled={!recommendation}
            className="min-h-8 rounded-md bg-white/10 px-3 text-[10px] font-black text-white disabled:opacity-40"
          >
            권장값 적용
          </button>
        </div>
      </div>
      {recommendation ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <PortfolioMetric label="권장 총 개수" value={`${formatInteger(recommendation.recommendedPortfolioCount)}개`} />
          <PortfolioMetric label="추가 권장" value={`${formatInteger(recommendation.recommendedRemainingCount)}개`} />
          <PortfolioMetric label="기관당 권장 AUM" value={formatCompactWon(recommendation.recommendedAumAmountPerPortfolio)} />
          <PortfolioMetric label="권장 AUM 비율" value={formatRate(recommendation.recommendedAumRateOfMarketCap)} />
        </div>
      ) : null}
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          포트폴리오 코드
          <input
            value={portfolioCode}
            maxLength={24}
            onChange={(event) => onPortfolioCodeChange(event.target.value.toUpperCase())}
            className="admin-control w-full px-3 text-sm font-bold"
          />
          <span className="text-[10px] font-bold text-admin-quiet">영문 대문자·숫자·밑줄 3~24자</span>
        </label>
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          표시명
          <input
            value={displayName}
            maxLength={120}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            className="admin-control w-full px-3 text-sm font-bold"
          />
        </label>
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          운용 유형
          <select
            value={investmentStyle}
            onChange={(event) => onInvestmentStyleChange(event.target.value)}
            className="admin-control w-full px-3 text-sm font-bold"
          >
            {(recommendation?.styles ?? []).map((style) => (
              <option key={style.investmentStyle} value={style.investmentStyle}>
                {style.label}
              </option>
            ))}
            {!recommendation ? <option value="BALANCED_LONG_TERM">연기금·저회전 균형형</option> : null}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          기관별 시가총액 대비 AUM
          <span className="relative">
            <input
              type="number"
              min="0.1"
              max="2"
              step="0.1"
              value={aumPercent}
              onChange={(event) => onAumPercentChange(event.target.value)}
              className="admin-control w-full px-3 pr-8 text-sm font-bold"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-admin-quiet">%</span>
          </span>
          <span className="text-[10px] font-bold text-admin-quiet">허용 0.1~2.0%, 기본 1.0%</span>
        </label>
        <label className="grid gap-1 text-xs font-black text-admin-muted md:col-span-2">
          운용 종목
          <input
            value={symbolsText}
            onChange={(event) => onSymbolsTextChange(event.target.value)}
            placeholder="비우면 현재 활성 종목 전체 · 예: DEMO001, DEMO002"
            className="admin-control w-full px-3 text-sm font-bold"
          />
          <span className="text-[10px] font-bold text-admin-quiet">쉼표로 구분하며 기관별로 독립 선택합니다.</span>
        </label>
        <label className="grid gap-1 text-xs font-black text-admin-muted">
          변경 사유
          <input
            value={changeReason}
            maxLength={500}
            onChange={(event) => onChangeReasonChange(event.target.value)}
            className="admin-control w-full px-3 text-sm font-bold"
          />
          <span className="text-[10px] font-bold text-admin-quiet">생성 정책 감사에 저장됩니다.</span>
        </label>
      </div>
      {recommendation?.styles.length ? (
        <DataTableViewport label="운용 유형별 권장 수치" tone="dark" className="mt-3">
          <table className="min-w-[760px] w-full text-left text-xs">
            <thead className="bg-white/[0.045] text-[10px] font-black text-admin-quiet">
              <tr>
                <th className="px-3 py-2">유형</th>
                <th className="px-3 py-2 text-right">기준 주식</th>
                <th className="px-3 py-2 text-right">허용 주식</th>
                <th className="px-3 py-2 text-right">일일 회전</th>
                <th className="px-3 py-2 text-right">결정당</th>
                <th className="px-3 py-2 text-right">결정 주기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recommendation.styles.map((style) => (
                <tr key={style.investmentStyle}>
                  <td className="px-3 py-2 font-black text-white">{style.label}</td>
                  <td className="px-3 py-2 text-right">{formatRate(style.baseStockAllocationRate)}</td>
                  <td className="px-3 py-2 text-right">{formatRate(style.minStockAllocationRate)}~{formatRate(style.maxStockAllocationRate)}</td>
                  <td className="px-3 py-2 text-right">{formatRate(style.dailyTurnoverLimitRate)}</td>
                  <td className="px-3 py-2 text-right">{formatRate(style.maxDecisionTurnoverRate)}</td>
                  <td className="px-3 py-2 text-right">{formatInteger(style.decisionIntervalMinutes)}분</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableViewport>
      ) : null}
      {recommendation?.symbols.length ? (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-black text-admin-quiet">종목별 권장 기준량</p>
          <DataTableViewport label="종목별 권장 기준량" tone="dark">
            <table className="min-w-[680px] w-full text-left text-xs">
              <thead className="bg-white/[0.045] text-[10px] font-black text-admin-quiet">
                <tr>
                  <th className="px-3 py-2">종목</th>
                  <th className="px-3 py-2 text-right">유통주식</th>
                  <th className="px-3 py-2 text-right">현재가</th>
                  <th className="px-3 py-2 text-right">시장 비중</th>
                  <th className="px-3 py-2 text-right">권장 기준 거래량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recommendation.symbols.map((symbol) => (
                  <tr key={symbol.symbol}>
                    <td className="px-3 py-2 font-black text-white">{symbol.symbol}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(symbol.tradableShares)}주</td>
                    <td className="px-3 py-2 text-right">{formatNumber(symbol.currentPrice)}원</td>
                    <td className="px-3 py-2 text-right">{formatRate(symbol.marketWeight)}</td>
                    <td className="px-3 py-2 text-right font-black text-admin-accent-soft">
                      {formatNumber(symbol.recommendedReferenceDailyVolume)}주
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableViewport>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <label className="flex max-w-3xl items-start gap-2 text-xs font-bold leading-5 text-stock-subtle">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[var(--admin-accent)]"
          />
          현재 시뮬레이션이 일시정지된 장전이며, 이 기관과 전용 계좌·개장 현금 원장만 생성하고 실제 주문은 만들지 않는다는 점을 확인했습니다.
        </label>
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate || pending}
          className="min-h-9 rounded-md bg-admin-accent px-3 py-1.5 text-xs font-black text-admin-canvas disabled:cursor-not-allowed disabled:opacity-45"
        >
          {pending ? "기관 생성 중" : "기관 1개 생성"}
        </button>
      </div>
    </div>
  );
}

function normalizeSymbols(value: string) {
  return [...new Set(
    value
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean),
  )];
}

function InstitutionPortfolioCard({
  accessToken,
  portfolio,
}: {
  accessToken: string | null;
  portfolio: InstitutionPortfolio;
}) {
  const reviewReasons = portfolioReviewReasons(portfolio);
  const actionCounts = countActions(portfolio.mandates);

  return (
    <article className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-black text-white">{portfolio.displayName}</h3>
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-[10px] font-black text-admin-accent-soft">
              {portfolio.executionMode}
            </span>
            <span className={portfolio.status === "ACTIVE"
              ? "rounded-md bg-admin-success-surface px-2 py-1 text-[10px] font-black text-admin-success"
              : "rounded-md bg-admin-danger-surface px-2 py-1 text-[10px] font-black text-admin-danger"}
            >
              {portfolio.status}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-stock-subtle">
              {portfolio.investmentStyle}
            </span>
            {reviewReasons.length > 0 ? (
              <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-[10px] font-black text-admin-danger">
                점검 {formatCount(reviewReasons.length, "건")}
              </span>
            ) : (
              <span className="rounded-md bg-admin-success-surface px-2 py-1 text-[10px] font-black text-admin-success">
                구조 정상
              </span>
            )}
          </div>
          <p className="mt-1 break-all text-xs font-bold text-stock-subtle">
            {portfolio.portfolioCode} · 계좌 #{portfolio.accountId} · 정책 v{portfolio.policyVersion}
          </p>
          <p className="mt-1 break-all text-[11px] font-bold text-admin-quiet">
            자기체결 그룹 {portfolio.accountSelfTradeGroupId ?? "미설정"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black">
          <span className="rounded-md bg-admin-success-surface px-2 py-1 text-admin-success">HOLD {actionCounts.HOLD}</span>
          <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-admin-accent-soft">BUY {actionCounts.BUY}</span>
          <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-admin-danger">SELL {actionCounts.SELL}</span>
        </div>
      </div>

      {reviewReasons.length > 0 ? (
        <ul className="mt-3 grid gap-1 rounded-md border border-admin-danger/20 bg-admin-danger-surface/60 px-3 py-2 text-xs font-bold leading-5 text-admin-danger">
          {reviewReasons.map((reason) => <li key={reason}>· {reason}</li>)}
        </ul>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <PortfolioMetric label="AUM" value={formatCompactWon(portfolio.totalAsset)} />
        <PortfolioMetric label="현금 / 주식" value={`${formatRate(1 - portfolio.currentStockAllocationRate)} / ${formatRate(portfolio.currentStockAllocationRate)}`} />
        <PortfolioMetric label="기준 목표" value={formatRate(portfolio.baseStockAllocationRate)} />
        <PortfolioMetric label="허용 밴드" value={`${formatRate(portfolio.minStockAllocationRate)}~${formatRate(portfolio.maxStockAllocationRate)}`} />
        <PortfolioMetric label="일일 총매매 한도" value={formatRate(portfolio.dailyTurnoverLimitRate)} />
        <PortfolioMetric label="결정당 한도" value={formatRate(portfolio.maxDecisionTurnoverRate)} />
        <PortfolioMetric label="결정 주기" value={`${formatInteger(portfolio.decisionIntervalMinutes)}분`} />
        <PortfolioMetric label="미체결 기관 주문" value={formatCount(portfolio.institutionalOpenOrderCount, "건")} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <PortfolioInfo
          label="최근 결정"
          primary={portfolio.latestDecisionStatus ?? "아직 실행 전"}
          secondary={[
            portfolio.latestDecisionSlot
              ? `${formatDateTime(portfolio.latestDecisionSlot)} · run #${portfolio.latestDecisionRunId}`
              : `다음 ${formatDateTime(portfolio.nextDecisionAt)}`,
            `완료 ${formatInteger(portfolio.completedDecisionTradingDays)}일`,
            `최근 실패 ${formatInteger(portfolio.recentDecisionFailureCount)}건`,
          ].join(" · ")}
        />
        <PortfolioInfo
          label={`일일 계획 예산 · ${portfolio.budgetTradeDate}`}
          primary={`매수 ${formatCompactWon(portfolio.dailyPlannedBuyAmount)} · 매도 ${formatCompactWon(portfolio.dailyPlannedSellAmount)}`}
          secondary={`계획 ${formatNumber(portfolio.dailyPlannedBuyQuantity)}주 / ${formatNumber(portfolio.dailyPlannedSellQuantity)}주 · 제출 ${formatCompactWon(portfolio.dailySubmittedBuyAmount)} / ${formatCompactWon(portfolio.dailySubmittedSellAmount)}`}
        />
        <PortfolioInfo
          label="레짐 해석"
          primary={`주 ${formatRate(portfolio.primaryRegimeWeight)} · 보조 ${formatRate(1 - portfolio.primaryRegimeWeight)}`}
          secondary={`자산선호 ${formatSensitivity(portfolio.assetPreferenceSensitivity)} · 변동성 ${formatSensitivity(portfolio.volatilitySensitivity)}`}
        />
      </div>

      {portfolio.latestDecisionError ? (
        <p className="mt-3 rounded-md border border-admin-danger/20 bg-admin-danger-surface px-3 py-2 text-xs font-bold leading-5 text-admin-danger">
          최근 기관 결정 실패: {portfolio.latestDecisionError}
        </p>
      ) : null}

      {portfolio.executionMode === "LIVE" && portfolio.status === "ACTIVE" ? (
        <InstitutionEmergencyStopControls
          accessToken={accessToken}
          portfolio={portfolio}
        />
      ) : null}

      {portfolio.status === "SUSPENDED" ? (
        <p className="mt-3 rounded-md border border-admin-danger/25 bg-admin-danger-surface px-3 py-2 text-xs font-bold leading-5 text-admin-danger">
          이 포트폴리오는 중단 상태입니다. 신규 결정과 주문은 차단되며, 재개 API를 별도로 구현하기 전에는 DB 값을 직접 되돌리지 마세요.
        </p>
      ) : null}

      <DataTableViewport label={`${portfolio.displayName} 종목별 결정·주문 감사`} tone="dark" className="mt-3">
        <table className="min-w-[1320px] w-full text-left text-xs">
          <thead className="bg-white/[0.045] text-[10px] font-black uppercase tracking-wide text-admin-quiet">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">실제 / 예상 / 목표</th>
              <th className="px-3 py-2">결정</th>
              <th className="px-3 py-2">원인 / 게이트</th>
              <th className="px-3 py-2 text-right">계획·주문</th>
              <th className="px-3 py-2 text-right">기준 거래량·참여율</th>
              <th className="px-3 py-2">혼합 압력</th>
              <th className="px-3 py-2">수익률 신호</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {portfolio.mandates.map((mandate) => (
              <InstitutionMandateRow key={mandate.mandateId} mandate={mandate} />
            ))}
          </tbody>
        </table>
      </DataTableViewport>
    </article>
  );
}

function InstitutionEmergencyStopControls({
  accessToken,
  portfolio,
}: {
  accessToken: string | null;
  portfolio: InstitutionPortfolio;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation(adminSuspendInstitutionMutationOptions());
  const [changeReason, setChangeReason] = useState("LIVE 위험 한도 또는 시장 품질 이상 즉시 중단");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const suspendInstitution = async () => {
    if (!accessToken || mutation.isPending) {
      return;
    }
    const confirmed = window.confirm(
      `${portfolio.displayName}의 신규 결정을 즉시 중단하고 전용 계좌의 모든 미체결 주문을 취소합니다.\n\n시뮬레이션 실행 중에도 적용되는 비상 조치입니다. 계속하시겠습니까?`,
    );
    if (!confirmed) {
      return;
    }
    setFeedback(null);
    const result = await mutation.mutateAsync({
      token: accessToken,
      portfolioId: portfolio.portfolioId,
      payload: {
        changeReason: changeReason.trim() || undefined,
      },
    });
    const suspended = getAdminActionData(
      result,
      "기관 LIVE 비상 중단에 실패했습니다.",
    );
    if (!suspended.ok) {
      setFeedback({ tone: "error", message: suspended.message });
      return;
    }
    setInstitutionPortfoliosQueryData(queryClient, suspended.data);
    setFeedback({
      tone: "success",
      message: `${portfolio.displayName}의 신규 결정과 미체결 주문을 중단했습니다.`,
    });
  };

  return (
    <div className="mt-3 rounded-md border border-admin-danger/25 bg-admin-danger-surface/35 p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="grid min-w-0 flex-1 gap-1 text-xs font-black text-admin-danger">
          LIVE 비상 중단 사유
          <input
            value={changeReason}
            maxLength={500}
            onChange={(event) => setChangeReason(event.target.value)}
            className="admin-control w-full px-3 text-sm font-bold"
          />
          <span className="text-[10px] font-bold leading-5 text-stock-subtle">
            포트폴리오를 먼저 SUSPENDED로 확정한 뒤 대기 주문 의도를 거절하고 전용 계좌의 주문 예약을 반환합니다.
          </span>
        </label>
        <button
          type="button"
          onClick={() => void suspendInstitution()}
          disabled={!accessToken || mutation.isPending}
          className="min-h-9 rounded-md bg-admin-danger px-3 py-1.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {mutation.isPending ? "중단 처리 중" : "LIVE 즉시 중단"}
        </button>
      </div>
      {feedback ? (
        <p
          role="status"
          className={[
            "mt-3 rounded-md border px-3 py-2 text-[11px] font-bold leading-5",
            feedback.tone === "success"
              ? "border-admin-success/25 bg-admin-success-surface text-admin-success"
              : "border-admin-danger/25 bg-admin-danger-surface text-admin-danger",
          ].join(" ")}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}

function InstitutionMandateRow({ mandate }: { mandate: InstitutionSymbolMandate }) {
  return (
    <tr className="align-top text-admin-muted">
      <td className="px-3 py-3">
        <p className="font-black text-white">{mandate.symbol}</p>
        <p className="mt-1 tabular-nums text-[10px] text-admin-quiet">{formatInteger(mandate.currentPrice)}원</p>
      </td>
      <td className="px-3 py-3 tabular-nums">
        <p className="font-black text-white">
          {formatOptionalRate(mandate.actualAllocationRate)}
          {" / "}{formatOptionalRate(mandate.projectedAllocationRate)}
          {" / "}<span className="text-admin-accent-soft">{formatOptionalRate(mandate.targetAllocationRate)}</span>
        </p>
        <p className="mt-1 text-[10px] text-admin-quiet">
          {formatNumber(mandate.actualQuantity)}주
          {" → "}{formatNumber(mandate.projectedQuantity)}주
          {mandate.openBuyQuantity > 0 || mandate.openSellQuantity > 0
            ? ` · 대기 +${formatNumber(mandate.openBuyQuantity)} / -${formatNumber(mandate.openSellQuantity)}`
            : ""}
          {mandate.dailyPlannedBuyQuantity > 0 || mandate.dailyPlannedSellQuantity > 0
            ? ` · 계획 +${formatNumber(mandate.dailyPlannedBuyQuantity)} / -${formatNumber(mandate.dailyPlannedSellQuantity)}`
            : ""}
        </p>
      </td>
      <td className="px-3 py-3">
        <span className={actionClassName(mandate.action)}>{mandate.action ?? "미결정"}</span>
      </td>
      <td className="px-3 py-3">
        <p className="font-black text-white">{mandate.decisionReason ?? "첫 결정 대기"}</p>
        <p className="mt-1 break-words text-[10px] text-admin-quiet">{mandate.gateReason ?? "—"}</p>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <p className="font-black text-white">{formatNumber(mandate.gatedQuantity)}주</p>
        <p className="mt-1 text-[10px] text-admin-quiet">{formatCompactWon(mandate.gatedTradeAmount)}</p>
        <p className="mt-1 text-[10px] font-black text-admin-accent-soft">
          {formatOrderIntent(mandate)}
        </p>
        {mandate.orderSubmissionReason ? (
          <p className="mt-1 max-w-56 break-words text-[10px] text-admin-quiet">
            {mandate.orderSubmissionReason}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <p className="font-black text-white">{formatNumber(mandate.referenceDailyVolume)}주 · {formatRate(mandate.dailyParticipationRate)}</p>
        <p className="mt-1 text-[10px] text-admin-quiet">
          일일 {formatNumber(mandate.dailyGrossQuantityLimit)}주 / {formatCompactWon(mandate.dailyGrossNotionalLimit)}
        </p>
      </td>
      <td className="px-3 py-3 tabular-nums">
        <p className="font-black text-white">
          가격 {formatPressure(mandate.blendedPricePressure)}
          {" · 자산 "}{formatPressure(mandate.blendedAssetPreferencePressure)}
        </p>
        <p className="mt-1 text-[10px] text-admin-quiet">
          변동 {formatPressure(mandate.blendedVolatilityPressure)}
          {" · 유동 "}{formatPressure(mandate.blendedLiquidityPressure)}
          {" · 공격 "}{formatPressure(mandate.blendedExecutionAggressionPressure)}
        </p>
      </td>
      <td className="px-3 py-3 tabular-nums">
        <p className="font-black text-white">5일 {formatOptionalRate(mandate.return5Day)} · 20일 {formatOptionalRate(mandate.return20Day)}</p>
        <p className="mt-1 text-[10px] text-admin-quiet">보고서 {formatPressure(mandate.reportPressure)}</p>
      </td>
    </tr>
  );
}

function PortfolioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-bold text-admin-quiet">{label}</p>
      <p className="mt-1 truncate text-xs font-black tabular-nums text-white" title={value}>{value}</p>
    </div>
  );
}

function PortfolioInfo({
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

function summarizePortfolios(portfolios: InstitutionPortfolio[]) {
  const totalAsset = portfolios.reduce((sum, portfolio) => sum + portfolio.totalAsset, 0);
  const holdingMarketValue = portfolios.reduce(
    (sum, portfolio) => sum + portfolio.holdingMarketValue,
    0,
  );
  const actions = portfolios.flatMap((portfolio) => portfolio.mandates.map((mandate) => mandate.action));
  return {
    totalAsset,
    stockAllocationRate: totalAsset > 0 ? holdingMarketValue / totalAsset : 0,
    dailyPlannedGrossAmount: portfolios.reduce(
      (sum, portfolio) =>
        sum + portfolio.dailyPlannedBuyAmount + portfolio.dailyPlannedSellAmount,
      0,
    ),
    holdCount: actions.filter((action) => action === "HOLD").length,
    reviewCount: portfolios.reduce(
      (sum, portfolio) => sum + portfolioReviewReasons(portfolio).length,
      0,
    ),
  };
}

function portfolioReviewReasons(portfolio: InstitutionPortfolio) {
  const reasons: string[] = [];
  if (portfolio.mandates.every((mandate) => !mandate.enabled)) {
    reasons.push("활성 종목 위임이 없습니다.");
  }
  if (portfolio.participantSelfTradeGroupId !== portfolio.accountSelfTradeGroupId) {
    reasons.push("기관과 계좌의 자기체결 방지 그룹이 일치하지 않습니다.");
  }
  if (portfolio.participantStatus !== "ACTIVE" || portfolio.accountStatus !== "ACTIVE") {
    reasons.push("기관 또는 계좌가 ACTIVE 상태가 아닙니다.");
  }
  if (portfolio.institutionalOpenOrderCount > 0 && portfolio.status !== "ACTIVE") {
    reasons.push("중단된 기관 계좌에 미체결 주문이 남아 있습니다.");
  }
  if (portfolio.latestDecisionStatus === "FAILED") {
    reasons.push("최근 기관 결정이 실패했습니다.");
  }
  if (portfolio.recentDecisionFailureCount > 0) {
    reasons.push(`최근 기관 결정 실패 ${portfolio.recentDecisionFailureCount}건을 확인해야 합니다.`);
  }
  if (portfolio.mandates.some((mandate) =>
    mandate.orderIntentStatus === "FAILED" || mandate.orderIntentStatus === "REJECTED"
  )) {
    reasons.push("최근 주문 의도가 실패 또는 거절 상태입니다.");
  }
  return reasons;
}

function countActions(mandates: InstitutionSymbolMandate[]) {
  return mandates.reduce<Record<InstitutionDecisionAction, number>>(
    (counts, mandate) => {
      if (mandate.action) {
        counts[mandate.action] += 1;
      }
      return counts;
    },
    { BUY: 0, SELL: 0, HOLD: 0 },
  );
}

function actionClassName(action: InstitutionDecisionAction | null) {
  const tone = action === "BUY"
    ? "bg-admin-accent-surface text-admin-accent-soft"
    : action === "SELL"
      ? "bg-admin-danger-surface text-admin-danger"
      : "bg-admin-success-surface text-admin-success";
  return `inline-flex rounded-md px-2 py-1 text-[10px] font-black ${tone}`;
}

function formatOptionalRate(value: number | null) {
  return value == null ? "—" : formatRate(value);
}

function formatRate(value: number) {
  return `${formatNumber(value * 100)}%`;
}

function formatPressure(value: number | null) {
  if (value == null) {
    return "—";
  }
  const score = value * 100;
  return `${score > 0 ? "+" : ""}${formatNumber(score)}`;
}

function formatSensitivity(value: number) {
  const score = value * 100;
  return `${score > 0 ? "+" : ""}${formatNumber(score)}`;
}

function formatOrderIntent(mandate: InstitutionSymbolMandate) {
  if (!mandate.orderIntentStatus) {
    return "주문 의도 없음";
  }
  if (mandate.orderIntentStatus === "SUBMITTED") {
    return `제출 #${mandate.submittedOrderId ?? "?"} · ${formatNumber(mandate.submittedQuantity)}주 @ ${formatInteger(mandate.submittedPrice ?? 0)}원`;
  }
  return `${mandate.orderIntentStatus} · 요청 ${formatNumber(mandate.orderIntentRequestedQuantity)}주 · 시도 ${formatInteger(mandate.orderIntentAttemptCount)}회`;
}
