import { queryOptions, type QueryKey, type QueryObserverOptions } from "@tanstack/react-query";

import type { ApiResult } from "@/app/lib/api";
import { unwrapStockRequest } from "@/app/lib/react-query/stockResult";
import type { AuthStatus } from "@/app/types/auth";

export const FAST_MARKET_REFETCH_MS = 2_000;
export const USER_ACTIVITY_REFETCH_MS = 5_000;
export const ADMIN_SNAPSHOT_STALE_MS = 30_000;
export const ADMIN_LEDGER_STALE_MS = 60_000;

export function isEnabledWithToken(token: string | null, enabled = true) {
  return Boolean(token) && enabled;
}

export function isEnabledWithAuthenticatedSession({
  authStatus,
  enabled = true,
  isHydrated = true,
  token,
}: {
  authStatus: AuthStatus;
  enabled?: boolean;
  isHydrated?: boolean;
  token: string | null;
}) {
  return isHydrated && authStatus === "in" && isEnabledWithToken(token, enabled);
}

export type StockQueryOptionsConfig<TData> = {
  queryKey: QueryKey;
  request: () => Promise<ApiResult<TData>>;
  fallbackMessage: string;
  enabled?: boolean;
  refetchInterval?: number | false;
  retry?: boolean | number;
  staleTime?: number;
  placeholderData?: QueryObserverOptions<TData>["placeholderData"];
  refetchOnWindowFocus?: QueryObserverOptions<TData>["refetchOnWindowFocus"];
};

export type AuthenticatedStockQueryOptionsConfig<TData> = Omit<StockQueryOptionsConfig<TData>, "request"> & {
  request: (token: string) => Promise<ApiResult<TData>>;
};

export function stockQueryOptions<TData>(config: StockQueryOptionsConfig<TData>) {
  return queryOptions({
    queryKey: config.queryKey,
    queryFn: () => unwrapStockRequest(config.request(), config.fallbackMessage),
    enabled: config.enabled,
    refetchInterval: config.refetchInterval,
    retry: config.retry,
    staleTime: config.staleTime,
    placeholderData: config.placeholderData,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
  });
}

export function authenticatedStockQueryOptions<TData>(
  token: string | null,
  config: AuthenticatedStockQueryOptionsConfig<TData>,
) {
  return stockQueryOptions({
    ...config,
    request: () => config.request(token ?? ""),
    enabled: isEnabledWithToken(token, config.enabled),
  });
}
