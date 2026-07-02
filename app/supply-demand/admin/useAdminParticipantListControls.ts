import { useCallback, useState } from "react";

import type { ParticipantProfileFilter, ParticipantStatusFilter } from "@/app/supply-demand/admin/AdminAutoParticipantManagementTypes";

export function useAdminParticipantListControls() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParticipantStatusFilter>("ALL");
  const [profileFilter, setProfileFilter] = useState<ParticipantProfileFilter>("ALL");
  const [page, setPage] = useState(0);

  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const updateStatusFilter = useCallback((value: ParticipantStatusFilter) => {
    setStatusFilter(value);
    setPage(0);
  }, []);

  const updateProfileFilter = useCallback((value: ParticipantProfileFilter) => {
    setProfileFilter(value);
    setPage(0);
  }, []);

  return {
    page,
    profileFilter,
    search,
    setPage,
    statusFilter,
    updateProfileFilter,
    updateSearch,
    updateStatusFilter,
  };
}
