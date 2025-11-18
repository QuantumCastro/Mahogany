"use client";

import dynamic from "next/dynamic";

import { useI18n } from "@/lib/i18n/i18n-provider";

const GraphPanel = dynamic(
  () => import("@/components/graph/graph-panel").then((mod) => mod.GraphPanel),
  {
    ssr: false,
    loading: () => <GraphPanelFallback />,
  },
);

function GraphPanelFallback() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-border bg-panel p-6 text-center text-muted">
      {t("graph.loading")}
    </div>
  );
}

export function GraphView() {
  const { t } = useI18n();
  return (
    <div className="pt-4 space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-brand">{t("nav.graph")}</p>
        <h1 className="text-4xl font-semibold">{t("graph.title")}</h1>
        <p className="text-muted">{t("graph.description")}</p>
      </header>
      <GraphPanel />
    </div>
  );
}
