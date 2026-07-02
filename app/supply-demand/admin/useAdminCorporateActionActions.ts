import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { invalidateAdminCorporateActionQueries } from "@/app/lib/react-query/stockInvalidations";
import { adminApplyCorporateActionMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import { buildCorporateActionPayload } from "@/app/supply-demand/admin/AdminCorporateActionPayloadHelpers";
import { normalizeOrderBookSymbol } from "@/app/supply-demand/admin/AdminPayloadTextHelpers";
import { isKnownOrderBookSymbol } from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type { StockEventDraft } from "@/app/supply-demand/admin/AdminStockEventPanel";
import type { OrderBookInstrument } from "@/app/types/stock";

export function useAdminCorporateActionActions({
  actionSymbol,
  draft,
  instruments,
  queryClient,
  requireAdminToken,
  resetCorporateActionFields,
  setMessage,
}: {
  actionSymbol: string;
  draft: StockEventDraft;
  instruments: OrderBookInstrument[];
  queryClient: QueryClient;
  requireAdminToken: RequireAdminToken;
  resetCorporateActionFields: () => void;
  setMessage: AdminActionMessageSetter;
}) {
  const corporateActionMutation = useMutation(adminApplyCorporateActionMutationOptions());

  const submitCorporateAction = async () => {
    if (corporateActionMutation.isPending) {
      return;
    }
    const normalizedSymbol = normalizeOrderBookSymbol(actionSymbol);
    if (!normalizedSymbol) {
      setMessage("액션을 적용할 종목을 선택해 주세요.");
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, normalizedSymbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    const corporateActionPayload = buildCorporateActionPayload(draft);
    if (!corporateActionPayload.ok) {
      setMessage(corporateActionPayload.message);
      return;
    }

    const token = await requireAdminToken("관리자 로그인 후 주식 이벤트를 적용할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await corporateActionMutation.mutateAsync({
      token,
      symbol: normalizedSymbol,
      payload: corporateActionPayload.payload,
    });
    if (reportAdminActionFailure(result, "주식 이벤트 적용에 실패했습니다.", setMessage)) {
      return;
    }
    resetCorporateActionFields();
    setMessage("주식 이벤트를 적용했습니다.");
    await invalidateAdminCorporateActionQueries(queryClient, normalizedSymbol);
  };

  return {
    applyingAction: corporateActionMutation.isPending,
    submitCorporateAction,
  };
}
