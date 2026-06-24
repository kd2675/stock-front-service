import axios from "axios";
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
};

const stockApiClient = axios.create({
  baseURL: STOCK_API_BASE,
  withCredentials: true,
  validateStatus: () => true,
  headers: {
    "Content-Type": "application/json",
  },
});

const authApiClient = axios.create({
  baseURL: AUTH_API_BASE,
  withCredentials: true,
  validateStatus: () => true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const baseUrl = options.baseUrl ?? STOCK_API_BASE;
  const client = baseUrl === AUTH_API_BASE ? authApiClient : stockApiClient;

  try {
    const response = await client.request({
      url: path,
      method,
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      withCredentials: (options.credentials ?? "include") === "include",
      data: options.body,
    });

    const parsed = typeof response.data === "string" ? parseResponseBody(response.data) : response.data ?? null;
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
      message: error instanceof Error ? error.message : "알 수 없는 네트워크 오류가 발생했습니다.",
    };
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
