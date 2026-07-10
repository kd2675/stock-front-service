import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { invalidateAdminCorporateActionQueries } from "@/app/lib/react-query/stockInvalidations";
import { adminApplyCorporateActionMutationOptions } from "@/app/lib/react-query/stockMutations";
import { getAdminActionFailureMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import { buildCorporateActionPayload } from "@/app/supply-demand/admin/AdminCorporateActionPayloadHelpers";
import { normalizeOrderBookSymbol } from "@/app/supply-demand/admin/AdminPayloadTextHelpers";
import { isKnownOrderBookSymbol } from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type { StockEventDraft } from "@/app/supply-demand/admin/AdminStockEventPanel";
import type { OrderBookInstrument } from "@/app/types/stock";

export function useAdminCorporateActionActions({
  actionSymbol,
  currentSimulationDate,
  draft,
  instruments,
  queryClient,
  requireAdminToken,
  resetCorporateActionFields,
  setMessage,
}: {
  actionSymbol: string;
  currentSimulationDate?: string;
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
      setMessage("이벤트를 적용할 종목을 선택해 주세요.");
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, normalizedSymbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    const corporateActionPayload = buildCorporateActionPayload(draft, currentSimulationDate);
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
    const failureMessage = getAdminActionFailureMessage(result, "주식 이벤트 적용에 실패했습니다.");
    if (failureMessage) {
      setMessage(formatCorporateActionAdminFailure(failureMessage));
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

function formatCorporateActionAdminFailure(message: string) {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes("requires no open order book orders")) {
    return "미체결 또는 부분체결 주문을 모두 취소한 뒤 기업 이벤트를 적용해 주세요.";
  }
  if (normalizedMessage.includes("instrument-changing corporate action is already in progress")) {
    return "같은 종목에서 증자·분할·무상배정 또는 상장폐지 이벤트가 진행 중입니다. 기존 이벤트가 끝난 뒤 다시 적용해 주세요.";
  }
  return message;
}
