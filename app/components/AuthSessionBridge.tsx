"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useAuthSession from "@/app/hooks/useAuthSession";
import { stockKeys } from "@/app/lib/react-query/stockKeys";

export default function AuthSessionBridge() {
  const queryClient = useQueryClient();
  const { authStatus, user } = useAuthSession();

  useEffect(() => {
    if (authStatus === "out") {
      queryClient.clear();
    }
  }, [authStatus, queryClient]);

  useEffect(() => {
    if (user?.userKey) {
      void queryClient.invalidateQueries({ queryKey: stockKeys.account() });
    }
  }, [queryClient, user?.userKey]);

  return null;
}
