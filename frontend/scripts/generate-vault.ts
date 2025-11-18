import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import stripMarkdown from "strip-markdown";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type {
  GraphEdge,
  GraphFile,
  GraphNode,
  Heading,
  LinkContext,
  LinkEdge,
  LinksFile,
  NoteContent,
  NoteFrontmatter,
  NoteIndexItem,
  NotesContentFile,
  VaultJson,
} from "@/lib/vault/types";

type RawNote = {
  filePath: string;
  relativePath: string;
  fileStem: string;
  body: string;
  data: NoteFrontmatter;
  mtime: Date;
};

type NoteDraft = {
  id: string;
  slug: string;
  title: string;
  aliases: string[];
  tags: string[];
  properties: Record<string, string>;
  updatedAt: string;
  filePath: string;
  fileStem: string;
  bodyOriginal: string;
  bodyPrepared: string;
  blockIds: Set<string>;
  plainText: string;
  excerpt: string;
  headings: Heading[];
  headingLookup: Map<string, string>;
  outbound: LinkContext[];
  backlinks: LinkContext[];
  html?: string;
};

type AliasRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  headingLookup: Map<string, string>;
  blockIds: Set<string>;
};

type WikiTarget = {
  rawLabel: string;
  targetLabel: string;
  target?: string | null;
  heading?: string | null;
  block?: string | null;
};

type ReplacementResult = {
  text: string;
  outbound: LinkContext[];
  warnings: string[];
};

const DEFAULT_VAULT_NAME = process.env.VAULT_NAME ?? "demo";
const DEFAULT_VAULT_LABEL = (
  process.env.VAULT_LABEL ?? (DEFAULT_VAULT_NAME === "demo" ? "Vault Demo" : DEFAULT_VAULT_NAME)
);
const BUILD_VERSION = process.env.VAULT_BUILD_VERSION ?? "1.0.0";
const FRONTEND_ROOT = path.resolve(process.cwd());
const VAULT_DIR = path.join(FRONTEND_ROOT, "content", DEFAULT_VAULT_NAME);
const PUBLIC_DATA_DIR = path.join(FRONTEND_ROOT, "public", "data");
const GENERATED_DIR = path.join(FRONTEND_ROOT, ".generated");
const PUBLIC_VAULT_DIR = path.join(FRONTEND_ROOT, "public", "vault");
const DATA_FILENAMES = {
  vault: "vault.json",
  notesIndex: "notes.index.json",
  links: "links.json",
  graph: "graph.json",
  notesContent: "notes-content.json",
};

const WIKILINK_REGEX = /(!)?\[\[([^[\]]+)\]\]/g;
const ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"]);
const RESERVED_FRONTMATTER = new Set(["title", "aliases", "tags", "properties", "updatedat"]);

