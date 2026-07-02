const koKrNumberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

const koKrIntegerFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const koKrFixedTwoFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const koKrMaxOneFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});

const koKrMonthDayFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
});

const koKrMonthDayTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const koKrMonthDayTimeSecondFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const koKrTimeSecondFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatKoKrNumber(value: number) {
  return koKrNumberFormatter.format(value);
}

export function formatKoKrInteger(value: number) {
  return koKrIntegerFormatter.format(value);
}

export function formatKoKrFixedTwo(value: number) {
  return koKrFixedTwoFormatter.format(value);
}

export function formatKoKrMaxOne(value: number) {
  return koKrMaxOneFormatter.format(value);
}

export function formatKoKrMonthDay(value: Date) {
  return koKrMonthDayFormatter.format(value);
}

export function formatKoKrMonthDayTime(value: Date) {
  return koKrMonthDayTimeFormatter.format(value);
}

export function formatKoKrMonthDayTimeSecond(value: Date) {
  return koKrMonthDayTimeSecondFormatter.format(value);
}

export function formatKoKrTimeSecond(value: Date) {
  return koKrTimeSecondFormatter.format(value);
}
