import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";

export function buildAdminEodContentProps({
  actions,
  queries,
}: AdminPageContentBuilderContext): NonNullable<AdminPageContentProps["eodProps"]> {
  const query = queries.eodOperationsOverviewQuery;
  return {
    error: query.isError,
    loading: query.isPending,
    overview: query.data ?? null,
    refreshing: query.isFetching,
    onRefresh: () => void query.refetch(),
    onRetryFailedPhase: (cycleId) => void actions.retryFailedEodPhase(cycleId),
    retryingCycleId: actions.retryingEodCycleId,
  };
}
