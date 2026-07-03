import { keepPreviousData } from "@tanstack/react-query";

import { normalizeStringList } from "@/app/lib/stringLists";
import {
  type AdminFundFlowScope,
  type AutoParticipantActivityScope,
  getAdminCashFlows,
  getAdminFlowOverview,
  getAdminFundFlowSummary,
  getAdminSymbolFlows,
  getAdminUserFundFlow,
  getAutoParticipants,
  getAutoParticipantOverviews,
  getAutoParticipantProfileOverviews,
  getBatchJobRuntimeControls,
} from "@/app/lib/stock";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import {
  ADMIN_LEDGER_STALE_MS,
  ADMIN_SNAPSHOT_STALE_MS,
  USER_ACTIVITY_REFETCH_MS,
  authenticatedStockQueryOptions,
  type AuthenticatedStockQueryOptionsConfig,
} from "@/app/lib/react-query/stockQueryCore";

function adminAuthenticatedQueryOptions<TData>(
  token: string | null,
  config: AuthenticatedStockQueryOptionsConfig<TData>,
) {
  return authenticatedStockQueryOptions(token, {
    retry: 1,
    staleTime: ADMIN_SNAPSHOT_STALE_MS,
    ...config,
  });
}

function adminSnapshotQueryOptions<TData>(
  token: string | null,
  config: AuthenticatedStockQueryOptionsConfig<TData>,
) {
  return authenticatedStockQueryOptions(token, {
    refetchInterval: USER_ACTIVITY_REFETCH_MS,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_SNAPSHOT_STALE_MS,
    ...config,
  });
}

export function adminFundFlowSummaryQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    scope?: AdminFundFlowScope;
  } = {},
) {
  const scope = options.scope ?? "RECENT_SIMULATION_DAY";
  return adminAuthenticatedQueryOptions(token, {
    queryKey: stockKeys.adminFundFlowSummary({ scope }),
    request: (nextToken) => getAdminFundFlowSummary(nextToken, { scope }),
    fallbackMessage: "전체 자금 흐름을 조회하지 못했습니다.",
    enabled: options.enabled,
  });
}

export function adminFlowOverviewQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    includeFundFlow?: boolean;
    includeSymbolFlows?: boolean;
    fundFlowScope?: AdminFundFlowScope;
    symbolFlowLimit?: number;
  } = {},
) {
  const includeFundFlow = options.includeFundFlow ?? true;
  const includeSymbolFlows = options.includeSymbolFlows ?? true;
  const fundFlowScope = options.fundFlowScope ?? "RECENT_SIMULATION_DAY";
  const symbolFlowLimit = options.symbolFlowLimit;
  return adminAuthenticatedQueryOptions(token, {
    queryKey: stockKeys.adminFlowOverview({ fundFlowScope, includeFundFlow, includeSymbolFlows, symbolFlowLimit }),
    request: (nextToken) => getAdminFlowOverview(nextToken, {
      fundFlowScope,
      includeFundFlow,
      includeSymbolFlows,
      symbolFlowLimit,
    }),
    fallbackMessage: "전체 흐름을 조회하지 못했습니다.",
    enabled: options.enabled,
  });
}

export function adminSymbolFlowsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    limit?: number;
  } = {},
) {
  const limit = options.limit;
  return adminAuthenticatedQueryOptions(token, {
    queryKey: stockKeys.adminSymbolFlows({ limit }),
    request: (nextToken) => getAdminSymbolFlows(nextToken, { limit }),
    fallbackMessage: "종목별 흐름을 조회하지 못했습니다.",
    enabled: options.enabled,
  });
}

export function adminCashFlowsQueryOptions(
  token: string | null,
  page: number,
  size: number,
  options: {
    enabled?: boolean;
  } = {},
) {
  return adminAuthenticatedQueryOptions(token, {
    queryKey: stockKeys.adminCashFlows({ page, size }),
    request: (nextToken) => getAdminCashFlows(nextToken, page, size),
    fallbackMessage: "전체 현금 원장을 조회하지 못했습니다.",
    enabled: options.enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LEDGER_STALE_MS,
  });
}

