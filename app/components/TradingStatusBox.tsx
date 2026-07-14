export default function TradingStatusBox({ children }: { children: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border border-stock-border bg-white px-5 py-4 text-sm font-bold text-stock-text-tertiary shadow-[var(--shadow-raised)]">
      <span aria-hidden="true" className="relative size-2.5 shrink-0 rounded-full bg-stock-accent">
        <span className="absolute inset-0 animate-ping rounded-full bg-stock-accent/35 motion-reduce:animate-none" />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function TradingStatusScreen({
  backgroundClassName = "bg-stock-surface-muted",
  children,
}: {
  backgroundClassName?: string;
  children: string;
}) {
  return (
    <main className={`flex min-h-screen items-center justify-center px-5 text-stock-ink ${backgroundClassName}`}>
      <TradingStatusBox>{children}</TradingStatusBox>
    </main>
  );
}
