export function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white px-4 py-3">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums text-[#191f28]">{value}</p>
    </div>
  );
}
