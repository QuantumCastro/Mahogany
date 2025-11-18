# ADR 0001 - Vault Ingestion Strategy

## Context
We need to publish a small Obsidian-like vault (10 notes) as a static site with backlinks, search operators and a global graph. The source of truth is Markdown + YAML frontmatter under `frontend/content/<vault>` and only local assets are allowed.

## Decision
1. **Single build script (`scripts/generate-vault.ts`)**
   - Walks the vault directory, parses frontmatter via `gray-matter`, normalises slugs/aliases and records metadata (`id`, `slug`, `title`, `tags`, `updatedAt`).
   - Converts Markdown to HTML using the unified/remark/rehype pipeline while preserving wikilinks and note/asset embeds.
   - Precomputes links, backlinks and graph edges. Broken links are flagged (`isBroken: true`).
   - Emits deterministic contracts in `public/data/`: `vault.json`, `notes.index.json`, `links.json`, `graph.json`, plus a private `.generated/notes-content.json` for the App Router.
   - Copies local assets to `public/vault/assets/*` so they can be served from the static export.
2. **Data contracts**
   - `notes.index.json` includes a `plainText` field to keep client-side search offline without downloading all HTML.
   - `graph.json` is capped at ~50 KB for 10 notes; it is only fetched on `/graph` when the user requests it.
3. **Automation**
   - `predev`, `prebuild`, `prelint`, `pretest`, `pretype-check` always run `pnpm run vault:build` to avoid stale JSON/HTML.
   - `.generated/` stays out of git; every rebuild is deterministic.

## Consequences
- **Pros**
  - No backend or database is required; the entire vault ships as static assets.
  - App Router can run `next export`, so deployment to Vercel static hosting is trivial.
  - Search and graph operate offline by reading local JSON contracts only when needed.
- **Cons**
  - Any note change requires re-running `pnpm --dir frontend run vault:build`.
  - `.generated/notes-content.json` must exist before `next dev`/`next build`, hence the automatic `pre*` scripts.
  - External embeds remain blocked; only local assets are copied to `public/vault`.

## Follow-ups
- Investigate multi-vault ingestion (selector) without having to rebuild everything every time.
- Consider incremental graph chunks for larger datasets once the MVP graduates beyond 10 notes.

