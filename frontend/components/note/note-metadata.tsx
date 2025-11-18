"use client";

import Link from "next/link";

import type { NoteContent } from "@/lib/vault/types";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { formatDate } from "@/lib/utils";

type NoteMetadataProps = {
  note: NoteContent;
};

export function NoteMetadata({ note }: NoteMetadataProps) {
  const { t } = useI18n();
  const propertyEntries = Object.entries(note.properties ?? {}).filter(
    ([key, value]) => Boolean(key) && value !== undefined && value !== "",
  );

  return (
    <section className="rounded-2xl border border-border bg-panel p-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>
          {t("note.meta.updated")} {formatDate(note.updatedAt)}
        </span>
        {note.aliases.length > 0 && (
          <span>
            {t("note.meta.aliases")}:{" "}
            <span className="font-semibold text-foreground">{note.aliases.join(", ")}</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="tag-chip focus-ring hover:border-brand hover:text-brand"
          >
            #{tag}
          </Link>
        ))}
      </div>
      {propertyEntries.length > 0 && (
        <dl className="mt-4 space-y-1 text-sm">
          <dt className="uppercase tracking-wide text-xs text-muted">{t("note.meta.properties")}</dt>
          {propertyEntries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <dd className="min-w-[5rem] text-xs uppercase tracking-wide text-muted">{key}</dd>
              <dd className="flex-1 text-foreground">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
