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
  if (status === "CIRCUIT_BREAKER") {
    return "서킷브레이크";
  }
  return "-";
}

export function formatEffectiveMarketSessionStatus(status: MarketSessionStatus | undefined, isOpen: boolean) {
  if (isOpen) {
    return "정규장";
  }
  if (status === "HALTED") {
    return "거래정지";
  }
  if (status === "CIRCUIT_BREAKER") {
    return "서킷브레이크";
  }
  if (status === "OPEN" || status === "CLOSED") {
    return "장외/마감";
  }
  return formatMarketSessionStatus(status);
}
