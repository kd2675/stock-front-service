import DataTableViewport from "@/app/components/DataTableViewport";
import {
  formatCorporateActionPrice,
  formatCorporateActionSchedule,
  formatCorporateActionStatus,
  formatCorporateActionSubscriptionProgress,
  formatCorporateActionType,
  formatCorporateActionValue,
} from "@/app/supply-demand/admin/AdminFormatters";
import { DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import type { CorporateAction, OrderBookInstrument } from "@/app/types/stock";

type AdminCorporateActionHistoryPanelProps = {
  actions: CorporateAction[];
  errorMessage: string | null;
  instruments: OrderBookInstrument[];
  loading: boolean;
  symbol: string;
  onRetry: () => void;
  onSymbolChange: (symbol: string) => void;
};

export function AdminCorporateActionHistoryPanel({
  actions,
  errorMessage,
  instruments,
  loading,
  symbol,
  onRetry,
  onSymbolChange,
}: AdminCorporateActionHistoryPanelProps) {
  return (
    <section className="admin-panel mt-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
        <div>
          <h2 className="text-base font-black">선택 종목 이벤트 이력</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">이벤트 상태, 일정과 유상증자 청약·잔여 수량을 서버 원장 기준으로 조회합니다.</p>
        </div>
        <DarkSelect label="이력 조회 종목" value={symbol} onChange={onSymbolChange}>
          <option value="">선택</option>
          {instruments.map((instrument) => (
            <option key={instrument.symbol} value={instrument.symbol}>{`${instrument.symbol} · ${instrument.name}`}</option>
          ))}
        </DarkSelect>
      </div>

      {errorMessage ? (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-stock-danger/30 bg-admin-danger-surface px-3 py-3 text-sm font-bold text-admin-danger">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-white px-3 py-2 text-xs font-black text-admin-danger-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          >
            다시 조회
          </button>
        </div>
      ) : null}

      <DataTableViewport label="선택 종목 기업 이벤트 이력" tone="dark" className="mt-4 hidden md:block">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <caption className="sr-only">선택 종목 기업 이벤트 이력</caption>
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">이벤트</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">수량/금액</th>
              <th className="px-3 py-2">청약 현황</th>
              <th className="px-3 py-2">가격 조정</th>
              <th className="px-3 py-2">일정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {actions.map((action) => (
              <tr key={action.id}>
                <td className="px-3 py-3 align-top">
                  <p className="font-black">{formatCorporateActionType(action.actionType)}</p>
                  {action.description ? <p className="mt-1 max-w-52 break-words text-xs font-bold leading-5 text-stock-subtle">{action.description}</p> : null}
                </td>
                <td className="px-3 py-3 align-top">{formatCorporateActionStatus(action)}</td>
                <td className="px-3 py-3 align-top tabular-nums">{formatCorporateActionValue(action)}</td>
                <td className="px-3 py-3 align-top tabular-nums">{formatCorporateActionSubscriptionProgress(action)}</td>
                <td className="px-3 py-3 align-top tabular-nums">{formatCorporateActionPrice(action)}</td>
                <td className="px-3 py-3 align-top text-admin-muted">{formatCorporateActionSchedule(action)}</td>
              </tr>
            ))}
            <AdminCorporateActionEmptyRow actions={actions} loading={loading} symbol={symbol} />
          </tbody>
        </table>
      </DataTableViewport>

      <div className="mt-4 grid gap-3 md:hidden">
        {actions.map((action) => (
          <article key={action.id} className="rounded-md border border-white/10 bg-black/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black">{formatCorporateActionType(action.actionType)}</h3>
                <p className="mt-1 text-xs font-bold text-stock-subtle">{formatCorporateActionValue(action)}</p>
              </div>
              <span className="shrink-0 rounded-sm bg-white/10 px-2 py-1 text-xs font-black text-admin-text-strong">
                {formatCorporateActionStatus(action)}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-xs">
              <MobileDetail label="청약 현황" value={formatCorporateActionSubscriptionProgress(action)} />
              <MobileDetail label="가격 조정" value={formatCorporateActionPrice(action)} />
              <MobileDetail label="일정" value={formatCorporateActionSchedule(action)} />
            </dl>
            {action.description ? <p className="mt-3 break-words text-xs font-bold leading-5 text-stock-subtle">{action.description}</p> : null}
          </article>
        ))}
        {actions.length === 0 ? (
          <p className="rounded-md border border-white/10 bg-black/10 px-3 py-4 text-sm font-bold text-stock-subtle">
            {resolveEmptyMessage(symbol, loading)}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AdminCorporateActionEmptyRow({
  actions,
  loading,
  symbol,
}: {
  actions: CorporateAction[];
  loading: boolean;
  symbol: string;
}) {
  if (actions.length > 0) {
    return null;
  }
  return (
    <tr>
      <td colSpan={6} className="px-3 py-4 text-stock-subtle">{resolveEmptyMessage(symbol, loading)}</td>
    </tr>
  );
}

function MobileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
      <dt className="font-bold text-stock-subtle">{label}</dt>
      <dd className="min-w-0 break-words font-black text-admin-text-strong">{value}</dd>
    </div>
  );
}

function resolveEmptyMessage(symbol: string, loading: boolean) {
  if (!symbol) {
    return "이력을 조회할 종목을 선택해 주세요.";
  }
  return loading ? "기업 이벤트 이력을 조회하고 있습니다." : "선택한 종목의 이벤트 이력이 없습니다.";
}
