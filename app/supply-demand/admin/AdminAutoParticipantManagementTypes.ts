import type { PaginationWindow } from "@/app/supply-demand/admin/AdminPaginationHelpers";
import type { AutoParticipant, AutoParticipantOverview } from "@/app/types/stock";
import type { AutoParticipantProfileType } from "@/app/types/stock";

export type ParticipantStatusFilter = "ALL" | "ENABLED" | "DISABLED";
export type ParticipantProfileFilter = "ALL" | AutoParticipantProfileType;
export type AutoGenerateProfileMode = "ROTATE" | "SINGLE";

export type AutoParticipantListControls = {
  search: string;
  statusFilter: ParticipantStatusFilter;
  profileFilter: ParticipantProfileFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ParticipantStatusFilter) => void;
  onProfileFilterChange: (value: ParticipantProfileFilter) => void;
  onPageChange: (updater: (page: number) => number) => void;
};

export type AutoParticipantListView = {
  controls: AutoParticipantListControls;
  filteredCount: number;
  totalCount: number;
  pagination: PaginationWindow;
  visibleParticipants: AutoParticipant[];
  overviewByUserKey: ReadonlyMap<string, AutoParticipantOverview>;
  overviewsFetching: boolean;
};
