import {
  formatCorporateActionPrice,
  formatCorporateActionSchedule,
  formatCorporateActionStatus,
  formatCorporateActionType,
  formatCorporateActionValue,
} from "@/app/supply-demand/admin/AdminFormatters";
import type { CorporateAction } from "@/app/types/stock";

type AdminCorporateActionHistoryPanelProps = {
  symbol: string;
  actions: CorporateAction[];
};

export function AdminCorporateActionHistoryPanel({ symbol, actions }: AdminCorporateActionHistoryPanelProps) {
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-black">선택 종목 이벤트 이력</h2>
        <span className="text-xs font-bold text-[#8b95a1]">{symbol || "종목 선택 필요"}</span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[720px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">이벤트</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">수량/금액</th>
              <th className="px-3 py-2">가격 조정</th>
              <th className="px-3 py-2">일정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {actions.map((action) => (
              <tr key={action.id}>
                <td className="px-3 py-2 font-black">{formatCorporateActionType(action.actionType)}</td>
                <td className="px-3 py-2">{formatCorporateActionStatus(action.status)}</td>
                <td className="px-3 py-2 tabular-nums">{formatCorporateActionValue(action)}</td>
                <td className="px-3 py-2 tabular-nums">{formatCorporateActionPrice(action)}</td>
                <td className="px-3 py-2 text-[#b8c2cc]">{formatCorporateActionSchedule(action)}</td>
              </tr>
            ))}
            {actions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-[#8b95a1]">선택한 종목의 이벤트 이력이 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