export function adminUserFundFlowQueryOptions(
  token: string | null,
  userKey: string,
  options: {
    enabled?: boolean;
  } = {},
) {
  const normalizedUserKey = userKey.trim();
  return adminAuthenticatedQueryOptions(token, {
    queryKey: stockKeys.adminUserFundFlow(normalizedUserKey),
    request: (nextToken) => getAdminUserFundFlow(nextToken, normalizedUserKey),
    fallbackMessage: "유저 자금 흐름을 조회하지 못했습니다.",
    enabled: (options.enabled ?? true) && Boolean(normalizedUserKey),
    staleTime: ADMIN_LEDGER_STALE_MS,
  });
}

export function batchJobRuntimeControlsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
  } = {},
) {
  return adminAuthenticatedQueryOptions(token, {
    queryKey: stockKeys.batchJobRuntimeControls(),
    request: getBatchJobRuntimeControls,
    fallbackMessage: "배치 자동 실행 상태를 조회하지 못했습니다.",
    enabled: options.enabled,
    retry: false,
  });
}

export function autoParticipantsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    refetchIntervalMs?: number | false;
    staleTimeMs?: number;
  } = {},
) {
  return adminSnapshotQueryOptions(token, {
    queryKey: stockKeys.autoParticipants(),
    request: getAutoParticipants,
    fallbackMessage: "자동 참여자 목록을 조회하지 못했습니다.",
    enabled: options.enabled,
    refetchInterval: options.refetchIntervalMs ?? false,
    staleTime: options.staleTimeMs ?? ADMIN_SNAPSHOT_STALE_MS,
  });
}

export function autoParticipantOverviewsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    activityScope?: AutoParticipantActivityScope;
    includeHoldings?: boolean;
    refetchIntervalMs?: number | false;
    staleTimeMs?: number;
    userKeys?: string[];
  } = {},
) {
  const includeHoldings = options.includeHoldings ?? true;
  const activityScope = options.activityScope ?? "RECENT_SIMULATION_DAY";
  const normalizedUserKeys = normalizeStringList(options.userKeys, { sort: true });
  return adminSnapshotQueryOptions(token, {
    queryKey: stockKeys.autoParticipantOverviews({ activityScope, includeHoldings, userKeys: normalizedUserKeys }),
    request: (nextToken) => getAutoParticipantOverviews(nextToken, { activityScope, includeHoldings, userKeys: normalizedUserKeys }),
    fallbackMessage: "자동 참여자 현황을 조회하지 못했습니다.",
    enabled: options.enabled,
    refetchInterval: options.refetchIntervalMs ?? USER_ACTIVITY_REFETCH_MS,
    staleTime: options.staleTimeMs ?? ADMIN_SNAPSHOT_STALE_MS,
  });
}

export function autoParticipantProfileOverviewsQueryOptions(
  token: string | null,
  options: {
    enabled?: boolean;
    activityScope?: AutoParticipantActivityScope;
    profileTypes?: string[];
    refetchIntervalMs?: number | false;
    staleTimeMs?: number;
  } = {},
) {
  const activityScope = options.activityScope ?? "RECENT_SIMULATION_DAY";
  const normalizedProfileTypes = normalizeStringList(options.profileTypes, { sort: true });
  return adminSnapshotQueryOptions(token, {
    queryKey: stockKeys.autoParticipantProfileOverviews({ activityScope, profileTypes: normalizedProfileTypes }),
    request: (nextToken) => getAutoParticipantProfileOverviews(nextToken, { activityScope, profileTypes: normalizedProfileTypes }),
    fallbackMessage: "프로필별 자동 참여자 현황을 조회하지 못했습니다.",
    enabled: options.enabled,
    refetchInterval: options.refetchIntervalMs ?? false,
    staleTime: options.staleTimeMs ?? ADMIN_SNAPSHOT_STALE_MS,
  });
}
