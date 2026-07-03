import { useState } from "react";

import { formatCount, formatDateTime, formatFlowMarketStatus, formatSignedPercent, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminSymbolFlow, AdminSymbolFlowList } from "@/app/types/stock";

export function AdminSymbolFlowTablePanel({
  allError,
  allSymbolFlowList,
  loadingAll,
  loading,
  onLoadAll,
  symbolFlowTotalCount,
  visibleSymbolFlows,
}: {
  allError: boolean;
  allSymbolFlowList: AdminSymbolFlowList | null;
  loadingAll: boolean;
  loading: boolean;
  onLoadAll: () => void;
  symbolFlowTotalCount: number;
  visibleSymbolFlows: AdminSymbolFlow[];
}) {
  const [showAllCumulativeFlows, setShowAllCumulativeFlows] = useState(false);

  const openAllCumulativeFlows = () => {
    setShowAllCumulativeFlows(true);
    if (!allSymbolFlowList && !loadingAll) {
      onLoadAll();
    }
  };

  return (
    <>
      <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white">시뮬레이션 하루 종목 흐름</h3>
            <p className="mt-1 text-xs font-bold text-[#8b95a1]">현재 조회 시점의 시뮬레이션 장 시작부터 지금까지의 체결 기준입니다.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-bold text-[#8b95a1]">
              거래대금 상위 {formatCount(visibleSymbolFlows.length, "개")} / 전체 {formatCount(symbolFlowTotalCount, "개")}
            </span>
            <button
              type="button"
              onClick={openAllCumulativeFlows}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-[#d8ecff] transition hover:border-[#64a8ff] hover:text-white"
            >
              전체 누적 보기
            </button>
          </div>
        </div>
        <AdminSymbolFlowTable flows={visibleSymbolFlows} loading={loading} loadingMessage="종목 흐름을 조회하고 있습니다." emptyMessage="시뮬레이션 하루 종목 흐름이 없습니다." />
      </div>
      <AdminAllSymbolFlowModal
        error={allError}
        loading={loadingAll}
        open={showAllCumulativeFlows}
        symbolFlowList={allSymbolFlowList}
        onClose={() => setShowAllCumulativeFlows(false)}
        onRefresh={onLoadAll}
      />
    </>
  );
}

function AdminAllSymbolFlowModal({
  error,
  loading,
  open,
  symbolFlowList,
  onClose,
  onRefresh,
}: {
  error: boolean;
  loading: boolean;
  open: boolean;
  symbolFlowList: AdminSymbolFlowList | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  if (!open) {
    return null;
  }

  const flows = symbolFlowList?.symbolFlows ?? [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-[#11161d] p-4 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white">전체 누적 종목 흐름</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-[#8b95a1]">서비스에 쌓인 주문장 전체 체결 기준의 누적 종목 흐름입니다. 현재가, 대기주문, 보유자는 현재 스냅샷입니다.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#d8ecff]">
              전체 {formatCount(symbolFlowList?.totalCount ?? flows.length, "개")}
            </span>
            {loading ? (
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#d8ecff]">조회 중</span>
            ) : null}
            {error ? (
              <span className="rounded-md bg-[#3a1f1b] px-2 py-1 text-xs font-black text-[#ffb4a8]">조회 실패</span>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-[#d8ecff] transition hover:border-[#64a8ff] hover:text-white"
            >
              다시 조회
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101418]"
            >
              닫기
            </button>
          </div>
        </div>

        <AdminSymbolFlowTable flows={flows} loading={loading} loadingMessage="전체 누적 종목 흐름을 조회하고 있습니다." emptyMessage="전체 누적 종목 흐름이 없습니다." />
      </div>
    </div>
  );
}

function AdminSymbolFlowTable({
  flows,
  loading,
  loadingMessage,
  emptyMessage,
}: {
  flows: AdminSymbolFlow[];
  loading: boolean;
  loadingMessage: string;
  emptyMessage: string;
}) {
  return (
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
          {flows.map((flow) => (
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
          {flows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-sm font-bold text-[#8b95a1]">
                {loading ? loadingMessage : emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
