"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useAuthSession from "@/app/hooks/useAuthSession";
import { clearStockQueryCache, invalidateAccountQueries } from "@/app/lib/react-query/stockInvalidations";

export default function AuthSessionBridge() {
  const queryClient = useQueryClient();
  const { authStatus, user } = useAuthSession();

  useEffect(() => {
    if (authStatus === "out") {
      clearStockQueryCache(queryClient);
    }
  }, [authStatus, queryClient]);

  useEffect(() => {
    if (user?.userKey) {
      void invalidateAccountQueries(queryClient);
    }
  }, [queryClient, user?.userKey]);

  return null;
}
