import type { ApiResult } from "@/app/lib/api";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import type { AdminActionMessageSetter } from "@/app/supply-demand/admin/AdminActionTypes";

export function getAdminActionFailureMessage<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
  options: { requireData?: boolean } = {},
): string | null {
  if (!result.ok) {
    return result.message ?? fallbackMessage;
  }
  if (options.requireData && result.data == null) {
    return fallbackMessage;
  }
  return null;
}

export function reportAdminActionFailure<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
  setMessage: AdminActionMessageSetter,
  options: { requireData?: boolean } = {},
) {
  const failureMessage = getAdminActionFailureMessage(result, fallbackMessage, options);
  if (!failureMessage) {
    return false;
  }
  setMessage(failureMessage);
  return true;
}

export type AdminActionDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function getAdminActionData<T>(
  result: ApiResult<T>,
  fallbackMessage: string,
): AdminActionDataResult<T> {
  const failureMessage = getAdminActionFailureMessage(result, fallbackMessage, { requireData: true });
  if (failureMessage) {
    return { ok: false, message: failureMessage };
  }
  return { ok: true, data: result.data as T };
}

export function getAdminUnknownErrorMessage(error: unknown, fallbackMessage: string) {
  return getStockErrorMessage(error, fallbackMessage);
}
