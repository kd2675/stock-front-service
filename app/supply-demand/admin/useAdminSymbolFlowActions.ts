import { getAdminUnknownErrorMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";

export function useAdminSymbolFlowActions({
  refetchSymbolFlows,
  requireAdminToken,
  setMessage,
}: {
  refetchSymbolFlows: () => Promise<{ error: unknown; isError: boolean }>;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const loadAllAdminSymbolFlows = async () => {
    const token = await requireAdminToken("관리자 로그인 후 전체 종목 흐름을 조회할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await refetchSymbolFlows();
    if (result.isError) {
      setMessage(getAdminUnknownErrorMessage(result.error, "전체 종목 흐름 조회에 실패했습니다."));
    }
  };

  return {
    loadAllAdminSymbolFlows,
  };
}
