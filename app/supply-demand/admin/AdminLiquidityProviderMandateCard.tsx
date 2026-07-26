"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import DataTableViewport from "@/app/components/DataTableViewport";
import { upsertLiquidityProviderMandateQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import {
  adminResumeLiquidityProviderMutationOptions,
  adminSuspendLiquidityProviderMutationOptions,
  adminUpdateLiquidityProviderPolicyMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  formatCompactWon,
  formatDateTime,
  formatInteger,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import type {
  LiquidityProviderDailyState,
  LiquidityProviderMandate,
  LiquidityProviderPolicy,
  LiquidityProviderPolicyUpdatePayload,
} from "@/app/types/stock";

type Feedback = {
  tone: "success" | "error";
  message: string;
};

type PolicyDraft = Record<EditablePolicyKey, string> & {
  changeReason: string;
};

type EditablePolicyKey = Exclude<
  keyof LiquidityProviderPolicyUpdatePayload,
  "changeReason"
>;

type PolicyField = {
  key: EditablePolicyKey;
  label: string;
  min: number;
  max?: number;
  step: number;
  suffix: string;
};

const QUOTE_FIELDS: PolicyField[] = [
  { key: "targetSpreadTicks", label: "목표 스프레드", min: 1, max: 50, step: 1, suffix: "틱" },
  { key: "maxSpreadTicks", label: "최대 스프레드", min: 1, max: 100, step: 1, suffix: "틱" },
  { key: "maxOrderQuantity", label: "주문 1건 최대", min: 1, step: 1, suffix: "주" },
  { key: "targetOpenParticipationRate", label: "한 방향 목표 잔량", min: 0.0001, max: 0.1, step: 0.0001, suffix: "비율" },
  { key: "maxOpenParticipationRate", label: "한 방향 최대 잔량", min: 0.0001, max: 0.2, step: 0.0001, suffix: "비율" },
  { key: "maxSingleOrderParticipationRate", label: "단일 주문 참여율", min: 0.0001, max: 0.1, step: 0.0001, suffix: "비율" },
  { key: "externalDepthLevels", label: "외부 깊이", min: 1, max: 10, step: 1, suffix: "호가" },
  { key: "maxExternalDepthParticipationRate", label: "외부 깊이 참여율", min: 0.0001, max: 0.25, step: 0.0001, suffix: "비율" },
];

const INVENTORY_FIELDS: PolicyField[] = [
  { key: "targetInventoryQuantity", label: "목표 재고", min: 0, step: 1, suffix: "주" },
  { key: "inventoryBandQuantity", label: "재고 허용 밴드", min: 1, step: 1, suffix: "±주" },
  { key: "inventorySkewTicks", label: "재고 호가 보정", min: 0, max: 50, step: 1, suffix: "틱" },
  { key: "volatilitySpreadMaxTicks", label: "변동성 스프레드 확대", min: 0, max: 50, step: 1, suffix: "틱" },
  { key: "priceRegimeMaxSkewTicks", label: "가격 레짐 최대 보정", min: 0, max: 5, step: 1, suffix: "틱" },
];

const LIMIT_FIELDS: PolicyField[] = [
  { key: "referenceDailyVolume", label: "기준 일거래량", min: 1, step: 1, suffix: "주" },
  { key: "dailyExecutionParticipationRate", label: "일일 체결 참여율", min: 0.0001, max: 0.3, step: 0.0001, suffix: "비율" },
  { key: "dailySubmissionMultiplier", label: "제출 한도 배수", min: 1, max: 10, step: 0.1, suffix: "배" },
  { key: "dailyLossLimitAmount", label: "일일 손실 한도", min: 1, step: 1000, suffix: "원" },
];

const TIMING_FIELDS: PolicyField[] = [
  { key: "minimumQuoteLifetimeSeconds", label: "최소 호가 유지", min: 10, max: 1800, step: 1, suffix: "초" },
  { key: "repriceThresholdTicks", label: "재호가 임계값", min: 1, max: 20, step: 1, suffix: "틱" },
  { key: "orderTtlSeconds", label: "주문 TTL", min: 10, max: 7200, step: 1, suffix: "초" },
  { key: "quoteIntervalSeconds", label: "판단 간격", min: 10, max: 600, step: 1, suffix: "초" },
];

export function AdminLiquidityProviderMandateCard({
  accessToken,
  mandate,
  onRefresh,
}: {
  accessToken: string | null;
  mandate: LiquidityProviderMandate;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation(adminUpdateLiquidityProviderPolicyMutationOptions());
  const suspendMutation = useMutation(adminSuspendLiquidityProviderMutationOptions());
  const resumeMutation = useMutation(adminResumeLiquidityProviderMutationOptions());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PolicyDraft>(() => toPolicyDraft(mandate.policy));
  const [statusReason, setStatusReason] = useState("LP 운용 정책 점검");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const state = mandate.dailyState;
  const reviewReasons = mandateReviewReasons(mandate);
  const pending = updateMutation.isPending || suspendMutation.isPending || resumeMutation.isPending;

  const applyResult = (
    result: Awaited<ReturnType<typeof updateMutation.mutateAsync>>,
    fallback: string,
    success: string,
  ) => {
    const action = getAdminActionData(result, fallback);
    if (!action.ok) {
      setFeedback({ tone: "error", message: action.message });
      return false;
    }
    upsertLiquidityProviderMandateQueryData(queryClient, action.data);
    setDraft(toPolicyDraft(action.data.policy));
    setFeedback({ tone: "success", message: success });
    onRefresh();
    return true;
  };

  const updatePolicy = async () => {
    if (!accessToken || pending || mandate.status !== "SUSPENDED") {
      return;
    }
    const parsed = parsePolicyDraft(draft);
    if (!parsed.ok) {
      setFeedback({ tone: "error", message: parsed.message });
      return;
    }
    setFeedback(null);
    try {
      const result = await updateMutation.mutateAsync({
        token: accessToken,
        symbol: mandate.symbol,
        payload: parsed.payload,
      });
      if (applyResult(
        result,
        "LP 정책을 저장하지 못했습니다.",
        `${mandate.symbol} LP 정책을 저장했습니다. 재개 전 수치를 다시 확인해 주세요.`,
      )) {
        setEditing(false);
      }
    } catch (error) {
      setFeedback({ tone: "error", message: mutationFailureMessage(error, "LP 정책을 저장하지 못했습니다.") });
    }
  };

  const suspend = async () => {
    if (!accessToken || pending || mandate.status !== "ACTIVE") {
      return;
    }
    setFeedback(null);
    try {
      const result = await suspendMutation.mutateAsync({
        token: accessToken,
        symbol: mandate.symbol,
        payload: { changeReason: statusReason.trim() || undefined },
      });
      if (applyResult(
        result,
        "LP를 중단하지 못했습니다.",
        `${mandate.symbol} LP를 중단하고 미체결 LP 주문을 취소했습니다.`,
      )) {
        setEditing(true);
      }
    } catch (error) {
      setFeedback({ tone: "error", message: mutationFailureMessage(error, "LP를 중단하지 못했습니다.") });
    }
  };

  const resume = async () => {
    if (!accessToken || pending || mandate.status !== "SUSPENDED") {
      return;
    }
    setFeedback(null);
    try {
      const result = await resumeMutation.mutateAsync({
        token: accessToken,
        symbol: mandate.symbol,
        payload: { changeReason: statusReason.trim() || undefined },
      });
      if (applyResult(
        result,
        "LP를 재개하지 못했습니다.",
        `${mandate.symbol} LP를 LIVE로 재개했습니다.`,
      )) {
        setEditing(false);
      }
    } catch (error) {
      setFeedback({ tone: "error", message: mutationFailureMessage(error, "LP를 재개하지 못했습니다.") });
    }
  };

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
            <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-[10px] font-black text-admin-danger">
              {mandate.executionMode}
            </span>
            <span className={mandate.status === "ACTIVE"
              ? "rounded-md bg-admin-success-surface px-2 py-1 text-[10px] font-black text-admin-success"
              : "rounded-md bg-admin-warning-surface px-2 py-1 text-[10px] font-black text-admin-warning"}
            >
              {mandate.status}
            </span>
            <span className={stateClassName(state)}>{state?.stateStatus ?? "미실행"}</span>
          </div>
          <p className="mt-1 break-all text-xs font-bold text-stock-subtle">
            {mandate.mandateCode} · 계약 #{mandate.mandateId} · 정책 v{mandate.policyVersion}
          </p>
          <p className="mt-1 break-all text-[11px] font-bold text-admin-quiet">
            {mandate.account.participantCode} · 계좌 {mandate.account.accountCode ?? `#${mandate.account.accountId}`} · STP {mandate.account.accountSelfTradeGroupId ?? "미설정"}
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap items-end justify-end gap-2">
          <label className="grid min-w-52 flex-1 gap-1 text-[10px] font-black text-admin-quiet">
            변경·중단 사유
            <input
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              maxLength={500}
              className="min-h-9 rounded-md border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none focus:border-admin-accent/60"
            />
          </label>
          {mandate.status === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => void suspend()}
              disabled={!accessToken || pending}
              className="min-h-9 rounded-md bg-admin-danger px-3 text-xs font-black text-white disabled:opacity-40"
            >
              {suspendMutation.isPending ? "중단 중" : "LP 중단"}
            </button>
          ) : null}
          {mandate.status === "SUSPENDED" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!editing) {
                    setDraft(toPolicyDraft(mandate.policy));
                  }
                  setEditing((value) => !value);
                }}
                disabled={pending}
                className="min-h-9 rounded-md bg-white/10 px-3 text-xs font-black text-white disabled:opacity-40"
              >
                {editing ? "편집 닫기" : "정책 편집"}
              </button>
              <button
                type="button"
                onClick={() => void resume()}
                disabled={!accessToken || pending || editing}
                className="min-h-9 rounded-md bg-admin-success px-3 text-xs font-black text-white disabled:opacity-40"
              >
                {resumeMutation.isPending ? "재개 중" : "LIVE 재개"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p
          role="status"
          className={[
            "mt-3 rounded-md border px-3 py-2 text-xs font-bold leading-5",
            feedback.tone === "success"
              ? "border-admin-success/25 bg-admin-success-surface text-admin-success"
              : "border-admin-danger/25 bg-admin-danger-surface text-admin-danger",
          ].join(" ")}
        >
          {feedback.message}
        </p>
      ) : null}

      {mandate.transition ? (
        <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-[10px] font-bold text-stock-subtle md:grid-cols-5">
          <TransitionMetric label="전환 상태" value={`${mandate.transition.stage} · v${mandate.transition.policyVersion}`} />
          <TransitionMetric label="출발 → LP" value={`#${mandate.transition.sourceAccountId} → #${mandate.account.accountId}`} />
          <TransitionMetric label="최초 LP 시드" value={`${formatInteger(mandate.transition.seedInventoryQuantity)}주 · ${formatCompactWon(mandate.transition.seedCashAmount)}`} />
          <TransitionMetric label="기존 계좌 전량 이전" value={`${formatInteger(mandate.transition.transferredInventoryQuantity)}주 · ${formatCompactWon(mandate.transition.transferredCashAmount)}`} />
          <TransitionMetric label="기존 계좌 종료" value={formatDateTime(mandate.transition.legacyRetiredAt)} />
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

      <InventoryBandProgress mandate={mandate} />

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <MandateMetric label="가용 현금" value={formatCompactWon(mandate.account.availableCash)} />
        <MandateMetric label="보유 평가액" value={formatCompactWon(mandate.account.holdingMarketValue)} />
        <MandateMetric label="현재 / 예상 재고" value={`${formatInteger(state?.lastInventoryQuantity ?? mandate.account.holdingQuantity)} / ${formatInteger(state?.lastProjectedInventoryQuantity ?? mandate.account.holdingQuantity)}주`} />
        <MandateMetric label="목표 ± 밴드" value={`${formatInteger(mandate.policy.targetInventoryQuantity)} ± ${formatInteger(mandate.policy.inventoryBandQuantity)}주`} />
        <MandateMetric label="기준 거래량" value={`${formatInteger(mandate.policy.referenceDailyVolume)}주`} />
        <MandateMetric label="체결 한도 사용" value={formatPercent(executionUsage)} />
        <MandateMetric label="제출 한도 사용" value={formatPercent(submissionUsage)} />
        <MandateMetric label="일일 위험손익" value={formatSignedWon(state?.riskProfit ?? 0)} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MandateInfo
          label="호가·외부 깊이"
          primary={state ? `매수 ${formatNullableWon(state.lastBidPrice)} · 매도 ${formatNullableWon(state.lastAskPrice)}` : "오늘 판단 전"}
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

      {editing ? (
        <PolicyEditor
          draft={draft}
          pending={updateMutation.isPending}
          onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
          onCancel={() => {
            setDraft(toPolicyDraft(mandate.policy));
            setEditing(false);
          }}
          onSave={() => void updatePolicy()}
        />
      ) : (
        <PolicyAuditTable mandate={mandate} />
      )}
    </article>
  );
}

