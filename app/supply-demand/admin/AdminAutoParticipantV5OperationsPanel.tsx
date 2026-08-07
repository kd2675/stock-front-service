"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { setAutoParticipantV5OperationsQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { autoParticipantV5OperationsQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import {
  scheduleAutoParticipantV5Policy,
  updateAutoParticipantV5Runtime,
} from "@/app/lib/stock";
import type {
  AutoParticipantV5Operations,
  AutoParticipantV5PolicySchedulePayload,
} from "@/app/types/stock";
import {
  getAdminActionData,
  getAdminUnknownErrorMessage,
} from "@/app/supply-demand/admin/AdminActionResultHelpers";

type Props = {
  accessToken: string | null;
};

type V5PolicyDraft = Pick<
  AutoParticipantV5PolicySchedulePayload,
  | "attentionRateScale"
  | "decisionThresholdOffset"
  | "quantityScale"
  | "surpriseRateScale"
  | "cancellationThresholdOffset"
  | "maxOrdersPerParticipantPerDay"
  | "maxOpenOrdersPerParticipant"
  | "maxChildNotionalRate"
>;

const BASELINE_V5_POLICY: V5PolicyDraft = {
  attentionRateScale: 1,
  decisionThresholdOffset: 0,
  quantityScale: 1,
  surpriseRateScale: 1,
  cancellationThresholdOffset: 0,
  maxOrdersPerParticipantPerDay: 32,
  maxOpenOrdersPerParticipant: 2,
  maxChildNotionalRate: 0.05,
};

