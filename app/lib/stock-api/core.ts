import { deleteJson, getJson, patchJson, postJson, type ApiResult } from "@/app/lib/api";
import { clearAccessToken, getUserFromToken, notifyAuthExpired, refreshAccessToken } from "@/app/lib/auth";

export function authHeaders(token: string): Record<string, string> {
  const user = getUserFromToken(token);
  return {
    Authorization: `Bearer ${token}`,
    ...(user?.userKey ? { "X-User-Key": user.userKey } : {}),
    ...(user?.role ? { "X-User-Role": user.role } : {}),
  };
}

type QueryParamValue = string | number | boolean | readonly string[] | null | undefined;

function stringifyQueryParam(value: QueryParamValue) {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? null : value.join(",");
  }
  return String(value);
}

export function toQuery(params: Record<string, QueryParamValue>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const queryValue = stringifyQueryParam(value);
    if (queryValue) {
      query.set(key, queryValue);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function withAuthRefresh<T>(
  token: string,
  request: (token: string) => Promise<ApiResult<T>>,
): Promise<ApiResult<T>> {
  const result = await request(token);
  if (result.status !== 401) {
    return result;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    clearAccessToken();
    notifyAuthExpired("refresh_failed");
    return result;
  }

  return request(refreshedToken);
}

export function authenticatedGetJson<T>(token: string, path: string) {
  return withAuthRefresh(token, (nextToken) => getJson<T>(path, authHeaders(nextToken)));
}

export function authenticatedPostJson<T>(token: string, path: string, body: unknown) {
  return withAuthRefresh(token, (nextToken) => postJson<T>(path, body, authHeaders(nextToken)));
}

export function authenticatedPatchJson<T>(token: string, path: string, body: unknown) {
  return withAuthRefresh(token, (nextToken) => patchJson<T>(path, body, authHeaders(nextToken)));
}

export function authenticatedDeleteJson<T>(token: string, path: string) {
  return withAuthRefresh(token, (nextToken) => deleteJson<T>(path, authHeaders(nextToken)));
}
