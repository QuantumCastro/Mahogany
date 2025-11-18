"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { parseSearchQuery, runSearch } from "@/lib/vault/search";
import type { NoteIndexItem } from "@/lib/vault/types";

type SearchClientProps = {
  dataset: NoteIndexItem[];
  initialQuery?: string;
};

export function SearchClient({ dataset, initialQuery = "" }: SearchClientProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const { t } = useI18n();

  useEffect(() => {
    const handler = () => inputRef.current?.focus();
    window.addEventListener("vault:focus-search", handler as EventListener);
    return () => window.removeEventListener("vault:focus-search", handler as EventListener);
  }, []);

  useEffect(() => {
    if (initialQuery) return;
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("q");
      if (q) setQuery(q);
    } catch {
      // ignore
    }
  }, [initialQuery]);

  const parsed = useMemo(() => parseSearchQuery(query), [query]);
  const results = useMemo(() => runSearch(dataset, parsed), [dataset, parsed]);
  const trimmed = query.trim();
  const showEmpty = trimmed.length > 0 && results.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-panel p-4">
        <label htmlFor="search" className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("search.label")}
        </label>
        <input
          ref={inputRef}
          id="search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus-ring"
        />
        <p className="mt-2 text-xs text-muted">{t("search.hint")}</p>
      </div>

      {trimmed.length === 0 ? (
        <div className="rounded-2xl border border-border bg-panel p-6 text-sm text-muted">
          <p className="font-medium text-foreground">{t("search.suggestions")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              {t("search.suggestionExact")}
            </li>
            <li>
              {t("search.suggestionExclude")}
            </li>
            <li>
              {t("search.suggestionTag")}
            </li>
          </ul>
        </div>
      ) : showEmpty ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted">{t("search.empty")}</p>
          <p className="text-xs text-muted">{t("search.emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {results.map((result) => (
            <li key={result.note.id} className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <span>{result.matches.join(" • ")}</span>
                <time dateTime={result.note.updatedAt}>{result.note.updatedAt}</time>
              </div>
              <Link
                href={`/n/${result.note.slug}`}
                className="mt-1 block text-xl font-semibold text-foreground hover:text-brand focus-ring"
              >
                {result.note.title}
              </Link>
              <p
                className="mt-2 text-sm text-muted"
                dangerouslySetInnerHTML={{ __html: result.snippet }}
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {result.note.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-border px-3 py-1 text-muted hover:border-brand hover:text-brand focus-ring"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
