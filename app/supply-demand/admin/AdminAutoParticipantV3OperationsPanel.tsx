"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { setAutoParticipantV3OperationsQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { autoParticipantV3OperationsQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import { updateAutoParticipantV3Runtime } from "@/app/lib/stock";
import {
  getAdminActionData,
  getAdminUnknownErrorMessage,
} from "@/app/supply-demand/admin/AdminActionResultHelpers";

type Props = {
  accessToken: string | null;
};

export function AdminAutoParticipantV3OperationsPanel({ accessToken }: Props) {
  const queryClient = useQueryClient();
  const [changeReason, setChangeReason] = useState("");
  const operationsQuery = useQuery(
    autoParticipantV3OperationsQueryOptions(accessToken, {
      enabled: Boolean(accessToken),
    }),
  );
  const runtimeMutation = useMutation({
    mutationFn: async (runtimeEnabled: boolean) => {
      if (!accessToken) throw new Error("관리자 인증이 필요합니다.");
      const result = await updateAutoParticipantV3Runtime(accessToken, {
        runtimeEnabled,
        changeReason: changeReason.trim(),
      });
      const action = getAdminActionData(
        result,
        "V3 런타임 상태를 변경하지 못했습니다.",
      );
      if (!action.ok) {
        throw new Error(action.message);
      }
      return action.data;
    },
    onSuccess: (operations) => {
      setAutoParticipantV3OperationsQueryData(queryClient, operations);
      setChangeReason("");
    },
  });
  const operations = operationsQuery.data;
  const activePolicy = operations?.policies.find((policy) => policy.status === "ACTIVE");
  const summary = operations?.dailySummary;

  return (
    <section className="mb-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-admin-accent">V3 runtime</p>
          <h2 className="mt-1 text-lg font-black text-white">확률 행동 운영 상태</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            정책 버전, 일일 잠재 상태, 피로도, 다음 관심·가드 시각과 미완료 강제청산을 10초마다 확인합니다.
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
            "V3 런타임 상태를 변경하지 못했습니다.",
          )}
        </p>
      ) : null}

      {operationsQuery.isError ? (
        <p className="mt-4 text-sm font-bold text-admin-danger">V3 운영 상태를 불러오지 못했습니다.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          <Metric label="정책" value={activePolicy ? `v${activePolicy.policyVersion}` : "-"} />
          <Metric label="런타임" value={activePolicy?.runtimeEnabled ? "실행" : "정지"} />
          <Metric label="계좌" value={formatNumber(summary?.accountCount)} />
          <Metric label="OFFLINE" value={formatNumber(summary?.offlineAccountCount)} />
          <Metric label="제출 주문" value={formatNumber(summary?.submittedOrderCount)} />
          <Metric label="관측 체결" value={formatNumber(summary?.observedExecutionCount)} />
          <Metric label="평균 피로" value={formatDecimal(summary?.averageFatigueScore)} />
          <Metric label="미완료 청산" value={formatNumber(operations?.incompleteLiquidationPlanCount)} />
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
                <th className="px-2 py-2">다음 관심</th>
                <th className="px-2 py-2">다음 가드</th>
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
                  <td className="px-2 py-2">{formatDateTime(state.nextAttentionAt)}</td>
                  <td className="px-2 py-2">{formatDateTime(state.nextGuardAt)}</td>
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
    </section>
  );
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
