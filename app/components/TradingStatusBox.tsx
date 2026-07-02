export default function TradingStatusBox({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
      {children}
    </div>
  );
}

export function TradingStatusScreen({
  backgroundClassName = "bg-[#f7f8fa]",
  children,
}: {
  backgroundClassName?: string;
  children: string;
}) {
  return (
    <main className={`flex min-h-screen items-center justify-center px-5 text-[#191f28] ${backgroundClassName}`}>
      <TradingStatusBox>{children}</TradingStatusBox>
    </main>
  );
}
