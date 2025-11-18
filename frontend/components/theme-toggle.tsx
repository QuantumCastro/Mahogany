"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { type ThemeMode, useTheme } from "@/lib/theme/theme-provider";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  dark: "light",
  light: "system",
  system: "dark",
};

export function ThemeToggle() {
  const { mode, setMode, theme } = useTheme();
  const { t } = useI18n();

  const handleToggle = () => {
    setMode(NEXT_MODE[mode]);
  };

  const label =
    mode === "system"
      ? t("theme.auto")
      : theme === "dark"
        ? t("theme.dark")
        : t("theme.light");

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1 text-sm font-medium text-foreground transition hover:bg-border/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      aria-label={t("theme.toggle")}
    >
      <span aria-hidden="true">{theme === "dark" ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
