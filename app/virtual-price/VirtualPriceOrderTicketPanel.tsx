import { ASSET_PERCENT_OPTIONS } from "@/app/lib/orderSizing";
import { formatWon } from "@/app/lib/stockFormatters";
import type {
  Holding,
  Instrument,
  OrderSide,
  OrderType,
  Portfolio,
  Price,
} from "@/app/types/stock";

import { formatNumber } from "./VirtualPriceFormatters";
import { Input, Toggle } from "./VirtualPricePanels";

export function VirtualPriceOrderTicketPanel({
  estimatedOrderValue,
  instruments,
  limitPrice,
  message,
  orderActionClassName,
  orderType,
  orderValidationMessage,
  placingOrder,
  portfolio,
  quantity,
  selectedHolding,
  selectedPrice,
  selectedSymbol,
  side,
  onApplyAssetPercent,
  onLimitPriceChange,
  onOrderTypeChange,
  onQuantityChange,
  onSelectSymbol,
  onSideChange,
  onSubmit,
}: {
  estimatedOrderValue: number | null;
  instruments: Instrument[];
  limitPrice: string;
  message: string | null;
  orderActionClassName: string;
  orderType: OrderType;
  orderValidationMessage: string | null;
  placingOrder: boolean;
  portfolio: Portfolio | null;
  quantity: string;
  selectedHolding?: Holding;
  selectedPrice?: Price;
  selectedSymbol: string;
  side: OrderSide;
  onApplyAssetPercent: (percent: number) => void;
  onLimitPriceChange: (value: string) => void;
  onOrderTypeChange: (orderType: OrderType) => void;
  onQuantityChange: (value: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onSideChange: (side: OrderSide) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="rounded-lg bg-[#191f28] p-5 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
      <h2 className="text-xl font-bold">주문 입력</h2>
      <div className="mt-5 grid gap-3">
        <label className="block">
          <span className="text-xs text-[#b0b8c1]">종목</span>
          <select
            value={selectedSymbol}
            onChange={(event) => onSelectSymbol(event.target.value)}
            className="mt-1 w-full rounded-md bg-[#2b333f] px-3 py-3 text-sm outline-none"
          >
            <option value="" disabled>등록된 종목 없음</option>
            {instruments.map((item) => (
              <option key={item.symbol} value={item.symbol}>{item.symbol} {item.name}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Toggle active={side === "BUY"} tone="buy" onClick={() => onSideChange("BUY")} label="매수" />
          <Toggle active={side === "SELL"} tone="sell" onClick={() => onSideChange("SELL")} label="매도" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Toggle active={orderType === "LIMIT"} onClick={() => onOrderTypeChange("LIMIT")} label="지정가" />
          <Toggle active={orderType === "MARKET"} onClick={() => onOrderTypeChange("MARKET")} label="시장가" />
        </div>
        <Input label="현재가" value={formatWon(selectedPrice?.currentPrice)} readOnly />
        <Input label="주문가" value={limitPrice} onChange={onLimitPriceChange} disabled={orderType === "MARKET"} inputMode="decimal" />
        <Input label="수량" value={quantity} onChange={onQuantityChange} inputMode="numeric" />
      </div>
      <div className="mt-4 rounded-md border border-[#3a4553] p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#b0b8c1]">
          <span>{side === "SELL" ? "보유 비중 주문" : "현금 비중 주문"}</span>
          <span className="min-w-0 break-words text-right tabular-nums">
            {side === "SELL" ? `매도가능 ${formatNumber(selectedHolding?.availableQuantity ?? 0)}주` : `주문가능 ${formatWon(portfolio?.account.cashBalance)}`}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ASSET_PERCENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => onApplyAssetPercent(percent)}
              className="h-9 rounded-md bg-[#2b333f] text-xs font-black text-white hover:bg-[#3a4553]"
            >
              {percent}%
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-[#8b95a1]">
          <span>{side === "SELL" ? "매도 가능" : "현금 잔고"}</span>
          <span className="min-w-0 break-words text-right tabular-nums">
            {side === "SELL" ? `${formatNumber(selectedHolding?.availableQuantity ?? 0)}주` : formatWon(portfolio?.account.cashBalance)}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 rounded-md bg-[#2b333f] p-3 text-xs sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[#b0b8c1]">예상 금액</p>
          <p className="mt-1 min-w-0 break-words text-sm font-black tabular-nums">{formatWon(estimatedOrderValue)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[#b0b8c1]">{side === "SELL" ? "매도 가능" : "주문 가능"}</p>
          <p className="mt-1 min-w-0 break-words text-sm font-black tabular-nums">
            {side === "SELL" ? `${selectedHolding?.availableQuantity ?? 0}주` : formatWon(portfolio?.account.cashBalance)}
          </p>
        </div>
      </div>
      {orderValidationMessage ? <p className="mt-3 rounded-md bg-[#3d2830] px-3 py-2 text-sm text-[#ffd1d6]">{orderValidationMessage}</p> : null}
      {message ? <p className="mt-4 rounded-md bg-[#2b333f] px-3 py-2 text-sm text-white">{message}</p> : null}
      <button
        type="button"
        onClick={onSubmit}
        disabled={Boolean(orderValidationMessage) || placingOrder}
        className={`mt-5 w-full rounded-md px-4 py-3 text-sm font-black text-white ${orderActionClassName} disabled:cursor-not-allowed disabled:bg-[#4e5968] disabled:text-[#b0b8c1]`}
      >
        {placingOrder ? "접수 중" : "주문 접수"}
      </button>
    </section>
  );
}
