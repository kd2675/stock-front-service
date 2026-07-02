import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AUTH_EXPIRED_REDIRECT_KEY } from "@/app/lib/authEvents";
import type { AuthStatus } from "@/app/types/auth";

type UseLoginRequiredRedirectOptions = {
  authStatus: AuthStatus;
  isHydrated: boolean;
  preserveExpiredRedirect?: boolean;
};

export function useLoginRequiredRedirect({
  authStatus,
  isHydrated,
  preserveExpiredRedirect = false,
}: UseLoginRequiredRedirectOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || authStatus === "unknown") {
      return;
    }
    if (authStatus !== "out") {
      return;
    }

    if (!preserveExpiredRedirect) {
      router.replace("/login");
      return;
    }

    const expiredRedirect = window.sessionStorage.getItem(AUTH_EXPIRED_REDIRECT_KEY) === "1";
    if (expiredRedirect) {
      window.sessionStorage.removeItem(AUTH_EXPIRED_REDIRECT_KEY);
    }
    router.replace(expiredRedirect ? "/login?expired=1" : "/login");
  }, [authStatus, isHydrated, preserveExpiredRedirect, router]);
}
