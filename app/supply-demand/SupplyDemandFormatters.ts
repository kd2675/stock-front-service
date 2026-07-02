import type { MarketSessionStatus } from "@/app/types/stock";

export function formatMarketSessionStatus(status?: MarketSessionStatus) {
  if (status === "OPEN") {
    return "정규장";
  }
  if (status === "CLOSED") {
    return "마감";
  }
  if (status === "HALTED") {
    return "거래정지";
  }
  return "-";
}
