"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";

export function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="skip-link absolute left-4 top-4 -translate-y-20 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white focus-visible:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      {t("layout.skip")}
    </a>
  );
}
