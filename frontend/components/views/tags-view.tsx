"use client";

import { TagDirectory } from "@/components/tags/tag-directory";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { TagStat } from "@/lib/vault/repository";

type TagsViewProps = {
  tags: TagStat[];
};

export function TagsView({ tags }: TagsViewProps) {
  const { t } = useI18n();
  return (
    <div className="pt-4 space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-brand">{t("nav.tags")}</p>
        <h1 className="text-4xl font-semibold">{t("tags.title")}</h1>
        <p className="text-muted">{t("tags.description")}</p>
      </header>
      <TagDirectory tags={tags} />
    </div>
  );
}
