import { useMemo, useState } from "react";

import { ADMIN_SALARY_PAGE_SIZE } from "@/app/supply-demand/admin/AdminConstants";
import {
  resolveSalaryEligibilityRows,
  summarizeSalaryEligibilityRows,
  type SalaryEligibilityRow,
} from "@/app/supply-demand/admin/AdminParticipantPolicyHelpers";
import type { PaginationWindow } from "@/app/supply-demand/admin/AdminPaginationHelpers";
import { useAdminPaginatedItems } from "@/app/supply-demand/admin/useAdminPaginatedItems";
import type { AutoParticipant, AutoParticipantProfileConfig, AutoParticipantProfileType } from "@/app/types/stock";

export type AdminSalaryEligibilityRowsState = {
  page: number;
  pagination: PaginationWindow;
  rows: SalaryEligibilityRow[];
  setPage: (page: number) => void;
  summary: ReturnType<typeof summarizeSalaryEligibilityRows>;
  visibleRows: SalaryEligibilityRow[];
};

export function useAdminSalaryEligibilityRows({
  enabled,
  participants,
  profileConfigByType,
}: {
  enabled: boolean;
  participants: AutoParticipant[];
  profileConfigByType: Map<AutoParticipantProfileType, AutoParticipantProfileConfig>;
}): AdminSalaryEligibilityRowsState {
  const [page, setPage] = useState(0);

  const rows = useMemo(() => (
    enabled
      ? resolveSalaryEligibilityRows(participants, profileConfigByType, new Map())
      : []
  ), [enabled, participants, profileConfigByType]);

  const summary = useMemo(
    () => summarizeSalaryEligibilityRows(rows),
    [rows],
  );

  const {
    pagination,
    visibleItems,
  } = useAdminPaginatedItems(rows, page, ADMIN_SALARY_PAGE_SIZE);

  return {
    page,
    pagination,
    rows,
    setPage,
    summary,
    visibleRows: visibleItems,
  };
}
