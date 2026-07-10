"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const CALENDAR_CELL_COUNT = 42;

function formatDateControlValue(value: string, placeholder: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return {
      primary: placeholder,
      secondary: "날짜 선택",
      day: "--",
    };
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return {
      primary: value,
      secondary: "날짜 확인",
      day: String(day).padStart(2, "0"),
    };
  }

  return {
    primary: `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`,
    secondary: `${KOREAN_WEEKDAYS[date.getUTCDay()]}요일`,
    day: String(day).padStart(2, "0"),
  };
}

function parseCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) {
    return null;
  }

  const daysInMonth = getDaysInMonth(year, month - 1);
  if (day < 1 || day > daysInMonth) {
    return null;
  }

  return {
    year,
    monthIndex: month - 1,
    day,
  };
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function getMonthStartWeekday(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
}

function getCalendarMonth(value: string, placeholder: string) {
  const parsed = parseCalendarDate(value) ?? parseCalendarDate(placeholder);
  if (parsed) {
    return {
      year: parsed.year,
      monthIndex: parsed.monthIndex,
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  };
}

function addCalendarMonths(year: number, monthIndex: number, amount: number) {
  const date = new Date(Date.UTC(year, monthIndex + amount, 1));
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
  };
}

function toCalendarDateValue(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DarkSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`grid min-w-0 gap-1 text-xs font-bold ${disabled ? "text-[#66717d]" : "text-[#b8c2cc]"}`}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#64a8ff] disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-[#101418] disabled:text-[#66717d]"
      >
        {children}
      </select>
    </label>
  );
}

