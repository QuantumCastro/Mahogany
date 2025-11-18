"use client";

import type { Locale } from "@/lib/i18n/dictionary";
import { useI18n } from "@/lib/i18n/i18n-provider";

const locales: Locale[] = ["en", "es"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex rounded-lg border border-border bg-panel text-xs font-semibold">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`px-3 py-1 transition ${locale === code ? "bg-brand text-white" : "text-muted hover:text-foreground"}`}
          aria-pressed={locale === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
