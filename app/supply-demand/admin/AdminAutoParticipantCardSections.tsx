import { useMemo } from "react";

import { formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { formatCount, formatDateTime, formatInteger, formatNumber, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { ParticipantInfoItem, ParticipantMetricLine } from "@/app/supply-demand/admin/AdminMetricCards";
import {
  formatParticipantRecurringCash,
  resolveAutoParticipantHoldingPreview,
} from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import type { AutoParticipant, AutoParticipantOverview } from "@/app/types/stock";

const EMPTY_AUTO_PARTICIPANT_HOLDINGS: AutoParticipantOverview["holdings"] = [];

export function AutoParticipantProfileSection({ participant }: { participant: AutoParticipant }) {
  return (
    <ParticipantInfoItem label="운용 프로필">
      <p className="font-black text-white">{formatAutoParticipantProfile(participant.profileType)}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">{formatAutoParticipantProfileDescription(participant.profileType)}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-admin-muted">
        프로필 V3 ·{" "}
        {formatAutoParticipantProfileBehavior(participant.profileType)}
      </p>
      <p className="mt-2 text-[11px] font-black text-admin-accent">
        프로필 행동 {participant.behaviorModelVersion} · 실주문
      </p>
      <div className="mt-3 grid gap-1 border-t border-white/10 pt-2 text-xs font-bold leading-5 text-stock-subtle">
        <p>정기 자금 {formatParticipantRecurringCash(participant)}</p>
        <p>월급 매수 예산 {formatWon(participant.paydayAvailableBudget)}</p>
        <p>배당 재투자 예산 {formatWon(participant.dividendAvailableBudget)}</p>
        <p>주문 예약 예산 {formatWon(participant.fundingReservedAmount)}</p>
        <p>수정 {formatDateTime(participant.updatedAt)}</p>
      </div>
    </ParticipantInfoItem>
  );
}

export function AutoParticipantAssetSection({
  participant,
  overview,
  overviewLoading,
}: {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  overviewLoading: boolean;
}) {
  return (
    <ParticipantInfoItem label="자산과 손익">
      {overview ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <ParticipantMetricLine label="가용 현금" value={formatWon(overview.availableCash)} valueClassName="text-admin-accent" />
          <ParticipantMetricLine label="추정 총자산" value={formatWon(overview.estimatedTotalAsset)} valueClassName="text-white" />
          <ParticipantMetricLine label="예약 매수금" value={formatWon(overview.reservedBuyCash)} />
          <ParticipantMetricLine label="순입금" value={formatWon(overview.netCashFlow)} />
          <ParticipantMetricLine label="손익" value={formatWon(overview.totalProfit)} valueClassName={resolveProfitTextClass(overview.totalProfit)} />
          <ParticipantMetricLine
            label="계좌 순입금 대비 수익률"
            value={overview.returnRate === null ? "—" : formatSignedPercent(overview.returnRate)}
            valueClassName={resolveProfitTextClass(overview.returnRate)}
          />
        </div>
      ) : (
        <div className="grid gap-1 text-sm font-bold leading-5 text-stock-subtle">
          <p className="text-white tabular-nums">{participant.cashBalance == null ? "계좌 미개설" : formatWon(participant.cashBalance)}</p>
          <p>{overviewLoading ? "계좌/자산 현황 조회 중" : "자산 상세 현황 없음"}</p>
        </div>
      )}
    </ParticipantInfoItem>
  );
}

export function AutoParticipantHoldingSection({
  participant,
  overview,
  overviewLoading,
}: {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  overviewLoading: boolean;
}) {
  const holdings = overview?.holdings ?? EMPTY_AUTO_PARTICIPANT_HOLDINGS;
  const holdingPreview = useMemo(() => resolveAutoParticipantHoldingPreview(holdings), [holdings]);

  return (
    <ParticipantInfoItem label="보유와 평가">
      {overview ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <ParticipantMetricLine label="보유 수량" value={`${formatNumber(overview.totalHoldingQuantity)}주`} valueClassName="text-white" />
            <ParticipantMetricLine label="보유 종목" value={formatCount(overview.holdingCount, "종목")} />
            <ParticipantMetricLine label="평가액" value={formatWon(overview.holdingMarketValue)} valueClassName="text-admin-accent" />
            <ParticipantMetricLine label="전략" value={`${formatInteger(overview.enabledStrategyCount)} / ${formatInteger(overview.strategyCount)}`} />
            <ParticipantMetricLine label="상태 추적 종목" value={formatCount(participant.trackedPositionCount, "종목")} />
            <ParticipantMetricLine label="평균 보유 거래일" value={`${formatNumber(participant.averageHoldingTradingDays)}일`} />
            <ParticipantMetricLine label="누적 물타기 회차" value={formatCount(participant.averageDownRoundCount, "회")} />
            <ParticipantMetricLine label="사용한 전용 예산" value={formatWon(participant.fundingSpentAmount)} />
          </div>
          {holdingPreview.length ? (
            <div className="mt-3 grid gap-0.5 border-t border-white/10 pt-2 text-xs font-bold leading-5 text-admin-muted">
              {holdingPreview.map((line) => (
                <p key={line} className="truncate" title={line}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="mt-3 border-t border-white/10 pt-2 text-xs font-bold text-admin-quiet">보유 종목 없음</p>
          )}
        </>
      ) : (
        <p className="font-bold text-stock-subtle">{overviewLoading ? "보유 종목 조회 중" : "보유 현황 없음"}</p>
      )}
    </ParticipantInfoItem>
  );
}

export function AutoParticipantActivitySection({
  overview,
  overviewLoading,
}: {
  overview: AutoParticipantOverview | null;
  overviewLoading: boolean;
}) {
  return (
    <ParticipantInfoItem label="거래와 활동">
      {overview ? (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <ParticipantMetricLine label="2시간 매수" value={`${formatNumber(overview.todayBuyQuantity)}주`} valueClassName="text-admin-success" />
            <ParticipantMetricLine label="2시간 매도" value={`${formatNumber(overview.todaySellQuantity)}주`} valueClassName="text-admin-danger" />
            <ParticipantMetricLine label="2시간 체결" value={formatCount(overview.todayExecutionCount, "건")} />
            <ParticipantMetricLine label="대기 주문" value={formatCount(overview.openOrderCount, "건")} />
            <ParticipantMetricLine label="2시간 거래대금" value={formatWon(overview.todayGrossAmount)} valueClassName="text-white" />
          </div>
          <div className="grid gap-0.5 border-t border-white/10 pt-2 text-xs font-bold leading-5 text-stock-subtle">
            <p>최근 주문 {formatDateTime(overview.lastOrderAt)}</p>
            <p>최근 체결 {formatDateTime(overview.lastExecutionAt)}</p>
          </div>
        </div>
      ) : (
        <p className="font-bold text-stock-subtle">{overviewLoading ? "거래 현황 조회 중" : "거래 현황 없음"}</p>
      )}
    </ParticipantInfoItem>
  );
}

function resolveProfitTextClass(value: number | null) {
  if (value === null) {
    return "text-stock-subtle";
  }
  if (value > 0) {
    return "text-admin-success";
  }
  if (value < 0) {
    return "text-admin-danger";
  }
  return "text-white";
}
