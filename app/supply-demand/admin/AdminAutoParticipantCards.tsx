import { useState } from "react";

import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { AdminAutoParticipantCard } from "@/app/supply-demand/admin/AdminAutoParticipantCard";
import type { AutoParticipantEditDraft, AutoParticipantEditDraftSetters } from "@/app/supply-demand/admin/AdminAutoParticipantEditTypes";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import {
  AdminEntitySelector,
  type AdminEntitySelectorItem,
} from "@/app/supply-demand/admin/AdminEntitySelector";
import { formatWon } from "@/app/supply-demand/admin/AdminFormatters";
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
  const [selectedParticipantKey, setSelectedParticipantKey] = useState("");

  if (participants.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-black/20 px-3 py-4 text-sm font-bold text-stock-subtle">
        조건에 맞는 자동 참여자가 없습니다.
      </div>
    );
  }

  const selectedParticipant = participants.find(
    (participant) => participant.userKey === selectedParticipantKey,
  ) ?? participants.find(
    (participant) => participant.userKey === editingUserKey,
  ) ?? participants[0];
  const selectedOverview = overviewByUserKey.get(selectedParticipant.userKey) ?? null;
  const selectedOverviewLoading = overviewsFetching && selectedOverview === null;
  const editingSelectedParticipant = editingUserKey === selectedParticipant.userKey;
  const selectorItems: AdminEntitySelectorItem[] = participants.map((participant) => {
    const overview = overviewByUserKey.get(participant.userKey) ?? null;
    return {
      key: participant.userKey,
      title: participant.displayName,
      subtitle: participant.userKey,
      statusLabel: participant.enabled ? "가동" : "정지",
      statusTone: participant.enabled ? "success" : "muted",
      metricLabel: formatAutoParticipantProfile(participant.profileType),
      metricValue: overview
        ? formatWon(overview.estimatedTotalAsset)
        : formatWon(participant.cashBalance ?? 0),
    };
  });

  return (
    <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <AdminEntitySelector
        ariaLabel="자동 참여자 선택"
        heading="참여자 선택"
        hint={`${participants.length}명 표시`}
        mobileLabel="확인·수정할 참여자"
        items={selectorItems}
        selectedKey={selectedParticipant.userKey}
        onSelect={(key) => {
          if (editingUserKey && editingUserKey !== key) {
            onResetDraft();
          }
          setSelectedParticipantKey(key);
        }}
      />
      <div className="min-w-0">
        <AdminAutoParticipantCard
          key={selectedParticipant.userKey}
          participant={selectedParticipant}
          overview={selectedOverview}
          editing={editingSelectedParticipant}
          toggling={togglingUserKey === selectedParticipant.userKey}
          withdrawing={withdrawingUserKey === selectedParticipant.userKey}
          saving={saving}
          adjustingCashType={adjustingCashType}
          overviewLoading={selectedOverviewLoading}
          draft={editingSelectedParticipant ? draft : null}
          draftSetters={editingSelectedParticipant ? draftSetters : null}
          onToggleParticipant={onToggleParticipant}
          onSelectParticipant={onSelectParticipant}
          onWithdrawParticipant={onWithdrawParticipant}
          onSubmitParticipant={onSubmitParticipant}
          onResetDraft={onResetDraft}
          onAdjustCash={onAdjustCash}
        />
      </div>
    </div>
  );
}
