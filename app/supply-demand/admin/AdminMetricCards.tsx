import type { ReactNode } from "react";

export function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

export function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

export function FundFlowLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-bold text-[#8b95a1]">{label}</p>
      <p className="mt-1 text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

export function SalaryMetric({ label, value, tone }: { label: string; value: string; tone: "good" | "neutral" | "warn" | "muted" }) {
  const toneClass = {
    good: "text-[#7bd88f]",
    neutral: "text-white",
    warn: "text-[#ffd166]",
    muted: "text-[#8b95a1]",
  }[tone];
  return (
    <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-black text-[#8b95a1]">{label}</p>
      <p className={["mt-1 text-lg font-black tabular-nums", toneClass].join(" ")}>{value}</p>
    </div>
  );
}

export function ParticipantInfoItem({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["min-w-0 overflow-hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-2", className].join(" ")}>
      <p className="text-[11px] font-black text-[#8b95a1]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm leading-5">{children}</div>
    </div>
  );
}

export function ParticipantMetricLine({
  label,
  value,
  valueClassName = "text-[#b8c2cc]",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-[#6f7a86]">{label}</p>
      <p className={["mt-0.5 truncate text-sm font-black tabular-nums", valueClassName].join(" ")} title={value}>{value}</p>
    </div>
  );
}

export function ProfileOverviewInfoItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-black text-[#8b95a1]">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm leading-5">{children}</div>
    </div>
  );
}

export function ProfileMiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "red" | "muted";
}) {
  const toneClass = {
    blue: "text-[#64a8ff]",
    green: "text-[#6ee7a8]",
    red: "text-[#ffb4a8]",
    muted: "text-[#b8c2cc]",
  }[tone];

  return (
    <div className="min-w-0 rounded-md bg-black/20 px-2 py-2">
      <p className="text-[11px] font-bold text-[#6f7a86]">{label}</p>
      <p className={["mt-1 truncate text-xs font-black", toneClass].join(" ")}>{value}</p>
    </div>
  );
}
