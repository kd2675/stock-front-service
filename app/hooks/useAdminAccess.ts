"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { bootstrapAccessToken, getUserFromToken, isAdminRole } from "@/app/lib/auth";

type AdminAccessStatus = "checking" | "allowed" | "denied";

export default function useAdminAccess() {
  const router = useRouter();
  const [status, setStatus] = useState<AdminAccessStatus>("checking");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await bootstrapAccessToken();
      if (cancelled) {
        return;
      }
      if (!token) {
        router.replace("/login");
        return;
      }
      const user = getUserFromToken(token);
      setAccessToken(token);
      setStatus(isAdminRole(user?.role) ? "allowed" : "denied");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return {
    accessToken,
    adminStatus: status,
  };
}
