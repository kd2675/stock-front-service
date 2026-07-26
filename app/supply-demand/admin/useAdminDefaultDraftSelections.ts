import { useEffect, useRef } from "react";

import {
  resolveAutoMarketConfigDraft,
} from "@/app/supply-demand/admin/AdminDraftHelpers";
import type { AutoMarketStatus, OrderBookInstrument } from "@/app/types/stock";

type AdminDefaultDraftSelectionsOptions = {
  applyAutoMarketConfigDraft: (draft: ReturnType<typeof resolveAutoMarketConfigDraft>) => void;
  autoConfigSymbol: string;
  historySymbol: string;
  instruments: OrderBookInstrument[];
  reportSymbol: string;
  setHistorySymbol: (symbol: string) => void;
  setReportSymbol: (symbol: string) => void;
  shouldLoadInstrumentDetails: boolean;
  status: AutoMarketStatus | null | undefined;
};

export function useAdminDefaultDraftSelections(options: AdminDefaultDraftSelectionsOptions) {
  const {
    applyAutoMarketConfigDraft,
    autoConfigSymbol,
    historySymbol,
    instruments,
    reportSymbol,
    setHistorySymbol,
    setReportSymbol,
    shouldLoadInstrumentDetails,
    status,
  } = options;
  const autoConfigSymbolRef = useRef("");
  const historySymbolRef = useRef("");
  const reportSymbolRef = useRef("");

  useEffect(() => {
    autoConfigSymbolRef.current = autoConfigSymbol;
  }, [autoConfigSymbol]);

  useEffect(() => {
    historySymbolRef.current = historySymbol;
  }, [historySymbol]);

  useEffect(() => {
    reportSymbolRef.current = reportSymbol;
  }, [reportSymbol]);

  useEffect(() => {
    if (!shouldLoadInstrumentDetails || instruments.length === 0) {
      return undefined;
    }
    const firstSymbol = instruments[0].symbol;
    const shouldSetReportSymbol = !reportSymbolRef.current;
    const shouldSetHistorySymbol = !historySymbolRef.current;
    if (!shouldSetReportSymbol && !shouldSetHistorySymbol) {
      return undefined;
    }
    if (shouldSetReportSymbol) {
      reportSymbolRef.current = firstSymbol;
    }
    if (shouldSetHistorySymbol) {
      historySymbolRef.current = firstSymbol;
    }
    const timer = window.setTimeout(() => {
      if (shouldSetReportSymbol) {
        setReportSymbol(firstSymbol);
      }
      if (shouldSetHistorySymbol) {
        setHistorySymbol(firstSymbol);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [instruments, setHistorySymbol, setReportSymbol, shouldLoadInstrumentDetails]);

  useEffect(() => {
    if (!status) {
      return;
    }
    if (!autoConfigSymbolRef.current && status.configs.length > 0) {
      const draft = resolveAutoMarketConfigDraft(status.configs[0]);
      autoConfigSymbolRef.current = draft.symbol;
      applyAutoMarketConfigDraft(draft);
    }
  }, [applyAutoMarketConfigDraft, status]);

  return {
    historySymbolRef,
    reportSymbolRef,
  };
}
