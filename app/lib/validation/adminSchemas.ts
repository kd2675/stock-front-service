import { z } from "zod";

const positiveNumber = (message: string) => z.coerce.number().finite(message).positive(message);
const positiveInteger = (message: string) => z.coerce.number().int(message).positive(message);

export const createInstrumentSchema = z.object({
  symbol: z.string().trim().min(1, "종목 코드를 입력해 주세요.").transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "종목명을 입력해 주세요."),
  market: z.string().trim().default("ORDERBOOK"),
  initialPrice: positiveNumber("초기 가격은 0보다 큰 숫자로 입력해 주세요."),
  issuedShares: positiveInteger("초기 발행주식수는 1주 이상 정수로 입력해 주세요."),
  tickSize: positiveNumber("호가 단위는 0보다 큰 숫자로 입력해 주세요."),
  priceLimitRate: z.coerce.number().finite("가격제한폭을 입력해 주세요.").positive("가격제한폭은 0보다 커야 합니다.").max(100, "가격제한폭은 100 이하로 입력해 주세요."),
  listingAutoDisplayName: z.string().trim().optional(),
  listingAutoEnabled: z.enum(["true", "false"]).default("true"),
  listingAutoPositionSide: z.enum(["SELL_ONLY", "BUY_ONLY"]).default("SELL_ONLY"),
  listingAutoMaxOrderQuantity: positiveInteger("상장주관사 최대 주문 수량은 1주 이상 정수로 입력해 주세요."),
  listingAutoOrderTtlSeconds: positiveInteger("상장주관사 호가 TTL은 1초 이상 정수로 입력해 주세요."),
  listingAutoPriceOffsetTicks: z.coerce.number().int("상장주관사 가격 분산 틱은 정수로 입력해 주세요.").min(0, "상장주관사 가격 분산 틱은 0 이상이어야 합니다."),
});

export type CreateInstrumentFormValues = z.input<typeof createInstrumentSchema>;
export type CreateInstrumentPayload = z.output<typeof createInstrumentSchema>;
