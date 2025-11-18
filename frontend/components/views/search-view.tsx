"use client";

import { SearchClient } from "@/components/search/search-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { NoteIndexItem } from "@/lib/vault/types";

type SearchViewProps = {
  dataset: NoteIndexItem[];
};

export function SearchView({ dataset }: SearchViewProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-brand">{t("nav.search")}</p>
        <h1 className="text-4xl font-semibold">{t("search.title")}</h1>
        <p className="text-muted">{t("search.description")}</p>
      </header>
      <SearchClient dataset={dataset} />
    </div>
  );
}
