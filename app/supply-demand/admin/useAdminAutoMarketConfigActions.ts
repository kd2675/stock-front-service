import { useMutation } from "@tanstack/react-query";

import { adminRegenerateAutoMarketDailyRegimeMutationOptions, adminRegenerateAutoMarketRegimeModifierMutationOptions, adminUpdateAutoMarketConfigMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AutoMarketConfigDraft } from "@/app/supply-demand/admin/AdminAutoMarketConfigPanel";
import { buildAutoMarketConfigPayload } from "@/app/supply-demand/admin/AdminMarketPayloadHelpers";
import type { AutoMarketConfig } from "@/app/types/stock";

export function useAdminAutoMarketConfigActions({
  autoConfigSymbol,
  draft,
  reloadAutoMarketConfigurationState,
  requireAdminToken,
  setAutoConfigEnabled,
  setEditingAutoConfigSymbol,
  setMessage,
}: {
  autoConfigSymbol: string;
  draft: AutoMarketConfigDraft;
  reloadAutoMarketConfigurationState: () => void;
  requireAdminToken: RequireAdminToken;
  setAutoConfigEnabled: (value: boolean) => void;
  setEditingAutoConfigSymbol: (value: string | null) => void;
  setMessage: AdminActionMessageSetter;
}) {
  const submitAutoConfigMutation = useMutation(adminUpdateAutoMarketConfigMutationOptions());
  const toggleAutoConfigMutation = useMutation(adminUpdateAutoMarketConfigMutationOptions());
  const regenerateDailyRegimeMutation = useMutation(adminRegenerateAutoMarketDailyRegimeMutationOptions());
  const regenerateRegimeModifierMutation = useMutation(adminRegenerateAutoMarketRegimeModifierMutationOptions());

  const submitAutoConfig = async () => {
    if (submitAutoConfigMutation.isPending) {
      return;
    }
    const autoConfigPayload = buildAutoMarketConfigPayload(draft);
    if (!autoConfigPayload.ok) {
      setMessage(autoConfigPayload.message);
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 자동장 설정을 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await submitAutoConfigMutation.mutateAsync({
      token,
      symbol: autoConfigPayload.symbol,
      payload: autoConfigPayload.payload,
    });
    if (reportAdminActionFailure(result, "자동장 설정 변경에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage("자동장 알고리즘 설정을 변경했습니다.");
    setEditingAutoConfigSymbol(null);
    reloadAutoMarketConfigurationState();
  };

  const toggleAutoConfigEnabled = async (config: AutoMarketConfig) => {
    if (toggleAutoConfigMutation.isPending) {
      return;
    }
    const nextEnabled = !config.enabled;
    const token = await requireAdminToken("관리자 로그인 후 자동장 가동 상태를 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await toggleAutoConfigMutation.mutateAsync({
      token,
      symbol: config.symbol,
      payload: {
        enabled: nextEnabled,
        maxOrderQuantity: config.maxOrderQuantity,
        orderTtlSeconds: config.orderTtlSeconds,
        primaryDistributionBias: config.primaryDistributionBias,
        secondaryDistributionBias: config.secondaryDistributionBias,
      },
    });
    if (reportAdminActionFailure(result, "자동장 가동 상태 변경에 실패했습니다.", setMessage)) {
      return;
    }
    if (autoConfigSymbol === config.symbol) {
      setAutoConfigEnabled(nextEnabled);
    }
    setMessage(nextEnabled ? "종목 자동 주문 생성을 가동했습니다." : "종목 자동 주문 생성을 정지했습니다.");
    reloadAutoMarketConfigurationState();
  };

  const regenerateDailyRegime = async (config: AutoMarketConfig) => {
    if (regenerateDailyRegimeMutation.isPending) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 랜덤값을 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await regenerateDailyRegimeMutation.mutateAsync({
      token,
      symbol: config.symbol,
    });
    if (reportAdminActionFailure(result, "랜덤값 변경에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage(`${config.symbol} 주 랜덤값을 다시 생성했습니다.`);
    reloadAutoMarketConfigurationState();
  };

  const regenerateRegimeModifier = async (config: AutoMarketConfig) => {
    if (regenerateRegimeModifierMutation.isPending) {
      return;
    }
    if (!config.dailyRegime) {
      setMessage("주 랜덤값이 먼저 생성되어야 보조 랜덤값을 변경할 수 있습니다.");
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 보조 랜덤값을 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await regenerateRegimeModifierMutation.mutateAsync({
      token,
      symbol: config.symbol,
    });
    if (reportAdminActionFailure(result, "보조 랜덤값 변경에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage(`${config.symbol} 현재 30분 보조 랜덤값을 다시 생성했습니다.`);
    reloadAutoMarketConfigurationState();
  };

  return {
    regeneratingDailyRegimeSymbol: regenerateDailyRegimeMutation.isPending ? regenerateDailyRegimeMutation.variables?.symbol ?? null : null,
    regeneratingRegimeModifierSymbol: regenerateRegimeModifierMutation.isPending ? regenerateRegimeModifierMutation.variables?.symbol ?? null : null,
    regenerateDailyRegime,
    regenerateRegimeModifier,
    submitAutoConfig,
    toggleAutoConfigEnabled,
    togglingAutoConfigSymbol: toggleAutoConfigMutation.isPending ? toggleAutoConfigMutation.variables?.symbol ?? null : null,
    updatingAutoConfig: submitAutoConfigMutation.isPending,
  };
}