function InventoryBandProgress({ mandate }: { mandate: LiquidityProviderMandate }) {
  const current = mandate.dailyState?.lastInventoryQuantity ?? mandate.account.holdingQuantity;
  const projected = mandate.dailyState?.lastProjectedInventoryQuantity ?? current;
  const target = mandate.policy.targetInventoryQuantity;
  const band = mandate.policy.inventoryBandQuantity;
  const lower = Math.max(0, target - band);
  const upper = target + band;
  const displayPadding = Math.max(band, Math.ceil(Math.max(upper, 1) * 0.05), 1);
  const displayMin = Math.max(0, Math.min(lower - displayPadding, current, projected));
  const displayMax = Math.max(upper + displayPadding, current, projected, displayMin + 1);
  const position = (value: number) => Math.min(
    100,
    Math.max(0, ((value - displayMin) / (displayMax - displayMin)) * 100),
  );
  const zone = inventoryZone(projected, lower, upper);

  return (
    <section className="mt-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black text-white">재고 밴드 진행 현황</p>
          <p className="mt-1 text-[10px] font-bold text-stock-subtle">
            하한 {formatInteger(lower)}주 · 목표 {formatInteger(target)}주 · 상한 {formatInteger(upper)}주
          </p>
        </div>
        <span className={zone.tone}>{zone.label}</span>
      </div>
      <div
        role="img"
        aria-label={`현재 재고 ${current}주, 예상 재고 ${projected}주, 허용 범위 ${lower}주부터 ${upper}주`}
        className="relative mt-4 h-3 rounded-full bg-white/10"
      >
        <div
          className="absolute inset-y-0 rounded-full bg-admin-accent/30"
          style={{ left: `${position(lower)}%`, width: `${Math.max(1, position(upper) - position(lower))}%` }}
        />
        <div className="absolute inset-y-[-3px] w-px bg-white/80" style={{ left: `${position(target)}%` }} />
        <div className="absolute inset-y-[-2px] w-2 -translate-x-1/2 rounded-full bg-admin-warning" style={{ left: `${position(current)}%` }} />
        <div className="absolute inset-y-[-4px] w-1.5 -translate-x-1/2 rounded-full bg-admin-success" style={{ left: `${position(projected)}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px] font-bold text-admin-quiet">
        <span>표시 구간 {formatInteger(displayMin)}~{formatInteger(displayMax)}주</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-admin-warning" />현재 {formatInteger(current)}주</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-admin-success" />미체결 반영 예상 {formatInteger(projected)}주</span>
      </div>
    </section>
  );
}

function PolicyEditor({
  draft,
  pending,
  onChange,
  onCancel,
  onSave,
}: {
  draft: PolicyDraft;
  pending: boolean;
  onChange: (key: keyof PolicyDraft, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <section className="mt-3 rounded-md border border-admin-accent/30 bg-admin-accent-surface/15 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-black text-white">LP 정책 편집</h4>
          <p className="mt-1 text-[10px] font-bold leading-5 text-stock-subtle">
            중단 상태·시뮬레이션 일시정지·장전에서만 저장됩니다. 비율은 0.01이 1%이며 LP는 항상 수동 지정가만 사용합니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-stock-subtle">passive only</span>
      </div>
      <PolicyFieldGroup title="호가 크기·시장 깊이" fields={QUOTE_FIELDS} draft={draft} onChange={onChange} />
      <PolicyFieldGroup title="재고 목표·레짐 보정" fields={INVENTORY_FIELDS} draft={draft} onChange={onChange} />
      <PolicyFieldGroup title="일일 한도" fields={LIMIT_FIELDS} draft={draft} onChange={onChange} />
      <PolicyFieldGroup title="호가 수명·재호가" fields={TIMING_FIELDS} draft={draft} onChange={onChange} />
      <label className="mt-3 grid gap-1 text-[10px] font-black text-admin-quiet">
        정책 변경 사유
        <input
          value={draft.changeReason}
          onChange={(event) => onChange("changeReason", event.target.value)}
          maxLength={500}
          className="min-h-10 rounded-md border border-white/10 bg-black/25 px-3 text-xs font-bold text-white outline-none focus:border-admin-accent/60"
        />
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={pending} className="min-h-9 rounded-md bg-white/10 px-3 text-xs font-black text-white disabled:opacity-40">
          취소
        </button>
        <button type="button" onClick={onSave} disabled={pending} className="min-h-9 rounded-md bg-admin-accent px-4 text-xs font-black text-white disabled:opacity-40">
          {pending ? "저장 중" : "정책 저장"}
        </button>
      </div>
    </section>
  );
}

function PolicyFieldGroup({
  title,
  fields,
  draft,
  onChange,
}: {
  title: string;
  fields: PolicyField[];
  draft: PolicyDraft;
  onChange: (key: keyof PolicyDraft, value: string) => void;
}) {
  return (
    <fieldset className="mt-3 rounded-md border border-white/10 p-3">
      <legend className="px-1 text-[11px] font-black text-white">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-1 text-[10px] font-black text-admin-quiet">
            {field.label}
            <span className="flex min-h-9 items-center rounded-md border border-white/10 bg-black/25 px-3">
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={draft[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-black text-white outline-none"
              />
              <span className="ml-2 text-[10px] text-admin-quiet">{field.suffix}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PolicyAuditTable({ mandate }: { mandate: LiquidityProviderMandate }) {
  const state = mandate.dailyState;
  return (
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

function TransitionMetric({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-admin-quiet">{label}</span><br />
      <strong className="break-words text-white">{value}</strong>
    </p>
  );
}

function toPolicyDraft(policy: LiquidityProviderPolicy): PolicyDraft {
  return {
    targetSpreadTicks: String(policy.targetSpreadTicks),
    maxSpreadTicks: String(policy.maxSpreadTicks),
    maxOrderQuantity: String(policy.maxOrderQuantity),
    referenceDailyVolume: String(policy.referenceDailyVolume),
    targetOpenParticipationRate: String(policy.targetOpenParticipationRate),
    maxOpenParticipationRate: String(policy.maxOpenParticipationRate),
    maxSingleOrderParticipationRate: String(policy.maxSingleOrderParticipationRate),
    externalDepthLevels: String(policy.externalDepthLevels),
    maxExternalDepthParticipationRate: String(policy.maxExternalDepthParticipationRate),
    dailyExecutionParticipationRate: String(policy.dailyExecutionParticipationRate),
    dailySubmissionMultiplier: String(policy.dailySubmissionMultiplier),
    targetInventoryQuantity: String(policy.targetInventoryQuantity),
    inventoryBandQuantity: String(policy.inventoryBandQuantity),
    inventorySkewTicks: String(policy.inventorySkewTicks),
    volatilitySpreadMaxTicks: String(policy.volatilitySpreadMaxTicks),
    priceRegimeMaxSkewTicks: String(policy.priceRegimeMaxSkewTicks),
    minimumQuoteLifetimeSeconds: String(policy.minimumQuoteLifetimeSeconds),
    repriceThresholdTicks: String(policy.repriceThresholdTicks),
    orderTtlSeconds: String(policy.orderTtlSeconds),
    quoteIntervalSeconds: String(policy.quoteIntervalSeconds),
    dailyLossLimitAmount: String(policy.dailyLossLimitAmount),
    changeReason: "축소 시장 LP 정책 조정",
  };
}

function parsePolicyDraft(draft: PolicyDraft):
  | { ok: true; payload: LiquidityProviderPolicyUpdatePayload }
  | { ok: false; message: string } {
  const values = Object.fromEntries(
    (Object.keys(draft) as (keyof PolicyDraft)[])
      .filter((key) => key !== "changeReason")
      .map((key) => [key, Number(draft[key])]),
  ) as Record<EditablePolicyKey, number>;
  if (Object.values(values).some((value) => !Number.isFinite(value))) {
    return { ok: false, message: "LP 정책의 모든 수치를 입력해 주세요." };
  }
  if (!draft.changeReason.trim()) {
    return { ok: false, message: "정책 변경 사유를 입력해 주세요." };
  }
  if (values.targetSpreadTicks > values.maxSpreadTicks) {
    return { ok: false, message: "목표 스프레드는 최대 스프레드를 넘을 수 없습니다." };
  }
  if (values.targetOpenParticipationRate > values.maxOpenParticipationRate) {
    return { ok: false, message: "목표 미체결 참여율은 최대 미체결 참여율을 넘을 수 없습니다." };
  }
  if (values.maxSingleOrderParticipationRate > values.targetOpenParticipationRate) {
    return { ok: false, message: "단일 주문 참여율은 목표 미체결 참여율을 넘을 수 없습니다." };
  }
  if (values.orderTtlSeconds < values.minimumQuoteLifetimeSeconds
      || values.orderTtlSeconds < values.quoteIntervalSeconds) {
    return { ok: false, message: "주문 TTL은 최소 호가 유지시간과 판단 간격보다 길어야 합니다." };
  }
  if (values.maxOrderQuantity > values.inventoryBandQuantity) {
    return { ok: false, message: "주문 1건 최대 수량은 재고 허용 밴드를 넘을 수 없습니다." };
  }
  return {
    ok: true,
    payload: {
      ...values,
      changeReason: draft.changeReason.trim(),
    },
  };
}

function mandateReviewReasons(mandate: LiquidityProviderMandate) {
  const reasons: string[] = [];
  if (!mandate.transition) {
    reasons.push("종목 단위 생성·이전 감사 기록이 없습니다.");
  }
  if (!mandate.roleEligible) {
    reasons.push(`전용 계정 역할 검증 실패: ${mandate.roleEligibilityIssue ?? "UNKNOWN"}`);
  }
  if (!mandate.policy.passiveOnly) {
    reasons.push("공격 주문 정책은 현재 LP 엔진에서 허용하지 않습니다.");
  }
  if (mandate.status !== "ACTIVE" && mandate.status !== "SUSPENDED") {
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

function inventoryZone(value: number, lower: number, upper: number) {
  if (value < lower) {
    return {
      label: `하한보다 ${formatInteger(lower - value)}주 부족`,
      tone: "rounded-md bg-admin-warning-surface px-2 py-1 text-[10px] font-black text-admin-warning",
    };
  }
  if (value > upper) {
    return {
      label: `상한보다 ${formatInteger(value - upper)}주 초과`,
      tone: "rounded-md bg-admin-danger-surface px-2 py-1 text-[10px] font-black text-admin-danger",
    };
  }
  return {
    label: "허용 밴드 안",
    tone: "rounded-md bg-admin-success-surface px-2 py-1 text-[10px] font-black text-admin-success",
  };
}

function stateClassName(state: LiquidityProviderDailyState | null) {
  const tone = state?.stateStatus === "HALTED" || state?.stateStatus === "ERROR"
    ? "bg-admin-danger-surface text-admin-danger"
    : state?.stateStatus === "QUOTING"
      ? "bg-admin-success-surface text-admin-success"
      : "bg-white/10 text-stock-subtle";
  return `rounded-md px-2 py-1 text-[10px] font-black ${tone}`;
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

function formatNullableWon(value: number | null) {
  return value == null ? "—" : formatWon(value);
}

function mutationFailureMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
