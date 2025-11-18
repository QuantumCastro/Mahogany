"use client";

import Link from "next/link";

import { SearchClient } from "@/components/search/search-client";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { getAllNoteSummaries } from "@/lib/vault/repository";

const DATASET = getAllNoteSummaries();

export function NotFoundView() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-brand">404</p>
        <h1 className="mt-4 text-4xl font-semibold">{t("notFound.title")}</h1>
        <p className="mt-2 text-muted">{t("notFound.description")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand focus-ring"
          >
            {t("notFound.homeCta")}
          </Link>
        </div>
      </div>
      <SearchClient dataset={DATASET} />
    </div>
  );
}
