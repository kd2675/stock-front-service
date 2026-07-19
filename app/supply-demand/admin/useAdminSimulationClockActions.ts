import { useMutation } from "@tanstack/react-query";

import { adminJumpSimulationClockMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { SimulationClockJumpAction } from "@/app/types/stock";

const SIMULATION_CLOCK_ACTION_MESSAGES: Record<SimulationClockJumpAction, string> = {
  NEXT_MARKET_OPEN: "시계를 다음 장 06:00으로 이동했습니다. 개장 동기화 상태를 다시 확인합니다.",
  NEXT_SIMULATION_DAY_START: "시계를 다음 일자 00:00으로 이동했습니다. 야간 후처리는 coordinator 단계에 따라 진행됩니다.",
  TODAY_MARKET_CLOSE: "시계를 오늘 18:00 경계로 이동했습니다. EOD coordinator가 시장 차단과 원장 동결을 이어서 처리합니다.",
};

export function useAdminSimulationClockActions({
  reloadSimulationClockState,
  requireAdminToken,
  setMessage,
}: {
  reloadSimulationClockState: () => void;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const jumpMutation = useMutation(adminJumpSimulationClockMutationOptions());

  const jumpSimulationClock = async (action: SimulationClockJumpAction) => {
    if (jumpMutation.isPending) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 시뮬레이션 시간을 조정할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await jumpMutation.mutateAsync({
      token,
      action,
    });
    if (reportAdminActionFailure(result, "시뮬레이션 시간 조정에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage(SIMULATION_CLOCK_ACTION_MESSAGES[action]);
    reloadSimulationClockState();
  };

  return {
    jumpSimulationClock,
    jumpingSimulationClockAction: jumpMutation.isPending ? jumpMutation.variables?.action ?? null : null,
  };
}
