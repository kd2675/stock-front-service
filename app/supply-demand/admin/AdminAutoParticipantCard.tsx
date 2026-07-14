import { memo } from "react";

import { AdminAutoParticipantEditPanel } from "@/app/supply-demand/admin/AdminAutoParticipantEditPanel";
import {
  AutoParticipantActivitySection,
  AutoParticipantAssetSection,
  AutoParticipantHoldingSection,
  AutoParticipantProfileSection,
} from "@/app/supply-demand/admin/AdminAutoParticipantCardSections";
import type { AutoParticipantEditDraft, AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantEditTypes";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import { EnabledToggleButton } from "@/app/supply-demand/admin/AdminFormControls";
import type { AutoParticipant, AutoParticipantOverview } from "@/app/types/stock";

type AdminAutoParticipantCardProps = {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  editing: boolean;
  toggling: boolean;
  withdrawing: boolean;
  saving: boolean;
  adjustingCashType: CashAdjustmentType | null;
  overviewLoading: boolean;
  draft: AutoParticipantEditDraft | null;
  draftSetters: AutoParticipantEditDraftSetters | null;
  onToggleParticipant: (participant: AutoParticipant) => void;
  onSelectParticipant: (participant: AutoParticipant) => void;
  onWithdrawParticipant: (participant: AutoParticipant) => void;
  onSubmitParticipant: () => void;
  onResetDraft: () => void;
  onAdjustCash: (adjustmentType: CashAdjustmentType) => void;
};

export const AdminAutoParticipantCard = memo(function AdminAutoParticipantCard({
  participant,
  overview,
  editing,
  toggling,
  withdrawing,
  saving,
  adjustingCashType,
  overviewLoading,
  draft,
  draftSetters,
  onToggleParticipant,
  onSelectParticipant,
  onWithdrawParticipant,
  onSubmitParticipant,
  onResetDraft,
  onAdjustCash,
}: AdminAutoParticipantCardProps) {
  return (
    <article className={["min-w-0 overflow-hidden rounded-lg border p-3", editing ? "border-stock-accent/60 bg-[#10233a]/35" : "border-white/10 bg-black/20"].join(" ")}>
      <AutoParticipantCardHeader
        participant={participant}
        toggling={toggling}
        withdrawing={withdrawing}
        onToggleParticipant={onToggleParticipant}
        onSelectParticipant={onSelectParticipant}
        onWithdrawParticipant={onWithdrawParticipant}
      />

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1.25fr_1.1fr_1.1fr]">
        <AutoParticipantProfileSection participant={participant} />
        <AutoParticipantAssetSection participant={participant} overview={overview} overviewLoading={overviewLoading} />
        <AutoParticipantHoldingSection overview={overview} overviewLoading={overviewLoading} />
        <AutoParticipantActivitySection overview={overview} overviewLoading={overviewLoading} />
      </div>

      {editing && draft !== null && draftSetters !== null ? (
        <AdminAutoParticipantEditPanel
          adjustingCashType={adjustingCashType}
          draft={draft}
          draftSetters={draftSetters}
          overview={overview}
          overviewLoading={overviewLoading}
          participant={participant}
          saving={saving}
          onAdjustCash={onAdjustCash}
          onResetDraft={onResetDraft}
          onSubmitParticipant={onSubmitParticipant}
        />
      ) : null}
    </article>
  );
});

function AutoParticipantCardHeader({
  participant,
  toggling,
  withdrawing,
  onToggleParticipant,
  onSelectParticipant,
  onWithdrawParticipant,
}: {
  participant: AutoParticipant;
  toggling: boolean;
  withdrawing: boolean;
  onToggleParticipant: (participant: AutoParticipant) => void;
  onSelectParticipant: (participant: AutoParticipant) => void;
  onWithdrawParticipant: (participant: AutoParticipant) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{participant.displayName}</p>
        <p className="mt-1 break-all text-xs font-bold text-stock-subtle">{participant.userKey}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <EnabledToggleButton enabled={participant.enabled} disabled={toggling} onToggle={() => onToggleParticipant(participant)} />
        <button type="button" onClick={() => onSelectParticipant(participant)} className="min-h-9 rounded-md bg-white/10 px-3 py-1.5 text-xs font-black text-white">
          수정
        </button>
        <button
          type="button"
          onClick={() => onWithdrawParticipant(participant)}
          disabled={withdrawing}
          className="min-h-9 rounded-md bg-admin-danger-surface px-3 py-1.5 text-xs font-black text-admin-danger disabled:cursor-wait disabled:opacity-55"
        >
          {withdrawing ? "처리 중" : "탈퇴"}
        </button>
      </div>
    </div>
  );
}
