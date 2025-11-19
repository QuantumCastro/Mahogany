"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { useI18n } from "@/lib/i18n/i18n-provider";

import { cn } from "@/lib/utils";

import type { NoteContent, NoteIndexItem } from "@/lib/vault/types";

type VaultEditorViewProps = {
  vaultName: string;
  notes: NoteIndexItem[];
  noteContents: NoteContent[];
};

type ExplorerItem = {
  id: string;
  label: string;
  type: "note" | "draft";
};

const PRESET_VAULTS = ["Vault Demo", "Research Garden", "Personal Notes"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "note";

const ensureUniqueSlug = (slug: string, used: Set<string>) => {
  if (!used.has(slug)) return slug;
  let suffix = 2;
  let candidate = `${slug}-${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${slug}-${suffix}`;
  }
  return candidate;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const plaintextToHtml = (value: string) => {
  if (!value.trim()) return "";
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const buildExcerpt = (value: string, fallback: string) => {
  const source =
    value
      .split(/\n/)
      .map((line) => line.trim())
      .find((line) => line.length) || fallback;
  return source.length > 160 ? `${source.slice(0, 157)}...` : source;
};

export function VaultEditorView({ vaultName, notes, noteContents }: VaultEditorViewProps) {
  const { t } = useI18n();
  const normalizedVaultName = vaultName?.trim().length ? vaultName : "Vault Demo";
  const [vaultOptions, setVaultOptions] = useState<string[]>(() => {
    const seeds = [normalizedVaultName, ...PRESET_VAULTS];
    const unique: string[] = [];
    for (const seed of seeds) {
      if (seed && !unique.includes(seed)) {
        unique.push(seed);
      }
    }
    return unique;
  });
  const [selectedVault, setSelectedVault] = useState<string>(normalizedVaultName);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [localNotes, setLocalNotes] = useState<NoteIndexItem[]>(() => notes);
  const [localContents, setLocalContents] = useState<NoteContent[]>(() => noteContents);
  const pendingNoteIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingNoteIdRef.current) {
      setSelectedNoteId(pendingNoteIdRef.current);
      pendingNoteIdRef.current = null;
      return;
    }
    setSelectedNoteId(null);
  }, [selectedVault]);
  const isPrimaryVault = selectedVault === normalizedVaultName;
  const visibleNotes = useMemo(
    () => (isPrimaryVault ? localNotes : []),
    [isPrimaryVault, localNotes],
  );
  const visibleContents = useMemo(
    () => (isPrimaryVault ? localContents : []),
    [isPrimaryVault, localContents],
  );
  const resolvedCount = visibleNotes.length;
  const showEmptyState = resolvedCount === 0;
  const lastOpened = visibleNotes[0]?.title ?? "";
  const statsLabel = t("home.editor.stats")
    .replace("{count}", String(resolvedCount))
    .replace("{last}", lastOpened || t("home.editor.none"));
  const noteLookup = useMemo(() => {
    const map = new Map<string, NoteContent>();
    for (const note of visibleContents) {
      map.set(note.id, note);
    }
    return map;
  }, [visibleContents]);
  const slugLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of visibleContents) {
      map.set(note.slug, note.id);
    }
    return map;
  }, [visibleContents]);
  const globalSlugLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of localContents) {
      map.set(note.slug, note.id);
    }
    return map;
  }, [localContents]);
  const noteBodyRef = useRef<HTMLDivElement | null>(null);
  const openNoteInEditor = useCallback(
    (noteId: string) => {
      if (!isPrimaryVault) {
        pendingNoteIdRef.current = noteId;
        setSelectedVault(normalizedVaultName);
        return;
      }
      setSelectedNoteId(noteId);
    },
    [isPrimaryVault, normalizedVaultName],
  );
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      const slug = detail?.slug;
      if (!slug) return;
      const noteId = globalSlugLookup.get(slug);
      if (!noteId) return;
      openNoteInEditor(noteId);
    };
    window.addEventListener("vault:open-note", handler as EventListener);
    return () => window.removeEventListener("vault:open-note", handler as EventListener);
  }, [globalSlugLookup, openNoteInEditor]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingSlug = window.sessionStorage.getItem("vault:pending-note");
    if (!pendingSlug) return;
    window.sessionStorage.removeItem("vault:pending-note");
    const noteId = globalSlugLookup.get(pendingSlug);
    if (!noteId) return;
    openNoteInEditor(noteId);
  }, [globalSlugLookup, openNoteInEditor]);
  const explorerItems = useMemo<ExplorerItem[]>(() => {
    const base = visibleNotes.map((note) => ({
      id: note.id,
      label: note.title,
      type: "note" as const,
    }));
    const draftName = draftTitle.trim() || t("home.editor.untitled");
    return [...base, { id: "draft", label: draftName, type: "draft" as const }];
  }, [visibleNotes, draftTitle, t]);
  const activeNote = selectedNoteId ? noteLookup.get(selectedNoteId) : undefined;
  const contentPath = "/frontend/content";
  const [emptyActionBefore, emptyActionAfter = ""] = t("home.editor.emptyAction").split("{path}");
  const handleVaultChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "__new") {
      const label = window.prompt(t("home.editor.newVaultPrompt"))?.trim();
      if (label) {
        setVaultOptions((prev) => (prev.includes(label) ? prev : [...prev, label]));
        setSelectedVault(label);
      }
      return;
    }
    setSelectedVault(value);
  };
  const handleExplorerSelect = (item: ExplorerItem) => {
    if (item.type === "draft") {
      setSelectedNoteId(null);
      return;
    }
    setSelectedNoteId(item.id);
  };
  const handleCreateNewNote = () => {
    const title = draftTitle.trim() || t("home.editor.untitled");
    const rawContent = draftContent.trim();
    const fallbackPreview = t("home.editor.emptyNote");
    const usedSlugs = new Set(localContents.map((note) => note.slug));
    const slug = ensureUniqueSlug(slugify(title), usedSlugs);
    const id = `local-${Date.now()}`;
    const updatedAt = new Date().toISOString().slice(0, 10);
    const excerpt = buildExcerpt(rawContent, fallbackPreview);
    const html = plaintextToHtml(rawContent || excerpt) || `<p>${escapeHtml(excerpt)}</p>`;
    const plainText = rawContent || title;
    const tags: string[] = [];
    const newIndex: NoteIndexItem = {
      id,
      slug,
      title,
      tags,
      excerpt,
      plainText,
      updatedAt,
    };
    const newContent: NoteContent = {
      id,
      slug,
      title,
      aliases: [],
      tags,
      properties: {},
      excerpt,
      updatedAt,
      headings: [],
      html,
      plainText,
      backlinks: [],
      outbound: [],
    };
    setLocalNotes((prev) => [newIndex, ...prev]);
    setLocalContents((prev) => [newContent, ...prev]);
    setDraftTitle("");
    setDraftContent("");
    openNoteInEditor(id);
  };
  const fallbackPreview = activeNote?.excerpt || t("home.editor.emptyNote");
  const activeNoteHtml = activeNote?.html?.trim().length
    ? activeNote.html
    : activeNote
      ? `<p>${fallbackPreview}</p>`
      : "";
  useEffect(() => {
    const container = noteBodyRef.current;
    if (!container) return;
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (!url.pathname.startsWith("/n/")) return;
      const slug = url.pathname.slice(3).replace(/\/$/, "");
      const noteId = slugLookup.get(slug);
      if (!noteId) return;
      event.preventDefault();
      openNoteInEditor(noteId);
      container.scrollTo({ top: 0, behavior: "smooth" });
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [openNoteInEditor, slugLookup]);
  return (
    <div className="flex min-h-screen justify-center bg-surface px-4 py-6 md:items-center">
      <div className="flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-border bg-panel shadow-2xl md:h-[90vh] md:flex-row md:gap-0">
        <aside className="editor-sidebar flex w-full min-h-0 flex-col border-b border-border max-h-[45vh] overflow-hidden md:w-72 md:max-h-full md:border-b-0 md:border-r md:overflow-visible">
          <div className="border-border/60 border-b px-4 py-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="editor-sidebar__muted text-xs font-semibold uppercase tracking-wider">
                  {t("home.editor.vaultLabel")}
                </p>
                <select
                  value={selectedVault}
                  onChange={handleVaultChange}
                  className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {vaultOptions.map((option) => (
                    <option key={option} value={option} className="bg-surface text-foreground">
                      {option}
                    </option>
                  ))}
                  <option value="__new" className="bg-surface text-foreground">
                    {t("home.editor.createVault")}
                  </option>
                </select>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="editor-sidebar__muted text-xs font-semibold uppercase tracking-wider">
                  {t("home.editor.newNoteLabel")}
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="inline-flex h-10 w-12 items-center justify-center rounded-lg border border-border text-2xl font-semibold text-foreground hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  aria-label={t("home.editor.newNoteLabel")}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-3 py-4">
            {showEmptyState ? (
              <div className="editor-sidebar__muted space-y-2 text-xs">
                <p>{t("home.editor.noFolderMessage")}</p>
                <p>
                  {emptyActionBefore}
                  <code className="mx-1">{contentPath}</code>
                  {emptyActionAfter}
                </p>
              </div>
            ) : (
              <ul className="space-y-1 font-mono text-sm">
                {explorerItems.map((item) => {
                  const isActive =
                    item.type === "draft" ? !selectedNoteId : selectedNoteId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleExplorerSelect(item)}
                        className={cn(
                          "editor-sidebar__item flex w-full items-center justify-between rounded px-2 py-1 text-left transition",
                          isActive ? "editor-sidebar__item--active" : "opacity-80",
                        )}
                      >
                        <span>{item.label}</span>
                        {item.type === "note" && (
                          <span className="editor-sidebar__muted text-[10px]">&gt;</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
        <section className="flex flex-col bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <div className="flex flex-wrap items-center gap-3">
              <span>{statsLabel}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {selectedVault}
              </span>
            </div>
            {activeNote ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t("home.editor.viewerModeBadge")}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNoteId(null)}
                  className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("home.editor.backToComposer")}
                </button>
              </div>
            ) : (
              <div className="font-mono text-xs text-[#7aa2f7]">{t("home.editor.modeBadge")}</div>
            )}
          </div>
          <div className="mt-6 flex flex-1 flex-col gap-4 overflow-visible md:overflow-hidden">
            {activeNote ? (
              <article className="h-auto rounded-2xl border border-border bg-panel p-4 md:h-full md:overflow-hidden md:p-6">
                <header className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("home.editor.openedFrom")}
                  </p>
                  <h2 className="text-3xl font-semibold text-foreground">{activeNote.title}</h2>
                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    {activeNote.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border px-3 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </header>
                <div
                  ref={noteBodyRef}
                  className="note-body-scroll mt-6 h-full overflow-auto pr-2 text-sm text-foreground"
                >
                  <div className="note-body" dangerouslySetInnerHTML={{ __html: activeNoteHtml }} />
                </div>
              </article>
            ) : (
              <div className="flex flex-1 flex-col gap-4">
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder={t("home.editor.titlePlaceholder")}
                  className="rounded-xl border border-border bg-panel px-4 py-3 text-2xl font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
                <textarea
                  value={draftContent}
                  onChange={(event) => setDraftContent(event.target.value)}
                  placeholder={t("home.editor.bodyPlaceholder")}
                  className="flex-1 resize-none rounded-xl border border-border bg-panel px-4 py-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
