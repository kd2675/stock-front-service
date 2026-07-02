"use client";

import type { ReactNode } from "react";

import { isPositiveFiniteNumber } from "@/app/lib/numberParsing";
import { formatNumber } from "@/app/lib/stockFormatters";

export function OrderTicketField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="grid min-h-11 grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
      <span className="text-sm font-bold text-[#6b7684]">{label}</span>
      {children}
    </div>
  );
}

export function OrderTicketInput({
  disabled = false,
  label,
  placeholder,
  suffix,
  value,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  placeholder: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-h-11 grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
      <span className="text-sm font-bold text-[#6b7684]">{label}</span>
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_24px] items-center rounded-md border border-[#d1d6db] bg-white px-3 focus-within:border-[#3182f6]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          inputMode="decimal"
          className="h-11 min-w-0 bg-transparent text-right text-sm font-black tabular-nums outline-none placeholder:text-[#b0b8c1] disabled:text-[#8b95a1]"
        />
        <span className="text-right text-xs font-bold text-[#8b95a1]">{suffix}</span>
      </span>
    </label>
  );
}

export function OrderPriceInput({
  disabled,
  placeholder,
  tickSize,
  value,
  onChange,
  onStep,
}: {
  disabled: boolean;
  placeholder: string;
  tickSize?: number;
  value: string;
  onChange: (value: string) => void;
  onStep: (direction: -1 | 1) => void;
}) {
  const stepLabel = isPositiveFiniteNumber(tickSize) ? `${formatNumber(tickSize)}원` : "호가";
  return (
    <OrderTicketField label="주문가">
      <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_24px_36px] items-center rounded-md border border-[#d1d6db] bg-white px-1 focus-within:border-[#3182f6]">
        <PriceStepButton
          disabled={disabled}
          label={`${stepLabel} 낮추기`}
          onClick={() => onStep(-1)}
        >
          -
        </PriceStepButton>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          inputMode="decimal"
          aria-label="주문가"
          className="h-11 min-w-0 bg-transparent px-2 text-right text-sm font-black tabular-nums outline-none placeholder:text-[#b0b8c1] disabled:text-[#8b95a1]"
        />
        <span className="text-right text-xs font-bold text-[#8b95a1]">원</span>
        <PriceStepButton
          disabled={disabled}
          label={`${stepLabel} 높이기`}
          onClick={() => onStep(1)}
        >
          +
        </PriceStepButton>
      </div>
    </OrderTicketField>
  );
}

function PriceStepButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-sm text-base font-black text-[#333d4b] transition hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:text-[#b0b8c1] disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
