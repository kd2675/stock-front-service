"use client";

import { useQuery } from "@tanstack/react-query";

import { autoParticipantV5OperationsQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import type { AutoParticipantV5Operations } from "@/app/types/stock";

type Props = {
  accessToken: string | null;
};

export function AdminAutoParticipantV5OperationsPanel({ accessToken }: Props) {
  const operationsQuery = useQuery(
    autoParticipantV5OperationsQueryOptions(accessToken, {
      enabled: Boolean(accessToken),
    }),
  );
  const operations = operationsQuery.data;
  const codeModel = operations?.codeModel;
  const summary = operations?.dailySummary;
  const calibration = operations?.calibrationReadiness;

  return (
    <section className="mb-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-admin-accent">V5 code model</p>
          <h2 className="mt-1 text-lg font-black text-white">확률 행동 운영 상태</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
            V5는 배포 코드에 고정된 단일 행동모델입니다. 장 시작 시 생성·예약·활성화하지 않으며 어드민에서 실행값을 변경하지 않습니다.
            일일 잠재 상태, 피로도, 다음 프로필 관심 시각과 주문 메타데이터 계약을 10초마다 확인합니다.
            체결 수량은 자동참여자 계좌의 매수와 매도를 합한 계좌측 참여량입니다.
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
          {codeModel
            ? `${codeModel.behaviorModelVersion} · 배포 코드 고정`
            : "코드 모델 확인 중"}
        </span>
      </div>

      {operationsQuery.isError ? (
        <p className="mt-4 text-sm font-bold text-admin-danger">V5 운영 상태를 불러오지 못했습니다.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">
          <Metric label="행동모델" value={codeModel?.behaviorModelVersion ?? "-"} />
          <Metric label="설정 원본" value={codeModel?.configurationSource === "CODE" ? "배포 코드" : "-"} />
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
                calibration.calibrationPassed
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-200"
              }`}
            >
              {calibration.calibrationPassed ? "완료장 검증 통과" : "완료장 검증 미완성"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
            <Metric
              label="기준 완료 장"
              value={calibration.basisBusinessDate ?? "-"}
            />
            <Metric
              label="계약 / 행동모델"
              value={
                calibration.contractVersion && calibration.codeModelVersion
                  ? `c${calibration.contractVersion} / V${calibration.codeModelVersion}`
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
                완료장 검증 차단 사유
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
