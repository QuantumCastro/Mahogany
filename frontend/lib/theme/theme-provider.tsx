"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type ThemeMode = Theme | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "vault:theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored) {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (targetMode: ThemeMode) => {
      const resolved: Theme = targetMode === "system" ? (media.matches ? "dark" : "light") : targetMode;
      setTheme(resolved);
      document.documentElement.dataset.theme = resolved;
      if (targetMode !== "system") {
        window.localStorage.setItem(STORAGE_KEY, targetMode);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    };

    applyTheme(mode);
    if (mode === "system") {
      const listener = (_event: MediaQueryListEvent) => {
        if (mode === "system") {
          applyTheme("system");
        }
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    return;
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      setMode,
    }),
    [mode, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
