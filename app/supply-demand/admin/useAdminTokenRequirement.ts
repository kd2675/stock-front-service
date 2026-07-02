import { useCallback } from "react";

import { ensureAccessToken } from "@/app/lib/auth";
import type { AdminActionMessageSetter } from "@/app/supply-demand/admin/AdminActionTypes";

export function useAdminTokenRequirement({
  setMessage,
}: {
  setMessage: AdminActionMessageSetter;
}) {
  return useCallback(async (missingTokenMessage: string) => {
    const token = await ensureAccessToken();
    if (!token) {
      setMessage(missingTokenMessage);
    }
    return token;
  }, [setMessage]);
}
