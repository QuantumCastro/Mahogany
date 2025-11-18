export const AUTH_HTTP_ONLY = process.env.NEXT_PUBLIC_AUTH_HTTP_ONLY === "true";
export const TOKEN_COOKIE_ENDPOINT = "/auth/token/cookie/";
export const DEFAULT_TOKEN_PERSIST = process.env.NEXT_PUBLIC_AUTH_PERSIST_TOKENS !== "false";
