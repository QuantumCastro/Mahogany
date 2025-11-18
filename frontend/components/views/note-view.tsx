"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import type { NoteContent } from "@/lib/vault/types";

import { NoteLinkPanel } from "../note/link-panel";
import { NoteMetadata } from "../note/note-metadata";

type NoteViewProps = {
  note: NoteContent;
};

export function NoteView({ note }: NoteViewProps) {
  const { t } = useI18n();

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <article className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold">{note.title}</h1>
          <a
            href="/graph"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand focus-ring"
          >
            {t("note.viewGraph")}
          </a>
        </div>
        <NoteMetadata note={note} />
        <div className="note-body" dangerouslySetInnerHTML={{ __html: note.html }} />
      </article>
      <aside className="space-y-4">
        <NoteLinkPanel variant="backlinks" items={note.backlinks} />
        <NoteLinkPanel variant="outbound" items={note.outbound} />
      </aside>
    </div>
  );
}
