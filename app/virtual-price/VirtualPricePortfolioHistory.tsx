import AssetLineChart from "@/app/components/AssetLineChart";
import { formatWon } from "@/app/lib/stockFormatters";
import type { PortfolioSnapshot } from "@/app/types/stock";

import { formatDate, formatNumber, formatSignedWon } from "./VirtualPriceFormatters";

export function PortfolioHistory({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  if (!snapshots.length) {
    return <p className="text-sm text-[#6b7684]">장 마감 정산 기록이 아직 없습니다.</p>;
  }

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];
  const trend = latest.totalAsset - oldest.totalAsset;

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-md bg-[#f9fafb] p-3">
          <p className="text-xs font-bold text-[#6b7684]">최근 정산</p>
          <p className="mt-1 min-w-0 break-words text-sm font-black tabular-nums">{formatWon(latest.totalAsset)}</p>
        </div>
        <div className="min-w-0 rounded-md bg-[#f9fafb] p-3">
          <p className="text-xs font-bold text-[#6b7684]">기록 변동</p>
          <p className={trend >= 0 ? "mt-1 min-w-0 break-words text-sm font-black text-[#f04452] tabular-nums" : "mt-1 min-w-0 break-words text-sm font-black text-[#3182f6] tabular-nums"}>
            {formatSignedWon(trend)}
          </p>
        </div>
      </div>
      <AssetLineChart snapshots={snapshots} />
      <div className="mt-4 space-y-2">
        {snapshots.slice(0, 5).map((snapshot) => (
          <div key={snapshot.snapshotDate} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#eef0f2] py-2 text-sm">
            <span className="text-xs font-bold text-[#6b7684]">{formatDate(snapshot.snapshotDate)}</span>
            <span className="min-w-0 break-words font-semibold tabular-nums">{formatWon(snapshot.totalAsset)}</span>
            <span className={snapshot.returnRate >= 0 ? "text-xs font-black text-[#f04452] tabular-nums" : "text-xs font-black text-[#3182f6] tabular-nums"}>
              {formatNumber(snapshot.returnRate)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
