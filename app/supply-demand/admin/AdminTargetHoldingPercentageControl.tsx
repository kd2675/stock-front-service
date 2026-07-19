import { formatNumber } from "@/app/supply-demand/admin/AdminFormatters";

type AdminTargetHoldingPercentageControlProps = {
  issuedShares: number;
  targetHoldingQuantity: string;
  onTargetHoldingQuantityChange: (value: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  error?: string;
};

const TARGET_HOLDING_PERCENT_STEP = 0.01;

export function AdminTargetHoldingPercentageControl({
  issuedShares,
  targetHoldingQuantity,
  onTargetHoldingQuantityChange,
  actionLabel,
  onAction,
  actionDisabled = false,
  error,
}: AdminTargetHoldingPercentageControlProps) {
  const parsedTarget = Number(targetHoldingQuantity);
  const normalizedIssuedShares = Number.isSafeInteger(issuedShares) ? Math.max(issuedShares, 0) : 0;
  const normalizedTarget = Number.isSafeInteger(parsedTarget)
    ? Math.max(parsedTarget, 0)
    : 0;
  const percent = normalizedIssuedShares > 0
    ? Math.min((normalizedTarget / normalizedIssuedShares) * 100, 100)
    : 0;
  const disabled = normalizedIssuedShares <= 0;

  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-admin-surface px-3 py-2.5 sm:col-span-2 lg:col-span-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black text-admin-muted">목표 보유 수량</span>
        <output className="text-sm font-black tabular-nums text-admin-accent">{percent.toFixed(2)}%</output>
      </div>
      <div className="relative mt-3 h-5">
        <input
          type="range"
          min="0"
          max="100"
          step={TARGET_HOLDING_PERCENT_STEP}
          value={percent}
          disabled={disabled}
          aria-label="전체 발행량 대비 목표 보유 비율"
          onChange={(event) => {
            const nextPercent = Number(event.target.value);
            const nextQuantity = Math.round((normalizedIssuedShares * nextPercent) / 100);
            onTargetHoldingQuantityChange(String(nextQuantity));
          }}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 peer-focus-visible:ring-2 peer-focus-visible:ring-admin-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-admin-surface peer-disabled:opacity-40">
          <span className="block h-full rounded-full bg-admin-accent transition-[width] duration-150" style={{ width: `${percent}%` }} />
        </span>
        <span aria-hidden="true" className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-admin-surface bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition-[left] duration-150 peer-disabled:opacity-40" style={{ left: `${percent}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs font-bold tabular-nums text-stock-subtle">
          {formatNumber(normalizedTarget)}주 / 전체 {formatNumber(normalizedIssuedShares)}주
        </p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="min-h-9 rounded-md bg-admin-accent px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs font-bold text-admin-danger">{error}</p> : null}
    </div>
  );
}
