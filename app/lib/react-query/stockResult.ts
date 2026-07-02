import { ensureAccessToken } from "@/app/lib/auth";
import type { ApiResult } from "@/app/lib/api";

export class StockApiError extends Error {
  readonly status?: number;
  readonly code?: string | number;

  constructor(result: ApiResult<unknown>, fallbackMessage: string) {
    super(result.message ?? fallbackMessage);
    this.name = "StockApiError";
    this.status = result.status;
    this.code = result.code;
  }
}

function unwrapStockResult<T>(result: ApiResult<T>, fallbackMessage: string): T {
  if (!result.ok) {
    throw new StockApiError(result, fallbackMessage);
  }
  return result.data as T;
}

export function getStockErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function createStockErrorMessageHandler(
  setMessage: (message: string) => void,
  fallbackMessage: string,
) {
  return (error: unknown) => {
    setMessage(getStockErrorMessage(error, fallbackMessage));
  };
}

export async function unwrapStockRequest<T>(
  request: Promise<ApiResult<T>>,
  fallbackMessage: string,
): Promise<T> {
  return unwrapStockResult(await request, fallbackMessage);
}

export async function unwrapAuthenticatedStockRequest<T>(
  request: (token: string) => Promise<ApiResult<T>>,
  fallbackMessage: string,
): Promise<T> {
  const token = await requireAccessToken();
  return unwrapStockRequest(request(token), fallbackMessage);
}

export async function requireAccessToken(): Promise<string> {
  const token = await ensureAccessToken();
  if (!token) {
    throw new Error("로그인 후 이용할 수 있습니다.");
  }
  return token;
}