async function run() {
  const start = performance.now();
  const vaultExists = existsSync(VAULT_DIR);
  if (!vaultExists) {
    throw new Error(`No se encontró la carpeta del vault en ${VAULT_DIR}`);
  }

  const files = await collectMarkdownFiles(VAULT_DIR);
  if (files.length === 0) {
    throw new Error(`El vault ${DEFAULT_VAULT_NAME} no contiene notas .md`);
  }

  const rawNotes = await Promise.all(files.map(loadNoteFile));
  const drafts = await normalizeNotes(rawNotes);
  const aliasIndex = buildAliasIndex(drafts);
  const warnings: string[] = [];

  for (const note of drafts) {
    const replaced = replaceWikilinks(note, aliasIndex);
    warnings.push(...replaced.warnings);
    const htmlResult = await markdownToHtml(replaced.text);
    note.html = htmlResult.html;
    note.headings = htmlResult.headings;
    note.bodyPrepared = replaced.text;
    note.outbound = replaced.outbound;
  }

  buildBacklinks(drafts);

  const notesContent: NoteContent[] = drafts.map((draft) => ({
    id: draft.id,
    slug: draft.slug,
    title: draft.title,
    aliases: draft.aliases,
    tags: draft.tags,
    properties: draft.properties,
    excerpt: draft.excerpt,
    updatedAt: draft.updatedAt,
    headings: draft.headings,
    html: draft.html ?? "",
    plainText: draft.plainText,
    backlinks: draft.backlinks,
    outbound: draft.outbound,
  }));
  const notesContentFile: NotesContentFile = { items: notesContent };

  const notesIndex: NoteIndexItem[] = drafts.map((draft) => ({
    id: draft.id,
    slug: draft.slug,
    title: draft.title,
    tags: draft.tags,
    excerpt: draft.excerpt,
    plainText: draft.plainText,
    updatedAt: draft.updatedAt,
  }));

  const linksFile: LinksFile = {
    edges: drafts.flatMap((draft) =>
      draft.outbound.map<LinkEdge>((link) => ({
        source: draft.id,
        target: link.isBroken
          ? null
          : link.blockId
            ? {
                type: "block",
                id: link.targetId!,
                block: link.blockId,
              }
            : link.headingId
              ? {
                  type: "heading",
                  id: link.targetId!,
                  heading: link.headingId,
                }
              : {
                  type: "note",
                  id: link.targetId!,
                },
        kind: link.kind,
        isBroken: link.isBroken,
      })),
    ),
  };

  const graphFile = buildGraph(drafts);

  await ensureDir(PUBLIC_DATA_DIR);
  await ensureDir(GENERATED_DIR);
  await ensureDir(PUBLIC_VAULT_DIR);

  await Promise.all([
    writeJson(path.join(PUBLIC_DATA_DIR, DATA_FILENAMES.vault), buildVaultMetadata(drafts.length)),
    writeJson(path.join(PUBLIC_DATA_DIR, DATA_FILENAMES.notesIndex), { items: notesIndex }),
    writeJson(path.join(PUBLIC_DATA_DIR, DATA_FILENAMES.links), linksFile),
    writeJson(path.join(PUBLIC_DATA_DIR, DATA_FILENAMES.graph), graphFile),
    writeJson(path.join(GENERATED_DIR, DATA_FILENAMES.notesContent), notesContentFile),
  ]);

  await copyAssetsFolder();

  const duration = (performance.now() - start).toFixed(0);
  console.log(
    `[vault] Generadas ${drafts.length} notas, ${linksFile.edges.length} enlaces y ${graphFile.edges.length} aristas en ${duration} ms.`,
  );
  if (warnings.length > 0) {
    console.warn(`[vault] ${warnings.length} advertencias:`);
    warnings.forEach((warning) => console.warn(`  • ${warning}`));
  }
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") continue;
      files.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function loadNoteFile(filePath: string): Promise<RawNote> {
  const content = await fs.readFile(filePath, "utf-8");
  const parsed = matter(content);
  const stats = await fs.stat(filePath);
  return {
    filePath,
    relativePath: path.relative(VAULT_DIR, filePath),
    fileStem: path.basename(filePath, path.extname(filePath)),
    body: parsed.content.trim(),
    data: parsed.data as NoteFrontmatter,
    mtime: stats.mtime,
  };
}

async function normalizeNotes(rawNotes: RawNote[]): Promise<NoteDraft[]> {
  const slugCounts = new Map<string, number>();
  const drafts: NoteDraft[] = [];

  for (const rawNote of rawNotes) {
    const title = String(rawNote.data.title ?? rawNote.fileStem).trim();
    const baseForSlug = rawNote.data.title
      ? title
      : Array.isArray(rawNote.data.aliases) && rawNote.data.aliases.length > 0
        ? String(rawNote.data.aliases[0])
        : title;
    const slug = uniqueSlug(slugify(baseForSlug), slugCounts);
    const annotations = annotateBlockAnchors(rawNote.body);
    const plainText = await markdownToPlainText(annotations.text);
    const excerpt = buildExcerpt(plainText);

    const tags = normalizeList(rawNote.data.tags);
    const aliases = Array.from(
      new Set([...(normalizeList(rawNote.data.aliases) ?? []), rawNote.fileStem, title]),
    );
    const properties = extractProperties(rawNote.data);
    const updatedAt = formatDate(rawNote.data.updatedAt as string | undefined, rawNote.mtime);

    const headingsLookup = new Map<string, string>();
    const headingList = extractHeadings(annotations.text);
    for (const heading of headingList) {
      const normalizedHeading = normalizeHeadingKey(heading.title);
      if (!headingsLookup.has(normalizedHeading)) {
        headingsLookup.set(normalizedHeading, heading.id);
      }
    }

    drafts.push({
      id: "", // assigned later
      slug,
      title,
      aliases,
      tags,
      properties,
      updatedAt,
      filePath: rawNote.filePath,
      fileStem: rawNote.fileStem,
      bodyOriginal: rawNote.body,
      bodyPrepared: annotations.text,
      blockIds: annotations.blockIds,
      plainText,
      excerpt,
      headings: headingList,
      headingLookup: headingsLookup,
      outbound: [],
      backlinks: [],
    });
  }

  drafts.sort((a, b) => a.slug.localeCompare(b.slug));
  drafts.forEach((draft, index) => {
    draft.id = `n_${String(index + 1).padStart(2, "0")}`;
  });

  return drafts;
}

function buildExcerpt(text: string): string {
  if (!text) return "";
  const maxLength = 180;
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}…`;
}

function extractProperties(frontmatter: NoteFrontmatter): Record<string, string> {
  const base: Record<string, string> = {};
  if (frontmatter.properties && typeof frontmatter.properties === "object") {
    for (const [key, value] of Object.entries(frontmatter.properties)) {
      base[key] = formatPropertyValue(value);
    }
  }

  for (const [key, value] of Object.entries(frontmatter)) {
    const normalizedKey = key.toLowerCase();
    if (RESERVED_FRONTMATTER.has(normalizedKey)) continue;
    base[key] = formatPropertyValue(value);
  }

  return base;
}

function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(formatPropertyValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim());
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDate(dateFromFrontmatter: string | undefined, fallback: Date): string {
  if (dateFromFrontmatter) {
    return new Date(dateFromFrontmatter).toISOString().split("T")[0] ?? dateFromFrontmatter;
  }
  return fallback.toISOString().split("T")[0];
}

function annotateBlockAnchors(markdown: string): { text: string; blockIds: Set<string> } {
  const blockIds = new Set<string>();
  const text = markdown.replace(/(?<![#\[])\^([A-Za-z0-9_-]+)(?=$|\s)/g, (_match, blockId: string) => {
    blockIds.add(blockId);
    return `<span id="block-${blockId}" class="block-anchor"></span>`;
  });

  return { text, blockIds };
}

async function markdownToPlainText(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(stripMarkdown)
    .use(remarkStringify)
    .process(markdown);
  const normalized = String(file)
    .replace(/\\([\[\]])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
  return normalized;
}

function extractHeadings(markdown: string): Heading[] {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown);
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  visit(tree, "heading", (node) => {
    const text = toString(node).trim();
    if (!text) return;
    headings.push({
      id: slugger.slug(text),
      title: text,
      level: node.depth ?? 2,
    });
  });

  return headings;
}

async function markdownToHtml(markdown: string): Promise<{ html: string; headings: Heading[] }> {
  const headings = extractHeadings(markdown);
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return { html: String(file), headings };
}

function buildAliasIndex(notes: NoteDraft[]): Map<string, AliasRecord> {
  const index = new Map<string, AliasRecord>();

  for (const note of notes) {
    const record: AliasRecord = {
      id: note.id,
      slug: note.slug,
      title: note.title,
      excerpt: note.excerpt,
      headingLookup: note.headingLookup,
      blockIds: note.blockIds,
    };

    const candidates = new Set<string>([
      note.slug,
      note.slug.replace(/-/g, ""),
      note.title,
      note.fileStem,
      ...note.aliases,
    ]);

    for (const candidate of candidates) {
      if (!candidate) continue;
      index.set(normalizeLookupKey(candidate), record);
    }
  }

  return index;
}

function replaceWikilinks(note: NoteDraft, aliasIndex: Map<string, AliasRecord>): ReplacementResult {
  const warnings: string[] = [];
  const outbound: LinkContext[] = [];

  const text = note.bodyPrepared.replace(
    WIKILINK_REGEX,
    (full, embedMarker: string | undefined, targetRaw: string, offset: number) => {
      const isEmbed = Boolean(embedMarker);
      const parsed = parseWikiTarget(targetRaw.trim());
      const snippet = createSnippet(note.bodyPrepared, offset, offset + full.length);
      const assetCandidate = parsed.target ? resolveAssetTarget(parsed.target) : null;

      if (isEmbed && assetCandidate) {
        const assetExists = existsSync(path.join(VAULT_DIR, assetCandidate.sourcePath));
        if (!assetExists) {
          warnings.push(
            `[asset] ${note.slug} no encontró ${assetCandidate.sourcePath} referenciado en [[${parsed.rawLabel}]]`,
          );
        }
        return `![${escapeHtml(parsed.targetLabel)}](${assetCandidate.publicPath})`;
      }

      const resolved = resolveNoteTarget(parsed, note, aliasIndex);
      const context: LinkContext = {
        sourceId: note.id,
        sourceSlug: note.slug,
        sourceTitle: note.title,
        preview: snippet,
        targetLabel: parsed.targetLabel,
        targetSlug: resolved.note?.slug,
        targetId: resolved.note?.id,
        headingId: resolved.headingId ?? undefined,
        blockId: resolved.blockId ?? undefined,
        kind: isEmbed ? "embed" : "link",
        isBroken: resolved.isBroken,
      };

      if (resolved.isBroken) {
        warnings.push(
          `[link] ${note.slug} no pudo resolver [[${parsed.rawLabel}]] (${parsed.target ?? "nota actual"})`,
        );
        outbound.push(context);
        return `<span class="broken-link" title="Enlace no resuelto">${escapeHtml(parsed.targetLabel)}</span>`;
      }

      outbound.push(context);
      const href =
        resolved.note !== undefined
          ? `/n/${resolved.note.slug}${resolved.blockId ? `#block-${resolved.blockId}` : resolved.headingId ? `#${resolved.headingId}` : ""}`
          : "#";

      if (isEmbed) {
        return buildNoteEmbed(resolved.note!, parsed.targetLabel);
      }

      return `[${escapeHtml(parsed.targetLabel)}](${href})`;
    },
  );

  return { text, outbound, warnings };
}

function parseWikiTarget(raw: string): WikiTarget {
  const [targetWithAnchor, labelOverride] = raw.split("|");
  const targetPortion = targetWithAnchor ?? raw;
  const hashIndex = targetPortion.indexOf("#");
  const target =
    hashIndex === -1 ? targetPortion.trim() : targetPortion.slice(0, hashIndex).trim() || null;
  const anchor = hashIndex === -1 ? null : targetPortion.slice(hashIndex + 1).trim();

  const heading =
    anchor && !anchor.startsWith("^") && anchor.length > 0 ? anchor.replace(/^#+/, "") : null;
  const block = anchor && anchor.startsWith("^") ? anchor.replace(/^\^/, "") : null;

  return {
    rawLabel: raw,
    targetLabel: (labelOverride ?? targetPortion ?? raw).trim(),
    target,
    heading,
    block,
  };
}

function resolveAssetTarget(target: string): { sourcePath: string; publicPath: string } | null {
  const normalized = target.replace(/\\/g, "/");
  const extension = path.extname(normalized).toLowerCase();
  if (!ASSET_EXTENSIONS.has(extension)) return null;
  const relativePath =
    normalized.startsWith("assets/") || normalized.startsWith("./assets/")
      ? normalized.replace(/^.\//, "")
      : `assets/${normalized}`;

  return {
    sourcePath: relativePath,
    publicPath: `/vault/${relativePath}`,
  };
}

function resolveNoteTarget(
  parsed: WikiTarget,
  note: NoteDraft,
  aliasIndex: Map<string, AliasRecord>,
): { note?: AliasRecord; headingId?: string; blockId?: string; isBroken: boolean } {
  const targetKey =
    parsed.target === null || parsed.target === undefined
      ? normalizeLookupKey(note.slug)
      : normalizeLookupKey(parsed.target);
  const record = aliasIndex.get(targetKey);
  if (!record) {
    return { isBroken: true };
  }

  let headingId: string | undefined;
  if (parsed.heading) {
    const key = normalizeHeadingKey(parsed.heading);
    headingId = record.headingLookup.get(key);
    if (!headingId) {
      return { note: record, isBroken: true };
    }
  }

  if (parsed.block) {
    if (!record.blockIds.has(parsed.block)) {
      return { note: record, isBroken: true };
    }
  }

  return {
    note: record,
    headingId,
    blockId: parsed.block ?? undefined,
    isBroken: false,
  };
}

function createSnippet(text: string, start: number, end: number): string {
  const radius = 80;
  const from = Math.max(0, start - radius);
  const to = Math.min(text.length, end + radius);
  return text
    .slice(from, to)
    .replace(/\s+/g, " ")
    .trim();
}

function buildNoteEmbed(target: AliasRecord, label: string): string {
  return `<aside class="note-embed" data-note="${target.slug}"><div class="note-embed__header">${escapeHtml(target.title)}</div><p class="note-embed__excerpt">${escapeHtml(target.excerpt)}</p><a class="note-embed__link" href="/n/${target.slug}">${escapeHtml(label || "Abrir nota")}</a></aside>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBacklinks(notes: NoteDraft[]) {
  const noteMap = new Map<string, NoteDraft>(notes.map((note) => [note.id, note]));
  for (const note of notes) {
    note.backlinks = [];
  }

  for (const note of notes) {
    for (const outbound of note.outbound) {
      if (!outbound.targetId || outbound.isBroken) continue;
      const targetNote = noteMap.get(outbound.targetId);
      if (!targetNote) continue;
      targetNote.backlinks.push({
        ...outbound,
        targetSlug: note.slug,
        targetLabel: note.title,
      });
    }
  }

  for (const note of notes) {
    note.backlinks.sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle));
  }
}

