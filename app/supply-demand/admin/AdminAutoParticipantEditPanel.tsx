import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import { formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AutoParticipantOverviewDetail } from "@/app/supply-demand/admin/AdminAutoParticipantOverviewDetail";
import type { AutoParticipantEditDraft, AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantEditTypes";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import type { AutoParticipant, AutoParticipantOverview, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export function AdminAutoParticipantEditPanel({
  adjustingCashType,
  draft,
  draftSetters,
  overview,
  overviewLoading,
  participant,
  saving,
  onAdjustCash,
  onResetDraft,
  onSubmitParticipant,
}: {
  adjustingCashType: CashAdjustmentType | null;
  draft: AutoParticipantEditDraft;
  draftSetters: AutoParticipantEditDraftSetters;
  overview: AutoParticipantOverview | null;
  overviewLoading: boolean;
  participant: AutoParticipant;
  saving: boolean;
  onAdjustCash: (adjustmentType: CashAdjustmentType) => void;
  onResetDraft: () => void;
  onSubmitParticipant: () => void;
}) {
  return (
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
  );
}
