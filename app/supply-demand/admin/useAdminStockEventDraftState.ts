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
  offeringType: "SHAREHOLDER_ALLOCATION",
  actionDividendAmount: "",
  exRightsDate: "",
  subscriptionStartDate: "",
  subscriptionEndDate: "",
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
      const defaults = defaultDatesForAction(previous.actionType, previous.offeringType, simulationDate);
      if (defaults === null) {
        return previous;
      }
      const next = {
        ...previous,
        exRightsDate: previous.exRightsDate || defaults.exRightsDate || "",
        subscriptionStartDate: previous.subscriptionStartDate || defaults.subscriptionStartDate || "",
        subscriptionEndDate: previous.subscriptionEndDate || defaults.subscriptionEndDate || "",
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
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      paymentDate: "",
      listingDate: "",
      delistingDate: "",
      actionDescription: "",
    }));
  };

  const draftSetters: StockEventDraftSetters = useMemo(() => ({
    setActionType: (value) => setDraft((previous) => {
      if (previous.actionType === value) {
        return previous;
      }
      return {
        ...clearCorporateActionDateFields(previous),
        actionType: value,
      };
    }),
    setActionSymbol: (value) => setDraftField("actionSymbol", value),
    setActionShares: (value) => setDraftField("actionShares", value),
    setActionIssuePrice: (value) => setDraftField("actionIssuePrice", value),
    setOfferingType: (value) => setDraft((previous) => {
      if (previous.offeringType === value) {
        return previous;
      }
      if (previous.actionType !== "PAID_IN_CAPITAL_INCREASE") {
        return {
          ...previous,
          offeringType: value,
        };
      }
      return {
        ...clearCorporateActionDateFields(previous),
        offeringType: value,
      };
    }),
    setActionDividendAmount: (value) => setDraftField("actionDividendAmount", value),
    setExRightsDate: (value) => setDraftField("exRightsDate", value),
    setSubscriptionStartDate: (value) => setDraftField("subscriptionStartDate", value),
    setSubscriptionEndDate: (value) => setDraftField("subscriptionEndDate", value),
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

function defaultDatesForAction(
  actionType: StockEventDraft["actionType"],
  offeringType: StockEventDraft["offeringType"],
  simulationDate: string,
) {
  const nextDate = addIsoDateDays(simulationDate, 1);
  const secondDate = addIsoDateDays(simulationDate, 2);
  const thirdDate = addIsoDateDays(simulationDate, 3);
  const fourthDate = addIsoDateDays(simulationDate, 4);
  const fifthDate = addIsoDateDays(simulationDate, 5);
  const sixthDate = addIsoDateDays(simulationDate, 6);
  if (
    nextDate === null
    || secondDate === null
    || thirdDate === null
    || fourthDate === null
    || fifthDate === null
    || sixthDate === null
  ) {
    return null;
  }
  if (actionType === "PAID_IN_CAPITAL_INCREASE") {
    if (offeringType === "PUBLIC_OFFERING") {
      return {
        exRightsDate: "",
        subscriptionStartDate: simulationDate,
        subscriptionEndDate: secondDate,
        paymentDate: thirdDate,
        listingDate: fifthDate,
        delistingDate: "",
      };
    }
    return {
      exRightsDate: simulationDate,
      subscriptionStartDate: nextDate,
      subscriptionEndDate: thirdDate,
      paymentDate: fourthDate,
      listingDate: sixthDate,
      delistingDate: "",
    };
  }
  if (actionType === "CASH_DIVIDEND") {
    return {
      exRightsDate: simulationDate,
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      paymentDate: nextDate,
      listingDate: "",
      delistingDate: "",
    };
  }
  if (actionType === "BONUS_ISSUE" || actionType === "STOCK_DIVIDEND") {
    return {
      exRightsDate: simulationDate,
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      paymentDate: "",
      listingDate: nextDate,
      delistingDate: "",
    };
  }
  if (actionType === "STOCK_SPLIT") {
    return {
      exRightsDate: "",
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      paymentDate: "",
      listingDate: simulationDate,
      delistingDate: "",
    };
  }
  if (actionType === "DELISTING") {
    return {
      exRightsDate: "",
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      paymentDate: "",
      listingDate: "",
      delistingDate: simulationDate,
    };
  }
  return null;
}

function clearCorporateActionDateFields(draft: StockEventDraft): StockEventDraft {
  return {
    ...draft,
    exRightsDate: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    paymentDate: "",
    listingDate: "",
    delistingDate: "",
  };
}

function datesEqual(left: StockEventDraft, right: StockEventDraft) {
  return left.exRightsDate === right.exRightsDate
    && left.subscriptionStartDate === right.subscriptionStartDate
    && left.subscriptionEndDate === right.subscriptionEndDate
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