export function AdminAutoParticipantV5OperationsPanel({ accessToken }: Props) {
  const queryClient = useQueryClient();
  const [changeReason, setChangeReason] = useState("");
  const [policyReason, setPolicyReason] = useState("");
  const [effectiveTradeDate, setEffectiveTradeDate] = useState("");
  const [policyDraft, setPolicyDraft] = useState<V5PolicyDraft>(BASELINE_V5_POLICY);
  const operationsQuery = useQuery(
    autoParticipantV5OperationsQueryOptions(accessToken, {
      enabled: Boolean(accessToken),
    }),
  );
  const runtimeMutation = useMutation({
    mutationFn: async (runtimeEnabled: boolean) => {
      if (!accessToken) throw new Error("관리자 인증이 필요합니다.");
      const result = await updateAutoParticipantV5Runtime(accessToken, {
        runtimeEnabled,
        changeReason: changeReason.trim(),
      });
      const action = getAdminActionData(
        result,
        "V5 런타임 상태를 변경하지 못했습니다.",
      );
      if (!action.ok) {
        throw new Error(action.message);
      }
      return action.data;
    },
    onSuccess: (operations) => {
      setAutoParticipantV5OperationsQueryData(queryClient, operations);
      setChangeReason("");
    },
  });
  const operations = operationsQuery.data;
  const activePolicy = operations?.policies.find((policy) => policy.status === "ACTIVE");
  const scheduledPolicy = operations?.policies.find((policy) => policy.status === "SCHEDULED");
  const summary = operations?.dailySummary;
  const calibration = operations?.calibrationReadiness;
  const activePolicyDraft = parseV5Policy(activePolicy?.policyJson);
  const policyChangeCount = activePolicyDraft
    ? countPolicyChanges(activePolicyDraft, policyDraft)
    : activePolicy
      ? Number.POSITIVE_INFINITY
      : 0;
  const suggestedEffectiveDate = nextCalendarDate(operations?.simulationTradeDate);
  const requestedEffectiveDate = effectiveTradeDate || suggestedEffectiveDate;
  const revisionBasisReady = !activePolicy || Boolean(
    calibration?.nextRevisionAllowed
      && calibration.basisCloseRunId != null
      && calibration.basisBusinessDate
      && calibration.contractVersion != null
      && calibration.activePolicyVersion != null,
  );
  const policyMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("관리자 인증이 필요합니다.");
      if (!requestedEffectiveDate) throw new Error("적용 거래일을 입력해 주세요.");
      const result = await scheduleAutoParticipantV5Policy(accessToken, {
        effectiveTradeDate: requestedEffectiveDate,
        changeReason: policyReason.trim(),
        basisCloseRunId: activePolicy ? calibration?.basisCloseRunId ?? null : null,
        basisBusinessDate: activePolicy ? calibration?.basisBusinessDate ?? null : null,
        basisContractVersion: activePolicy ? calibration?.contractVersion ?? null : null,
        basisPolicyVersion: activePolicy ? calibration?.activePolicyVersion ?? null : null,
        ...policyDraft,
      });
      const action = getAdminActionData(
        result,
        "V5 정책을 예약하지 못했습니다.",
      );
      if (!action.ok) throw new Error(action.message);
      return action.data;
    },
    onSuccess: (nextOperations) => {
      setAutoParticipantV5OperationsQueryData(queryClient, nextOperations);
      setPolicyReason("");
      setEffectiveTradeDate("");
    },
  });
  const policyScheduleEnabled = Boolean(
    accessToken
      && !scheduledPolicy
      && requestedEffectiveDate
      && policyReason.trim()
      && revisionBasisReady
      && (!activePolicy || policyChangeCount === 1),
  );

  return (
    <section className="mb-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-admin-accent">V5 runtime</p>
          <h2 className="mt-1 text-lg font-black text-white">확률 행동 운영 상태</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            정책 버전, 일일 잠재 상태, 피로도, 다음 프로필 관심 시각과 주문 메타데이터 계약을 10초마다 확인합니다.
            체결 수량은 자동참여자 계좌의 매수와 매도를 합한 계좌측 참여량입니다.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:min-w-[360px] sm:flex-row">
          <input
            value={changeReason}
            onChange={(event) => setChangeReason(event.target.value)}
            placeholder="비상 정지·재개 사유"
            maxLength={200}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-admin-accent/60"
          />
          <button
            type="button"
            disabled={!activePolicy || !changeReason.trim() || runtimeMutation.isPending}
            onClick={() => runtimeMutation.mutate(!(activePolicy?.runtimeEnabled ?? false))}
            className={`min-h-11 rounded-md px-4 text-sm font-black disabled:opacity-40 ${
              activePolicy?.runtimeEnabled
                ? "bg-admin-danger text-white"
                : "bg-admin-accent text-admin-canvas"
            }`}
          >
            {runtimeMutation.isPending
              ? "처리 중"
              : activePolicy?.runtimeEnabled
                ? "즉시 정지"
                : "재개"}
          </button>
        </div>
      </div>

      {runtimeMutation.isError ? (
        <p className="mt-3 text-sm font-bold text-admin-danger">
          {getAdminUnknownErrorMessage(
            runtimeMutation.error,
            "V5 런타임 상태를 변경하지 못했습니다.",
          )}
        </p>
      ) : null}

      <div className="mt-4 border-y border-white/10 bg-black/15 px-3 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Fresh V5 commissioning
            </p>
            <h3 className="mt-1 text-base font-black text-white">
              {activePolicy ? "완료장 근거 단일 변수 리비전" : "최초 V5 정책 생성"}
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
              {activePolicy
                ? "활성 정책을 불러온 뒤 한 항목만 바꿀 수 있습니다. 완료장 캘리브레이션 키는 화면의 최신 원장에서 자동 고정됩니다."
                : "이전 정책과 상태를 복사하지 않습니다. 아래 중립 기준으로 새 정책을 예약하며 최초 정책은 안전하게 정지 상태로 시작합니다."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activePolicyDraft ? (
              <button
                type="button"
                onClick={() => setPolicyDraft(activePolicyDraft)}
                className="min-h-10 border border-white/15 px-3 text-xs font-black text-white hover:border-white/30"
              >
                현재 정책값 불러오기
              </button>
            ) : null}
            <span className="flex min-h-10 items-center border border-white/10 px-3 text-xs font-black text-stock-subtle">
              {scheduledPolicy
                ? `예약됨 · ${scheduledPolicy.effectiveTradeDate}`
                : activePolicy
                  ? `변경 항목 ${Number.isFinite(policyChangeCount) ? policyChangeCount : "확인 불가"}개`
                  : "독립 초기값"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <PolicyNumberField label="관심 빈도" value={policyDraft.attentionRateScale} min={0.25} max={3} step={0.05} onChange={(value) => setPolicyDraft((current) => ({ ...current, attentionRateScale: value }))} />
          <PolicyNumberField label="판단 임계 오프셋" value={policyDraft.decisionThresholdOffset} min={-0.25} max={0.25} step={0.01} onChange={(value) => setPolicyDraft((current) => ({ ...current, decisionThresholdOffset: value }))} />
          <PolicyNumberField label="수량 배율" value={policyDraft.quantityScale} min={0.25} max={2} step={0.05} onChange={(value) => setPolicyDraft((current) => ({ ...current, quantityScale: value }))} />
          <PolicyNumberField label="의외성 빈도" value={policyDraft.surpriseRateScale} min={0} max={2} step={0.05} onChange={(value) => setPolicyDraft((current) => ({ ...current, surpriseRateScale: value }))} />
          <PolicyNumberField label="취소 임계 오프셋" value={policyDraft.cancellationThresholdOffset} min={-0.25} max={0.25} step={0.01} onChange={(value) => setPolicyDraft((current) => ({ ...current, cancellationThresholdOffset: value }))} />
          <PolicyNumberField label="계좌당 일일 주문 상한" value={policyDraft.maxOrdersPerParticipantPerDay} min={1} max={500} step={1} onChange={(value) => setPolicyDraft((current) => ({ ...current, maxOrdersPerParticipantPerDay: Math.trunc(value) }))} />
          <PolicyNumberField label="계좌당 동시 주문 상한" value={policyDraft.maxOpenOrdersPerParticipant} min={1} max={10} step={1} onChange={(value) => setPolicyDraft((current) => ({ ...current, maxOpenOrdersPerParticipant: Math.trunc(value) }))} />
          <PolicyNumberField label="자식 주문 자산 비율" value={policyDraft.maxChildNotionalRate} min={0.001} max={0.25} step={0.001} onChange={(value) => setPolicyDraft((current) => ({ ...current, maxChildNotionalRate: value }))} />
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto]">
          <label className="grid gap-1 text-[11px] font-black text-stock-subtle">
            적용 거래일
            <input
              type="date"
              value={requestedEffectiveDate}
              min={suggestedEffectiveDate || undefined}
              onChange={(event) => setEffectiveTradeDate(event.target.value)}
              className="min-h-11 border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none focus:border-emerald-300/60"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-black text-stock-subtle">
            변경 사유
            <input
              value={policyReason}
              onChange={(event) => setPolicyReason(event.target.value)}
              maxLength={200}
              placeholder={activePolicy ? "완료장 근거와 변경 목적" : "V5 독립 최초 정책"}
              className="min-h-11 min-w-0 border border-white/10 bg-black/30 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300/60"
            />
          </label>
          <button
            type="button"
            disabled={!policyScheduleEnabled || policyMutation.isPending}
            onClick={() => policyMutation.mutate()}
            className="mt-auto min-h-11 bg-emerald-300 px-5 text-sm font-black text-slate-950 disabled:bg-white/10 disabled:text-white/35"
          >
            {policyMutation.isPending ? "예약 중" : activePolicy ? "리비전 예약" : "최초 정책 예약"}
          </button>
        </div>

        {!revisionBasisReady && activePolicy ? (
          <p className="mt-2 text-xs font-bold text-amber-200">
            완료장 V5 캘리브레이션이 정합 상태가 될 때까지 다음 리비전을 예약할 수 없습니다.
          </p>
        ) : null}
        {activePolicy && policyChangeCount !== 1 ? (
          <p className="mt-2 text-xs font-bold text-amber-200">
            현재 활성 정책과 정확히 한 항목만 달라야 합니다.
          </p>
        ) : null}
        {policyMutation.isError ? (
          <p className="mt-2 text-xs font-bold text-admin-danger">
            {getAdminUnknownErrorMessage(policyMutation.error, "V5 정책을 예약하지 못했습니다.")}
          </p>
        ) : null}
      </div>

      {operationsQuery.isError ? (
        <p className="mt-4 text-sm font-bold text-admin-danger">V5 운영 상태를 불러오지 못했습니다.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">
          <Metric label="정책" value={activePolicy ? `v${activePolicy.policyVersion}` : "-"} />
          <Metric label="런타임" value={activePolicy?.runtimeEnabled ? "실행" : "정지"} />
          <Metric label="계좌" value={formatNumber(summary?.accountCount)} />
          <Metric label="OFFLINE" value={formatNumber(summary?.offlineAccountCount)} />
          <Metric label="제출 주문" value={formatNumber(summary?.submittedOrderCount)} />
          <Metric label="관측 체결" value={formatNumber(summary?.observedExecutionCount)} />
          <Metric
            label="계좌측 체결 수량"
            value={formatQuantity(
              summary == null
                ? undefined
                : summary.observedExecutionBuyQuantity
                  + summary.observedExecutionSellQuantity,
            )}
          />
          <Metric label="평균 피로" value={formatDecimal(summary?.averageFatigueScore)} />
          <Metric label="계약 위반" value={formatNumber(operations?.profileOrderContractViolationCount)} />
        </div>
      )}

      {operations && operations.accountStates.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-stock-subtle">
              <tr>
                <th className="px-2 py-2">계좌</th>
                <th className="px-2 py-2">상태</th>
                <th className="px-2 py-2">피로</th>
                <th className="px-2 py-2">주문/체결/취소</th>
                <th className="px-2 py-2">매수/매도 수량</th>
                <th className="px-2 py-2">다음 실행</th>
                <th className="px-2 py-2">최근 결과</th>
              </tr>
            </thead>
            <tbody>
              {operations.accountStates.slice(0, 20).map((state) => (
                <tr key={state.accountId} className="border-t border-white/5 font-bold text-white">
                  <td className="px-2 py-2">{state.userKey}<span className="ml-1 text-stock-subtle">{state.profileType}</span></td>
                  <td className="px-2 py-2">{state.activityState} · {state.activitySession}</td>
                  <td className="px-2 py-2">{formatDecimal(state.fatigueScore)}</td>
                  <td className="px-2 py-2">{state.submittedOrderCount}/{state.observedExecutionCount}/{state.observedCancelCount}</td>
                  <td className="px-2 py-2 tabular-nums">
                    {formatNumber(state.observedExecutionBuyQuantity)} / {formatQuantity(state.observedExecutionSellQuantity)}
                  </td>
                  <td className="px-2 py-2">
                    <span>{formatDateTime(state.nextRunAt)}</span>
                    <span className="ml-1 text-stock-subtle">
                      {nextRunLabel(state)}
                    </span>
                  </td>
                  <td className="max-w-56 truncate px-2 py-2">{state.lastResultReason ?? state.lastHoldReason ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {operations.accountStates.length > 20 ? (
            <p className="mt-2 text-right text-xs font-bold text-stock-subtle">
              최근 계좌 ID 순 20개 표시 · 전체 {formatNumber(operations.accountStates.length)}개
            </p>
          ) : null}
        </div>
      ) : null}

      {calibration ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-stock-subtle">
                Completed-day calibration basis
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                종목별 실제 거래량 부족분
              </h3>
              <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
                시장 거래량은 동일 수량의 BUY·SELL 계좌 원장 한 쌍을 1회만 셉니다(BUY 합계 = SELL 합계 = (BUY+SELL)/2).
                V5는 {formatNumber(calibration.participantCount)}개 실제 계좌의 주문과 수량을 1:1로 기록하며 대표인구 가중치나 코호트 증폭을 사용하지 않습니다.
                완료장 기준으로 제출 수량·총 체결 참여량·제출 주문 수가 각각 목표의 50%~200% 범위인지 함께 검증합니다.
              </p>
            </div>
            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
                calibration.nextRevisionAllowed
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-200"
              }`}
            >
              {calibration.nextRevisionAllowed ? "다음 정책 묶음 변경 가능" : "보정 기준 미완성"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
            <Metric
              label="기준 완료 장"
              value={calibration.basisBusinessDate ?? "-"}
            />
            <Metric
              label="계약 / 정책"
              value={
                calibration.contractVersion && calibration.activePolicyVersion
                  ? `c${calibration.contractVersion} / v${calibration.activePolicyVersion}`
                  : "-"
              }
            />
            <Metric
              label="상태 / 활성 / 목표"
              value={`${formatNumber(calibration.observedParticipantStateCount)} / ${formatNumber(calibration.activeParticipantCount)} / ${formatNumber(calibration.participantCount)}`}
            />
            <Metric
              label="종목 대사"
              value={`${formatNumber(calibration.observedSymbolCount)}/${formatNumber(calibration.targetSymbolCount)}`}
            />
            <Metric
              label="목표 거래량"
              value={formatQuantity(calibration.targetDailyVolume)}
            />
            <Metric
              label="실제 거래량"
              value={formatQuantity(calibration.observedDailyVolume)}
            />
            <Metric
              label="부족 거래량"
              value={formatSignedQuantity(calibration.dailyVolumeGap)}
            />
            <Metric
              label="달성률"
              value={formatPercent(calibration.volumeAttainmentRate)}
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
            <Metric
              label="자동 제출 수량"
              value={`${formatQuantity(calibration.autoSubmittedQuantity)} · ${bandStatusLabel(calibration.autoSubmissionBandStatus)}`}
            />
            <Metric
              label="제출 수량 허용 범위"
              value={`${formatQuantity(calibration.autoQuantityTargetLower)} ~ ${formatQuantity(calibration.autoQuantityTargetUpper)}`}
            />
            <Metric
              label="자동 총 체결 참여량"
              value={`${formatQuantity(calibration.autoExecutedGrossQuantity)} · ${bandStatusLabel(calibration.autoExecutionBandStatus)}`}
            />
            <Metric
              label="자동 BUY / SELL"
              value={`${formatQuantity(calibration.autoExecutedBuyQuantity)} / ${formatQuantity(calibration.autoExecutedSellQuantity)}`}
            />
            <Metric
              label="자동 제출 주문"
              value={`${formatNumber(calibration.autoSubmittedOrderCount)}건 · ${bandStatusLabel(calibration.autoOrderCountBandStatus)}`}
            />
            <Metric
              label="주문 목표 / 참여 계좌"
              value={`${formatNumber(calibration.targetAutoSubmittedOrderCount)}건 / ${formatNumber(calibration.autoSubmittingParticipantCount)}명`}
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
            <Metric
              label="실제 거래대금"
              value={formatWon(calibration.observedDailyTurnover)}
            />
            <Metric
              label="목표 거래대금 범위"
              value={`${formatWon(calibration.targetDailyTurnoverLower)} ~ ${formatWon(calibration.targetDailyTurnoverUpper)}`}
            />
            <Metric
              label="거래대금 판정"
              value={turnoverBandLabel(calibration.turnoverBandStatus)}
            />
            <Metric
              label="시장 주문 / 취소"
              value={`${formatNumber(calibration.marketSubmittedOrderCount)} / ${formatNumber(calibration.marketCancelledOrderCount)}`}
            />
            <Metric
              label="엔진 계정 불일치"
              value={formatNumber(calibration.participantIdentityMismatchCount)}
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            <Metric
              label="기관 BUY / SELL"
              value={calibration.institutionParticipationObserved
                ? `${formatQuantity(calibration.institutionBuyQuantity)} / ${formatQuantity(calibration.institutionSellQuantity)}`
                : "관측 전"}
            />
            <Metric
              label="기관 BUY 비율"
              value={calibration.institutionParticipationObserved
                ? `${formatPercent(calibration.institutionBuyParticipationRate)} / 최소 ${formatPercent(calibration.minimumInstitutionBuyParticipationRate)}`
                : "관측 전"}
            />
            <Metric
              label="기관 SELL 비율"
              value={calibration.institutionParticipationObserved
                ? `${formatPercent(calibration.institutionSellParticipationRate)} / 최소 ${formatPercent(calibration.minimumInstitutionSellParticipationRate)}`
                : "관측 전"}
            />
            <Metric
              label="기관 gross / 시장 한쪽"
              value={calibration.institutionParticipationObserved
                ? `${formatPercent(calibration.institutionGrossParticipationRate)} / 목표 ${formatPercent(calibration.targetInstitutionGrossParticipationRate)}`
                : "관측 전"}
            />
            <Metric
              label="기관 계정측 구성 비중"
              value={calibration.institutionParticipationObserved
                ? formatPercent(calibration.institutionAccountSideShareRate)
                : "관측 전"}
            />
            <Metric
              label="기관 목표 달성률"
              value={calibration.institutionParticipationObserved
                ? formatPercent(calibration.institutionGrossAttainmentRate)
                : "관측 전"}
            />
            <Metric
              label="기관 계약 판정"
              value={institutionParticipationLabel(calibration)}
            />
          </div>

          {calibration.blockers.length > 0 ? (
            <div className="mt-3 border-l-2 border-amber-300/70 bg-amber-300/[0.06] px-3 py-2">
              <p className="text-xs font-black text-amber-100">
                다음 정책 리비전 차단 사유
              </p>
              <p className="mt-1 break-words text-xs font-bold leading-5 text-amber-100/80">
                {calibration.blockers.join(" · ")}
              </p>
            </div>
          ) : null}

          {calibration.symbols.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-stock-subtle">
                  <tr>
                    <th className="px-2 py-2">순서</th>
                    <th className="px-2 py-2">종목</th>
                    <th className="px-2 py-2">목표 / 실제 거래량</th>
                    <th className="px-2 py-2">부족량</th>
                    <th className="px-2 py-2">달성률</th>
                    <th className="px-2 py-2">목표 / 실제 거래대금</th>
                    <th className="px-2 py-2">주식수 / 용량 대사</th>
                  </tr>
                </thead>
                <tbody>
                  {calibration.symbols.map((symbol) => (
                    <tr
                      key={symbol.symbol}
                      className="border-t border-white/5 font-bold text-white"
                    >
                      <td className="px-2 py-2 tabular-nums">{symbol.calibrationPriority}</td>
                      <td className="px-2 py-2 font-black">{symbol.symbol}</td>
                      <td className="px-2 py-2 tabular-nums">
                        {formatNumber(symbol.targetDailyVolume)} / {formatNumber(symbol.observedDailyVolume)}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {formatSignedQuantity(symbol.dailyVolumeGap)}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {formatPercent(symbol.volumeAttainmentRate)}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {formatWon(symbol.targetDailyTurnover)} / {formatWon(symbol.observedDailyTurnover)}
                      </td>
                      <td className="px-2 py-2">
                        {symbol.shareStructureMatched ? "주식수 일치" : "주식수 불일치"}
                        <span className="mx-1 text-stock-subtle">·</span>
                        {symbol.referenceCapacityMatched ? "용량 일치" : "용량 불일치"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function nextRunLabel(
  state: NonNullable<AutoParticipantV5Operations["accountStates"]>[number],
) {
  if (state.nextExecutionRetryAt && state.nextRunAt === state.nextExecutionRetryAt) return "재시도";
  if (state.nextProfileEvaluationAt && state.nextRunAt === state.nextProfileEvaluationAt) return "프로필 평가";
  if (state.nextAttentionAt && state.nextRunAt === state.nextAttentionAt) return "자발 관심";
  return "-";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/15 px-3 py-2">
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function PolicyNumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-black text-stock-subtle">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) onChange(nextValue);
        }}
        className="min-h-10 border border-white/10 bg-black/30 px-3 text-sm font-black tabular-nums text-white outline-none focus:border-emerald-300/60"
      />
    </label>
  );
}

function parseV5Policy(policyJson: string | undefined): V5PolicyDraft | null {
  if (!policyJson) return null;
  try {
    const candidate: unknown = JSON.parse(policyJson);
    if (!isRecord(candidate)) return null;
    const draft = {
      attentionRateScale: candidate.attentionRateScale,
      decisionThresholdOffset: candidate.decisionThresholdOffset,
      quantityScale: candidate.quantityScale,
      surpriseRateScale: candidate.surpriseRateScale,
      cancellationThresholdOffset: candidate.cancellationThresholdOffset,
      maxOrdersPerParticipantPerDay: candidate.maxOrdersPerParticipantPerDay,
      maxOpenOrdersPerParticipant: candidate.maxOpenOrdersPerParticipant,
      maxChildNotionalRate: candidate.maxChildNotionalRate,
    };
    return Object.values(draft).every(
      (value) => typeof value === "number" && Number.isFinite(value),
    ) ? draft as V5PolicyDraft : null;
  } catch {
    return null;
  }
}

function countPolicyChanges(left: V5PolicyDraft, right: V5PolicyDraft) {
  return (Object.keys(left) as Array<keyof V5PolicyDraft>)
    .filter((key) => left[key] !== right[key])
    .length;
}

function nextCalendarDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatNumber(value: number | undefined) {
  return value == null ? "-" : new Intl.NumberFormat("ko-KR").format(value);
}

function formatDecimal(value: number | undefined) {
  return value == null ? "-" : value.toFixed(3);
}

function formatQuantity(value: number | undefined) {
  return value == null ? "-" : `${formatNumber(value)}주`;
}

function formatSignedQuantity(value: number | undefined) {
  if (value == null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}주`;
}

function formatPercent(value: number | undefined) {
  return value == null ? "-" : `${(value * 100).toFixed(2)}%`;
}

function formatWon(value: number | undefined) {
  return value == null ? "-" : `${formatNumber(value)}원`;
}

function turnoverBandLabel(
  status: AutoParticipantV5Operations["calibrationReadiness"]["turnoverBandStatus"],
) {
  if (status === "BELOW") return "목표 하한 미달";
  if (status === "WITHIN") return "목표 범위";
  if (status === "ABOVE") return "목표 상한 초과";
  return "관측 전";
}

function bandStatusLabel(
  status: "BELOW" | "WITHIN" | "ABOVE" | "NOT_AVAILABLE",
) {
  if (status === "BELOW") return "50% 미달";
  if (status === "WITHIN") return "50%~200%";
  if (status === "ABOVE") return "200% 초과";
  return "관측 전";
}

function institutionParticipationLabel(
  calibration: AutoParticipantV5Operations["calibrationReadiness"],
) {
  if (!calibration.institutionParticipationObserved) return "관측 전";
  const sideMinimumsAttained = calibration.institutionBuyMinimumAttained
    && calibration.institutionSellMinimumAttained;
  if (!sideMinimumsAttained) return "방향별 최소 미달";
  return calibration.institutionGrossTargetAttained ? "목표 충족" : "최소 충족 · 목표 미달";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
