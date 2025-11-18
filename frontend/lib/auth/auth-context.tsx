"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { clearTokenCookies, login as loginRequest, refreshToken, setTokenCookies } from "../api/auth";
import { AUTH_HTTP_ONLY, DEFAULT_TOKEN_PERSIST } from "./config";
import {
  clearTokens,
  getRefreshToken,
  loadTokens,
  saveTokens,
} from "./token-store";

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (args: { email: string; password: string; persist?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const initialTokens = loadTokens();
  const [accessToken, setAccessToken] = useState(initialTokens?.access ?? null);
  const [refreshTokenState, setRefreshTokenState] = useState(initialTokens?.refresh ?? null);

  const login = useCallback(
    async ({ email, password, persist }: { email: string; password: string; persist?: boolean }) => {
      const tokens = await loginRequest({ email, password });
      const shouldPersist = (persist ?? DEFAULT_TOKEN_PERSIST) && !AUTH_HTTP_ONLY;
      saveTokens(tokens, shouldPersist);
      setAccessToken(tokens.access);
      setRefreshTokenState(tokens.refresh);

      if (AUTH_HTTP_ONLY) {
        await setTokenCookies();
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    const refreshValue = getRefreshToken();
    if (!refreshValue) {
      if (AUTH_HTTP_ONLY) {
        // tokens gestionados por cookies, no hay refresh en memoria
        await setTokenCookies();
        return;
      }
      throw new Error("No refresh token available");
    }
    const tokens = await refreshToken(refreshValue);
    const updated = { access: tokens.access, refresh: refreshValue };
    saveTokens(updated, !AUTH_HTTP_ONLY);
    setAccessToken(updated.access);
  }, []);

  const logout = useCallback(async () => {
    clearTokens();
    setAccessToken(null);
    setRefreshTokenState(null);
    if (AUTH_HTTP_ONLY) {
      await clearTokenCookies();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken: refreshTokenState,
      isAuthenticated: Boolean(accessToken) || AUTH_HTTP_ONLY,
      login,
      refresh,
      logout,
    }),
    [accessToken, refreshTokenState, login, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
