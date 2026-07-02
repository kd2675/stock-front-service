import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { invalidateInstrumentReportQueries } from "@/app/lib/react-query/stockInvalidations";
import {
  adminDeleteInstrumentReportMutationOptions,
  adminSaveInstrumentReportMutationOptions,
} from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import { buildInstrumentReportPayload } from "@/app/supply-demand/admin/AdminInstrumentReportPayloadHelpers";
import { normalizeOrderBookSymbol } from "@/app/supply-demand/admin/AdminPayloadTextHelpers";
import { isKnownOrderBookSymbol } from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type { InstrumentReportDraft } from "@/app/supply-demand/admin/AdminInstrumentReportPanel";
import type { OrderBookInstrument } from "@/app/types/stock";

export function useAdminInstrumentReportActions({
  draft,
  instruments,
  queryClient,
  reportSymbol,
  requireAdminToken,
  setMessage,
}: {
  draft: InstrumentReportDraft;
  instruments: OrderBookInstrument[];
  queryClient: QueryClient;
  reportSymbol: string;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const saveReportMutation = useMutation(adminSaveInstrumentReportMutationOptions());
  const deleteReportMutation = useMutation(adminDeleteInstrumentReportMutationOptions());

  const submitInstrumentReport = async (mode: "publish" | "update") => {
    if (saveReportMutation.isPending) {
      return;
    }
    const reportPayload = buildInstrumentReportPayload(draft);
    if (!reportPayload.ok) {
      setMessage(reportPayload.message);
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, reportPayload.symbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 평가 보고서를 저장할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await saveReportMutation.mutateAsync({
      mode,
      token,
      symbol: reportPayload.symbol,
      payload: reportPayload.payload,
    });
    if (reportAdminActionFailure(result, "평가 보고서 저장에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage(mode === "publish" ? "평가 보고서를 발행했습니다." : "평가 보고서를 수정 이벤트로 저장했습니다.");
    await invalidateInstrumentReportQueries(queryClient, reportPayload.symbol);
  };

  const removeInstrumentReport = async () => {
    if (deleteReportMutation.isPending) {
      return;
    }
    const normalizedSymbol = normalizeOrderBookSymbol(reportSymbol);
    if (!normalizedSymbol) {
      setMessage("삭제할 보고서 종목을 선택해 주세요.");
      return;
    }
    if (!isKnownOrderBookSymbol(instruments, normalizedSymbol)) {
      setMessage("현재 주문장 종목 목록에 없는 종목입니다. 종목을 다시 선택해 주세요.");
      return;
    }
    const confirmed = window.confirm(`${normalizedSymbol} 최신 평가 보고서를 삭제 이벤트로 처리할까요?`);
    if (!confirmed) {
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 평가 보고서를 삭제할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await deleteReportMutation.mutateAsync({
      token,
      symbol: normalizedSymbol,
    });
    if (reportAdminActionFailure(result, "평가 보고서 삭제에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage("평가 보고서를 삭제 이벤트로 처리했습니다.");
    await invalidateInstrumentReportQueries(queryClient, normalizedSymbol);
  };

  return {
    deletingReport: deleteReportMutation.isPending,
    removeInstrumentReport,
    savingReport: saveReportMutation.isPending,
    submitInstrumentReport,
  };
}