function buildVaultMetadata(noteCount: number): VaultJson {
  return {
    name: DEFAULT_VAULT_LABEL,
    defaultLang: "en",
    noteCount,
    build: {
      version: BUILD_VERSION,
      builtAt: new Date().toISOString(),
    },
  };
}

function buildGraph(notes: NoteDraft[]): GraphFile {
  const nodes: GraphNode[] = notes.map((note) => ({
    id: note.id,
    slug: note.slug,
    title: note.title,
    tags: note.tags,
  }));

  const weightMap = new Map<string, number>();
  for (const note of notes) {
    for (const outbound of note.outbound) {
      if (!outbound.targetId || outbound.isBroken) continue;
      const key = `${note.id}::${outbound.targetId}`;
      weightMap.set(key, (weightMap.get(key) ?? 0) + 1);
    }
  }

  const edges: GraphEdge[] = Array.from(weightMap.entries()).map(([key, weight]) => {
    const [source, target] = key.split("::");
    return { source, target, weight };
  });

  return { nodes, edges };
}

async function writeJson(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyAssetsFolder() {
  const sourceDir = path.join(VAULT_DIR, "assets");
  const targetDir = path.join(PUBLIC_VAULT_DIR, "assets");
  if (!existsSync(sourceDir)) {
    await fs.rm(targetDir, { recursive: true, force: true });
    return;
  }

  await fs.rm(targetDir, { recursive: true, force: true });
  await copyDirectory(sourceDir, targetDir);
}

async function copyDirectory(source: string, target: string) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function uniqueSlug(slug: string, counts: Map<string, number>): string {
  const occurrences = counts.get(slug) ?? 0;
  counts.set(slug, occurrences + 1);
  if (occurrences === 0) return slug;
  return `${slug}-${occurrences + 1}`;
}

function slugify(value: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
  return cleaned || "nota";
}

function normalizeLookupKey(value: string): string {
  return slugify(value);
}

function normalizeHeadingKey(value: string): string {
  return slugify(value);
}

run().catch((error) => {
  console.error("[vault] Error al generar el vault:", error);
  process.exitCode = 1;
});
