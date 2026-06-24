import { create } from "zustand";
import type { OrderSide, OrderType } from "@/app/types/stock";

type OrderTicketState = {
  selectedSymbol: string;
  side: OrderSide;
  orderType: OrderType;
  limitPrice: string;
  quantity: string;
};

type StockUiState = {
  virtualOrderTicket: OrderTicketState;
  orderBookTicket: OrderTicketState;
  setVirtualOrderTicket: (patch: Partial<OrderTicketState>) => void;
  setOrderBookTicket: (patch: Partial<OrderTicketState>) => void;
};

const defaultTicket: OrderTicketState = {
  selectedSymbol: "",
  side: "BUY",
  orderType: "LIMIT",
  limitPrice: "",
  quantity: "1",
};

export const useStockUiStore = create<StockUiState>((set) => ({
  virtualOrderTicket: {
    ...defaultTicket,
    limitPrice: "72000",
  },
  orderBookTicket: defaultTicket,
  setVirtualOrderTicket: (patch) =>
    set((state) => ({
      virtualOrderTicket: { ...state.virtualOrderTicket, ...patch },
    })),
  setOrderBookTicket: (patch) =>
    set((state) => ({
      orderBookTicket: { ...state.orderBookTicket, ...patch },
    })),
}));
