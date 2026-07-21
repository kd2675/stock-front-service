import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import type { AutoParticipantEditDraft, AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantCards";
import type { AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export function AdminAutoParticipantFormPanel({
  isEditing,
  participantUserKey,
  draft,
  draftSetters,
  saving,
  onParticipantUserKeyChange,
  onSubmitParticipant,
  onResetParticipantDraft,
}: {
  isEditing: boolean;
  participantUserKey: string;
  draft: AutoParticipantEditDraft;
  draftSetters: AutoParticipantEditDraftSetters;
  saving: boolean;
  onParticipantUserKeyChange: (value: string) => void;
  onSubmitParticipant: () => void;
  onResetParticipantDraft: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">자동 참여자</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            {isEditing
              ? "선택한 참여자의 프로필과 가동 상태를 수정 중입니다. 새 참여자는 신규 등록으로 전환해 입력합니다."
              : "참여자 등록은 프로필과 가동 상태만 저장하고, 운용 현금은 선택 후 입금/회수로 조정합니다."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <button type="button" onClick={onResetParticipantDraft} className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white">
              신규 등록
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.2fr_1.1fr_0.8fr_0.9fr_0.75fr_0.75fr_auto]">
        <DarkInput label="참여자 키" value={participantUserKey} onChange={onParticipantUserKeyChange} placeholder="stock-auto-001" disabled={isEditing} />
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
        <DarkInput label="개별 정기 자금" value={draft.recurringCashDisabled ? "" : draft.recurringCashAmount} onChange={draftSetters.setRecurringCashAmount} placeholder={draft.recurringCashDisabled ? "배당 이벤트만 사용" : "비우면 프로필"} disabled={draft.recurringCashDisabled} />
        <DarkInput label="주기 값" value={draft.recurringCashDisabled ? "" : draft.recurringCashIntervalValue} onChange={draftSetters.setRecurringCashIntervalValue} placeholder={draft.recurringCashDisabled ? "-" : "0.5"} disabled={draft.recurringCashDisabled} />
        <DarkSelect label="주기 단위" value={draft.recurringCashDisabled ? "DAY" : draft.recurringCashIntervalUnit} onChange={(value) => draftSetters.setRecurringCashIntervalUnit(value as RecurringCashIntervalUnit)} disabled={draft.recurringCashDisabled}>
          {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </DarkSelect>
        <button type="button" onClick={onSubmitParticipant} disabled={saving} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-admin-canvas disabled:opacity-50 sm:col-span-2 lg:col-span-1">
          {saving ? "저장 중" : isEditing ? "상태 저장" : "등록"}
        </button>
      </div>

      <div className="mt-3 rounded-md bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-admin-muted">
        <span className="text-white">{formatAutoParticipantProfile(draft.profileType)}</span>
        <span className="mx-2 text-[#5a6572]">/</span>
        <span>{formatAutoParticipantProfileDescription(draft.profileType)}</span>
        <span className="mx-2 text-[#5a6572]">/</span>
        <span>{formatAutoParticipantProfileBehavior(draft.profileType)}</span>
      </div>
    </>
  );
}
