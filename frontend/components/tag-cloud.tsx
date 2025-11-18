"use client";

import Link from "next/link";

import type { TagStat } from "@/lib/vault/repository";
import { useI18n } from "@/lib/i18n/i18n-provider";

type TagCloudProps = {
  tags: TagStat[];
  limit?: number;
};

export function TagCloud({ tags, limit = 10 }: TagCloudProps) {
  const { t } = useI18n();
  const items = tags.slice(0, limit);
  if (items.length === 0) {
    return <p className="text-sm text-muted">{t("home.tags.empty")}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map((tag) => (
        <li key={tag.name}>
          <Link
            href={`/tags/${encodeURIComponent(tag.name)}`}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            #{tag.name}
            <span className="text-xs text-muted">{tag.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
