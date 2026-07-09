import { useCallback, useMemo, useState } from "react";

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
  const [historySymbol, setHistorySymbol] = useState("");
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  const applySimulationDateDefaults = useCallback((simulationDate: string | null | undefined) => {
    if (!isIsoDate(simulationDate)) {
      return;
    }
    setDraft((previous) => {
      const defaults = defaultDatesForAction(previous.actionType, simulationDate);
      if (defaults === null) {
        return previous;
      }
      const next = {
        ...previous,
        exRightsDate: previous.exRightsDate || defaults.exRightsDate || "",
        paymentDate: previous.paymentDate || defaults.paymentDate || "",
        listingDate: previous.listingDate || defaults.listingDate || "",
        delistingDate: previous.delistingDate || defaults.delistingDate || "",
      };
      return datesEqual(previous, next) ? previous : next;
    });
  }, []);

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
    historySymbol,
    applySimulationDateDefaults,
    resetCorporateActionFields,
    setActionSymbol: draftSetters.setActionSymbol,
    setHistorySymbol,
  };
}

function defaultDatesForAction(actionType: StockEventDraft["actionType"], simulationDate: string) {
  const nextDate = addIsoDateDays(simulationDate, 1);
  const laterDate = addIsoDateDays(simulationDate, 2);
  if (nextDate === null || laterDate === null) {
    return null;
  }
  if (actionType === "PAID_IN_CAPITAL_INCREASE") {
    return {
      exRightsDate: simulationDate,
      paymentDate: nextDate,
      listingDate: laterDate,
      delistingDate: "",
    };
  }
  if (actionType === "CASH_DIVIDEND") {
    return {
      exRightsDate: simulationDate,
      paymentDate: nextDate,
      listingDate: "",
      delistingDate: "",
    };
  }
  if (actionType === "BONUS_ISSUE" || actionType === "STOCK_DIVIDEND") {
    return {
      exRightsDate: simulationDate,
      paymentDate: "",
      listingDate: nextDate,
      delistingDate: "",
    };
  }
  if (actionType === "STOCK_SPLIT") {
    return {
      exRightsDate: "",
      paymentDate: "",
      listingDate: simulationDate,
      delistingDate: "",
    };
  }
  if (actionType === "DELISTING") {
    return {
      exRightsDate: "",
      paymentDate: "",
      listingDate: "",
      delistingDate: simulationDate,
    };
  }
  return null;
}

function datesEqual(left: StockEventDraft, right: StockEventDraft) {
  return left.exRightsDate === right.exRightsDate
    && left.paymentDate === right.paymentDate
    && left.listingDate === right.listingDate
    && left.delistingDate === right.delistingDate;
}

function isIsoDate(value: string | null | undefined): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
}

function addIsoDateDays(value: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}
