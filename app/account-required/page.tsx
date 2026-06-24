import { Suspense } from "react";

import AccountRequiredClient from "./AccountRequiredClient";

export default function AccountRequiredPage() {
  return (
    <Suspense fallback={<AccountRequiredFallback />}>
      <AccountRequiredClient />
    </Suspense>
  );
}

function AccountRequiredFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 text-[#191f28]">
      <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
        계좌 확인 중
      </div>
    </main>
  );
}
