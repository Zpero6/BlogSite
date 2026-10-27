"use client";

const API_PREFIX = "/api/v1";
const CSRF_COOKIE = "XSRF-TOKEN";

export type CurrentUser = {
  id: number;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN" | string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return null;
}

function expireCsrfCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${CSRF_COOKIE}=; Max-Age=0; path=/`;
}

let csrfHeaderName = "X-XSRF-TOKEN";
let csrfToken: string | null = null;

async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cookieToken = readCookie(CSRF_COOKIE);
    if (cookieToken) {
      csrfToken = cookieToken;
      return cookieToken;
    }
    if (csrfToken) return csrfToken;
  }

  if (forceRefresh) {
    expireCsrfCookie();
    csrfToken = null;
  }

  const response = await fetch(`${API_PREFIX}/auth/csrf`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new ApiError(response.status, "CSRF_UNAVAILABLE", "无法获取 CSRF 令牌");
  }
  const body = (await response.json()) as { token: string; headerName: string };
  csrfHeaderName = body.headerName || csrfHeaderName;
  csrfToken = body.token || readCookie(CSRF_COOKIE);
  if (!csrfToken) throw new ApiError(0, "CSRF_UNAVAILABLE", "服务器未返回 CSRF 令牌");
  return csrfToken;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { code?: string; message?: string };
    return new ApiError(
      response.status,
      body.code || `HTTP_${response.status}`,
      body.message || `请求失败（${response.status}）`,
    );
  } catch {
    return new ApiError(response.status, `HTTP_${response.status}`, `请求失败（${response.status}）`);
  }
}

async function perform(path: string, init: RequestInit, forceCsrf: boolean): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set(csrfHeaderName, await ensureCsrfToken(forceCsrf));
  }

  return fetch(`${API_PREFIX}${path}`, {
    ...init,
    method,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  let response = await perform(path, init, false);

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && response.status === 403) {
    const cloned = response.clone();
    const body = (await cloned.json().catch(() => null)) as { code?: string } | null;
    if (body?.code === "CSRF_TOKEN_INVALID") {
      response = await perform(path, init, true);
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Returns null for anonymous visitors instead of throwing. */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiFetch<CurrentUser>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "请求失败，请稍后重试";
}
