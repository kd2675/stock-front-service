import { useMutation } from "@tanstack/react-query";
import type { QueryClient, UseQueryResult } from "@tanstack/react-query";

import { adminUserFundFlowQueryOptions } from "@/app/lib/react-query/stockAdminQueries";
import { invalidateAdminUserCashAdjustmentQueries } from "@/app/lib/react-query/stockInvalidations";
import { adminAdjustUserAccountCashMutationOptions } from "@/app/lib/react-query/stockMutations";
import { getAdminUnknownErrorMessage, reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import { buildCashAdjustmentPayload, type CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import { useAdminCashAdjustmentRunner } from "@/app/supply-demand/admin/useAdminCashAdjustmentRunner";
import type { FundFlow } from "@/app/types/stock";

export function useAdminUserCashActions({
  amount,
  clearAmount,
  fundFlowUserKey,
  queryClient,
  requireAdminToken,
  setFundFlowUserKey,
  setMessage,
  userFundFlowQuery,
  userKey,
}: {
  amount: string;
  clearAmount: () => void;
  fundFlowUserKey: string | null;
  queryClient: QueryClient;
  requireAdminToken: RequireAdminToken;
  setFundFlowUserKey: (userKey: string | null) => void;
  setMessage: AdminActionMessageSetter;
  userFundFlowQuery: UseQueryResult<FundFlow | null, Error>;
  userKey: string;
}) {
  const {
    adjustingCashType: adjustingUserCashType,
    runCashAdjustment,
  } = useAdminCashAdjustmentRunner();
  const adjustUserAccountCashMutation = useMutation(adminAdjustUserAccountCashMutationOptions());

  const loadUserFundFlow = async (showSuccessMessage = true) => {
    if (userFundFlowQuery.isFetching) {
      return;
    }
    const normalizedUserKey = userKey.trim();
    if (!normalizedUserKey) {
      if (showSuccessMessage) {
        setMessage("자금 흐름을 조회할 유저 식별키를 입력해 주세요.");
      }
      return;
    }
    try {
      const token = await requireAdminToken("관리자 로그인 후 자금 흐름을 조회할 수 있습니다.");
      if (!token) {
        return;
      }
      setFundFlowUserKey(normalizedUserKey);
      await queryClient.fetchQuery(adminUserFundFlowQueryOptions(token, normalizedUserKey, {
        enabled: true,
      }));
      if (showSuccessMessage) {
        setMessage(`${normalizedUserKey} 자금 흐름을 조회했습니다.`);
      }
    } catch (error) {
      setFundFlowUserKey(null);
      setMessage(getAdminUnknownErrorMessage(error, "자금 흐름 조회에 실패했습니다."));
    }
  };

  const adjustUserCashBalance = async (adjustmentType: CashAdjustmentType) => {
    const cashAdjustment = buildCashAdjustmentPayload({
      userKey,
      amount,
      adjustmentType,
      invalidMessage: "입금/회수할 실제 유저 식별키와 금액을 확인해 주세요.",
    });
    if (!cashAdjustment.ok) {
      setMessage(cashAdjustment.message);
      return;
    }
    await runCashAdjustment(adjustmentType, async () => {
      const token = await requireAdminToken("관리자 로그인 후 실제 유저 계좌 현금을 조정할 수 있습니다.");
      if (!token) {
        return;
      }
      const result = await adjustUserAccountCashMutation.mutateAsync({
        token,
        userKey: cashAdjustment.userKey,
        payload: cashAdjustment.payload,
      });
      if (reportAdminActionFailure(result, "실제 유저 계좌 현금 조정에 실패했습니다.", setMessage)) {
        return;
      }
      clearAmount();
      setMessage(adjustmentType === "DEPOSIT" ? "실제 유저 계좌에 입금했습니다." : "실제 유저 계좌에서 회수했습니다.");
      const shouldReloadUserFundFlow = fundFlowUserKey === cashAdjustment.userKey;
      await invalidateAdminUserCashAdjustmentQueries(
        queryClient,
        shouldReloadUserFundFlow ? cashAdjustment.userKey : null,
      );
      if (shouldReloadUserFundFlow) {
        await loadUserFundFlow(false);
      }
    });
  };

  return {
    adjustingUserCashType,
    adjustUserCashBalance,
    loadUserFundFlow,
  };
}
