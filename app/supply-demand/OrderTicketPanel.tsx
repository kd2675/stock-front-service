"use client";

import type { ReactNode } from "react";

import { ASSET_PERCENT_OPTIONS } from "@/app/lib/orderSizing";
import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBookInstrument, OrderSide, OrderType } from "@/app/types/stock";

export function OrderTicketPanel({
  availableCash,
  availableSellQuantity,
  estimatedOrderAmount,
  isMarketOpen,
  limitPrice,
  orderType,
  placingOrder,
  quantity,
  selectedInstrument,
  side,
  totalAsset,
  onAssetPercentSelect,
  onLimitPriceChange,
  onLimitPriceStep,
  onOrderTypeChange,
  onQuantityChange,
  onSideChange,
  onSubmit,
}: {
  availableCash?: number;
  availableSellQuantity?: number;
  estimatedOrderAmount?: number;
  isMarketOpen: boolean;
  limitPrice: string;
  orderType: OrderType;
  placingOrder: boolean;
  quantity: string;
  selectedInstrument?: OrderBookInstrument;
  side: OrderSide;
  totalAsset?: number;
  onAssetPercentSelect: (percent: number) => void;
  onLimitPriceChange: (value: string) => void;
  onLimitPriceStep: (direction: -1 | 1) => void;
  onOrderTypeChange: (value: OrderType) => void;
  onQuantityChange: (value: string) => void;
  onSideChange: (value: OrderSide) => void;
  onSubmit: () => void;
}) {
  const actionColor = side === "BUY" ? "bg-[#f04452]" : "bg-[#3182f6]";
  const actionLabel = side === "BUY" ? "매수 주문" : "매도 주문";

  return (
    <div data-order-ticket className="rounded-lg border border-[#d1d6db] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#8b95a1]">ORDER TICKET</p>
          <h3 className="mt-1 truncate text-lg font-black">주문장 주문</h3>
        </div>
        <span className={isMarketOpen ? "shrink-0 rounded-sm bg-[#eff6ff] px-2 py-1 text-xs font-black text-[#3182f6]" : "shrink-0 rounded-sm bg-[#fff3f0] px-2 py-1 text-xs font-black text-[#d34b36]"}>
          {isMarketOpen ? "주문 가능" : "주문 불가"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-[#f2f4f6] p-1">
        <SideButton active={side === "BUY"} side="BUY" onClick={() => onSideChange("BUY")} />
        <SideButton active={side === "SELL"} side="SELL" onClick={() => onSideChange("SELL")} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <OrderTypeButton active={orderType === "LIMIT"} label="지정가" onClick={() => onOrderTypeChange("LIMIT")} />
        <OrderTypeButton active={orderType === "MARKET"} label="시장가" onClick={() => onOrderTypeChange("MARKET")} />
      </div>

      <div className="mt-4 space-y-3">
        <OrderTicketField label="종목">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-black">{selectedInstrument?.name ?? "-"}</p>
            <p className="mt-0.5 truncate text-xs font-bold text-[#8b95a1]">{selectedInstrument?.symbol ?? "-"}</p>
          </div>
        </OrderTicketField>
        <OrderTicketField label="현재가">
          <span className="min-w-0 truncate text-right text-sm font-black tabular-nums">{formatWon(selectedInstrument?.currentPrice)}</span>
        </OrderTicketField>
        <OrderPriceInput
          disabled={orderType === "MARKET"}
          placeholder={orderType === "MARKET" ? "시장가" : "가격"}
          tickSize={selectedInstrument?.tickSize}
          value={limitPrice}
          onChange={onLimitPriceChange}
          onStep={onLimitPriceStep}
        />
        <OrderTicketInput
          label="수량"
          placeholder="수량"
          suffix="주"
          value={quantity}
          onChange={onQuantityChange}
        />
      </div>

      <div className="mt-4 rounded-md border border-[#e5e8eb] p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#6b7684]">
          <span>{side === "SELL" ? "보유 비중 주문" : "자산 비중 주문"}</span>
          <span className="min-w-0 truncate text-right tabular-nums">
            {side === "SELL" ? `매도가능 ${formatNumber(availableSellQuantity ?? 0)}주` : `총자산 ${formatWon(totalAsset)}`}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ASSET_PERCENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => onAssetPercentSelect(percent)}
              className="h-9 rounded-md bg-[#f2f4f6] text-xs font-black text-[#333d4b] hover:bg-[#e5e8eb]"
            >
              {percent}%
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-[#8b95a1]">
          <span>{side === "SELL" ? "매도 가능" : "현금 잔고"}</span>
          <span className="min-w-0 truncate text-right tabular-nums">
            {side === "SELL" ? `${formatNumber(availableSellQuantity ?? 0)}주` : formatWon(availableCash)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-[#f7f8fa] p-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-[#6b7684]">예상 주문금액</span>
          <span className="min-w-0 truncate text-right font-black tabular-nums">{formatWon(estimatedOrderAmount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-[#8b95a1]">
          <span>호가단위</span>
          <span className="tabular-nums">{selectedInstrument ? `${formatNumber(selectedInstrument.tickSize)}원` : "-"}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={placingOrder || !isMarketOpen || !selectedInstrument}
        className={`mt-4 h-12 w-full rounded-md px-3 text-sm font-black text-white ${actionColor} disabled:bg-[#b0b8c1] disabled:opacity-70`}
      >
        {placingOrder ? "접수 중" : actionLabel}
      </button>
    </div>
  );
}

function SideButton({
  active,
  side,
  onClick,
}: {
  active: boolean;
  side: OrderSide;
  onClick: () => void;
}) {
  const activeClass = side === "BUY" ? "bg-[#f04452] text-white" : "bg-[#3182f6] text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? `h-10 rounded-md text-sm font-black ${activeClass}` : "h-10 rounded-md text-sm font-black text-[#6b7684]"}
    >
      {side === "BUY" ? "매수" : "매도"}
    </button>
  );
}

function OrderTypeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "h-10 rounded-md bg-[#191f28] text-sm font-black text-white" : "h-10 rounded-md bg-[#f2f4f6] text-sm font-black text-[#6b7684]"}
    >
      {label}
    </button>
  );
}

function OrderTicketField({
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

function OrderTicketInput({
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

function OrderPriceInput({
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
  const stepLabel = tickSize && Number.isFinite(tickSize) && tickSize > 0 ? `${formatNumber(tickSize)}원` : "호가";
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
