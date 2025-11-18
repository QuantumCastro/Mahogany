"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  vaultName: string;
  noteCount: number;
};

type NavItem =
  | {
      type: "link";
      href: Route;
      label: string;
    }
  | {
      type: "action";
      label: string;
      action: () => void;
    };

export function SiteHeader({ vaultName, noteCount }: SiteHeaderProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const navItems: NavItem[] = [
    { type: "link", href: "/", label: t("nav.home") },
    {
      type: "action",
      label: t("nav.search"),
      action: () => window.dispatchEvent(new CustomEvent("vault:open-search")),
    },
    { type: "link", href: "/tags", label: t("nav.tags") },
    { type: "link", href: "/graph", label: t("nav.graph") },
    { type: "link", href: "/about", label: t("nav.about") },
  ];

  const brandLabel = "MAHOGANY";
  const displayName = brandLabel || vaultName;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            {displayName}
          </Link>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {noteCount} {t("header.noteLabel")}
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-muted" aria-label="Main">
          {navItems.map((item, index) => {
            if (item.type === "action") {
              return (
                <button
                  key={`action-${index}`}
                  type="button"
                  onClick={item.action}
                  className="rounded-lg px-3 py-1 text-sm font-medium text-muted transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {item.label}
                </button>
              );
            }
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1 transition",
                  active ? "bg-brand/20 text-brand" : "hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
