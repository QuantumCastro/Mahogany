"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n/i18n-provider";
import { getAllNoteSummaries } from "@/lib/vault/repository";

const DATASET = getAllNoteSummaries();

export function SearchOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingSlugRef = useRef<string | null>(null);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener("vault:open-search", openHandler as EventListener);
    window.addEventListener("vault:close-search", closeHandler as EventListener);
    return () => {
      window.removeEventListener("vault:open-search", openHandler as EventListener);
      window.removeEventListener("vault:close-search", closeHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.classList.add("search-open");
      inputRef.current?.focus();
    } else {
      document.body.classList.remove("search-open");
      setQuery("");
    }
    return () => {
      document.body.classList.remove("search-open");
    };
  }, [open]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DATASET.slice(0, 8);
    return DATASET.filter((note) => note.title.toLowerCase().includes(normalized)).slice(0, 12);
  }, [query]);

  const handleClose = () => setOpen(false);
  const hasNotes = DATASET.length > 0;

  const emitOpenNote = useCallback((slug: string) => {
    window.dispatchEvent(
      new CustomEvent("vault:open-note", {
        detail: { slug },
      }) as Event,
    );
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    if (!pendingSlugRef.current) return;
    const slug = pendingSlugRef.current;
    const timer = window.setTimeout(() => {
      emitOpenNote(slug);
      pendingSlugRef.current = null;
    }, 80);
    return () => window.clearTimeout(timer);
  }, [emitOpenNote, pathname]);

  const handleSelect = async (slug: string) => {
    if (pathname !== "/") {
      pendingSlugRef.current = slug;
      window.sessionStorage.setItem("vault:pending-note", slug);
      handleClose();
      await router.push("/");
      return;
    }
    emitOpenNote(slug);
    handleClose();
  };

  if (!open) return null;

  return (
    <div
      className="bg-surface/70 fixed inset-0 z-40 flex items-start justify-center px-4 pb-8 pt-20 backdrop-blur"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-border bg-panel p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("search.title")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("search.title")}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t("search.overlayClose")}
          </button>
        </div>
        <label
          htmlFor="overlay-search"
          className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {t("search.label")}
        </label>
        <input
          id="overlay-search"
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.overlayPlaceholder")}
          className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <p className="mt-1 text-xs text-muted">{t("search.overlayHint")}</p>
        <div className="mt-4 max-h-72 space-y-2 overflow-auto">
          {!hasNotes ? (
            <p className="text-sm text-muted">{t("search.noVault")}</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted">{t("search.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(note.slug)}
                    className="bg-panel/70 flex w-full flex-col rounded-xl border border-border px-4 py-3 text-left hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="text-base font-semibold">{note.title}</span>
                    <span className="text-xs text-muted">/{note.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
