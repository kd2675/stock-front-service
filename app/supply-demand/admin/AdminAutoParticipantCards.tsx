import { AdminAutoParticipantCard } from "@/app/supply-demand/admin/AdminAutoParticipantCard";
import type { AutoParticipantEditDraft, AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantEditTypes";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import type { AutoParticipant, AutoParticipantOverview } from "@/app/types/stock";

export type { AutoParticipantEditDraft, AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantEditTypes";

type AdminAutoParticipantCardsProps = {
  participants: AutoParticipant[];
  overviewByUserKey: ReadonlyMap<string, AutoParticipantOverview>;
  editingUserKey: string | null;
  togglingUserKey: string | null;
  withdrawingUserKey: string | null;
  saving: boolean;
  adjustingCashType: CashAdjustmentType | null;
  overviewsFetching: boolean;
  draft: AutoParticipantEditDraft;
  draftSetters: AutoParticipantEditDraftSetters;
  onToggleParticipant: (participant: AutoParticipant) => void;
  onSelectParticipant: (participant: AutoParticipant) => void;
  onWithdrawParticipant: (participant: AutoParticipant) => void;
  onSubmitParticipant: () => void;
  onResetDraft: () => void;
  onAdjustCash: (adjustmentType: CashAdjustmentType) => void;
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
        const overviewLoading = overviewsFetching && overview === null;
        const editingThisParticipant = editingUserKey === participant.userKey;
        return (
          <AdminAutoParticipantCard
            key={participant.userKey}
            participant={participant}
            overview={overview}
            editing={editingThisParticipant}
            toggling={togglingUserKey === participant.userKey}
            withdrawing={withdrawingUserKey === participant.userKey}
            saving={saving}
            adjustingCashType={adjustingCashType}
            overviewLoading={overviewLoading}
            draft={editingThisParticipant ? draft : null}
            draftSetters={editingThisParticipant ? draftSetters : null}
            onToggleParticipant={onToggleParticipant}
            onSelectParticipant={onSelectParticipant}
            onWithdrawParticipant={onWithdrawParticipant}
            onSubmitParticipant={onSubmitParticipant}
            onResetDraft={onResetDraft}
            onAdjustCash={onAdjustCash}
          />
        );
      })}
    </div>
  );
}
