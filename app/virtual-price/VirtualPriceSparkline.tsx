import type { PriceTick } from "@/app/types/stock";

export function Sparkline({ ticks }: { ticks: PriceTick[] }) {
  if (ticks.length < 2) {
    return (
      <div className="flex h-full items-center justify-center border-y border-[#eef0f2] text-sm text-[#6b7684]">
        가격 이력이 쌓이면 흐름이 표시됩니다.
      </div>
    );
  }

  const values = ticks.map((tick) => tick.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 300;
  const height = 80;
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="선택 종목 가격 흐름" className="h-full w-full overflow-visible">
      <line x1="0" x2={width} y1={height} y2={height} stroke="#eef0f2" strokeWidth="1" />
      <line x1="0" x2={width} y1="0" y2="0" stroke="#eef0f2" strokeWidth="1" />
      <polyline points={points} fill="none" stroke="#3182f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
