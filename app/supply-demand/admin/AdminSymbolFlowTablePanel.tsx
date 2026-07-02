import { formatCount, formatDateTime, formatFlowMarketStatus, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminSymbolFlow } from "@/app/types/stock";

export function AdminSymbolFlowTablePanel({
  canToggle,
  hasMore,
  isShowingAll,
  loadingAll,
  loading,
  onLoadAll,
  onSetShowAll,
  symbolFlowTotalCount,
  visibleSymbolFlows,
}: {
  canToggle: boolean;
  hasMore: boolean;
  isShowingAll: boolean;
  loadingAll: boolean;
  loading: boolean;
  onLoadAll: () => void;
  onSetShowAll: (showAll: boolean) => void;
  symbolFlowTotalCount: number;
  visibleSymbolFlows: AdminSymbolFlow[];
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-white">종목 흐름</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs font-bold text-[#8b95a1]">
            {isShowingAll
              ? `전체 ${formatCount(visibleSymbolFlows.length, "개")} / ${formatCount(symbolFlowTotalCount, "개")}`
              : `거래대금 상위 ${formatCount(visibleSymbolFlows.length, "개")} / 전체 ${formatCount(symbolFlowTotalCount, "개")}`}
          </span>
          {canToggle ? (
            <button
              type="button"
              onClick={() => {
                if (isShowingAll) {
                  onSetShowAll(false);
                  return;
                }
                if (hasMore) {
                  onLoadAll();
                }
                onSetShowAll(true);
              }}
              disabled={loadingAll || loading}
              className="min-h-9 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {loadingAll || loading ? "불러오는 중" : isShowingAll ? "상위만 보기" : "전체 보기"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">장</th>
              <th className="px-3 py-2 text-right">현재가</th>
              <th className="px-3 py-2 text-right">등락</th>
              <th className="px-3 py-2 text-right">거래대금</th>
              <th className="px-3 py-2 text-right">체결</th>
              <th className="px-3 py-2 text-right">대기주문</th>
              <th className="px-3 py-2 text-right">보유자</th>
              <th className="px-3 py-2">최근 체결</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {visibleSymbolFlows.map((flow) => (
              <tr key={flow.symbol}>
                <td className="px-3 py-2">
                  <p className="font-black text-white">{flow.name}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{flow.symbol}</p>
                </td>
                <td className="px-3 py-2 text-xs font-bold text-[#b8c2cc]">{formatFlowMarketStatus(flow.marketStatus)}</td>
                <td className="px-3 py-2 text-right font-black tabular-nums text-white">{formatWon(flow.currentPrice)}</td>
                <td className={flow.changeRate >= 0 ? "px-3 py-2 text-right font-black tabular-nums text-[#ffb4a8]" : "px-3 py-2 text-right font-black tabular-nums text-[#64a8ff]"}>
                  {formatSignedPercent(flow.changeRate)}
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{formatWon(flow.turnoverAmount)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{formatCount(flow.executionCount, "건")}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{formatCount(flow.openOrderCount, "건")}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-[#b8c2cc]">{formatCount(flow.holderCount, "명")}</td>
                <td className="px-3 py-2 text-xs font-bold text-[#8b95a1]">{formatDateTime(flow.lastExecutedAt)}</td>
              </tr>
            ))}
            {visibleSymbolFlows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm font-bold text-[#8b95a1]">
                  {loading ? "종목 흐름을 조회하고 있습니다." : "주문장 종목 흐름이 없습니다."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
