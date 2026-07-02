import { useMutation } from "@tanstack/react-query";

import { adminUpdateAutoParticipantSymbolConfigMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import { buildAutoParticipantStrategyPayload } from "@/app/supply-demand/admin/AdminAutoParticipantStrategyPayloadHelpers";
import type { AutoParticipantSymbolConfig } from "@/app/types/stock";

export function useAdminAutoParticipantStrategyActions({
  reloadAutoParticipantStrategyState,
  requireAdminToken,
  setEditingStrategyKey,
  setMessage,
  setStrategyEnabled,
  strategyEnabled,
  strategyIntensity,
  strategySymbol,
  strategyUserKey,
}: {
  reloadAutoParticipantStrategyState: () => void;
  requireAdminToken: RequireAdminToken;
  setEditingStrategyKey: (value: string | null) => void;
  setMessage: AdminActionMessageSetter;
  setStrategyEnabled: (value: boolean) => void;
  strategyEnabled: boolean;
  strategyIntensity: string;
  strategySymbol: string;
  strategyUserKey: string;
}) {
  const saveStrategyMutation = useMutation(adminUpdateAutoParticipantSymbolConfigMutationOptions());
  const toggleStrategyMutation = useMutation(adminUpdateAutoParticipantSymbolConfigMutationOptions());

  const submitAutoStrategy = async () => {
    if (saveStrategyMutation.isPending) {
      return;
    }
    const strategyPayload = buildAutoParticipantStrategyPayload({
      userKey: strategyUserKey,
      symbol: strategySymbol,
      enabled: strategyEnabled,
      intensity: strategyIntensity,
    });
    if (!strategyPayload.ok) {
      setMessage(strategyPayload.message);
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 참여자 종목별 가격 방향/강도를 저장할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await saveStrategyMutation.mutateAsync({
      token,
      userKey: strategyPayload.userKey,
      symbol: strategyPayload.symbol,
      payload: strategyPayload.payload,
    });
    if (reportAdminActionFailure(result, "참여자 종목별 가격 방향/강도 저장에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage("참여자 종목별 가격 방향/강도를 저장했습니다.");
    setEditingStrategyKey(null);
    reloadAutoParticipantStrategyState();
  };

  const toggleAutoStrategyEnabled = async (config: AutoParticipantSymbolConfig) => {
    if (toggleStrategyMutation.isPending) {
      return;
    }
    const nextEnabled = !config.enabled;
    const token = await requireAdminToken("관리자 로그인 후 참여자 종목별 가격 방향/강도 상태를 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await toggleStrategyMutation.mutateAsync({
      token,
      userKey: config.userKey,
      symbol: config.symbol,
      payload: {
        enabled: nextEnabled,
        intensity: config.intensity,
      },
    });
    if (reportAdminActionFailure(result, "참여자 종목별 가격 방향/강도 상태 변경에 실패했습니다.", setMessage)) {
      return;
    }
    if (strategyUserKey === config.userKey && strategySymbol === config.symbol) {
      setStrategyEnabled(nextEnabled);
    }
    setMessage(nextEnabled ? "참여자 종목별 가격 방향/강도를 가동했습니다." : "참여자 종목별 가격 방향/강도를 정지했습니다.");
    reloadAutoParticipantStrategyState();
  };

  return {
    savingStrategy: saveStrategyMutation.isPending,
    submitAutoStrategy,
    togglingStrategyKey: toggleStrategyMutation.isPending && toggleStrategyMutation.variables
      ? `${toggleStrategyMutation.variables.userKey}:${toggleStrategyMutation.variables.symbol}`
      : null,
    toggleAutoStrategyEnabled,
  };
}