export function DarkDateInput({
  label,
  value,
  onChange,
  placeholder = "날짜 선택",
  minDate,
  className,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  className?: string;
  disabled?: boolean;
}) {
  const display = formatDateControlValue(value, placeholder);
  const selectedDate = parseCalendarDate(value);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getCalendarMonth(value, placeholder));
  const calendarDays = useMemo(() => {
    const leadingDays = getMonthStartWeekday(visibleMonth.year, visibleMonth.monthIndex);
    const currentMonthDays = getDaysInMonth(visibleMonth.year, visibleMonth.monthIndex);
    const previousMonth = addCalendarMonths(visibleMonth.year, visibleMonth.monthIndex, -1);
    const previousMonthDays = getDaysInMonth(previousMonth.year, previousMonth.monthIndex);

    return Array.from({ length: CALENDAR_CELL_COUNT }, (_, index) => {
      const currentDay = index - leadingDays + 1;
      if (currentDay < 1) {
        return {
          ...previousMonth,
          day: previousMonthDays + currentDay,
          currentMonth: false,
        };
      }

      if (currentDay > currentMonthDays) {
        const nextMonth = addCalendarMonths(visibleMonth.year, visibleMonth.monthIndex, 1);
        return {
          ...nextMonth,
          day: currentDay - currentMonthDays,
          currentMonth: false,
        };
      }

      return {
        year: visibleMonth.year,
        monthIndex: visibleMonth.monthIndex,
        day: currentDay,
        currentMonth: true,
      };
    });
  }, [visibleMonth]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={pickerRef}
      className={[
        "relative grid min-w-0 gap-1 text-xs font-bold",
        disabled ? "text-[#66717d]" : "text-[#b8c2cc]",
        className,
      ].filter(Boolean).join(" ")}
    >
      <span>{label}</span>
      <span
        className={[
          "relative flex h-12 min-w-0 items-center gap-3 rounded-md border px-3 transition",
          "border-white/10 bg-[#111821] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-white/20 focus-within:border-[#64a8ff] focus-within:ring-2 focus-within:ring-[#64a8ff]/20",
        ].join(" ")}
      >
        <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-md border border-[#2b435a] bg-[#172433] text-center">
          <span className="h-1 w-full rounded-t-md bg-[#64a8ff]" />
          <span className="mt-0.5 text-[11px] font-black leading-none text-white tabular-nums">{display.day}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={value ? "block truncate text-sm font-black text-white tabular-nums" : "block truncate text-sm font-bold text-[#65717d]"}>
            {display.primary}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-bold text-[#8b95a1]">{display.secondary}</span>
        </span>
        <span className="shrink-0 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black text-[#8b95a1]">
          SIM
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!open) {
              setVisibleMonth(getCalendarMonth(value, placeholder));
            }
            setOpen((current) => !current);
          }}
          aria-expanded={open}
          aria-label={`${label} 달력 열기`}
          className="absolute inset-0 h-full w-full cursor-pointer rounded-md opacity-0 disabled:cursor-not-allowed"
        />
      </span>
      {open ? (
        <span className="absolute left-0 top-[calc(100%+8px)] z-30 block w-[296px] rounded-md border border-white/10 bg-[#0e151d] p-3 text-[#d8e2ec] shadow-[0_18px_48px_rgba(0,0,0,0.42)]">
          <span className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addCalendarMonths(current.year, current.monthIndex, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-black text-[#b8c2cc] hover:border-[#64a8ff]/60 hover:text-white"
              aria-label="이전 달"
            >
              ‹
            </button>
            <span className="text-sm font-black text-white tabular-nums">
              {visibleMonth.year}.{String(visibleMonth.monthIndex + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addCalendarMonths(current.year, current.monthIndex, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-black text-[#b8c2cc] hover:border-[#64a8ff]/60 hover:text-white"
              aria-label="다음 달"
            >
              ›
            </button>
          </span>
          <span className="grid grid-cols-7 gap-1">
            {KOREAN_WEEKDAYS.map((weekday) => (
              <span key={weekday} className="flex h-7 items-center justify-center text-[11px] font-black text-[#6f7b87]">
                {weekday}
              </span>
            ))}
            {calendarDays.map((date) => {
              const dateValue = toCalendarDateValue(date.year, date.monthIndex, date.day);
              const dateDisabled = Boolean(minDate && dateValue < minDate);
              const selected = selectedDate
                ? selectedDate.year === date.year
                  && selectedDate.monthIndex === date.monthIndex
                  && selectedDate.day === date.day
                : false;

              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={dateDisabled}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                  className={[
                    "flex h-8 items-center justify-center rounded-md text-xs font-black tabular-nums transition",
                    dateDisabled
                      ? "cursor-not-allowed bg-transparent text-[#313b45]"
                      : selected
                      ? "bg-[#64a8ff] text-[#07111b]"
                      : date.currentMonth
                        ? "bg-white/[0.04] text-[#d8e2ec] hover:bg-[#172433] hover:text-white"
                        : "bg-transparent text-[#46515d] hover:bg-white/[0.04] hover:text-[#8b95a1]",
                  ].join(" ")}
                >
                  {date.day}
                </button>
              );
            })}
          </span>
          <span className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const month = getCalendarMonth("", placeholder);
                setVisibleMonth(month);
              }}
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-[#b8c2cc] hover:border-white/20 hover:text-white"
            >
              기준월 보기
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-[#8b95a1] hover:border-white/20 hover:text-white"
            >
              비우기
            </button>
          </span>
        </span>
      ) : null}
    </div>
  );
}

export function DarkInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled = false,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  inputMode?: "decimal" | "numeric" | "text";
  maxLength?: number;
}) {
  return (
    <label className={["grid min-w-0 gap-1 text-xs font-bold text-[#b8c2cc]", className].filter(Boolean).join(" ")}>
      {label}
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-[#5f6b76] disabled:cursor-not-allowed disabled:bg-[#11161b] disabled:text-[#6b7682] focus:border-[#64a8ff]"
      />
    </label>
  );
}

export function DarkFormInput({
  label,
  registration,
  placeholder,
  className = "",
  error,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  className?: string;
  error?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-bold text-[#8b95a1]">{label}</span>
      <input
        {...registration}
        placeholder={placeholder}
        className="mt-1 w-full min-w-0 rounded-md border border-[#2b333f] bg-[#101418] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#3182f6]"
      />
      {error ? <span className="mt-1 block text-xs font-bold text-[#ff8a80]">{error}</span> : null}
    </label>
  );
}

export function DarkFormSelect({
  label,
  registration,
  children,
  className = "",
}: {
  label: string;
  registration: UseFormRegisterReturn;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-bold text-[#8b95a1]">{label}</span>
      <select
        {...registration}
        className="mt-1 w-full min-w-0 rounded-md border border-[#2b333f] bg-[#101418] px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#3182f6]"
      >
        {children}
      </select>
    </label>
  );
}

export function EnabledToggleButton({
  enabled,
  disabled = false,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "inline-flex h-8 min-w-20 items-center justify-between gap-2 rounded-md border px-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-55",
        enabled
          ? "border-[#3182f6]/50 bg-[#12345a] text-[#d8ecff]"
          : "border-white/10 bg-white/[0.06] text-[#b8c2cc]",
      ].join(" ")}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          enabled ? "bg-[#64a8ff]" : "bg-[#5f6b76]",
        ].join(" ")}
      />
      <span>{disabled ? "처리 중" : enabled ? "가동" : "정지"}</span>
    </button>
  );
}
