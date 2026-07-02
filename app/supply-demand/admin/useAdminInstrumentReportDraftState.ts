import { useCallback, useMemo, useState } from "react";

import { DEFAULT_REPORT_SCORE } from "@/app/supply-demand/admin/AdminConstants";
import type {
  InstrumentReportDraft,
  InstrumentReportDraftSetters,
} from "@/app/supply-demand/admin/AdminInstrumentReportPanel";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";
import type { InstrumentReport } from "@/app/types/stock";

const DEFAULT_INSTRUMENT_REPORT_DRAFT: InstrumentReportDraft = {
  symbol: "",
  title: "",
  score: DEFAULT_REPORT_SCORE,
  summary: "",
  riseReason: "",
  fallReason: "",
};

export function useAdminInstrumentReportDraftState() {
  const [draft, setDraft] = useState<InstrumentReportDraft>(DEFAULT_INSTRUMENT_REPORT_DRAFT);
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  const fillReportDraft = useCallback((report: InstrumentReport) => {
    if (report.eventType === "DELETE") {
      return;
    }
    setDraft({
      symbol: report.symbol,
      title: report.title ?? "",
      summary: report.summary ?? "",
      score: String(report.score ?? 5),
      riseReason: report.riseReason ?? "",
      fallReason: report.fallReason ?? "",
    });
  }, []);

  const draftSetters: InstrumentReportDraftSetters = useMemo(() => ({
    setSymbol: (value) => setDraftField("symbol", value),
    setTitle: (value) => setDraftField("title", value),
    setScore: (value) => setDraftField("score", value),
    setSummary: (value) => setDraftField("summary", value),
    setRiseReason: (value) => setDraftField("riseReason", value),
    setFallReason: (value) => setDraftField("fallReason", value),
  }), [setDraftField]);

  return {
    draft,
    draftSetters,
    fillReportDraft,
    setSymbol: draftSetters.setSymbol,
    symbol: draft.symbol,
  };
}
