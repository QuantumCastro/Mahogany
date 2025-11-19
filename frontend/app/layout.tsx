import type { Metadata } from "next";
import "./globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";

import { SkipLink } from "@/components/skip-link";
import { SearchOverlay } from "@/components/search/search-overlay";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getVaultInfo } from "@/lib/vault/repository";

import { Providers } from "./providers";

const vaultInfo = getVaultInfo();

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var storageKey = "vault:theme";
    var stored = localStorage.getItem(storageKey);
    var mode = stored === "light" || stored === "dark" ? stored : "system";
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var theme = mode === "system" ? (media.matches ? "dark" : "light") : mode;
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export const metadata: Metadata = {
  title: "MAHOGANY",
  description: "Obsydian-style demo web",
  icons: {
    icon: "/1-logo.ico",         
    shortcut: "/1-logo.ico",
  },
};


type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-surface font-sans text-foreground antialiased">
        <Providers>
          <SkipLink />
          <div className="flex min-h-screen flex-col">
            <SiteHeader vaultName={vaultInfo.name} noteCount={vaultInfo.noteCount} />
            <main id="main" className="mx-auto w-full max-w-6xl flex-0 px-4 py-0">
              {children}
            </main>
            <SiteFooter builtAt={vaultInfo.build.builtAt} version={vaultInfo.build.version} />
          </div>
          <SearchOverlay />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}




