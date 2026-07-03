import { useMutation } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { invalidateOrderBookTradingQueries } from "@/app/lib/react-query/stockInvalidations";
import { adminUpdateOrderBookInstrumentTradingRulesMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";

export function useAdminOrderBookInstrumentActions({
  queryClient,
  reloadOrderBookMarketState,
  requireAdminToken,
  setMessage,
}: {
  queryClient: QueryClient;
  reloadOrderBookMarketState: () => void;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const tradingRulesMutation = useMutation(adminUpdateOrderBookInstrumentTradingRulesMutationOptions());

  const updateOrderBookInstrumentTradingRules = async (
    targetSymbol: string,
    payload: { priceLimitRate: number },
  ) => {
    if (tradingRulesMutation.isPending) {
      return false;
    }
    const token = await requireAdminToken("관리자 로그인 후 종목 가격제한폭을 수정할 수 있습니다.");
    if (!token) {
      return false;
    }
    const result = await tradingRulesMutation.mutateAsync({
      token,
      symbol: targetSymbol,
      payload,
    });
    if (reportAdminActionFailure(result, "종목 가격제한폭 수정에 실패했습니다.", setMessage)) {
      return false;
    }
    setMessage("종목 가격제한폭을 수정했습니다.");
    reloadOrderBookMarketState();
    void invalidateOrderBookTradingQueries(queryClient, {
      symbols: [targetSymbol],
      includeTradeSummary: true,
      includeRecentExecutions: true,
    });
    return true;
  };

  return {
    updatingTradingRulesSymbol: tradingRulesMutation.isPending ? tradingRulesMutation.variables?.symbol ?? null : null,
    updateOrderBookInstrumentTradingRules,
  };
}
