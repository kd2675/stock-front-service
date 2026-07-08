import { getAdminSymbolFlows } from "@/app/lib/stock-api/admin";
import { unwrapStockRequest } from "@/app/lib/react-query/stockResult";
import { getAdminUnknownErrorMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AdminSymbolFlowList } from "@/app/types/stock";

export function useAdminSymbolFlowActions({
  requireAdminToken,
  setMessage,
}: {
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const loadWeeklyAdminSymbolFlows = async (dayOffset: number): Promise<AdminSymbolFlowList | null> => {
    const token = await requireAdminToken("관리자 로그인 후 최근 7일 종목 흐름을 조회할 수 있습니다.");
    if (!token) {
      return null;
    }
    try {
      return await unwrapStockRequest(
        getAdminSymbolFlows(token, {
          dailyCumulativeDayOffset: dayOffset,
          dailyCumulativeDays: 7,
          includeDailyCumulative: true,
          scope: "RECENT_SIMULATION_DAY",
        }),
        "최근 7일 종목 흐름 조회에 실패했습니다.",
      );
    } catch (error) {
      setMessage(getAdminUnknownErrorMessage(error, "최근 7일 종목 흐름 조회에 실패했습니다."));
      return null;
    }
  };

  return {
    loadWeeklyAdminSymbolFlows,
  };
}
