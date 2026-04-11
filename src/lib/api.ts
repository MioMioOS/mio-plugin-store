const ADMIN_API =
  process.env.NEXT_PUBLIC_ADMIN_API || "https://cat.wdao.chat";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${ADMIN_API}${path}`;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  // Don't set Content-Type for FormData bodies
  if (options?.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders: Record<string, string> = {};
      if (accessToken) {
        retryHeaders["Authorization"] = `Bearer ${accessToken}`;
      }
      if (options?.body && !(options.body instanceof FormData)) {
        retryHeaders["Content-Type"] = "application/json";
      }
      res = await fetch(url, {
        ...options,
        headers: {
          ...retryHeaders,
          ...(options?.headers as Record<string, string>),
        },
      });
    }
  }

  if (!res.ok) {
    let body: { message?: string; code?: string } = {};
    try {
      body = await res.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiError(
      body.message || res.statusText,
      body.code || "UNKNOWN",
      res.status,
    );
  }

  return res.json() as Promise<T>;
}
