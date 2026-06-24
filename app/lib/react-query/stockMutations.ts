import { mutationOptions } from "@tanstack/react-query";
import {
  amendOrder,
  applyCorporateAction,
  cancelOrder,
  cancelOrderPartially,
  createOrderBookInstrument,
  deleteInstrumentReport,
  detachStockAccount,
  openStockAccount,
  placeOrder,
  publishInstrumentReport,
  reconnectStockAccount,
  updateAutoMarketConfig,
  updateAutoParticipantSymbolConfig,
  updateInstrumentReport,
  updateMarketStatus,
  upsertAutoParticipant,
  withdrawAutoParticipant,
} from "@/app/lib/stock";
import { requireAccessToken, unwrapStockResult } from "@/app/lib/react-query/stockResult";
import type { Account, AutoMarketStatus, CorporateActionType, InstrumentReport, MarketSessionStatus, MarketType, OrderSide, OrderType, SymbolMarketConfig } from "@/app/types/stock";

export type PlaceOrderVariables = {
  symbol: string;
  marketType?: MarketType;
  side: OrderSide;
  orderType: OrderType;
  limitPrice?: number;
  quantity: number;
  clientOrderId?: string;
};

export function openAccountMutationOptions() {
  return mutationOptions({
    mutationFn: async (): Promise<Account> => unwrapStockResult(await openStockAccount(await requireAccessToken()), "계좌 개설에 실패했습니다."),
  });
}

export function detachAccountMutationOptions() {
  return mutationOptions({
    mutationFn: async (): Promise<Account> => unwrapStockResult(await detachStockAccount(await requireAccessToken()), "계좌 분리에 실패했습니다."),
  });
}

export function reconnectAccountMutationOptions() {
  return mutationOptions({
    mutationFn: async (payload: { accountCode: string; recoveryCode: string }): Promise<Account> =>
      unwrapStockResult(await reconnectStockAccount(await requireAccessToken(), payload), "계좌 복구 연결에 실패했습니다."),
  });
}

export function placeOrderMutationOptions() {
  return mutationOptions({
    mutationFn: async (payload: PlaceOrderVariables) => unwrapStockResult(await placeOrder(await requireAccessToken(), payload), "주문 접수에 실패했습니다."),
  });
}

export function cancelOrderMutationOptions() {
  return mutationOptions({
    mutationFn: async (orderId: number) => unwrapStockResult(await cancelOrder(await requireAccessToken(), orderId), "주문 취소에 실패했습니다."),
  });
}

export function amendOrderMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: { orderId: number; quantity?: number; limitPrice?: number }) =>
      unwrapStockResult(await amendOrder(await requireAccessToken(), variables.orderId, { quantity: variables.quantity, limitPrice: variables.limitPrice }), "주문 정정에 실패했습니다."),
  });
}

export function cancelOrderPartiallyMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: { orderId: number; quantity: number }) =>
      unwrapStockResult(await cancelOrderPartially(await requireAccessToken(), variables.orderId, variables.quantity), "부분 취소에 실패했습니다."),
  });
}

export function createOrderBookInstrumentMutationOptions() {
  return mutationOptions({
    mutationFn: async (payload: {
      symbol: string;
      name: string;
      market?: string;
      initialPrice: number;
      issuedShares: number;
      tickSize?: number;
      priceLimitRate?: number;
    }) => unwrapStockResult(await createOrderBookInstrument(await requireAccessToken(), payload), "주문장 종목 생성에 실패했습니다."),
  });
}

export function applyCorporateActionMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: {
      symbol: string;
      payload: {
        actionType: CorporateActionType;
        shareQuantity?: number;
        issuePrice?: number;
        splitFrom?: number;
        splitTo?: number;
        exRightsDate?: string;
        paymentDate?: string;
        listingDate?: string;
        dividendAmount?: number;
        description?: string;
      };
    }) => unwrapStockResult(await applyCorporateAction(await requireAccessToken(), variables.symbol, variables.payload), "주식 이벤트 적용에 실패했습니다."),
  });
}

export function updateMarketStatusMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: {
      marketType: MarketType;
      symbol: string;
      payload: {
        enabled?: boolean;
        marketStatus?: MarketSessionStatus;
      };
    }): Promise<SymbolMarketConfig> =>
      unwrapStockResult(await updateMarketStatus(await requireAccessToken(), variables.marketType, variables.symbol, variables.payload), "장 상태 변경에 실패했습니다."),
  });
}

export function updateAutoMarketConfigMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: {
      symbol: string;
      payload: {
        enabled?: boolean;
        intensity?: number;
        maxOrderQuantity?: number;
        orderTtlSeconds?: number;
      };
    }): Promise<AutoMarketStatus["configs"][number]> =>
      unwrapStockResult(await updateAutoMarketConfig(await requireAccessToken(), variables.symbol, variables.payload), "자동장 설정 변경에 실패했습니다."),
  });
}

export function upsertAutoParticipantMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: {
      userKey: string;
      payload: {
        displayName: string;
        enabled?: boolean;
      };
    }): Promise<AutoMarketStatus["participants"][number]> =>
      unwrapStockResult(await upsertAutoParticipant(await requireAccessToken(), variables.userKey, variables.payload), "자동 참여자 저장에 실패했습니다."),
  });
}

export function withdrawAutoParticipantMutationOptions() {
  return mutationOptions({
    mutationFn: async (userKey: string): Promise<AutoMarketStatus["participants"][number]> =>
      unwrapStockResult(await withdrawAutoParticipant(await requireAccessToken(), userKey), "자동 참여자 탈퇴 처리에 실패했습니다."),
  });
}

export function updateAutoParticipantSymbolConfigMutationOptions() {
  return mutationOptions({
    mutationFn: async (variables: {
      userKey: string;
      symbol: string;
      payload: {
        enabled?: boolean;
        intensity?: number;
      };
    }): Promise<AutoMarketStatus["participantSymbolConfigs"][number]> =>
      unwrapStockResult(await updateAutoParticipantSymbolConfig(await requireAccessToken(), variables.userKey, variables.symbol, variables.payload), "참여자별 종목 전략 저장에 실패했습니다."),
  });
}

export function saveInstrumentReportMutationOptions(mode: "publish" | "update") {
  return mutationOptions({
    mutationFn: async (variables: {
      symbol: string;
      payload: {
        title: string;
        summary: string;
        score: number;
        riseReason: string;
        fallReason: string;
      };
    }): Promise<InstrumentReport> => {
      const token = await requireAccessToken();
      const result = mode === "publish"
        ? await publishInstrumentReport(token, variables.symbol, variables.payload)
        : await updateInstrumentReport(token, variables.symbol, variables.payload);
      return unwrapStockResult(result, "평가 보고서 저장에 실패했습니다.");
    },
  });
}

export function deleteInstrumentReportMutationOptions() {
  return mutationOptions({
    mutationFn: async (symbol: string): Promise<InstrumentReport> =>
      unwrapStockResult(await deleteInstrumentReport(await requireAccessToken(), symbol), "평가 보고서 삭제에 실패했습니다."),
  });
}
