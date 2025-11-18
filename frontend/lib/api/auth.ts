import { apiFetch } from "../api";
import { TOKEN_COOKIE_ENDPOINT } from "../auth/config";

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  access: string;
  refresh: string;
};

type RefreshResponse = {
  access: string;
};

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/token/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function refreshToken(refresh: string): Promise<RefreshResponse> {
  return apiFetch<RefreshResponse>("/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export async function setTokenCookies(): Promise<void> {
  await apiFetch(TOKEN_COOKIE_ENDPOINT, {
    method: "POST",
    withAuth: true,
    parseJson: true,
  });
}

export async function clearTokenCookies(): Promise<void> {
  await apiFetch(TOKEN_COOKIE_ENDPOINT, {
    method: "DELETE",
    withAuth: true,
    parseJson: false,
  });
}
