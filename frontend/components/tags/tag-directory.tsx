"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { TagStat } from "@/lib/vault/repository";
import { useI18n } from "@/lib/i18n/i18n-provider";

type TagDirectoryProps = {
  tags: TagStat[];
};

export function TagDirectory({ tags }: TagDirectoryProps) {
  const [mode, setMode] = useState<"count" | "alpha">("count");
  const { t } = useI18n();

  const sorted = useMemo(() => {
    const cloned = [...tags];
    if (mode === "alpha") {
      cloned.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      cloned.sort((a, b) => b.count - a.count);
    }
    return cloned;
  }, [mode, tags]);

  if (tags.length === 0) {
    return <p className="text-muted">{t("tags.empty")}</p>;
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("count")}
          className={`rounded-full border px-4 py-1 text-sm font-semibold ${mode === "count" ? "border-brand text-brand" : "border-border text-muted"}`}
        >
          {t("tags.sortCount")}
        </button>
        <button
          type="button"
          onClick={() => setMode("alpha")}
          className={`rounded-full border px-4 py-1 text-sm font-semibold ${mode === "alpha" ? "border-brand text-brand" : "border-border text-muted"}`}
        >
          {t("tags.sortAlpha")}
        </button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((tag) => (
          <li key={tag.name} className="rounded-2xl border border-border bg-panel p-4">
            <div className="text-sm uppercase tracking-wide text-muted">#{tag.name}</div>
            <div className="text-3xl font-semibold text-foreground">{tag.count}</div>
            <Link
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="mt-3 inline-flex text-sm font-semibold text-brand hover:text-brand-strong focus-ring"
            >
              {t("tags.viewNotes")} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
