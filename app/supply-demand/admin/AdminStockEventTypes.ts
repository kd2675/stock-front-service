import type { CorporateActionType } from "@/app/types/stock";

export type StockEventDraft = {
  actionType: CorporateActionType;
  actionSymbol: string;
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

export type StockEventDraftSetters = {
  setActionType: (value: CorporateActionType) => void;
  setActionSymbol: (value: string) => void;
  setActionShares: (value: string) => void;
  setActionIssuePrice: (value: string) => void;
  setActionDividendAmount: (value: string) => void;
  setExRightsDate: (value: string) => void;
  setPaymentDate: (value: string) => void;
  setListingDate: (value: string) => void;
  setDelistingDate: (value: string) => void;
  setSplitFrom: (value: string) => void;
  setSplitTo: (value: string) => void;
  setActionDescription: (value: string) => void;
};
