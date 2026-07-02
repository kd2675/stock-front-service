import { parsePositiveIntegerInput, parsePositiveNumberInput } from "@/app/lib/numberParsing";
import type { StockCorporateActionPayload } from "@/app/lib/stock";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";
import type { CorporateActionType } from "@/app/types/stock";

export type CorporateActionPayload = StockCorporateActionPayload;

export type CorporateActionDraftInput = {
  actionType: CorporateActionType;
  actionShares: string;
  actionIssuePrice: string;
  actionDividendAmount: string;
  exRightsDate: string;
  paymentDate: string;
  listingDate: string;
  delistingDate: string;
  splitFrom: string;
  splitTo: string;
  actionDescription: string;
};

export function buildCorporateActionPayload(draft: CorporateActionDraftInput): AdminPayloadResult<{
  ok: true;
  payload: CorporateActionPayload;
}> {
  const payload: CorporateActionPayload = { actionType: draft.actionType };

  if (draft.actionType === "INITIAL_ISSUE") {
    return {
      ok: false,
      message: "신규 상장은 종목 생성 흐름으로 처리해 주세요.",
    };
  }

  if (draft.actionType === "DELISTING") {
    if (!draft.delistingDate) {
      return {
        ok: false,
        message: "상장폐지는 상장폐지일이 필요합니다.",
      };
    }
    payload.delistingDate = draft.delistingDate;
  } else if (draft.actionType === "STOCK_SPLIT") {
    const parsedSplitFrom = parsePositiveIntegerInput(draft.splitFrom);
    const parsedSplitTo = parsePositiveIntegerInput(draft.splitTo);
    if (parsedSplitFrom === null || parsedSplitTo === null || parsedSplitTo <= parsedSplitFrom) {
      return {
        ok: false,
        message: "액면분할 비율을 올바르게 입력해 주세요.",
      };
    }
    if (!draft.listingDate) {
      return {
        ok: false,
        message: "액면분할은 효력일이 필요합니다.",
      };
    }
    payload.splitFrom = parsedSplitFrom;
    payload.splitTo = parsedSplitTo;
    payload.listingDate = draft.listingDate;
  } else if (draft.actionType === "CASH_DIVIDEND") {
    const parsedDividendAmount = parsePositiveNumberInput(draft.actionDividendAmount);
    if (parsedDividendAmount === null) {
      return {
        ok: false,
        message: "1주당 배당금을 0보다 큰 숫자로 입력해 주세요.",
      };
    }
    if (!draft.exRightsDate || !draft.paymentDate) {
      return {
        ok: false,
        message: "현금배당은 배당락일과 지급일이 필요합니다.",
      };
    }
    if (draft.paymentDate < draft.exRightsDate) {
      return {
        ok: false,
        message: "현금배당 지급일은 배당락일 이후여야 합니다.",
      };
    }
    payload.dividendAmount = parsedDividendAmount;
    payload.exRightsDate = draft.exRightsDate;
    payload.paymentDate = draft.paymentDate;
  } else {
    const parsedShares = parsePositiveIntegerInput(draft.actionShares);
    const parsedIssuePrice = parsePositiveNumberInput(draft.actionIssuePrice);
    if (parsedShares === null) {
      return {
        ok: false,
        message: "발행 주식수를 입력해 주세요.",
      };
    }
    if (draft.actionType === "PAID_IN_CAPITAL_INCREASE") {
      if (parsedIssuePrice === null) {
        return {
          ok: false,
          message: "발행가는 0보다 큰 숫자로 입력해 주세요.",
        };
      }
      if (!draft.exRightsDate || !draft.paymentDate || !draft.listingDate) {
        return {
          ok: false,
          message: "유상증자는 권리락일, 납입일, 신주상장일이 필요합니다.",
        };
      }
      if (draft.paymentDate < draft.exRightsDate || draft.listingDate < draft.paymentDate) {
        return {
          ok: false,
          message: "유상증자 일정은 권리락일, 납입일, 신주상장일 순서여야 합니다.",
        };
      }
      payload.exRightsDate = draft.exRightsDate;
      payload.paymentDate = draft.paymentDate;
      payload.listingDate = draft.listingDate;
    }
    if (draft.actionType === "ADDITIONAL_ISSUE") {
      if (parsedIssuePrice === null) {
        return {
          ok: false,
          message: "발행가는 0보다 큰 숫자로 입력해 주세요.",
        };
      }
      if (!draft.listingDate) {
        return {
          ok: false,
          message: "추가발행은 신주상장일이 필요합니다.",
        };
      }
      payload.listingDate = draft.listingDate;
    }
    if (draft.actionType === "BONUS_ISSUE" || draft.actionType === "STOCK_DIVIDEND") {
      if (!draft.exRightsDate || !draft.listingDate) {
        return {
          ok: false,
          message: "무상증자와 주식배당은 권리락일과 신주상장일이 필요합니다.",
        };
      }
      if (draft.listingDate < draft.exRightsDate) {
        return {
          ok: false,
          message: "신주상장일은 권리락일 이후여야 합니다.",
        };
      }
      payload.exRightsDate = draft.exRightsDate;
      payload.listingDate = draft.listingDate;
    }
    payload.shareQuantity = parsedShares;
    if ((draft.actionType === "PAID_IN_CAPITAL_INCREASE" || draft.actionType === "ADDITIONAL_ISSUE") && parsedIssuePrice !== null) {
      payload.issuePrice = parsedIssuePrice;
    }
  }

  if (draft.actionDescription.trim()) {
    payload.description = draft.actionDescription.trim();
  }

  return {
    ok: true,
    payload,
  };
}
