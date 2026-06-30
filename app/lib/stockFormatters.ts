import type { Order } from "@/app/types/stock";

export function formatWon(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "-";
  }
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

export function formatOrderStatus(status: Order["status"]) {
  switch (status) {
    case "PENDING":
      return "대기";
    case "PARTIALLY_FILLED":
      return "부분 체결";
    case "FILLED":
      return "체결";
    case "CANCELLED":
      return "취소";
    case "REJECTED":
      return "거절";
  }
}

export function formatOrderPrice(order: Pick<Order, "averageFillPrice" | "limitPrice">) {
  if (order.limitPrice !== undefined && order.limitPrice !== null) {
    return formatWon(order.limitPrice);
  }
  if (order.averageFillPrice !== undefined && order.averageFillPrice !== null) {
    return formatWon(order.averageFillPrice);
  }
  return "시장가";
}
