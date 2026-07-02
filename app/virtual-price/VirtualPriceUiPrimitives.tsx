import type { HTMLAttributes, ReactNode } from "react";

export function Metric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "red" | "gray" }) {
  const toneClassName = {
    blue: "text-[#3182f6]",
    green: "text-[#00a56a]",
    red: "text-[#f04452]",
    gray: "text-[#4e5968]",
  }[tone];

  return (
    <article className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <p className="text-sm font-bold text-[#6b7684]">{label}</p>
      <p className={`mt-2 min-w-0 break-words text-[clamp(1rem,2.2vw,1.25rem)] font-black leading-tight tabular-nums ${toneClassName}`}>{value}</p>
    </article>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2]">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

export function Toggle({
  active,
  onClick,
  label,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: "default" | "buy" | "sell";
}) {
  const activeClassName = tone === "buy"
    ? "bg-[#f04452] text-white"
    : tone === "sell"
      ? "bg-[#3182f6] text-white"
      : "bg-[#3182f6] text-white";

  return (
    <button type="button" onClick={onClick} className={active ? `rounded-md px-3 py-2 text-sm font-black ${activeClassName}` : "rounded-md bg-[#2b333f] px-3 py-2 text-sm font-bold text-[#b0b8c1]"}>
      {label}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  inputMode,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-xs text-[#b0b8c1]">{label}</span>
      <input
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        inputMode={inputMode}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1 w-full min-w-0 rounded-md border border-[#3c4654] bg-[#2b333f] px-3 py-3 text-sm font-semibold text-white outline-none disabled:opacity-60"
      />
    </label>
  );
}
