"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_EXPIRED_REDIRECT_KEY, onAuthExpired } from "@/app/lib/authEvents";
import { buildLoginPath, currentBrowserPath } from "@/app/lib/authRouting";

export default function AuthWatcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      if (pathname === "/login") {
        return;
      }
      window.sessionStorage.setItem(AUTH_EXPIRED_REDIRECT_KEY, "1");
      router.push(buildLoginPath(currentBrowserPath(), true));
    });

    return () => {
      unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
