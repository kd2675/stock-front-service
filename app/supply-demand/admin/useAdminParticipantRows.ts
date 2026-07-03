import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { autoParticipantOverviewsQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import {
  ADMIN_PARTICIPANT_DETAIL_REFETCH_MS,
} from "@/app/supply-demand/admin/AdminConstants";
import {
  buildAutoParticipantOverviewMap,
  resolveParticipantUserKeys,
} from "@/app/supply-demand/admin/AdminSelectionHelpers";
import { filterAutoParticipants } from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import { useAdminPaginatedItems } from "@/app/supply-demand/admin/useAdminPaginatedItems";
import type { AutoParticipant, AutoParticipantOverview, AutoParticipantProfileType } from "@/app/types/stock";

type AdminAccessStatus = "checking" | "allowed" | "denied";

const EMPTY_AUTO_PARTICIPANT_OVERVIEW_MAP = new Map<string, AutoParticipantOverview>();

type AdminParticipantRowsOptions = {
  accessToken: string | null;
  adminStatus: AdminAccessStatus;
  enabled: boolean;
  page: number;
  pageSize: number;
  participants: AutoParticipant[];
  profileType: "ALL" | AutoParticipantProfileType;
  search: string;
  status: "ALL" | "ENABLED" | "DISABLED";
};

export function useAdminParticipantRows(options: AdminParticipantRowsOptions) {
  const filteredParticipants = useMemo(() => (
    options.enabled
      ? filterAutoParticipants(options.participants, {
        profileType: options.profileType,
        search: options.search,
        status: options.status,
      })
      : []
  ), [options.enabled, options.participants, options.profileType, options.search, options.status]);

  const {
    pagination,
    visibleItems: visibleParticipants,
  } = useAdminPaginatedItems(filteredParticipants, options.page, options.pageSize);

  const visibleParticipantUserKeys = useMemo(
    () => resolveParticipantUserKeys(visibleParticipants),
    [visibleParticipants],
  );

  const visibleParticipantOverviewsQuery = useQuery({
    ...autoParticipantOverviewsQueryOptions(options.accessToken, {
      enabled: options.adminStatus === "allowed" && options.enabled && visibleParticipantUserKeys.length > 0,
      activityScope: "RECENT_SIMULATION_DAY",
      includeHoldings: true,
      refetchIntervalMs: ADMIN_PARTICIPANT_DETAIL_REFETCH_MS,
      userKeys: visibleParticipantUserKeys,
    }),
    select: buildAutoParticipantOverviewMap,
  });
  const visibleAutoParticipantOverviewByUserKey = visibleParticipantOverviewsQuery.data ?? EMPTY_AUTO_PARTICIPANT_OVERVIEW_MAP;

  return {
    filteredParticipants,
    pagination,
    visibleAutoParticipantOverviewByUserKey,
    visibleParticipantOverviewsQuery,
    visibleParticipants,
  };
}
