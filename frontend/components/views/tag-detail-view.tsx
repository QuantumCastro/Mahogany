"use client";

import Link from "next/link";

import { NoteCard } from "@/components/note/note-card";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { NoteIndexItem } from "@/lib/vault/types";

type TagDetailViewProps = {
  tag: string;
  notes: NoteIndexItem[];
};

export function TagDetailView({ tag, notes }: TagDetailViewProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-4xl font-semibold">
          #{tag}{" "}
          <span className="text-muted text-base font-normal">
            ({notes.length} {t("tags.detail.countSuffix")})
          </span>
        </h1>
        <Link
          href="/tags"
          className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-brand hover:text-brand focus-ring"
        >
          {t("tags.clear")}
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
