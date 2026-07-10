import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { formatAccountStatus, formatCount, formatInteger, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import { formatBatchJobRunSummary } from "@/app/supply-demand/admin/AdminBatchRuntimeHelpers";
import { formatRecurringCashPolicy, type SalaryEligibilityRow } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import type { BatchJobRuntimeStatus, StockBatchJobRun } from "@/app/types/stock";

export function SalaryEligibilityPanel({
  rows,
  totalCount,
  pageStart,
  pageEnd,
  currentPage,
  totalPages,
  receivableCount,
  policyCount,
  accountCheckCount,
  excludedCount,
  loading,
  error,
  runtimeControl,
  running,
  lastRun,
  onPageChange,
  onRun,
}: {
  rows: SalaryEligibilityRow[];
  totalCount: number;
  pageStart: number;
  pageEnd: number;
  currentPage: number;
  totalPages: number;
  receivableCount: number;
  policyCount: number;
  accountCheckCount: number;
  excludedCount: number;
  loading: boolean;
  error: boolean;
  runtimeControl: BatchJobRuntimeStatus | null;
  running: boolean;
  lastRun: StockBatchJobRun | null;
  onPageChange: (page: number) => void;
  onRun: () => void;
}) {
  const automaticCashFlowEnabled = runtimeControl?.effectiveEnabled ?? true;
  const manualRunDisabled = running || automaticCashFlowEnabled;
  const manualRunLabel = running
    ? "지급 실행 중"
    : automaticCashFlowEnabled
      ? "자동 지급 ON"
      : "수동 월급 지급";

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">월급 지급 대상</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">수동 지급과 자동 지급 모두 가동 자동참여자, 유효한 월급 정책, ACTIVE 계좌 조건을 만족해야 실제 입금됩니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-md bg-[#19324a] px-2 py-1 text-xs font-black text-[#64a8ff]">
            {loading ? "계좌 상태 갱신 중" : `${formatInteger(receivableCount)}명 지급 가능`}
          </span>
          <button
            type="button"
            onClick={onRun}
            disabled={manualRunDisabled}
            className="min-h-10 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {manualRunLabel}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold text-[#8b95a1]">
        수동 지급은 자동 월급 지급이 꺼져 있을 때만 실행할 수 있습니다. 마지막 수동 실행 {lastRun ? formatBatchJobRunSummary(lastRun) : "-"}
      </p>

      {error ? (
        <p className="mt-3 rounded-md bg-[#3a1f1b] px-3 py-2 text-xs font-bold text-[#ffb4a8]">
          자동참여자 계좌 overview를 조회하지 못했습니다. 월급 정책은 표시하지만 ACTIVE 계좌 여부는 확인 필요로 남습니다.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SalaryMetric label="지급 가능" value={formatCount(receivableCount, "명")} tone="good" />
        <SalaryMetric label="월급 정책 있음" value={formatCount(policyCount, "명")} tone="neutral" />
        <SalaryMetric label="계좌 확인 필요" value={formatCount(accountCheckCount, "명")} tone="warn" />
        <SalaryMetric label="제외" value={formatCount(excludedCount, "명")} tone="muted" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2">
        <p className="text-xs font-bold text-[#8b95a1]">
          표시 {formatInteger(pageStart)}-{formatCount(pageEnd, "명")} / 전체 {formatCount(totalCount, "명")}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage <= 0}
            className="min-h-9 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-xs font-black text-[#b8c2cc]">
            {totalPages === 0 ? "0 / 0" : `${formatInteger(currentPage + 1)} / ${formatInteger(totalPages)}`}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={totalPages === 0 || currentPage >= totalPages - 1}
            className="min-h-9 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[1180px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">지급 상태</th>
              <th className="px-3 py-2">참여자</th>
              <th className="px-3 py-2">프로필</th>
              <th className="px-3 py-2">지급 기준</th>
              <th className="px-3 py-2">월급/주기</th>
              <th className="px-3 py-2">계좌</th>
              <th className="px-3 py-2">현재 현금</th>
              <th className="px-3 py-2">제외 사유</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={row.participant.userKey} className={row.canReceive ? "bg-[#132019]/35" : undefined}>
                <td className="px-3 py-2">
                  <span className={[
                    "inline-flex rounded-md px-2 py-1 text-xs font-black",
                    row.canReceive ? "bg-[#12351f] text-[#7bd88f]" : "bg-white/10 text-[#b8c2cc]",
                  ].join(" ")}>
                    {row.canReceive ? "지급 가능" : "제외"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <p className="font-black text-white">{row.participant.displayName}</p>
                  <p className="mt-0.5 break-all text-xs font-bold text-[#8b95a1]">{row.participant.userKey}</p>
                </td>
                <td className="px-3 py-2">
                  <p className="font-black text-white">{formatAutoParticipantProfile(row.participant.profileType)}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{row.participant.enabled ? "참여자 가동" : "참여자 정지"}</p>
                </td>
                <td className="px-3 py-2">
                  <p className="font-black text-white">{row.recurringPolicy.sourceLabel}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{row.recurringPolicy.source === "PARTICIPANT" ? "프로필보다 우선" : "개별 설정 비움"}</p>
                </td>
                <td className="px-3 py-2 font-bold text-[#b8c2cc]">{formatRecurringCashPolicy(row.recurringPolicy)}</td>
                <td className="px-3 py-2">
                  <p className="font-black text-white">{formatAccountStatus(row.accountStatus)}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">계좌 ID {row.overview?.accountId ?? row.participant.accountId ?? "-"}</p>
                </td>
                <td className="px-3 py-2 tabular-nums">{row.overview ? formatWon(row.overview.availableCash) : row.participant.cashBalance == null ? "-" : formatWon(row.participant.cashBalance)}</td>
                <td className="px-3 py-2 text-xs font-bold leading-5 text-[#b8c2cc]">{row.blockers.length > 0 ? row.blockers.join(" / ") : "조건 충족"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-[#8b95a1]">등록된 자동 참여자가 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
