import AutoSignalGuide from "@/app/supply-demand/admin/AdminSignalGuide";
import { AdminAutoParticipantV4OperationsPanel } from "@/app/supply-demand/admin/AdminAutoParticipantV4OperationsPanel";
import { AdminProfileConfigPanel } from "@/app/supply-demand/admin/AdminProfileConfigPanel";
import type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type { AutoParticipantProfileConfig, AutoParticipantProfileType } from "@/app/types/stock";

type AdminProfilesSectionProps = {
  accessToken: string | null;
  profileConfigs: AutoParticipantProfileConfig[];
  editingProfileType: AutoParticipantProfileType | null;
  selectedProfileConfig: AutoParticipantProfileConfig | null;
  draft: ProfileConfigDraft;
  draftSetters: ProfileConfigDraftSetters;
  saving: boolean;
  onSelectProfile: (profileType: string) => void;
  onSubmit: () => void;
  onClearSelection: () => void;
};

export function AdminProfilesSection({
  accessToken,
  profileConfigs,
  editingProfileType,
  selectedProfileConfig,
  draft,
  draftSetters,
  saving,
  onSelectProfile,
  onSubmit,
  onClearSelection,
}: AdminProfilesSectionProps) {
  return (
    <>
      <AdminAutoParticipantV4OperationsPanel accessToken={accessToken} />
      <AutoSignalGuide />

      <AdminProfileConfigPanel
        profileConfigs={profileConfigs}
        editingProfileType={editingProfileType}
        selectedProfileConfig={selectedProfileConfig}
        draft={draft}
        draftSetters={draftSetters}
        saving={saving}
        onSelectProfile={onSelectProfile}
        onSubmit={onSubmit}
        onClearSelection={onClearSelection}
      />
    </>
  );
}
