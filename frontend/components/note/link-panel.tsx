"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/i18n-provider";
import type { LinkContext } from "@/lib/vault/types";

type NoteLinkPanelProps = {
  variant: "backlinks" | "outbound";
  items: LinkContext[];
};

export function NoteLinkPanel({ variant, items }: NoteLinkPanelProps) {
  const { t } = useI18n();
  const title =
    variant === "backlinks" ? t("note.links.backlinks") : t("note.links.outbound");
  const emptyLabel =
    variant === "backlinks" ? t("note.links.emptyBacklinks") : t("note.links.emptyOutbound");

  return (
    <section className="rounded-2xl border border-border bg-panel p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">
          {items.map((item) => (
            <li key={`${item.sourceId}-${item.targetSlug}-${item.preview.slice(0, 20)}`}>
              {item.targetSlug ? (
                <Link
                  href={`/n/${item.targetSlug}`}
                  className="font-semibold text-brand hover:text-brand-strong focus-ring"
                >
                  {item.targetLabel}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">{item.targetLabel}</span>
              )}
              <p className="text-muted">{item.preview}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
