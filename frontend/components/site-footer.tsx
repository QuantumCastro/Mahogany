"use client";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { formatDate } from "@/lib/utils";

type SiteFooterProps = {
  builtAt: string;
  version: string;
};

export function SiteFooter({ builtAt, version }: SiteFooterProps) {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-surface/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{t("about.description")}</p>
          <p className="text-xs text-muted">
            {t("footer.buildLabel")} {version} - {formatDate(builtAt)}
          </p>
        </div>
        <div />
      </div>
    </footer>
  );
}
