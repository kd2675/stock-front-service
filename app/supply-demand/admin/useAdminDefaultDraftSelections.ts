import { useEffect, useRef } from "react";

import {
  resolveAutoMarketConfigDraft,
  resolveListingAutoAccountConfigDraft,
} from "@/app/supply-demand/admin/AdminDraftHelpers";
import type { AutoMarketStatus, OrderBookInstrument } from "@/app/types/stock";

type AdminDefaultDraftSelectionsOptions = {
  applyAutoMarketConfigDraft: (draft: ReturnType<typeof resolveAutoMarketConfigDraft>) => void;
  applyListingAutoAccountConfigDraft: (draft: ReturnType<typeof resolveListingAutoAccountConfigDraft>) => void;
  autoConfigSymbol: string;
  instruments: OrderBookInstrument[];
  listingAutoSymbol: string;
  reportSymbol: string;
  setReportSymbol: (symbol: string) => void;
  shouldLoadInstrumentDetails: boolean;
  status: AutoMarketStatus | null | undefined;
};

export function useAdminDefaultDraftSelections(options: AdminDefaultDraftSelectionsOptions) {
  const {
    applyAutoMarketConfigDraft,
    applyListingAutoAccountConfigDraft,
    autoConfigSymbol,
    instruments,
    listingAutoSymbol,
    reportSymbol,
    setReportSymbol,
    shouldLoadInstrumentDetails,
    status,
  } = options;
  const autoConfigSymbolRef = useRef("");
  const listingAutoSymbolRef = useRef("");
  const reportSymbolRef = useRef("");

  useEffect(() => {
    autoConfigSymbolRef.current = autoConfigSymbol;
  }, [autoConfigSymbol]);

  useEffect(() => {
    listingAutoSymbolRef.current = listingAutoSymbol;
  }, [listingAutoSymbol]);

  useEffect(() => {
    reportSymbolRef.current = reportSymbol;
  }, [reportSymbol]);

  useEffect(() => {
    if (!shouldLoadInstrumentDetails || reportSymbolRef.current || instruments.length === 0) {
      return undefined;
    }
    const firstSymbol = instruments[0].symbol;
    reportSymbolRef.current = firstSymbol;
    const timer = window.setTimeout(() => {
      setReportSymbol(firstSymbol);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [instruments, setReportSymbol, shouldLoadInstrumentDetails]);

  useEffect(() => {
    if (!status) {
      return;
    }
    if (!autoConfigSymbolRef.current && status.configs.length > 0) {
      const draft = resolveAutoMarketConfigDraft(status.configs[0]);
      autoConfigSymbolRef.current = draft.symbol;
      applyAutoMarketConfigDraft(draft);
    }
    if (!listingAutoSymbolRef.current && status.listingAutoAccounts.length > 0) {
      const draft = resolveListingAutoAccountConfigDraft(status.listingAutoAccounts[0]);
      listingAutoSymbolRef.current = draft.symbol;
      applyListingAutoAccountConfigDraft(draft);
    }
  }, [applyAutoMarketConfigDraft, applyListingAutoAccountConfigDraft, status]);

  return {
    reportSymbolRef,
  };
}
