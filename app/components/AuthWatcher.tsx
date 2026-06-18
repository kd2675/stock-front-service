"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_EXPIRED_REDIRECT_KEY, onAuthExpired } from "@/app/lib/authEvents";

export default function AuthWatcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      if (pathname === "/login") {
        return;
      }
      window.sessionStorage.setItem(AUTH_EXPIRED_REDIRECT_KEY, "1");
      router.push("/login?expired=1");
    });

    return () => {
      unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
