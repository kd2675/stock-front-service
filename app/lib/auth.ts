import { postJson, STOCK_CLIENT_ID } from "@/app/lib/api";
import { emitAuthChanged, emitAuthExpired } from "@/app/lib/authEvents";
import type { AuthUser, LoginResponse } from "@/app/types/auth";

const TOKEN_EXPIRY_LEEWAY_SECONDS = 300;
let accessTokenMemory: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let bootstrapRefreshDone = false;
let bootstrapRefreshInFlight: Promise<string | null> | null = null;
let authGeneration = 0;

export type AuthActionResult = {
  ok: boolean;
  message?: string;
  token?: string;
  user?: AuthUser | null;
};

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function setAccessToken(token: string): void {
  accessTokenMemory = token;
  bootstrapRefreshDone = false;
  authGeneration += 1;
  emitAuthChanged();
}

export function clearAccessToken(): void {
  accessTokenMemory = null;
  bootstrapRefreshDone = false;
  bootstrapRefreshInFlight = null;
  authGeneration += 1;
  emitAuthChanged();
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

export function getUserFromToken(token?: string | null): AuthUser | null {
  const rawToken = token ?? getAccessToken();
  if (!rawToken) {
    return null;
  }
  const parts = rawToken.split(".");
  if (parts.length < 2) {
    return null;
  }
  const payload = decodeBase64Url(parts[1]);
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return {
      username: typeof parsed.sub === "string" ? parsed.sub : undefined,
      userKey: typeof parsed.userKey === "string" ? parsed.userKey : undefined,
      role: typeof parsed.role === "string" ? parsed.role : undefined,
      exp: typeof parsed.exp === "number" ? parsed.exp : undefined,
    };
  } catch {
    return null;
  }
}

export function normalizeRole(role?: string | null): string | null {
  if (!role) {
    return null;
  }
  const normalized = role.trim().toUpperCase();
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

export function isUserRole(role?: string | null): boolean {
  return normalizeRole(role) === "USER";
}

export function isTokenExpired(exp?: number, leewaySeconds = TOKEN_EXPIRY_LEEWAY_SECONDS): boolean {
  if (!exp) {
    return false;
  }
  return exp <= Math.floor(Date.now() / 1000) + leewaySeconds;
}

export function scheduleTokenExpiry(
  onExpire: () => void,
  exp?: number,
  leewaySeconds = TOKEN_EXPIRY_LEEWAY_SECONDS,
): () => void {
  if (!exp) {
    return () => undefined;
  }
  const now = Math.floor(Date.now() / 1000);
  const delayMs = Math.max((exp - now - leewaySeconds) * 1000, 0);
  const timeoutId = window.setTimeout(onExpire, delayMs);
  return () => window.clearTimeout(timeoutId);
}

export function notifyAuthExpired(reason: "expired" | "refresh_failed" = "expired"): void {
  emitAuthExpired(reason);
}

export async function login(username: string, password: string): Promise<AuthActionResult> {
  const result = await postJson<LoginResponse>(
    "/auth/login",
    { username, password },
    { "X-Client-Id": STOCK_CLIENT_ID },
  );
  if (!result.ok || !result.data?.accessToken) {
    return { ok: false, message: result.message ?? "로그인에 실패했습니다." };
  }
  setAccessToken(result.data.accessToken);
  return {
    ok: true,
    message: result.message,
    token: result.data.accessToken,
    user: getUserFromToken(result.data.accessToken),
  };
}

export async function signup(username: string, password: string, email: string): Promise<AuthActionResult> {
  const result = await postJson<unknown>(
    "/api/users",
    {
      username,
      password,
      email,
      role: "USER",
    },
    { "X-Client-Id": STOCK_CLIENT_ID },
  );
  return { ok: result.ok, message: result.message };
}

export async function logout(): Promise<void> {
  const token = getAccessToken();
  const headers = {
    "X-Client-Id": STOCK_CLIENT_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  await postJson<void>("/auth/logout", {}, headers);
}

async function requestRefreshAccessToken(): Promise<string | null> {
  const requestGeneration = authGeneration;
  const result = await postJson<LoginResponse>("/auth/refresh", {}, { "X-Client-Id": STOCK_CLIENT_ID });
  if (!result.ok || !result.data?.accessToken) {
    return null;
  }
  if (requestGeneration !== authGeneration) {
    return null;
  }
  setAccessToken(result.data.accessToken);
  return result.data.accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = requestRefreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function bootstrapAccessToken(): Promise<string | null> {
  if (accessTokenMemory) {
    return accessTokenMemory;
  }
  if (bootstrapRefreshDone) {
    return null;
  }
  if (bootstrapRefreshInFlight) {
    return bootstrapRefreshInFlight;
  }
  bootstrapRefreshInFlight = refreshAccessToken().finally(() => {
    bootstrapRefreshDone = true;
    bootstrapRefreshInFlight = null;
  });
  return bootstrapRefreshInFlight;
}

export async function ensureAccessToken(): Promise<string | null> {
  if (accessTokenMemory) {
    return accessTokenMemory;
  }
  return bootstrapAccessToken();
}
