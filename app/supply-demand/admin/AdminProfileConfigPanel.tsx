import { useMemo, useState } from "react";

import { formatAutoParticipantProfile, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
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
  const [profileSearch, setProfileSearch] = useState("");
  const isDividendReinvestorProfileSelected = selectedProfileConfig?.profileType === "DIVIDEND_REINVESTOR";
  const visibleProfileConfigs = useMemo(() => {
    const keyword = profileSearch.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return profileConfigs;
    return profileConfigs.filter((config) => {
      const label = formatAutoParticipantProfile(config.profileType);
      const description = formatAutoParticipantProfileDescription(config.profileType);
      return `${label} ${description} ${config.profileType}`.toLocaleLowerCase("ko-KR").includes(keyword);
    });
  }, [profileConfigs, profileSearch]);

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">프로필 행동 설정</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">자동 참여자 심리 프로필별 주문 빈도, 가격 압력 민감도, 호가 공격성, 주문 유지 시간, 수량, 보유 성향, 주기적 현금 유입을 조정합니다.</p>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-black/15 p-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
          <DarkInput label="프로필 검색" value={profileSearch} onChange={setProfileSearch} placeholder="이름·성향·영문 코드" />
          <DarkSelect label="빠른 선택" value={editingProfileType ?? ""} onChange={onSelectProfile}>
            <option value="">프로필을 선택하세요</option>
            {profileConfigs.map((config) => (
              <option key={config.profileType} value={config.profileType}>
                {formatAutoParticipantProfile(config.profileType)}
              </option>
            ))}
          </DarkSelect>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-stock-subtle">
          <p>검색 결과 {visibleProfileConfigs.length}개 / 전체 {profileConfigs.length}개</p>
          <p>선택 상태 <span className="ml-1 font-black text-admin-accent">{selectedProfileConfig ? (selectedProfileConfig.customized ? "커스텀" : "기본값") : "미선택"}</span></p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProfileConfigs.map((config) => {
            const selected = config.profileType === editingProfileType;
            return (
              <button
                key={config.profileType}
                type="button"
                onClick={() => onSelectProfile(config.profileType)}
                className={[
                  "min-w-0 rounded-md border px-3 py-3 text-left transition",
                  selected ? "border-admin-accent/50 bg-admin-accent-surface" : "border-white/10 bg-white/[0.025] hover:border-white/20",
                ].join(" ")}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-black text-white">{formatAutoParticipantProfile(config.profileType)}</span>
                  <span className="shrink-0 rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-admin-muted">{config.customized ? "커스텀" : "기본"}</span>
                </span>
                <span className="mt-1 block text-xs font-bold leading-5 text-stock-subtle">{formatAutoParticipantProfileDescription(config.profileType)}</span>
              </button>
            );
          })}
          {visibleProfileConfigs.length === 0 ? <p className="rounded-md border border-dashed border-white/15 px-3 py-4 text-sm font-bold text-stock-subtle sm:col-span-2 xl:col-span-3">검색 조건에 맞는 프로필이 없습니다.</p> : null}
        </div>
      </div>

      <div className="mt-4 min-w-0">
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
