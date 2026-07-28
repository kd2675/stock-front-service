export type AdminEntitySelectorTone =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export type AdminEntitySelectorItem = {
  key: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: AdminEntitySelectorTone;
  metricLabel: string;
  metricValue: string;
};

export function AdminEntitySelector({
  ariaLabel,
  heading,
  hint,
  mobileLabel,
  items,
  selectedKey,
  onSelect,
}: {
  ariaLabel: string;
  heading: string;
  hint: string;
  mobileLabel: string;
  items: AdminEntitySelectorItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside aria-label={ariaLabel} className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black text-admin-muted">{heading}</h3>
        <span className="text-[11px] font-bold text-admin-placeholder">{hint}</span>
      </div>

      <label className="grid min-w-0 gap-1 text-xs font-bold text-admin-muted sm:hidden">
        {mobileLabel}
        <select
          className="admin-control h-11 w-full min-w-0 px-3 text-sm font-bold outline-none"
          value={selectedKey}
          onChange={(event) => onSelect(event.target.value)}
        >
          {items.map((item) => (
            <option key={item.key} value={item.key}>
              {item.title} · {item.statusLabel}
            </option>
          ))}
        </select>
      </label>

      <div className="hidden min-w-0 gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:max-h-[720px] xl:grid-cols-1 xl:overflow-y-auto xl:pr-1">
        {items.map((item) => {
          const active = item.key === selectedKey;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item.key)}
              className={[
                "group min-w-0 rounded-md border p-3 text-left transition",
                active
                  ? "border-admin-accent/60 bg-admin-accent-surface shadow-[inset_3px_0_0_var(--admin-accent)]"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.055]",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{item.title}</span>
                  <span className="mt-1 block truncate text-[10px] font-bold text-admin-placeholder">
                    {item.subtitle}
                  </span>
                </span>
                <span className={[
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-black",
                  statusToneClassName(item.statusTone),
                ].join(" ")}>
                  {item.statusLabel}
                </span>
              </span>
              <span className="mt-3 flex items-end justify-between gap-2">
                <span className="text-[10px] font-bold text-admin-placeholder">{item.metricLabel}</span>
                <span className="truncate text-right text-xs font-black tabular-nums text-admin-accent-soft" title={item.metricValue}>
                  {item.metricValue}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function statusToneClassName(tone: AdminEntitySelectorTone) {
  if (tone === "success") {
    return "border-admin-success/25 bg-admin-success/10 text-admin-success";
  }
  if (tone === "warning") {
    return "border-admin-warning/25 bg-admin-warning/10 text-admin-warning";
  }
  if (tone === "danger") {
    return "border-admin-danger/25 bg-admin-danger/10 text-admin-danger";
  }
  if (tone === "accent") {
    return "border-admin-accent/25 bg-admin-accent/10 text-admin-accent-soft";
  }
  return "border-white/10 bg-white/[0.04] text-admin-placeholder";
}
