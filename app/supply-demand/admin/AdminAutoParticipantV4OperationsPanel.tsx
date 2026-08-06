"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { setAutoParticipantV4OperationsQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { autoParticipantV4OperationsQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import { updateAutoParticipantV4Runtime } from "@/app/lib/stock";
import type { AutoParticipantV4Operations } from "@/app/types/stock";
import {
  getAdminActionData,
  getAdminUnknownErrorMessage,
} from "@/app/supply-demand/admin/AdminActionResultHelpers";

type Props = {
  accessToken: string | null;
};

export function AdminAutoParticipantV4OperationsPanel({ accessToken }: Props) {
  const queryClient = useQueryClient();
  const [changeReason, setChangeReason] = useState("");
  const operationsQuery = useQuery(
    autoParticipantV4OperationsQueryOptions(accessToken, {
      enabled: Boolean(accessToken),
    }),
  );
  const runtimeMutation = useMutation({
    mutationFn: async (runtimeEnabled: boolean) => {
      if (!accessToken) throw new Error("관리자 인증이 필요합니다.");
      const result = await updateAutoParticipantV4Runtime(accessToken, {
        runtimeEnabled,
        changeReason: changeReason.trim(),
      });
      const action = getAdminActionData(
        result,
        "V4 런타임 상태를 변경하지 못했습니다.",
      );
      if (!action.ok) {
        throw new Error(action.message);
      }
      return action.data;
    },
    onSuccess: (operations) => {
      setAutoParticipantV4OperationsQueryData(queryClient, operations);
      setChangeReason("");
    },
  });
  const operations = operationsQuery.data;
  const activePolicy = operations?.policies.find((policy) => policy.status === "ACTIVE");
  const summary = operations?.dailySummary;
  const calibration = operations?.calibrationReadiness;

  return (
    <section className="mb-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-admin-accent">V4 runtime</p>
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
            "V4 런타임 상태를 변경하지 못했습니다.",
          )}
        </p>
      ) : null}

      {operationsQuery.isError ? (
        <p className="mt-4 text-sm font-bold text-admin-danger">V4 운영 상태를 불러오지 못했습니다.</p>
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
                시장 거래량은 동일 수량의 BUY·SELL 계좌 원장 한 쌍을 1회만 셉니다(BUY 합계 = SELL 합계 = (BUY+SELL)/2). 실행 {formatNumber(calibration.engineParticipantCount)}명은
                대표 {formatNumber(calibration.representedParticipantCount)}명을 나타냅니다. 가중치{" "}
                {formatDecimal(calibration.populationWeight)}는 활성 계약의 표본 주문수량과 대표 코호트 판단에 반영하되,
                종목 목표·현금·보유·방향별 잔여량으로 제한합니다. 완료장 관찰 수치에는 다시 곱하지 않습니다.
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
              value={`${formatNumber(calibration.observedParticipantStateCount)} / ${formatNumber(calibration.activeParticipantCount)} / ${formatNumber(calibration.engineParticipantCount)}`}
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
  state: NonNullable<AutoParticipantV4Operations["accountStates"]>[number],
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
  status: AutoParticipantV4Operations["calibrationReadiness"]["turnoverBandStatus"],
) {
  if (status === "BELOW") return "목표 하한 미달";
  if (status === "WITHIN") return "목표 범위";
  if (status === "ABOVE") return "목표 상한 초과";
  return "관측 전";
}

function institutionParticipationLabel(
  calibration: AutoParticipantV4Operations["calibrationReadiness"],
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
