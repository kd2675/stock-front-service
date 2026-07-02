export type PaginationWindow = {
  totalPages: number;
  boundedPage: number;
  pageStart: number;
  pageEnd: number;
};

export function resolvePaginationWindow(totalCount: number, page: number, pageSize: number): PaginationWindow {
  const totalPages = Math.ceil(totalCount / pageSize);
  const boundedPage = totalPages === 0 ? 0 : Math.min(page, totalPages - 1);
  const pageStart = totalCount === 0 ? 0 : boundedPage * pageSize + 1;
  const pageEnd = Math.min(totalCount, (boundedPage + 1) * pageSize);
  return {
    totalPages,
    boundedPage,
    pageStart,
    pageEnd,
  };
}

export function resolvePaginatedItems<T>(items: T[], pagination: Pick<PaginationWindow, "boundedPage">, pageSize: number) {
  return items.slice(
    pagination.boundedPage * pageSize,
    pagination.boundedPage * pageSize + pageSize,
  );
}
