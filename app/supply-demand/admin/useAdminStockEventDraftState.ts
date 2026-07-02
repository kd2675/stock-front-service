import { useMemo, useState } from "react";

import {
  DEFAULT_STOCK_EVENT_ACTION_TYPE,
  DEFAULT_STOCK_SPLIT_FROM,
  DEFAULT_STOCK_SPLIT_TO,
} from "@/app/supply-demand/admin/AdminConstants";
import type {
  StockEventDraft,
  StockEventDraftSetters,
} from "@/app/supply-demand/admin/AdminStockEventPanel";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";

const DEFAULT_STOCK_EVENT_DRAFT: StockEventDraft = {
  actionType: DEFAULT_STOCK_EVENT_ACTION_TYPE,
  actionSymbol: "",
  actionShares: "",
  actionIssuePrice: "",
  actionDividendAmount: "",
  exRightsDate: "",
  paymentDate: "",
  listingDate: "",
  delistingDate: "",
  splitFrom: DEFAULT_STOCK_SPLIT_FROM,
  splitTo: DEFAULT_STOCK_SPLIT_TO,
  actionDescription: "",
};

export function useAdminStockEventDraftState() {
  const [draft, setDraft] = useState<StockEventDraft>(DEFAULT_STOCK_EVENT_DRAFT);
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  const resetCorporateActionFields = () => {
    setDraft((previous) => ({
      ...previous,
      actionShares: "",
      actionIssuePrice: "",
      actionDividendAmount: "",
      exRightsDate: "",
      paymentDate: "",
      listingDate: "",
      delistingDate: "",
      actionDescription: "",
    }));
  };

  const draftSetters: StockEventDraftSetters = useMemo(() => ({
    setActionType: (value) => setDraftField("actionType", value),
    setActionSymbol: (value) => setDraftField("actionSymbol", value),
    setActionShares: (value) => setDraftField("actionShares", value),
    setActionIssuePrice: (value) => setDraftField("actionIssuePrice", value),
    setActionDividendAmount: (value) => setDraftField("actionDividendAmount", value),
    setExRightsDate: (value) => setDraftField("exRightsDate", value),
    setPaymentDate: (value) => setDraftField("paymentDate", value),
    setListingDate: (value) => setDraftField("listingDate", value),
    setDelistingDate: (value) => setDraftField("delistingDate", value),
    setSplitFrom: (value) => setDraftField("splitFrom", value),
    setSplitTo: (value) => setDraftField("splitTo", value),
    setActionDescription: (value) => setDraftField("actionDescription", value),
  }), [setDraftField]);

  return {
    actionSymbol: draft.actionSymbol,
    actionType: draft.actionType,
    draft,
    draftSetters,
    resetCorporateActionFields,
    setActionSymbol: draftSetters.setActionSymbol,
  };
}
