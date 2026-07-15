import type { ReactNode } from "react";

export function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-bold text-stock-subtle">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

export function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-bold text-stock-subtle">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

export function FundFlowLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-bold text-stock-subtle">{label}</p>
      <p className="mt-1 text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

export function SalaryMetric({
  label,
  value,
  tone,
  detail,
  actionHint,
  onClick,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral" | "warn" | "muted";
  detail?: string;
  actionHint?: string;
  onClick?: () => void;
}) {
  const toneClass = {
    good: "text-admin-success",
    neutral: "text-white",
    warn: "text-admin-warning-soft",
    muted: "text-stock-subtle",
  }[tone];
  const content = (
    <>
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <p className={["mt-1 text-lg font-black tabular-nums", toneClass].join(" ")}>{value}</p>
      {detail ? <p className="mt-1 text-[11px] font-bold leading-4 text-admin-muted">{detail}</p> : null}
      {actionHint ? <p className="mt-2 text-[11px] font-black text-admin-accent-label">{actionHint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label} ${actionHint ?? "상세 보기"}`}
        className="group rounded-md border border-admin-accent/35 bg-black/20 px-3 py-3 text-left transition hover:border-admin-accent hover:bg-admin-accent-surface/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
      >
        {content}
      </button>
    );
  }
  return <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3">{content}</div>;
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
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm leading-5">{children}</div>
    </div>
  );
}

export function ParticipantMetricLine({
  label,
  value,
  valueClassName = "text-admin-muted",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-admin-quiet">{label}</p>
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
      <p className="text-[11px] font-black text-stock-subtle">{label}</p>
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
    blue: "text-admin-accent",
    green: "text-admin-success",
    red: "text-admin-danger",
    muted: "text-admin-muted",
  }[tone];

  return (
    <div className="min-w-0 rounded-md bg-black/20 px-2 py-2">
      <p className="text-[11px] font-bold text-admin-quiet">{label}</p>
      <p className={["mt-1 truncate text-xs font-black", toneClass].join(" ")}>{value}</p>
    </div>
  );
}
