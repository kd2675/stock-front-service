"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthSession from "@/app/hooks/useAuthSession";
import { setAuthSnapshot } from "@/app/redux/authSlice";
import { useAppDispatch } from "@/app/redux/hooks";

export default function AuthReduxBridge() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { authStatus, isHydrated, user } = useAuthSession();

  useEffect(() => {
    dispatch(setAuthSnapshot({ status: authStatus, user, isHydrated }));
  }, [authStatus, dispatch, isHydrated, user]);

  useEffect(() => {
    if (authStatus === "out") {
      queryClient.clear();
    }
  }, [authStatus, queryClient]);

  useEffect(() => {
    if (user?.userKey) {
      void queryClient.invalidateQueries({ queryKey: ["stock", "account"] });
    }
  }, [queryClient, user?.userKey]);

  return null;
}
