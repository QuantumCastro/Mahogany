"use client";

import Link from "next/link";

import { NoteCard } from "@/components/note/note-card";
import { TagCloud } from "@/components/tag-cloud";
import type { TagStat } from "@/lib/vault/repository";
import type { NoteIndexItem } from "@/lib/vault/types";
import { useI18n } from "@/lib/i18n/i18n-provider";

type HomeViewProps = {
  vaultName: string;
  noteCount: number;
  notes: NoteIndexItem[];
  tags: TagStat[];
};

export function HomeView({ vaultName, noteCount, notes, tags }: HomeViewProps) {
  const { t } = useI18n();
  const isEmpty = notes.length === 0;

  return (
    <div className="space-y-10">
      <section className="glass-card relative overflow-hidden">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-brand">
            {t("home.hero.vault")} · {vaultName}
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground">{t("home.hero.title")}</h1>
          <p className="text-lg text-muted">{t("home.hero.subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white focus-ring"
            >
              {t("home.hero.ctaExplore")}
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand focus-ring"
            >
              {t("home.hero.ctaSearch")}
            </Link>
            <Link
              href="/graph"
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand focus-ring"
            >
              {t("home.hero.ctaGraph")}
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-brand/20 to-transparent sm:block" />
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {t("home.latest.title")} ({noteCount})
          </h2>
          <Link href="/search" className="text-sm font-semibold text-brand hover:text-brand-strong">
            {t("home.latest.viewAll")}
          </Link>
        </header>
        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted">{t("home.latest.empty")}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/" className="rounded-full border border-border px-4 py-2 text-sm focus-ring">
                {t("home.latest.retry")}
              </Link>
              <Link href="/about" className="rounded-full border border-border px-4 py-2 text-sm focus-ring">
                {t("home.latest.about")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("home.tags.title")}</h2>
          <Link href="/tags" className="text-sm text-brand hover:text-brand-strong">
            {t("home.tags.viewAll")}
          </Link>
        </div>
        <TagCloud tags={tags} />
      </section>
    </div>
  );
}
