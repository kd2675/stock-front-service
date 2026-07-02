import { z } from "zod";

import { isWithinPriceLimit, matchesTickSize } from "@/app/lib/orderBookPricing";
import { formatNumber, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBookInstrument, OrderType } from "@/app/types/stock";

export const orderTicketSchema = z.object({
  quantity: z.coerce.number().int("수량은 정수로 입력해 주세요.").positive("수량은 1주 이상 정수로 입력해 주세요."),
  limitPrice: z.coerce.number().positive("주문가는 0보다 큰 숫자로 입력해 주세요.").optional(),
});

export type ParsedOrderTicket = z.infer<typeof orderTicketSchema>;

export function parseOrderTicket(input: {
  orderType: OrderType;
  quantity: string;
  limitPrice: string;
  instrument?: Pick<OrderBookInstrument, "tickSize" | "priceLimitBase" | "priceLimitRate"> | null;
}) {
  const parsed = orderTicketSchema.safeParse({
    quantity: input.quantity,
    limitPrice: input.orderType === "LIMIT" ? input.limitPrice : undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "주문 입력값을 확인해 주세요." };
  }
  if (input.orderType === "LIMIT" && input.instrument) {
    const limitPrice = parsed.data.limitPrice;
    if (limitPrice === undefined || !Number.isFinite(limitPrice)) {
      return { ok: false as const, message: "주문가는 0보다 큰 숫자로 입력해 주세요." };
    }
    if (!matchesTickSize(limitPrice, input.instrument.tickSize)) {
      return { ok: false as const, message: `주문가는 ${formatNumber(input.instrument.tickSize)}원 단위로 입력해 주세요.` };
    }
    if (!isWithinPriceLimit(limitPrice, input.instrument.priceLimitBase, input.instrument.priceLimitRate)) {
      const lowerLimit = (input.instrument.priceLimitBase * (100 - input.instrument.priceLimitRate)) / 100;
      const upperLimit = (input.instrument.priceLimitBase * (100 + input.instrument.priceLimitRate)) / 100;
      return { ok: false as const, message: `주문가는 ${formatWon(lowerLimit)} 이상 ${formatWon(upperLimit)} 이하로 입력해 주세요.` };
    }
  }
  return { ok: true as const, data: parsed.data };
}
