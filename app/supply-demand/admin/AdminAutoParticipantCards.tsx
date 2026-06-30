import type { Dispatch, SetStateAction } from "react";

import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import { formatDateTime, formatNumber, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect, EnabledToggleButton } from "@/app/supply-demand/admin/AdminFormControls";
import {
  formatParticipantRecurringCash,
  resolveAutoParticipantHoldingPreview,
} from "@/app/supply-demand/admin/AdminHelpers";
import { ParticipantInfoItem, ParticipantMetricLine } from "@/app/supply-demand/admin/AdminMetricCards";
import { AutoParticipantOverviewDetail } from "@/app/supply-demand/admin/AdminParticipantOverviewPanels";
import type { AutoParticipant, AutoParticipantOverview, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type AutoParticipantEditDraft = {
  displayName: string;
  profileType: AutoParticipantProfileType;
  enabled: boolean;
  recurringCashAmount: string;
  recurringCashIntervalValue: string;
  recurringCashIntervalUnit: RecurringCashIntervalUnit;
  recurringCashDisabled: boolean;
  cashAdjustmentAmount: string;
};

export type AutoParticipantEditDraftSetters = {
  setDisplayName: Dispatch<SetStateAction<string>>;
  setProfileType: Dispatch<SetStateAction<AutoParticipantProfileType>>;
  setEnabled: Dispatch<SetStateAction<boolean>>;
  setRecurringCashAmount: Dispatch<SetStateAction<string>>;
  setRecurringCashIntervalValue: Dispatch<SetStateAction<string>>;
  setRecurringCashIntervalUnit: Dispatch<SetStateAction<RecurringCashIntervalUnit>>;
  setCashAdjustmentAmount: Dispatch<SetStateAction<string>>;
};

type AdminAutoParticipantCardsProps = {
  participants: AutoParticipant[];
  overviewByUserKey: ReadonlyMap<string, AutoParticipantOverview>;
  editingUserKey: string | null;
  togglingUserKey: string | null;
  withdrawingUserKey: string | null;
  saving: boolean;
  adjustingCashType: "DEPOSIT" | "WITHDRAW" | null;
  overviewsFetching: boolean;
  draft: AutoParticipantEditDraft;
  draftSetters: AutoParticipantEditDraftSetters;
  onToggleParticipant: (participant: AutoParticipant) => void;
  onSelectParticipant: (participant: AutoParticipant) => void;
  onWithdrawParticipant: (participant: AutoParticipant) => void;
  onSubmitParticipant: () => void;
  onResetDraft: () => void;
  onAdjustCash: (adjustmentType: "DEPOSIT" | "WITHDRAW") => void;
};

export function AdminAutoParticipantCards({
  participants,
  overviewByUserKey,
  editingUserKey,
  togglingUserKey,
  withdrawingUserKey,
  saving,
  adjustingCashType,
  overviewsFetching,
  draft,
  draftSetters,
  onToggleParticipant,
  onSelectParticipant,
  onWithdrawParticipant,
  onSubmitParticipant,
  onResetDraft,
  onAdjustCash,
}: AdminAutoParticipantCardsProps) {
  if (participants.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-black/20 px-3 py-4 text-sm font-bold text-[#8b95a1]">
        조건에 맞는 자동 참여자가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {participants.map((participant) => {
        const overview = overviewByUserKey.get(participant.userKey) ?? null;
        const holdingPreview = resolveAutoParticipantHoldingPreview(overview?.holdings ?? []);
        const overviewLoading = overviewsFetching && overview === null;
        const editingThisParticipant = editingUserKey === participant.userKey;
        return (
          <article key={participant.userKey} className={["min-w-0 overflow-hidden rounded-lg border p-3", editingThisParticipant ? "border-[#3182f6]/60 bg-[#10233a]/35" : "border-white/10 bg-black/20"].join(" ")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{participant.displayName}</p>
                <p className="mt-1 break-all text-xs font-bold text-[#8b95a1]">{participant.userKey}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EnabledToggleButton
                  enabled={participant.enabled}
                  disabled={togglingUserKey === participant.userKey}
                  onToggle={() => onToggleParticipant(participant)}
                />
                <button type="button" onClick={() => onSelectParticipant(participant)} className="min-h-8 rounded-md bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onWithdrawParticipant(participant)}
                  disabled={withdrawingUserKey === participant.userKey}
                  className="min-h-8 rounded-md bg-[#3a1f1b] px-3 py-1.5 text-xs font-black text-[#ffb4a8] disabled:cursor-wait disabled:opacity-55"
                >
                  {withdrawingUserKey === participant.userKey ? "처리 중" : "탈퇴"}
                </button>
              </div>
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1.25fr_1.1fr_1.1fr]">
              <ParticipantInfoItem label="운용 프로필">
                <p className="font-black text-white">{formatAutoParticipantProfile(participant.profileType)}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">{formatAutoParticipantProfileDescription(participant.profileType)}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#b8c2cc]">{formatAutoParticipantProfileBehavior(participant.profileType)}</p>
                <div className="mt-3 grid gap-1 border-t border-white/10 pt-2 text-xs font-bold leading-5 text-[#8b95a1]">
                  <p>월급/현금 {formatParticipantRecurringCash(participant)}</p>
                  <p>수정 {formatDateTime(participant.updatedAt)}</p>
                </div>
              </ParticipantInfoItem>

              <ParticipantInfoItem label="자산과 손익">
                {overview ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <ParticipantMetricLine label="가용 현금" value={formatWon(overview.availableCash)} valueClassName="text-[#64a8ff]" />
                    <ParticipantMetricLine label="추정 총자산" value={formatWon(overview.estimatedTotalAsset)} valueClassName="text-white" />
                    <ParticipantMetricLine label="예약 매수금" value={formatWon(overview.reservedBuyCash)} />
                    <ParticipantMetricLine label="순입금" value={formatWon(overview.netCashFlow)} />
                    <ParticipantMetricLine
                      label="손익"
                      value={formatWon(overview.totalProfit)}
                      valueClassName={overview.totalProfit > 0 ? "text-[#6ee7a8]" : overview.totalProfit < 0 ? "text-[#ffb4a8]" : "text-white"}
                    />
                    <ParticipantMetricLine
                      label="수익률"
                      value={formatSignedPercent(overview.returnRate)}
                      valueClassName={overview.returnRate > 0 ? "text-[#6ee7a8]" : overview.returnRate < 0 ? "text-[#ffb4a8]" : "text-white"}
                    />
                  </div>
                ) : (
                  <div className="grid gap-1 text-sm font-bold leading-5 text-[#8b95a1]">
                    <p className="text-white tabular-nums">{participant.cashBalance == null ? "계좌 미개설" : formatWon(participant.cashBalance)}</p>
                    <p>{overviewLoading ? "계좌/자산 현황 조회 중" : "자산 상세 현황 없음"}</p>
                  </div>
                )}
              </ParticipantInfoItem>

              <ParticipantInfoItem label="보유와 평가">
                {overview ? (
                  <>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <ParticipantMetricLine label="보유 수량" value={`${formatNumber(overview.totalHoldingQuantity)}주`} valueClassName="text-white" />
                      <ParticipantMetricLine label="보유 종목" value={`${overview.holdingCount.toLocaleString("ko-KR")}종목`} />
                      <ParticipantMetricLine label="평가액" value={formatWon(overview.holdingMarketValue)} valueClassName="text-[#64a8ff]" />
                      <ParticipantMetricLine label="전략" value={`${overview.enabledStrategyCount.toLocaleString("ko-KR")} / ${overview.strategyCount.toLocaleString("ko-KR")}`} />
                    </div>
                    {holdingPreview.length ? (
                      <div className="mt-3 grid gap-0.5 border-t border-white/10 pt-2 text-xs font-bold leading-5 text-[#b8c2cc]">
                        {holdingPreview.map((line) => (
                          <p key={line} className="truncate" title={line}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 border-t border-white/10 pt-2 text-xs font-bold text-[#6f7a86]">보유 종목 없음</p>
                    )}
                  </>
                ) : (
                  <p className="font-bold text-[#8b95a1]">{overviewLoading ? "보유 종목 조회 중" : "보유 현황 없음"}</p>
                )}
              </ParticipantInfoItem>

              <ParticipantInfoItem label="거래와 활동">
                {overview ? (
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <ParticipantMetricLine label="오늘 매수" value={`${formatNumber(overview.todayBuyQuantity)}주`} valueClassName="text-[#6ee7a8]" />
                      <ParticipantMetricLine label="오늘 매도" value={`${formatNumber(overview.todaySellQuantity)}주`} valueClassName="text-[#ffb4a8]" />
                      <ParticipantMetricLine label="오늘 체결" value={`${overview.todayExecutionCount.toLocaleString("ko-KR")}건`} />
                      <ParticipantMetricLine label="대기 주문" value={`${overview.openOrderCount.toLocaleString("ko-KR")}건`} />
                      <ParticipantMetricLine label="거래대금" value={formatWon(overview.todayGrossAmount)} valueClassName="text-white" />
                    </div>
                    <div className="grid gap-0.5 border-t border-white/10 pt-2 text-xs font-bold leading-5 text-[#8b95a1]">
                      <p>최근 주문 {formatDateTime(overview.lastOrderAt)}</p>
                      <p>최근 체결 {formatDateTime(overview.lastExecutionAt)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-bold text-[#8b95a1]">{overviewLoading ? "거래 현황 조회 중" : "거래 현황 없음"}</p>
                )}
              </ParticipantInfoItem>
            </div>

            {editingThisParticipant ? (
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_0.8fr_0.9fr_0.75fr_0.75fr_auto]">
                  <DarkInput label="표시명" value={draft.displayName} onChange={draftSetters.setDisplayName} placeholder="자동 참여자 1" />
                  <DarkSelect label="심리 프로필" value={draft.profileType} onChange={(value) => draftSetters.setProfileType(value as AutoParticipantProfileType)}>
                    {AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => (
                      <option key={profile.value} value={profile.value}>{profile.label}</option>
                    ))}
                  </DarkSelect>
                  <DarkSelect label="상태" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
                    <option value="true">가동</option>
                    <option value="false">정지</option>
                  </DarkSelect>
                  <DarkInput label="개별 월급/현금" value={draft.recurringCashDisabled ? "" : draft.recurringCashAmount} onChange={draftSetters.setRecurringCashAmount} placeholder={draft.recurringCashDisabled ? "배당 이벤트만 사용" : "비우면 프로필"} disabled={draft.recurringCashDisabled} />
                  <DarkInput label="주기 값" value={draft.recurringCashDisabled ? "" : draft.recurringCashIntervalValue} onChange={draftSetters.setRecurringCashIntervalValue} placeholder={draft.recurringCashDisabled ? "-" : "0.5"} disabled={draft.recurringCashDisabled} />
                  <DarkSelect label="주기 단위" value={draft.recurringCashDisabled ? "DAY" : draft.recurringCashIntervalUnit} onChange={(value) => draftSetters.setRecurringCashIntervalUnit(value as RecurringCashIntervalUnit)} disabled={draft.recurringCashDisabled}>
                    {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </DarkSelect>
                  <div className="grid grid-cols-2 gap-2 self-end">
                    <button type="button" onClick={onSubmitParticipant} disabled={saving} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                      {saving ? "저장 중" : "저장"}
                    </button>
                    <button type="button" onClick={onResetDraft} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                      닫기
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 border-t border-white/10 pt-3 sm:grid-cols-[1.2fr_1fr_auto_auto]">
                  <div className="min-w-0 self-center">
                    <p className="text-xs font-bold text-[#8b95a1]">선택 참여자 실제 계좌</p>
                    <p className="mt-1 break-all text-sm font-black text-white">{participant.displayName} · {participant.userKey}</p>
                    <p className="mt-1 text-xs font-bold text-[#b8c2cc]">
                      {formatAutoParticipantProfile(participant.profileType)} · 현재 현금 {participant.cashBalance == null ? "계좌 미개설" : formatWon(participant.cashBalance)}
                    </p>
                  </div>
                  <DarkInput label="입금/회수 금액" value={draft.cashAdjustmentAmount} onChange={draftSetters.setCashAdjustmentAmount} placeholder="1000000" />
                  <button
                    type="button"
                    onClick={() => onAdjustCash("DEPOSIT")}
                    disabled={Boolean(adjustingCashType)}
                    className="min-h-11 self-end rounded-md bg-[#3182f6] px-3 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-55"
                  >
                    {adjustingCashType === "DEPOSIT" ? "입금 중" : "입금"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustCash("WITHDRAW")}
                    disabled={Boolean(adjustingCashType)}
                    className="min-h-11 self-end rounded-md bg-[#3a1f1b] px-3 py-3 text-sm font-black text-[#ffb4a8] disabled:cursor-wait disabled:opacity-55"
                  >
                    {adjustingCashType === "WITHDRAW" ? "회수 중" : "회수"}
                  </button>
                </div>
                {overview ? (
                  <AutoParticipantOverviewDetail overview={overview} />
                ) : (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-[#8b95a1]">
                    {overviewLoading ? "이 참여자의 계좌/보유 현황을 조회하고 있습니다." : "이 참여자의 계좌/보유 현황을 아직 조회하지 못했습니다."}
                  </div>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
