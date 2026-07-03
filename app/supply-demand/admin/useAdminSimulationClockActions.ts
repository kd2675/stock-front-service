import { useMutation } from "@tanstack/react-query";

import { adminJumpSimulationClockMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { SimulationClockJumpAction } from "@/app/types/stock";

const SIMULATION_CLOCK_ACTION_MESSAGES: Record<SimulationClockJumpAction, string> = {
  NEXT_MARKET_OPEN: "시뮬레이션 시간을 다음 장 시작 시점으로 이동했습니다.",
  NEXT_SIMULATION_DAY_START: "시뮬레이션 시간을 다음 시뮬레이션 일자 시작 시점으로 이동했습니다.",
  TODAY_MARKET_CLOSE: "시뮬레이션 시간을 오늘 장마감 시점으로 이동했습니다.",
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
