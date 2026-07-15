import type { AdminTotalAssetHistoryPoint } from "@/app/types/stock";

export type AdminAssetHistoryMetric =
  | "TOTAL_ASSET"
  | "CASH_BALANCE"
  | "RESERVED_CASH"
  | "MARKET_VALUE"
  | "HOLDING_QUANTITY"
  | "AVAILABLE_HOLDING_QUANTITY"
  | "RESERVED_SELL_QUANTITY";

export type AdminAssetHistoryMetricDefinition = {
  label: string;
  unit: "WON" | "SHARE";
  value: (point: AdminTotalAssetHistoryPoint) => number | null;
};

export const ADMIN_ASSET_HISTORY_METRICS: Record<AdminAssetHistoryMetric, AdminAssetHistoryMetricDefinition> = {
  TOTAL_ASSET: {
    label: "전체 총자산",
    unit: "WON",
    value: (point) => point.totalAsset,
  },
  CASH_BALANCE: {
    label: "가용 현금",
    unit: "WON",
    value: (point) => point.cashBalance,
  },
  RESERVED_CASH: {
    label: "매수·청약 예약금",
    unit: "WON",
    value: (point) => point.reservedCash,
  },
  MARKET_VALUE: {
    label: "보유 주식 평가액",
    unit: "WON",
    value: (point) => point.marketValue,
  },
  HOLDING_QUANTITY: {
    label: "총 보유량",
    unit: "SHARE",
    value: (point) => point.holdingQuantity,
  },
  AVAILABLE_HOLDING_QUANTITY: {
    label: "가용 보유량",
    unit: "SHARE",
    value: (point) => point.availableHoldingQuantity,
  },
  RESERVED_SELL_QUANTITY: {
    label: "매도 예약 보유량",
    unit: "SHARE",
    value: (point) => point.reservedSellQuantity,
  },
};

export const ADMIN_ASSET_HISTORY_METRIC_KEYS = Object.keys(
  ADMIN_ASSET_HISTORY_METRICS,
) as AdminAssetHistoryMetric[];

export type AdminAssetHistoryMetricSummary = {
  observedDayCount: number;
  startValue: number;
  endValue: number;
  changeAmount: number;
  changeRate: number | null;
  averageValue: number;
  highestValue: number;
  lowestValue: number;
};

export function summarizeAdminAssetHistoryMetric(
  points: AdminTotalAssetHistoryPoint[],
  metric: AdminAssetHistoryMetric,
): AdminAssetHistoryMetricSummary | null {
  const metricDefinition = ADMIN_ASSET_HISTORY_METRICS[metric];
  const values = [...points]
    .reverse()
    .map((point) => metricDefinition.value(point))
    .filter((value): value is number => value != null);
  if (values.length === 0) {
    return null;
  }

  const startValue = values[0];
  const endValue = values[values.length - 1];
  const changeAmount = endValue - startValue;
  return {
    observedDayCount: values.length,
    startValue,
    endValue,
    changeAmount,
    changeRate: startValue === 0 ? null : (changeAmount * 100) / startValue,
    averageValue: values.reduce((sum, value) => sum + value, 0) / values.length,
    highestValue: Math.max(...values),
    lowestValue: Math.min(...values),
  };
}
