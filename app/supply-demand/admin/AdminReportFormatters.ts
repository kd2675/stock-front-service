import type { InstrumentReport } from "@/app/types/stock";

export function formatReportEventType(eventType: InstrumentReport["eventType"]): string {
  switch (eventType) {
    case "PUBLISH":
      return "발행";
    case "UPDATE":
      return "수정";
    case "DELETE":
      return "삭제";
  }
}
