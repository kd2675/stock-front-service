import type { ResponseEnvelope } from "@/app/types/response";

const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "direct";
const DEFAULT_GATEWAY_API_BASE = "http://localhost:8080";
const DEFAULT_DIRECT_STOCK_API_BASE = "http://localhost:20480";
const DEFAULT_DIRECT_AUTH_API_BASE = "http://localhost:9000";

const isGatewayMode = API_MODE === "gateway";

export const STOCK_API_BASE =
  process.env.NEXT_PUBLIC_STOCK_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (isGatewayMode ? DEFAULT_GATEWAY_API_BASE : DEFAULT_DIRECT_STOCK_API_BASE);

export const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_AUTH_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (isGatewayMode ? DEFAULT_GATEWAY_API_BASE : DEFAULT_DIRECT_AUTH_API_BASE);

export const API_BASE = STOCK_API_BASE;
export const STOCK_CLIENT_ID = "stock-front-service";
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export type ApiResult<T> = {
  ok: boolean;
  status?: number;
  data: T | null;
  message?: string;
  code?: string | number;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  baseUrl?: string;
  timeoutMs?: number;
};

function isEnvelope<T>(value: unknown): value is ResponseEnvelope<T> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.success === "boolean" &&
    (typeof record.code === "number" || typeof record.code === "string") &&
    typeof record.message === "string"
  );
}

function parseResponseBody(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildRequestUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const baseUrl = options.baseUrl ?? STOCK_API_BASE;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(buildRequestUrl(baseUrl, path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      credentials: options.credentials ?? "include",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const parsed = parseResponseBody(await response.text());
    if (isEnvelope<T>(parsed)) {
      return {
        ok: response.status >= 200 && response.status < 300 && parsed.success,
        status: response.status,
        data: response.status >= 200 && response.status < 300 && parsed.success ? parsed.data ?? null : null,
        message: parsed.message,
        code: parsed.code,
      };
    }

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, status: response.status, data: (parsed as T) ?? null };
    }

    return {
      ok: false,
      status: response.status,
      data: null,
      message:
        (typeof parsed === "string" && parsed.trim()) ||
        response.statusText ||
        "요청 처리에 실패했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      message: isAbortError(error)
        ? "요청 시간이 초과되었습니다."
        : error instanceof Error ? error.message : "알 수 없는 네트워크 오류가 발생했습니다.",
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function getJson<T>(path: string, headers?: Record<string, string>): Promise<ApiResult<T>> {
  return requestJson<T>(path, { method: "GET", headers });
}

export function postAuthJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, { method: "POST", body, headers, baseUrl: AUTH_API_BASE });
}

export function postJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, { method: "POST", body, headers });
}

export function patchJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, { method: "PATCH", body, headers });
}

export function deleteJson<T>(path: string, headers?: Record<string, string>): Promise<ApiResult<T>> {
  return requestJson<T>(path, { method: "DELETE", headers });
}
