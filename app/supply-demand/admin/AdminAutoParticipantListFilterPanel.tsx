import { AUTO_PARTICIPANT_PROFILE_OPTIONS } from "@/app/lib/autoParticipantProfiles";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { formatCount, formatInteger } from "@/app/supply-demand/admin/AdminFormatters";
import type { AutoParticipantListControls, AutoParticipantListView, ParticipantProfileFilter, ParticipantStatusFilter } from "@/app/supply-demand/admin/AdminAutoParticipantManagementTypes";

type AdminAutoParticipantListFilterPanelProps = {
  controls: AutoParticipantListControls;
  list: Pick<AutoParticipantListView, "filteredCount" | "totalCount" | "pagination">;
};

export function AdminAutoParticipantListFilterPanel({
  controls,
  list,
}: AdminAutoParticipantListFilterPanelProps) {
  return (
    <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 rounded-md border border-white/10 bg-black/20 p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
      <DarkInput
        label="참여자 검색"
        value={controls.search}
        onChange={controls.onSearchChange}
        placeholder="표시명 또는 userKey"
      />
      <DarkSelect
        label="상태 필터"
        value={controls.statusFilter}
        onChange={(value) => controls.onStatusFilterChange(value as ParticipantStatusFilter)}
      >
        <option value="ALL">전체</option>
        <option value="ENABLED">가동</option>
        <option value="DISABLED">정지</option>
      </DarkSelect>
      <DarkSelect
        label="프로필 필터"
        value={controls.profileFilter}
        onChange={(value) => controls.onProfileFilterChange(value as ParticipantProfileFilter)}
      >
        <option value="ALL">전체 프로필</option>
        {AUTO_PARTICIPANT_PROFILE_OPTIONS.map((profile) => (
          <option key={profile.value} value={profile.value}>{profile.label}</option>
        ))}
      </DarkSelect>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#8b95a1] sm:col-span-3">
        <p>
          표시 {formatCount(list.filteredCount, "명")} / 전체 {formatCount(list.totalCount, "명")}
          {list.filteredCount > 0 ? ` · 현재 ${formatInteger(list.pagination.pageStart)}-${formatInteger(list.pagination.pageEnd)}` : ""}
        </p>
        {list.pagination.totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => controls.onPageChange((page) => Math.max(0, page - 1))}
              disabled={list.pagination.boundedPage === 0}
              className="min-h-8 rounded-md bg-white/10 px-3 py-1.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <span className="tabular-nums text-[#b8c2cc]">
              {formatInteger(list.pagination.boundedPage + 1)} / {formatInteger(list.pagination.totalPages)}
            </span>
            <button
              type="button"
              onClick={() => controls.onPageChange((page) => Math.min(list.pagination.totalPages - 1, page + 1))}
              disabled={list.pagination.boundedPage >= list.pagination.totalPages - 1}
              className="min-h-8 rounded-md bg-white/10 px-3 py-1.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
