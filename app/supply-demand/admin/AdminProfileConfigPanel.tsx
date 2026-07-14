import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AdminProfileConfigFormPanel } from "@/app/supply-demand/admin/AdminProfileConfigFormPanel";
import { AdminProfileConfigSummaryPanel } from "@/app/supply-demand/admin/AdminProfileConfigSummaryPanel";
import type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type { AutoParticipantProfileConfig, AutoParticipantProfileType } from "@/app/types/stock";

export type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";

export function AdminProfileConfigPanel({
  profileConfigs,
  editingProfileType,
  selectedProfileConfig,
  draft,
  draftSetters,
  saving,
  onSelectProfile,
  onSubmit,
  onClearSelection,
}: {
  profileConfigs: AutoParticipantProfileConfig[];
  editingProfileType: AutoParticipantProfileType | null;
  selectedProfileConfig: AutoParticipantProfileConfig | null;
  draft: ProfileConfigDraft;
  draftSetters: ProfileConfigDraftSetters;
  saving: boolean;
  onSelectProfile: (profileType: string) => void;
  onSubmit: () => void;
  onClearSelection: () => void;
}) {
  const isDividendReinvestorProfileSelected = selectedProfileConfig?.profileType === "DIVIDEND_REINVESTOR";

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">프로필 행동 설정</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">자동 참여자 심리 프로필별 주문 빈도, 호가 공격성, 주문 유지 시간, 수량, 보유 성향, 주기적 현금 유입을 조정합니다.</p>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
        <div className="rounded-md border border-white/10 bg-black/15 p-3">
          <DarkSelect label="프로필 선택" value={editingProfileType ?? ""} onChange={onSelectProfile}>
            <option value="">프로필을 선택하세요</option>
            {profileConfigs.map((config) => (
              <option key={config.profileType} value={config.profileType}>
                {formatAutoParticipantProfile(config.profileType)}
              </option>
            ))}
          </DarkSelect>
          <div className="mt-3 grid gap-2 text-xs font-bold text-stock-subtle">
            <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
              <span>전체 프로필</span>
              <span className="font-black text-white">{profileConfigs.length}개</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
              <span>선택 상태</span>
              <span className="font-black text-admin-accent">{selectedProfileConfig ? (selectedProfileConfig.customized ? "커스텀" : "기본값") : "미선택"}</span>
            </div>
          </div>
        </div>
        {selectedProfileConfig ? (
          <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
            <AdminProfileConfigSummaryPanel config={selectedProfileConfig} />
            <AdminProfileConfigFormPanel
              draft={draft}
              draftSetters={draftSetters}
              isDividendReinvestorProfileSelected={isDividendReinvestorProfileSelected}
              saving={saving}
              onClearSelection={onClearSelection}
              onSubmit={onSubmit}
            />
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center rounded-md border border-dashed border-white/15 bg-black/15 px-4 py-8 text-center">
            <p className="text-sm font-bold text-stock-subtle">수정할 프로필을 하나 선택하세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}
