"use client";

import Link from "next/link";

import type { NoteIndexItem } from "@/lib/vault/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { formatDate } from "@/lib/utils";

type NoteCardProps = {
  note: NoteIndexItem;
  showSnippet?: boolean;
};

export function NoteCard({ note, showSnippet = true }: NoteCardProps) {
  const { t } = useI18n();
  return (
    <article className="glass-card flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <time dateTime={note.updatedAt}>{formatDate(note.updatedAt)}</time>
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div>
        <Link
          href={`/n/${note.slug}`}
          className="text-lg font-semibold text-foreground transition hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {note.title}
        </Link>
        {showSnippet && <p className="mt-2 text-sm text-muted">{note.excerpt}</p>}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <Link href={`/n/${note.slug}`} className="text-sm font-semibold text-brand hover:text-brand-strong">
          {t("note.card.open")}
        </Link>
        <Link href={`/graph?n=${note.slug}`} className="text-xs text-muted hover:text-brand">
          {t("note.card.highlight")}
        </Link>
      </div>
    </article>
  );
}
