import type { CandlestickData, HistogramData, Time } from "lightweight-charts";

import { calculateChangeRate } from "@/app/lib/priceMath";
import { formatMonthDayTime, formatTimeSecond } from "@/app/lib/stockFormatters";
import type { OrderBookCandle, OrderBookCandleInterval } from "@/app/types/stock";

export const CANDLE_INTERVAL_OPTIONS: { value: OrderBookCandleInterval; label: string }[] = [
  { value: "1M", label: "1분" },
  { value: "5M", label: "5분" },
  { value: "15M", label: "15분" },
  { value: "1H", label: "1시간" },
  { value: "1D", label: "시뮬일(2시간)" },
  { value: "1W", label: "시뮬주(14시간)" },
];

export type MarketChartSeriesData = {
  candleData: CandlestickData<Time>[];
  volumeData: HistogramData<Time>[];
};

export type MarketChartPriceSummary = {
  changeRate: number;
  firstBucketStart: string;
  lastBucketStart: string;
  lastClosePrice: number;
  maxPrice: number;
  minPrice: number;
};

export function toMarketChartSeriesData(candles: OrderBookCandle[]): MarketChartSeriesData {
  const uniqueTimes = new Set<number>();
  const candleData: CandlestickData<Time>[] = [];
  const volumeData: HistogramData<Time>[] = [];

  for (const candle of candles) {
    const time = toChartUnixTime(candle.bucketStart);
    if (!Number.isFinite(time) || uniqueTimes.has(time)) {
      continue;
    }

    uniqueTimes.add(time);

    const up = candle.closePrice >= candle.openPrice;
    const hasExecution = candle.hasExecution !== false;
    const candleColor = hasExecution
      ? up ? "#f04452" : "#3182f6"
      : "#a8b0b8";

    candleData.push({
      time: time as Time,
      open: candle.openPrice,
      high: candle.highPrice,
      low: candle.lowPrice,
      close: candle.closePrice,
      color: candleColor,
      borderColor: candleColor,
      wickColor: candleColor,
    });
    volumeData.push({
      time: time as Time,
      value: candle.volume,
      color: hasExecution
        ? up ? "rgba(240, 68, 82, 0.28)" : "rgba(49, 130, 246, 0.28)"
        : "rgba(139, 149, 161, 0.10)",
    });
  }

  return { candleData, volumeData };
}

export function toMarketChartPriceSummary(candles: OrderBookCandle[]): MarketChartPriceSummary | null {
  const first = candles[0];
  const last = candles[candles.length - 1];
  if (!first || !last) {
    return null;
  }

  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = Number.NEGATIVE_INFINITY;

  for (const candle of candles) {
    minPrice = Math.min(minPrice, candle.lowPrice);
    maxPrice = Math.max(maxPrice, candle.highPrice);
  }

  return {
    changeRate: calculateChangeRate(last.closePrice, first.openPrice),
    firstBucketStart: first.bucketStart,
    lastBucketStart: last.bucketStart,
    lastClosePrice: last.closePrice,
    maxPrice,
    minPrice,
  };
}

export function formatTime(value: string) {
  return formatTimeSecond(value);
}

export function formatShortDateTime(value: string) {
  return formatMonthDayTime(value);
}

export function formatChartCrosshairTime(time: Time, interval: OrderBookCandleInterval) {
  return formatChartTime(time, interval, "crosshair");
}

export function formatChartTickTime(time: Time, interval: OrderBookCandleInterval) {
  return formatChartTime(time, interval, "tick");
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatChartTime(time: Time, interval: OrderBookCandleInterval, mode: "crosshair" | "tick") {
  const date = resolveChartDate(time);
  if (!date) {
    return "";
  }
  if (interval === "1W") {
    return mode === "crosshair"
      ? `시뮬 ${formatYearMonthDay(date)}`
      : formatMonthDay(date);
  }
  return mode === "crosshair"
    ? `시뮬 ${formatMonthDay(date)} ${formatHourMinute(date)}`
    : formatHourMinute(date);
}

function resolveChartDate(time: Time) {
  if (typeof time === "number") {
    return new Date(time * 1000);
  }
  if (typeof time === "string") {
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(time.year, time.month - 1, time.day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toChartUnixTime(value: string) {
  const date = parseLocalDateTime(value);
  return date ? Math.floor(date.getTime() / 1000) : Number.NaN;
}

function parseLocalDateTime(value: string) {
  if (!value) {
    return null;
  }
  const normalized = value.replace(" ", "T");
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized)) {
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) {
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function formatYearMonthDay(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function formatMonthDay(date: Date) {
  return `${padDatePart(date.getMonth() + 1)}/${padDatePart(date.getDate())}`;
}

function formatHourMinute(date: Date) {
  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}
