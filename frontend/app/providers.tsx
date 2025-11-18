"use client";

import { Analytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

import { ShortcutLayer } from "@/components/shortcut-layer";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { ThemeProvider } from "@/lib/theme/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ShortcutLayer>
          {children}
          <Analytics />
        </ShortcutLayer>
      </I18nProvider>
    </ThemeProvider>
  );
}
