import { getAccessToken } from "@/lib/auth-storage";

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestInit = RequestInit & { skipAuth?: boolean };

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { skipAuth, ...rest } = init;
  const url = path.startsWith("/api") ? path : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(rest.headers);
  if (!headers.has("Content-Type") && rest.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { ...rest, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const body = data as Partial<ApiErrorBody> | null;
    const message = body?.message ?? res.statusText;
    throw new ApiError(message, res.status, body?.code);
  }

  return data as T;
}
