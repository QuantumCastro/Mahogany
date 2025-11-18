"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { cn, isFocusableElement } from "@/lib/utils";

type ShortcutDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutLayer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isFocusableElement(event.target)) return;
      if (event.key === "/" && !event.metaKey) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("vault:open-search"));
      } else if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        if (pathname !== "/graph") {
          router.push("/graph");
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pathname, router]);

  return (
    <>
      {children}
      <ShortcutDialog open={showDialog} onClose={() => setShowDialog(false)} />
      <nav aria-label="Quick actions" className="sr-only">
        <Link href="/graph">{t("nav.graph")}</Link>
      </nav>
    </>
  );
}

function ShortcutDialog({ open, onClose }: ShortcutDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("shortcuts.title")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-panel/90 p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("shortcuts.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1 text-sm hover:bg-border/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Esc
          </button>
        </header>
        <ul className="space-y-2 text-sm text-muted">
          <ShortcutRow label={t("shortcuts.search")} />
          <ShortcutRow label={t("shortcuts.graph")} />
        </ul>
      </div>
    </div>
  );
}

function ShortcutRow({ label }: { label: string }) {
  const [keys, description] = label.split("\u2022").map((segment) => segment.trim());
  const keyTokens = keys?.split(" ").filter(Boolean) ?? [];
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
      <span className="text-foreground">{description ?? label}</span>
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {keyTokens.map((token, index) => (
          <kbd
            key={`${token}-${index}`}
            className={cn(
              "rounded-md border border-border bg-panel px-2 py-1",
              token.length > 1 && "text-[10px]",
            )}
          >
            {token}
          </kbd>
        ))}
      </span>
    </li>
  );
}
