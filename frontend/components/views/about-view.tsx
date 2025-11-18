"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/i18n-provider";

type AboutViewProps = {
  noteCount: number;
};

export function AboutView({ noteCount }: AboutViewProps) {
  const { t } = useI18n();

  return (
    <div className="pt-2 space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-brand">{t("nav.about")}</p>
        <h1 className="text-4xl font-semibold">{t("about.title")}</h1>
        <p className="text-muted">{t("about.description")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-panel p-4">
          <h2 className="text-xl font-semibold">{t("about.section.model.title")}</h2>
          <p className="text-muted">{t("about.section.model.body").replace("{count}", String(noteCount))}</p>
        </article>
        <article className="rounded-2xl border border-border bg-panel p-4">
          <h2 className="text-xl font-semibold">{t("about.section.tech.title")}</h2>
          <p className="text-muted">{t("about.section.tech.body")}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-panel p-4">
        <h2 className="text-xl font-semibold">{t("about.section.limits.title")}</h2>
        <p className="text-muted">{t("about.section.limits.body")}</p>
      </section>

      <section className="rounded-2xl border border-border bg-panel p-6">
        <h2 className="text-xl font-semibold">{t("about.section.a11y.title")}</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted">
          <li>{t("about.section.a11y.item1")}</li>
          <li>{t("about.section.a11y.item2")}</li>
          <li>{t("about.section.a11y.item3")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-panel p-6">
        <h2 className="text-xl font-semibold">{t("about.steps.title")}</h2>
        <ol className="list-decimal space-y-2 pl-6 text-muted">
          <li>{t("about.steps.item1")}</li>
          <li>{t("about.steps.item2")}</li>
          <li>{t("about.steps.item3")}</li>
        </ol>
      </section>

      <Link href="/" className="inline-flex text-sm font-semibold text-brand hover:text-brand-strong">
        ← {t("nav.home")}
      </Link>
    </div>
  );
}
