import { z } from "zod";

import type { StockInstrumentReportPayload } from "@/app/lib/stock";
import {
  integerRange,
  optionalTrimmedStringAsNull,
  requiredTrimmedString,
  requiredUppercaseString,
} from "@/app/lib/validation/zodFormSchemas";
import type { AdminPayloadResult } from "@/app/supply-demand/admin/AdminPayloadResultTypes";

export type InstrumentReportPayload = StockInstrumentReportPayload;

export type InstrumentReportDraftInput = {
  symbol: string;
  title: string;
  summary: string;
  score: string;
  riseReason: string;
  fallReason: string;
};

const INSTRUMENT_REPORT_MESSAGE = "보고서 종목, 제목, 요약, 점수 1-10을 입력해 주세요.";

const instrumentReportSchema = z.object({
  symbol: requiredUppercaseString(),
  title: requiredTrimmedString(),
  summary: requiredTrimmedString(),
  score: integerRange(1, 10),
  riseReason: optionalTrimmedStringAsNull(),
  fallReason: optionalTrimmedStringAsNull(),
});

export function buildInstrumentReportPayload(draft: InstrumentReportDraftInput): AdminPayloadResult<{
  ok: true;
  symbol: string;
  payload: InstrumentReportPayload;
}> {
  const parsed = instrumentReportSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      message: INSTRUMENT_REPORT_MESSAGE,
    };
  }

  return {
    ok: true,
    symbol: parsed.data.symbol,
    payload: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      score: parsed.data.score,
      riseReason: parsed.data.riseReason,
      fallReason: parsed.data.fallReason,
    },
  };
}
