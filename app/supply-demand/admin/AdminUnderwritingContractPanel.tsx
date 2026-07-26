"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import DataTableViewport from "@/app/components/DataTableViewport";
import { upsertUnderwritingContractQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import {
  adminActivateUnderwritingSupplyMutationOptions,
  adminCreateUnderwritingContractMutationOptions,
  adminSuspendUnderwritingSupplyMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import {
  formatCompactWon,
  formatCount,
  formatDateTime,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type {
  SecurityAllocation,
  UnderwritingContract,
  UnderwritingContractRecommendation,
} from "@/app/types/stock";

export function AdminUnderwritingContractPanel({
  accessToken,
  contracts,
  recommendation,
  loading,
  error,
  onRefresh,
}: {
  accessToken: string | null;
  contracts: UnderwritingContract[];
  recommendation: UnderwritingContractRecommendation | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const createContractMutation = useMutation(
    adminCreateUnderwritingContractMutationOptions(),
  );
  const activationMutation = useMutation(
    adminActivateUnderwritingSupplyMutationOptions(),
  );
  const suspensionMutation = useMutation(
    adminSuspendUnderwritingSupplyMutationOptions(),
  );
  const [supplyPercent, setSupplyPercent] = useState("10");
  const [durationDays, setDurationDays] = useState("20");
  const [contractSymbol, setContractSymbol] = useState("");
  const [contractReason, setContractReason] = useState(
    "발행 대기 유통분의 종목별 인수계정·계약 생성",
  );
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [supplyChangeReason, setSupplyChangeReason] = useState(
    "축소 시장 초기 수급용 유한 수동 매도 공급",
  );
  const [confirmed, setConfirmed] = useState(false);
  const [workingContractId, setWorkingContractId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const summary = useMemo(() => summarizeContracts(contracts), [contracts]);
  const supplyRate = Number(supplyPercent) / 100;
  const normalizedDurationDays = Number(durationDays);
  const activationPolicyValid = Number.isFinite(supplyRate)
    && supplyRate >= 0.01
    && supplyRate <= 0.25
    && Number.isInteger(normalizedDurationDays)
    && normalizedDurationDays >= 1
    && normalizedDurationDays <= 60;
  const normalizedContractSymbol = contractSymbol.trim().toUpperCase();
  const contractCandidate = recommendation?.symbols.find(
    (item) => item.symbol === normalizedContractSymbol,
  );
  const canCreateContract = Boolean(accessToken)
    && !loading
    && !error
    && contractConfirmed
    && contractCandidate?.creationEligible === true
    && !contracts.some((contract) => contract.symbol === normalizedContractSymbol);

  const createContract = async () => {
    if (!accessToken || !canCreateContract || createContractMutation.isPending) {
      return;
    }
    setFeedback(null);
    const result = await createContractMutation.mutateAsync({
      token: accessToken,
      symbol: normalizedContractSymbol,
      payload: {
        underwritingType: "FIRM_COMMITMENT",
        changeReason: contractReason.trim() || undefined,
      },
    });
    const created = getAdminActionData(
      result,
      "인수계정과 계약을 생성하지 못했습니다.",
    );
    if (!created.ok) {
      setFeedback({ tone: "error", message: created.message });
      return;
    }
    upsertUnderwritingContractQueryData(queryClient, created.data);
    setContractConfirmed(false);
    setFeedback({
      tone: "success",
      message: `${created.data.symbol} 인수계정과 계약 1건을 생성했습니다. LP와 유한 공급은 별도 작업입니다.`,
    });
    onRefresh();
  };

  const activateSupply = async (contract: UnderwritingContract) => {
    if (!accessToken
      || loading
      || error
      || !confirmed
      || !activationPolicyValid
      || activationMutation.isPending
      || contract.status !== "ALLOCATED"
      || !contract.reconciliation.roleEligible) {
      return;
    }
    const approved = window.confirm(
      `${contract.symbol} 인수재고 중 ${supplyPercent}%를 최대 ${durationDays}일 동안 유한 공급합니다.\n\n매수 주문은 만들지 않고 한 번에 수동 매도호가 1개만 유지합니다. 취소·TTL 만료된 주문도 제출예산을 돌려받지 않습니다. 시뮬레이션이 일시정지된 장전 상태인지 확인했습니까?`,
    );
    if (!approved) {
      return;
    }
    setWorkingContractId(contract.contractId);
    setFeedback(null);
    try {
      const result = await activationMutation.mutateAsync({
        token: accessToken,
        contractId: contract.contractId,
        payload: {
          supplyRate,
          durationDays: normalizedDurationDays,
          changeReason: supplyChangeReason.trim() || undefined,
        },
      });
      const activated = getAdminActionData(
        result,
        "인수기관 유한 공급을 활성화하지 못했습니다.",
      );
      if (!activated.ok) {
        setFeedback({ tone: "error", message: activated.message });
        return;
      }
      upsertUnderwritingContractQueryData(queryClient, activated.data);
      setConfirmed(false);
      setFeedback({
        tone: "success",
        message: `${activated.data.symbol} 인수기관을 유한·매도 전용 공급 상태로 전환했습니다.`,
      });
    } finally {
      setWorkingContractId(null);
    }
  };

  const suspendSupply = async (contract: UnderwritingContract) => {
    if (!accessToken
      || loading
      || error
      || suspensionMutation.isPending
      || contract.status !== "STABILIZING") {
      return;
    }
    const approved = window.confirm(
      `${contract.symbol} 인수기관 공급을 즉시 중단하고 계약 소유 미체결 주문을 취소합니다. 이미 사용한 제출예산은 복원하지 않습니다. 계속할까요?`,
    );
    if (!approved) {
      return;
    }
    setWorkingContractId(contract.contractId);
    setFeedback(null);
    try {
      const result = await suspensionMutation.mutateAsync({
        token: accessToken,
        contractId: contract.contractId,
        payload: {
          changeReason: "관리자 긴급 중단 및 미체결 주문 취소",
        },
      });
      const suspended = getAdminActionData(
        result,
        "인수기관 공급을 중단하지 못했습니다.",
      );
      if (!suspended.ok) {
        setFeedback({ tone: "error", message: suspended.message });
        return;
      }
      upsertUnderwritingContractQueryData(queryClient, suspended.data);
      setFeedback({
        tone: "success",
        message: `${suspended.data.symbol} 인수기관 공급을 중단하고 ALLOCATED 상태로 되돌렸습니다.`,
      });
    } finally {
      setWorkingContractId(null);
    }
  };

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black">발행·인수·최초 배정 감사</h2>
            <span className="rounded-md bg-admin-accent-surface px-2 py-1 text-[10px] font-black text-admin-accent-soft">
              역할 분리형
            </span>
          </div>
          <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            신규 발행은 먼저 유통 대기·잠금 보관계정에 적재되고, 이 화면에서 선택한 한 종목의 유통분만 별도 인수계정과 계약으로 이전합니다.
          </p>
          <p className="mt-1 max-w-4xl text-[11px] font-bold leading-5 text-admin-quiet">
            인수계정 보유량은 이후 매매로 달라질 수 있으므로 현재 잔고와 최초 배정량의 차이 자체는 오류가 아닙니다. 불변 배정원장의 합계는 최초 계약 수량과 일치해야 하고, 현재 발행·유통주식은 이후 기업행사로 늘어날 수 있어 최초 계약량 이상인지만 별도로 대사합니다.
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

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <ProfileMiniMetric label="인수 계약" value={formatCount(contracts.length, "개")} tone="blue" />
        <ProfileMiniMetric label="총 발행량" value={formatCount(summary.totalIssueQuantity, "주")} tone="muted" />
        <ProfileMiniMetric label="초기 유통비율" value={formatRate(summary.tradableShareRate)} tone="blue" />
        <ProfileMiniMetric label="잠금·보관 물량" value={formatCount(summary.lockedQuantity, "주")} tone="muted" />
        <ProfileMiniMetric label="인수 평가액" value={formatCompactWon(summary.underwrittenValue)} tone="muted" />
        <ProfileMiniMetric label="유한 공급 활성" value={formatCount(summary.activeSupplyCount, "개")} tone={summary.activeSupplyCount > 0 ? "blue" : "muted"} />
        <ProfileMiniMetric label="누적 제출" value={formatCount(summary.submittedSupplyQuantity, "주")} tone="muted" />
        <ProfileMiniMetric label="대사 실패" value={formatCount(summary.mismatchCount, "건")} tone={summary.mismatchCount > 0 ? "red" : "green"} />
      </div>

      <div className="mt-4 rounded-md border border-admin-accent/25 bg-admin-accent-surface/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white">상장 인수계약 개별 생성</h3>
            <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
              한 번에 한 종목의 인수계정과 계약만 생성합니다. 인수기관 법인은 전체 시장에 1곳을 권장하지만 거래계정은 종목별 1개를 유지합니다.
            </p>
          </div>
          <span className="rounded-md bg-black/25 px-2 py-1 text-[10px] font-black text-admin-accent-soft">
            권장 계약 {recommendation ? `${recommendation.currentContractCount}/${recommendation.currentContractCount + recommendation.recommendedRemainingContractCount}건` : "조회 대기"}
          </span>
        </div>
        {recommendation ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ContractMetric label="권장 법인" value={`${formatNumber(recommendation.recommendedUnderwriterOrganizationCount)}곳`} />
            <ContractMetric label="종목당 권장 계정" value={`${formatNumber(recommendation.recommendedAccountCountPerSymbol)}개`} />
            <ContractMetric label="추가 권장 계약" value={`${formatNumber(recommendation.recommendedRemainingContractCount)}건`} />
            <ContractMetric label="권장 공급" value={`${formatRate(recommendation.recommendedSupplyRate)} · ${recommendation.recommendedSupplyDurationDays}일`} />
          </div>
        ) : null}
        {recommendation?.symbols.length ? (
          <div className="mt-3">
            <p className="mb-1 text-[10px] font-black text-admin-quiet">발행 대기 종목별 권장 인수 수량</p>
            <DataTableViewport label="발행 대기 종목별 권장 인수 수량" tone="dark">
              <table className="min-w-[860px] w-full text-left text-xs">
                <thead className="bg-white/[0.045] text-[10px] font-black text-admin-quiet">
                  <tr>
                    <th className="px-3 py-2">종목</th>
                    <th className="px-3 py-2 text-right">총 발행량</th>
                    <th className="px-3 py-2 text-right">유통 대기</th>
                    <th className="px-3 py-2 text-right">잠금 수량</th>
                    <th className="px-3 py-2 text-right">발행가</th>
                    <th className="px-3 py-2">생성 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recommendation.symbols.map((item) => (
                    <tr key={item.symbol}>
                      <td className="px-3 py-2 font-black text-white">{item.symbol}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(item.issuedShares)}주</td>
                      <td className="px-3 py-2 text-right font-black text-admin-accent-soft">
                        {formatNumber(item.floatCustodyAvailableQuantity)}주
                      </td>
                      <td className="px-3 py-2 text-right">{formatNumber(item.lockedShares)}주</td>
                      <td className="px-3 py-2 text-right">{formatWon(item.issuePrice)}</td>
                      <td className={item.creationEligible ? "px-3 py-2 text-admin-success" : "px-3 py-2 text-admin-warning"}>
                        {item.creationEligible ? "생성 가능" : item.eligibilityReason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableViewport>
          </div>
        ) : null}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-black text-stock-subtle">
            발행 대기 종목
            <select
              value={contractSymbol}
              onChange={(event) => setContractSymbol(event.target.value)}
              className="mt-1 min-h-10 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm font-black text-white"
            >
              <option value="">종목 선택</option>
              {(recommendation?.symbols ?? []).map((item) => (
                <option key={item.symbol} value={item.symbol} disabled={!item.creationEligible}>
                  {item.symbol} · {item.creationEligible ? `${formatNumber(item.floatCustodyAvailableQuantity)}주 인수 가능` : item.eligibilityReason}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black text-stock-subtle md:col-span-2">
            생성 사유
            <input
              value={contractReason}
              onChange={(event) => setContractReason(event.target.value)}
              maxLength={500}
              className="mt-1 min-h-10 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm font-black text-white"
            />
          </label>
        </div>
        {contractCandidate ? (
          <p className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-stock-subtle">
            <strong className="text-white">{contractCandidate.symbol}</strong>
            {" · "}발행 {formatNumber(contractCandidate.issuedShares)}주
            {" · "}유통 대기 {formatNumber(contractCandidate.floatCustodyAvailableQuantity)}주
            {" · "}잠금 {formatNumber(contractCandidate.lockedShares)}주
            {" · "}발행가 {formatWon(contractCandidate.issuePrice)}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex max-w-4xl items-start gap-2 text-xs font-bold leading-5 text-stock-subtle">
            <input
              type="checkbox"
              checked={contractConfirmed}
              onChange={(event) => setContractConfirmed(event.target.checked)}
              className="mt-1"
            />
            선택 종목의 유통 대기 물량 전부를 종목 전용 인수계정으로 이전하며, LP 계약과 공급 활성화는 함께 생성되지 않는다는 점을 확인했습니다.
          </label>
          <button
            type="button"
            onClick={() => void createContract()}
            disabled={!canCreateContract || createContractMutation.isPending}
            className="min-h-10 rounded-md bg-admin-accent px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createContractMutation.isPending ? "계약 생성 중" : "인수계정·계약 1건 생성"}
          </button>
        </div>
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
          인수계약 또는 배정원장을 읽지 못했습니다. 신규 발행과 초기화 작업을 진행하기 전에 스키마 readiness와 원장 합계를 먼저 확인하세요.
        </p>
      ) : null}

      {!loading && !error && contracts.length === 0 ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-4 py-5">
          <p className="text-sm font-black text-white">역할 분리형 인수계약이 아직 없습니다.</p>
          <p className="mt-2 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">
            기존 종목은 100% 유통 구조를 그대로 보존합니다. 신규 발행 탭에서 역할 분리형 종목을 만든 뒤 위에서 인수계약을 별도로 생성하세요.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">축소 시장용 초기 공급 정책</p>
            <p className="mt-1 max-w-4xl text-[11px] font-bold leading-5 text-stock-subtle">
              전체 인수재고를 시장에 내놓지 않습니다. 계약 총 제출량, 거래일별 제출량, 일일 주문 횟수, 주문 1건, 외부 매수 5호가 깊이 중 가장 작은 한도만 매도하며 취소된 주문도 예산과 주문 횟수를 소비합니다.
            </p>
            <p className="mt-1 max-w-4xl text-[10px] font-bold leading-5 text-admin-quiet">
              역할 분리형 신규 종목은 먼저 전용 LP를 LIVE로 전환해 주문장 시장을 활성화하고, 종목 자동시장·기준 거래량 위험 설정이 켜져 있어야 합니다.
            </p>
            <p className="mt-1 max-w-4xl text-[10px] font-bold leading-5 text-admin-warning">
              공급 기간이나 총 상한이 끝난 뒤 남은 인수재고는 자동 분산되지 않습니다. 현재 초기 참여자 배정·락업 해제 workflow가 없으므로 신규 종목의 실제 활동 유통량을 별도로 검토한 뒤 공급률을 확정하세요.
            </p>
          </div>
          <span className="rounded-md bg-admin-warning-surface px-2 py-1 text-[10px] font-black text-admin-warning">
            일시정지·장전에서만 활성화
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-black text-stock-subtle">
            총 공급 상한 · 현재 가용재고 대비 %
            <input
              value={supplyPercent}
              onChange={(event) => setSupplyPercent(event.target.value)}
              inputMode="decimal"
              className="mt-1 min-h-10 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm font-black text-white"
            />
            <span className="mt-1 block text-[10px] text-admin-quiet">1~25% · 기본 10%</span>
          </label>
          <label className="text-xs font-black text-stock-subtle">
            공급 기간 · 시뮬레이션 일
            <input
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
              inputMode="numeric"
              className="mt-1 min-h-10 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm font-black text-white"
            />
            <span className="mt-1 block text-[10px] text-admin-quiet">1~60일 · 기본 20일</span>
          </label>
          <label className="text-xs font-black text-stock-subtle">
            변경 사유
            <input
              value={supplyChangeReason}
              onChange={(event) => setSupplyChangeReason(event.target.value)}
              className="mt-1 min-h-10 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm font-black text-white"
            />
          </label>
        </div>
        <label className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-stock-subtle">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1"
          />
          매수·가격추격·영구 재보충이 없고, 취소해도 제출예산이 복원되지 않는 유한 공급임을 확인했습니다.
        </label>
        {!activationPolicyValid ? (
          <p className="mt-2 text-xs font-bold text-admin-danger">
            공급률은 1~25%, 기간은 1~60의 정수로 입력하세요.
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        {contracts.map((contract) => (
          <UnderwritingContractCard
            key={contract.contractId}
            contract={contract}
            working={workingContractId === contract.contractId}
            canActivate={Boolean(accessToken)
              && !loading
              && !error
              && confirmed
              && activationPolicyValid
              && contract.status === "ALLOCATED"
              && contract.reconciliation.issues.length === 0
              && Math.min(
                Math.max(
                  1,
                  Math.floor(contract.account.availableSellQuantity * supplyRate),
                ),
                contract.account.availableSellQuantity,
              ) > contract.supply.lifetimeSubmittedQuantity}
            canSuspend={Boolean(accessToken)
              && !loading
              && !error
              && contract.status === "STABILIZING"}
            onActivate={() => void activateSupply(contract)}
            onSuspend={() => void suspendSupply(contract)}
          />
        ))}
      </div>
    </section>
  );
}

function UnderwritingContractCard({
  contract,
  working,
  canActivate,
  canSuspend,
  onActivate,
  onSuspend,
}: {
  contract: UnderwritingContract;
  working: boolean;
  canActivate: boolean;
  canSuspend: boolean;
  onActivate: () => void;
  onSuspend: () => void;
}) {
  const issues = contract.reconciliation.issues;
  const stabilizationEnabled = contract.stabilizationQuantityLimit > 0
    || contract.stabilizationAmountLimit > 0;

  return (
    <article className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{contract.symbol} · {contract.instrumentName}</h3>
            <span className={statusClassName(contract.status)}>{contract.status}</span>
            <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-stock-subtle">
              {contract.underwritingType}
            </span>
          </div>
          <p className="mt-1 break-all text-xs font-bold text-stock-subtle">
            {contract.contractCode} · 계약 #{contract.contractId} · 기업행사 #{contract.corporateActionId ?? "미연결"} · 정책 v{contract.policyVersion}
          </p>
          <p className="mt-1 break-all text-[11px] font-bold text-admin-quiet">
            {contract.account.participantDisplayName} ({contract.account.participantCode}) · 계좌 {contract.account.accountCode ?? `#${contract.account.accountId}`} · STP {contract.account.accountSelfTradeGroupId ?? "미설정"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-[10px] font-bold text-admin-quiet">
          <div>
            <p>발행가 {formatWon(contract.issuePrice)}</p>
            <p className="mt-1">생성 {formatDateTime(contract.createdAt)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onActivate}
              disabled={!canActivate || working}
              className="min-h-9 rounded-md bg-admin-accent-surface px-3 py-1.5 text-xs font-black text-admin-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {working ? "처리 중" : "유한 공급 활성화"}
            </button>
            <button
              type="button"
              onClick={onSuspend}
              disabled={!canSuspend || working}
              className="min-h-9 rounded-md bg-admin-danger-surface px-3 py-1.5 text-xs font-black text-admin-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              즉시 중단
            </button>
          </div>
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="mt-3 grid gap-1 rounded-md border border-admin-danger/20 bg-admin-danger-surface/60 px-3 py-2 text-xs font-bold leading-5 text-admin-danger">
          {issues.map((issue) => <li key={issue}>· {formatReconciliationIssue(issue)}</li>)}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-admin-success/20 bg-admin-success-surface px-3 py-2 text-xs font-bold text-admin-success">
          계약 내부 수량, 최초 배정원장, 현재 발행수량 보존, 전용 계정 역할과 자기체결 그룹이 모두 정상입니다.
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <ContractMetric label="발행주식" value={formatCount(contract.totalIssueQuantity, "주")} />
        <ContractMetric label="유통 배정" value={`${formatCount(contract.tradableAllocationQuantity, "주")} · ${formatRate(contract.tradableShareRate)}`} />
        <ContractMetric label="잠금 배정" value={formatCount(contract.lockedAllocationQuantity, "주")} />
        <ContractMetric label="인수 수량" value={formatCount(contract.underwrittenQuantity, "주")} />
        <ContractMetric label="인수 평가액" value={formatCompactWon(contract.underwrittenQuantity * contract.issuePrice)} />
        <ContractMetric label="현재 인수재고" value={formatCount(contract.account.holdingQuantity, "주")} />
        <ContractMetric label="현재 평가액" value={formatCompactWon(contract.account.holdingMarketValue)} />
        <ContractMetric label="인수 미체결" value={`${formatCount(contract.account.openUnderwritingOrderCount, "건")} · ${formatCount(contract.account.openUnderwritingOrderQuantity, "주")}`} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <ContractMetric label="공급 총 상한" value={formatCount(contract.stabilizationQuantityLimit, "주")} />
        <ContractMetric label="누적 제출 / 체결" value={`${formatNumber(contract.supply.lifetimeSubmittedQuantity)} / ${formatNumber(contract.supply.lifetimeExecutedQuantity)}주`} />
        <ContractMetric label="남은 제출량" value={formatCount(contract.supply.remainingSubmissionQuantity, "주")} />
        <ContractMetric label="남은 제출금액" value={formatCompactWon(contract.supply.remainingSubmissionAmount)} />
        <ContractMetric
          label="최근 일일 게이트"
          value={contract.supply.latestDailyState
            ? `${contract.supply.latestDailyState.stateStatus} · ${contract.supply.latestDailyState.gateReason}`
            : "실행 이력 없음"}
        />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <ContractInfo
          label="수량 대사"
          primary={`계약 ${formatNumber(contract.totalIssueQuantity)} · 원장 ${formatNumber(contract.reconciliation.initialAllocationLedgerQuantity)}주`}
          secondary={`종목 발행 ${formatNumber(contract.issuedShares)} · 현재 전체 보유 ${formatNumber(contract.reconciliation.currentTotalHoldingQuantity)} · 유통 ${formatNumber(contract.instrumentTradableShares)}주`}
        />
        <ContractInfo
          label="전용 계정"
          primary={`${contract.account.accountRole ?? "역할 없음"} · ${contract.account.accountStatus}`}
          secondary={`가용 ${formatNumber(contract.account.availableSellQuantity)}주 · 예약 ${formatNumber(contract.account.reservedSellQuantity)}주 · 타종목 ${formatNumber(contract.account.unmanagedHoldingCount)}개`}
        />
        <ContractInfo
          label="한시 초기 공급"
          primary={stabilizationEnabled
            ? `${formatNumber(contract.stabilizationQuantityLimit)}주 · ${formatCompactWon(contract.stabilizationAmountLimit)}`
            : "비활성 · 수량·금액 한도 0"}
          secondary={contract.stabilizationStartDate || contract.stabilizationEndDate
            ? `${contract.stabilizationStartDate ?? "시작 미정"} ~ ${contract.stabilizationEndDate ?? "종료 미정"}`
            : "활성화 전에는 인수계정이 주문을 만들지 않습니다."}
        />
        <ContractInfo
          label="최근 거래일 예산"
          primary={contract.supply.latestDailyState
            ? `${formatNumber(contract.supply.latestDailyState.submittedQuantity)} / ${formatNumber(contract.supply.latestDailyState.submissionQuantityLimit)}주`
            : "일일 예산 없음"}
          secondary={contract.supply.latestDailyState
            ? `${contract.supply.latestDailyState.simulationTradeDate} · 기준 거래량 ${formatNumber(contract.supply.latestDailyState.referenceDailyVolume)}주 · 주문 ${formatNumber(contract.supply.latestDailyState.generatedOrderCount)}건`
            : "첫 정규장 실행 시 일일 제출예산을 생성합니다."}
        />
      </div>

      <AllocationLedgerTable contract={contract} />
    </article>
  );
}

function AllocationLedgerTable({ contract }: { contract: UnderwritingContract }) {
  return (
    <DataTableViewport label={`${contract.symbol} 최초 배정 불변원장`} tone="dark" className="mt-3">
      <table className="min-w-[1180px] w-full text-left text-xs">
        <thead className="bg-white/[0.045] text-[10px] font-black uppercase tracking-wide text-admin-quiet">
          <tr>
            <th className="px-3 py-2">원장</th>
            <th className="px-3 py-2">거래 가능</th>
            <th className="px-3 py-2">배정 사유</th>
            <th className="px-3 py-2">도착 계정</th>
            <th className="px-3 py-2 text-right">배정 수량</th>
            <th className="px-3 py-2 text-right">단가 / 금액</th>
            <th className="px-3 py-2 text-right">현재 보유 / 예약</th>
            <th className="px-3 py-2">효력 / 해제</th>
            <th className="px-3 py-2">멱등성 키</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {contract.allocations.map((allocation) => (
            <AllocationRow key={allocation.allocationId} allocation={allocation} />
          ))}
        </tbody>
      </table>
    </DataTableViewport>
  );
}

function AllocationRow({ allocation }: { allocation: SecurityAllocation }) {
  return (
    <tr className="align-top text-admin-muted">
      <td className="px-3 py-3">
        <p className="font-black text-white">#{allocation.allocationId} · {allocation.eventType}</p>
        <p className="mt-1 text-[10px] text-admin-quiet">기업행사 #{allocation.corporateActionId ?? "—"}</p>
      </td>
      <td className="px-3 py-3">
        <span className={allocation.tradabilityStatus === "TRADABLE"
          ? "rounded-md bg-admin-success-surface px-2 py-1 text-[10px] font-black text-admin-success"
          : "rounded-md bg-white/10 px-2 py-1 text-[10px] font-black text-stock-subtle"}
        >
          {allocation.tradabilityStatus}
        </span>
      </td>
      <td className="px-3 py-3 font-black text-white">{allocation.allocationReason}</td>
      <td className="px-3 py-3">
        <p className="font-black text-white">{allocation.destinationAccountCode ?? `#${allocation.destinationAccountId}`}</p>
        <p className="mt-1 text-[10px] text-admin-quiet">{allocation.destinationParticipantCategory}</p>
      </td>
      <td className="px-3 py-3 text-right font-black tabular-nums text-white">{formatNumber(allocation.quantity)}주</td>
      <td className="px-3 py-3 text-right tabular-nums">
        <p className="font-black text-white">{formatWon(allocation.unitPrice)}</p>
        <p className="mt-1 text-[10px] text-admin-quiet">{formatCompactWon(allocation.quantity * allocation.unitPrice)}</p>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <p className="font-black text-white">{formatNumber(allocation.currentHoldingQuantity)} / {formatNumber(allocation.currentReservedQuantity)}주</p>
        <p className="mt-1 text-[10px] text-admin-quiet">평단 {formatWon(allocation.currentAveragePrice)}</p>
      </td>
      <td className="px-3 py-3">
        <p className="font-black text-white">{allocation.effectiveBusinessDate}</p>
        <p className="mt-1 text-[10px] text-admin-quiet">
          해제 {allocation.unlockBusinessDate
            ?? (allocation.tradabilityStatus === "LOCKED" ? "무기한" : "해당 없음")}
        </p>
      </td>
      <td className="max-w-64 break-all px-3 py-3 text-[10px] font-bold text-admin-quiet">{allocation.idempotencyKey}</td>
    </tr>
  );
}

function ContractMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-bold text-admin-quiet">{label}</p>
      <p className="mt-1 truncate text-xs font-black tabular-nums text-white" title={value}>{value}</p>
    </div>
  );
}

function ContractInfo({
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

function summarizeContracts(contracts: UnderwritingContract[]) {
  const totalIssueQuantity = contracts.reduce(
    (sum, contract) => sum + contract.totalIssueQuantity,
    0,
  );
  const tradableQuantity = contracts.reduce(
    (sum, contract) => sum + contract.tradableAllocationQuantity,
    0,
  );
  return {
    totalIssueQuantity,
    tradableShareRate: totalIssueQuantity > 0 ? tradableQuantity / totalIssueQuantity : 0,
    lockedQuantity: contracts.reduce(
      (sum, contract) => sum + contract.lockedAllocationQuantity,
      0,
    ),
    underwrittenValue: contracts.reduce(
      (sum, contract) => sum + contract.underwrittenQuantity * contract.issuePrice,
      0,
    ),
    activeSupplyCount: contracts.filter(
      (contract) => contract.status === "STABILIZING",
    ).length,
    submittedSupplyQuantity: contracts.reduce(
      (sum, contract) => sum + contract.supply.lifetimeSubmittedQuantity,
      0,
    ),
    mismatchCount: contracts.filter(
      (contract) => contract.reconciliation.issues.length > 0,
    ).length,
  };
}

type Feedback = {
  tone: "success" | "error";
  message: string;
};

function statusClassName(status: UnderwritingContract["status"]) {
  const tone = status === "CANCELLED"
    ? "bg-admin-danger-surface text-admin-danger"
    : status === "STABILIZING"
      ? "bg-admin-warning-surface text-admin-warning"
      : status === "COMPLETED"
        ? "bg-white/10 text-stock-subtle"
        : "bg-admin-accent-surface text-admin-accent-soft";
  return `rounded-md px-2 py-1 text-[10px] font-black ${tone}`;
}

function formatRate(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${formatNumber(value * 100)}%`;
}

function formatReconciliationIssue(issue: string) {
  const labels: Record<string, string> = {
    ROLE_PARTICIPANT_TYPE_MISMATCH: "기관 유형이 ISSUE_UNDERWRITER가 아닙니다.",
    ROLE_PARTICIPANT_NOT_ACTIVE: "인수기관이 활성 상태가 아닙니다.",
    ROLE_ACCOUNT_NOT_ACTIVE: "인수계정이 활성 상태가 아닙니다.",
    ROLE_ACCOUNT_CATEGORY_MISMATCH: "계좌 참여자 유형이 ISSUE_UNDERWRITER가 아닙니다.",
    ROLE_MAPPING_MISMATCH: "기관-계좌 역할 매핑이 없거나 비활성입니다.",
    ROLE_SELF_TRADE_GROUP_MISMATCH: "기관과 계좌의 자기체결 방지 그룹이 다릅니다.",
    ROLE_NON_CONTRACT_OPEN_ORDER: "전용 계정에 계약 소유가 아닌 미체결 주문이 있습니다.",
    ROLE_UNMANAGED_HOLDING: "전용 계정에 계약 종목 외 보유주식이 있습니다.",
    CONTRACT_QUANTITY_MISMATCH: "계약 내부 유통·잠금·외부·인수 수량 합계가 맞지 않습니다.",
    INSTRUMENT_QUANTITY_UNDERFLOW: "현재 종목 발행·유통주식이 최초 계약 배정량보다 작습니다.",
    ALLOCATION_LEDGER_MISMATCH: "최초 배정원장의 유통·잠금 합계가 계약과 다릅니다.",
    HOLDING_SUPPLY_MISMATCH: "현재 전체 계좌 보유수량 합계가 종목 발행주식과 일치하지 않습니다.",
    HOLDING_RESERVATION_INVALID: "보유수량 또는 예약수량에 음수·초과 값이 있습니다.",
  };
  return labels[issue] ?? issue;
}
