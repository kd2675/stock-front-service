"use client";

import DataTableViewport from "@/app/components/DataTableViewport";
import {
  formatCount,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMiniMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import { formatMarketRoleCode } from "@/app/supply-demand/admin/adminMarketRoleFormatters";
import type { SystemCustodyOverview } from "@/app/types/stock";

export function AdminDormantAssetsPanel({
  custodyOverview,
  loading,
  error,
  onRefresh,
}: {
  custodyOverview: SystemCustodyOverview | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  const totals = custodyOverview?.accounts.reduce(
    (result, account) => ({
      cash: result.cash + account.cashBalance,
      quantity: result.quantity + account.holdings.reduce(
        (sum, holding) => sum + holding.quantity,
        0,
      ),
      marketValue: result.marketValue + account.holdings.reduce(
        (sum, holding) => sum + holding.marketValue,
        0,
      ),
    }),
    { cash: 0, quantity: 0, marketValue: 0 },
  ) ?? { cash: 0, quantity: 0, marketValue: 0 };

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">시스템 보관 자산</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-stock-subtle">
            자동참여자 개인 계좌는 관리자 조회 대상에서 제외하고, 주문을 내지 않는 시스템 보관계정의 현금과 종목별 수량만 집계합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="min-h-9 rounded-md bg-stock-surface-strong px-3 py-1.5 text-xs font-black text-stock-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "조회 중" : "새로고침"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md border border-admin-danger/25 bg-admin-danger-surface px-3 py-3 text-xs font-bold text-admin-danger">
          시스템 보관계정 원장을 불러오지 못했습니다.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <ProfileMiniMetric
          label="탈퇴 보관계정"
          value={custodyOverview
            ? `${custodyOverview.currentWithdrawalCustodyAccountCount}/${custodyOverview.recommendedWithdrawalCustodyAccountCount}개`
            : "—"}
          tone="blue"
        />
        <ProfileMiniMetric
          label="발행 보관계정"
          value={custodyOverview
            ? `${custodyOverview.currentIssuanceCustodyAccountCount}/${custodyOverview.recommendedIssuanceCustodyAccountCount}개`
            : "—"}
          tone="blue"
        />
        <ProfileMiniMetric
          label="발행 종목당 권장"
          value={custodyOverview ? `${custodyOverview.recommendedIssuanceCustodyAccountsPerSymbol}개` : "—"}
          tone="muted"
        />
        <ProfileMiniMetric label="보관 수량" value={formatCount(totals.quantity, "주")} tone="muted" />
        <ProfileMiniMetric label="보관 평가액" value={formatWon(totals.marketValue)} tone="muted" />
        <ProfileMiniMetric label="보관 현금" value={formatWon(totals.cash)} tone="muted" />
      </div>

      {custodyOverview?.accounts.length ? (
        <DataTableViewport label="시스템 보관계정 종목별 잔고" tone="dark" className="mt-3">
          <table className="min-w-[920px] w-full text-left text-xs">
            <thead className="bg-white/[0.045] text-[10px] font-black text-admin-quiet">
              <tr>
                <th className="px-3 py-2">보관 역할</th>
                <th className="px-3 py-2">계정</th>
                <th className="px-3 py-2">상태·STP</th>
                <th className="px-3 py-2">종목</th>
                <th className="px-3 py-2 text-right">수량·예약</th>
                <th className="px-3 py-2 text-right">평가액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {custodyOverview.accounts.flatMap((account) => (
                account.holdings.length > 0
                  ? account.holdings.map((holding) => (
                    <tr key={`${account.accountId}:${holding.symbol}`}>
                      <td className="px-3 py-2 font-black text-white">{account.deskCode}</td>
                      <td className="px-3 py-2">{account.accountCode ?? `#${account.accountId}`}</td>
                      <td className="px-3 py-2">
                        {formatMarketRoleCode(account.accountStatus)} · {formatMarketRoleCode(account.mappingStatus)}
                      </td>
                      <td className="px-3 py-2 font-black text-white">{holding.symbol}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(holding.quantity)}주 · 예약 {formatNumber(holding.reservedQuantity)}주
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatWon(holding.marketValue)}</td>
                    </tr>
                  ))
                  : [(
                    <tr key={`${account.accountId}:empty`}>
                      <td className="px-3 py-2 font-black text-white">{account.deskCode}</td>
                      <td className="px-3 py-2">{account.accountCode ?? `#${account.accountId}`}</td>
                      <td className="px-3 py-2">
                        {formatMarketRoleCode(account.accountStatus)} · {formatMarketRoleCode(account.mappingStatus)}
                      </td>
                      <td className="px-3 py-2 text-admin-quiet">보유 없음</td>
                      <td className="px-3 py-2 text-right">0주</td>
                      <td className="px-3 py-2 text-right">{formatWon(0)}</td>
                    </tr>
                  )]
              ))}
            </tbody>
          </table>
        </DataTableViewport>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-white/15 px-3 py-4 text-xs font-bold text-stock-subtle">
          조회된 시스템 보관계정이 없습니다.
        </p>
      )}
    </section>
  );
}
