import { formatNumber, formatTimeSecond, formatWon } from "@/app/lib/stockFormatters";
import type { OrderBookRecentExecution } from "@/app/types/stock";

export function MarketTapePanel({ executions, isLoading }: { executions: OrderBookRecentExecution[]; isLoading: boolean }) {
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#8b95a1]">MARKET TAPE</p>
          <h3 className="mt-1 text-base font-black">전체 체결</h3>
        </div>
        <span className="rounded-sm bg-[#f2f4f6] px-2 py-1 text-xs font-black text-[#6b7684]">
          최근 {executions.length}건
        </span>
      </div>
      <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {executions.map((execution) => {
          const up = execution.priceChange >= 0;
          return (
            <article key={execution.id} className="rounded-md bg-[#f7f8fa] px-3 py-2">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className={execution.side === "BUY" ? "shrink-0 text-xs font-black text-[#f04452]" : "shrink-0 text-xs font-black text-[#3182f6]"}>
                  {execution.side === "BUY" ? "매수체결" : "매도체결"}
                </span>
                <span className="min-w-0 truncate text-right text-xs font-bold text-[#8b95a1]">{formatTimeSecond(execution.executedAt)}</span>
              </div>
              <div className="mt-1 flex min-w-0 items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className={up ? "text-sm font-black tabular-nums text-[#f04452]" : "text-sm font-black tabular-nums text-[#3182f6]"}>
                    {formatWon(execution.price)}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                    {up ? "+" : ""}{formatNumber(execution.priceChange)}원
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tabular-nums text-[#191f28]">{formatNumber(execution.quantity)}주</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{formatWon(execution.grossAmount)}</p>
                </div>
              </div>
            </article>
          );
        })}
        {executions.length === 0 ? (
          <p className="rounded-md bg-[#f7f8fa] px-3 py-4 text-sm font-bold leading-6 text-[#8b95a1]">
            {isLoading ? "전체 체결을 불러오는 중입니다." : "아직 종목 전체 체결이 없습니다."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
