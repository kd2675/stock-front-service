import { Suspense } from "react";

import { TradingStatusScreen } from "@/app/components/TradingStatusBox";

import AccountRequiredClient from "./AccountRequiredClient";

export default function AccountRequiredPage() {
  return (
    <Suspense fallback={<AccountRequiredFallback />}>
      <AccountRequiredClient />
    </Suspense>
  );
}

function AccountRequiredFallback() {
  return <TradingStatusScreen backgroundClassName="bg-[#f6f7f9]">계좌 확인 중</TradingStatusScreen>;
}
