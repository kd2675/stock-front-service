import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { buildAccountRequiredPath } from "@/app/lib/accountRouting";
import type { AuthStatus } from "@/app/types/auth";

type UseAccountRequiredRedirectOptions = {
  accountStatusPending: boolean;
  authStatus: AuthStatus;
  hasTradingAccount: boolean;
  isHydrated: boolean;
  nextPath: string;
};

export function useAccountRequiredRedirect({
  accountStatusPending,
  authStatus,
  hasTradingAccount,
  isHydrated,
  nextPath,
}: UseAccountRequiredRedirectOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || authStatus !== "in" || accountStatusPending || hasTradingAccount) {
      return;
    }
    router.replace(buildAccountRequiredPath(nextPath));
  }, [accountStatusPending, authStatus, hasTradingAccount, isHydrated, nextPath, router]);
}
