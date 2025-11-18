import { AUTH_HTTP_ONLY } from "./auth/config";
import { getAccessToken } from "./auth/token-store";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type FetchOptions = RequestInit & {
  parseJson?: boolean;
  withAuth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  { parseJson = true, withAuth = false, ...init }: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...normalizeHeaders(init.headers),
  };

  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: withAuth || AUTH_HTTP_ONLY ? init.credentials ?? "include" : init.credentials,
  });

  if (!response.ok) {
    const error = new Error(`API error ${response.status}`);
    (error as Error & { response?: Response }).response = response;
    throw error;
  }

  if (!parseJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) {
    return {};
  }
  if (Array.isArray(input)) {
    return Object.fromEntries(input);
  }
  if (input instanceof Headers) {
    return Object.fromEntries(input.entries());
  }
  return { ...(input as Record<string, string>) };
}
