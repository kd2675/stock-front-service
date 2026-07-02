import { useMemo } from "react";

import {
  resolvePaginatedItems,
  resolvePaginationWindow,
  type PaginationWindow,
} from "@/app/supply-demand/admin/AdminPaginationHelpers";

type AdminPaginatedItems<T> = {
  pagination: PaginationWindow;
  visibleItems: T[];
};

export function useAdminPaginatedItems<T>(items: T[], page: number, pageSize: number): AdminPaginatedItems<T> {
  const pagination = useMemo(
    () => resolvePaginationWindow(items.length, page, pageSize),
    [items.length, page, pageSize],
  );

  const visibleItems = useMemo(
    () => resolvePaginatedItems(items, pagination, pageSize),
    [items, pageSize, pagination],
  );

  return useMemo(
    () => ({ pagination, visibleItems }),
    [pagination, visibleItems],
  );
}
