export function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stock-border bg-white px-4 py-3">
      <p className="text-xs font-bold text-stock-subtle">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums text-stock-ink">{value}</p>
    </div>
  );
}
