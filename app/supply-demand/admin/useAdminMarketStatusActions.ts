import { useMutation } from "@tanstack/react-query";

import { adminUpdateMarketStatusMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { MarketSessionStatus } from "@/app/types/stock";

export function useAdminMarketStatusActions({
  reloadOrderBookMarketState,
  requireAdminToken,
  setMessage,
}: {
  reloadOrderBookMarketState: () => void;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const marketStatusMutation = useMutation(adminUpdateMarketStatusMutationOptions());

  const changeOrderBookMarketStatus = async (targetSymbol: string, marketStatus: MarketSessionStatus) => {
    if (marketStatusMutation.isPending) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 장 상태를 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await marketStatusMutation.mutateAsync({
      token,
      marketType: "ORDER_BOOK",
      symbol: targetSymbol,
      payload: {
        enabled: true,
        marketStatus,
      },
    });
    if (reportAdminActionFailure(result, "장 상태 변경에 실패했습니다.", setMessage)) {
      return;
    }
    if (marketStatus === "CLOSED") {
      setMessage("장마감을 실행했습니다. 해당 종목의 미체결 주문 정리, 예약 해제, 보유 스냅샷, 기준가 롤오버가 처리되었습니다.");
    } else if (marketStatus === "CIRCUIT_BREAKER") {
      setMessage("서킷브레이크로 전환했습니다. 해당 종목의 미체결 주문은 정리되고 다음 시뮬레이션 정규장 시작 때 자동 재개됩니다.");
    } else if (marketStatus === "HALTED") {
      setMessage("거래정지로 전환했습니다. 해당 종목의 미체결 주문은 정리되고 수동 재개 전까지 정지됩니다.");
    } else {
      setMessage("장 상태를 변경했습니다.");
    }
    reloadOrderBookMarketState();
  };

  return {
    changeOrderBookMarketStatus,
    updatingStatusSymbol: marketStatusMutation.isPending ? marketStatusMutation.variables?.symbol ?? null : null,
  };
}
