import { getAdminTotalAssetHistory } from "@/app/lib/stock-api/admin";
import { unwrapStockRequest } from "@/app/lib/react-query/stockResult";
import { getAdminUnknownErrorMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AdminTotalAssetHistoryPage } from "@/app/types/stock";

export function useAdminTotalAssetHistoryActions({
  requireAdminToken,
  setMessage,
}: {
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const loadAdminTotalAssetHistory = async (page: number): Promise<AdminTotalAssetHistoryPage | null> => {
    const token = await requireAdminToken("관리자 로그인 후 전체 총자산 변화를 조회할 수 있습니다.");
    if (!token) {
      return null;
    }
    try {
      return await unwrapStockRequest(
        getAdminTotalAssetHistory(token, page),
        "전체 총자산 변화 조회에 실패했습니다.",
      );
    } catch (error) {
      setMessage(getAdminUnknownErrorMessage(error, "전체 총자산 변화 조회에 실패했습니다."));
      return null;
    }
  };

  return {
    loadAdminTotalAssetHistory,
  };
}
