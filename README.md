# MAHOGANY Vault SSG

Obsidian-style vault demo built with Next.js App Router, TailwindCSS and static export. It ingests 10 Markdown notes (OFM frontmatter, wikilinks, embeds, backlinks) and ships a full UI (home vault editor, search overlay, tags, graph, note view, about) ready to deploy to Vercel as a pure SSG.

## Highlights

- **Static vault ingestion**: `scripts/generate-vault.ts` walks `frontend/content/<vault>/`, normalizes slugs, resolves wikilinks/embeds, and emits HTML + JSON contracts (`public/data/*.json`).
- **Next.js App Router UI**: `/` (VS Code–style editor), `/graph`, `/search`, `/tags`, `/tags/{tag}`, `/about`, `/n/{slug}` and fallback 404. Fully accessible, theme-aware (dark/light), responsive, and localized (EN/ES).
- **Graph playground**: d3-force canvas with lazy load, tag filters, force sliders (center/repel/link-distance), “Load graph” CTA, and a drag-to-move experience that mirrors Obsidian (click opens, short drag stretches nodes).
- **Global command palette**: pressing `/` or clicking “Search” shows an overlay with keyboard navigation, filtering and the ability to open notes directly in the home editor even from other routes.
- **Testing and DX**: Playwright E2E for navigation/search/graph, Vitest + Testing Library for components, ESLint + TypeScript, and vault generation baked into every relevant script.

## Repository layout

```
frontend/
├─ app/                # Next.js App Router routes/layout
├─ components/         # UI primitives: editor, graph, search overlay, etc.
├─ content/demo/       # 10-note sample vault with assets
├─ lib/                # i18n, theme, vault repository/types
├─ public/data/        # Generated JSON contracts
├─ scripts/            # generate-vault + helpers
└─ tests/              # Playwright E2E specs
```

## Prerequisites

- Node.js 20.x (developed on 20.11)
- pnpm 9.x (`corepack enable pnpm` recommended)
- PowerShell or bash for the helper scripts

## Quick start

```bash
pnpm install                     # from repo root
pnpm --dir frontend run vault:build  # generate HTML + data from /content/demo
pnpm --dir frontend dev          # Next.js dev server (auto-regenerates vault)
```

Visit `http://localhost:3000` to explore the editor, graph, search overlay and note views.

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm --dir frontend run vault:build` | Ingest OFM notes, emit `public/data/*.json` and `.generated/notes-content.json`. Run automatically before dev/build/lint/test/type-check. |
| `pnpm --dir frontend dev` | Next.js dev server (`predev` runs `vault:build`). |
| `pnpm --dir frontend lint` | ESLint with Next.js preset. |
| `pnpm --dir frontend type-check` | `tsc --noEmit`. |
| `pnpm --dir frontend test` | Vitest + Testing Library. |
| `pnpm --dir frontend test:e2e` | Playwright E2E specs (`pnpm exec playwright install` once). |
| `pnpm --dir frontend build` | `next build` + `next export` → `frontend/out` ready for Vercel static hosting. |
| `pnpm --dir frontend run sync-vault -- --source ../my-vault --vault demo --clean` | Import an external Markdown vault into `content/<vault>` prior to building. |

## Content workflow

1. Drop Markdown files under `frontend/content/<vault>/`. Use YAML frontmatter: `title`, `aliases`, `tags`, `properties` and any custom keys.
2. Use Obsidian-style wikilinks (`[[Note]]`, `[[Note#Heading]]`, `[[Note#^block]]`). Slugs are auto-generated from title or alias with collision suffix `-n`.
3. Embeds: `![[Note]]` renders note snippets, while `![[assets/image.png]]` pulls from `content/<vault>/assets`.
4. Run `pnpm --dir frontend run vault:build` (automatically invoked by most scripts). The generator reports warnings for unresolved links or missing assets.
5. Static contracts appear in `public/data/` (`vault.json`, `notes.index.json`, `links.json`, `graph.json`) and `frontend/.generated/notes-content.json` for note HTML.

## UI basics

- **Home (`/`)**: VS Code–inspired layout with vault selector, explorer, dynamic note viewer, new-note composer and command palette integration.
- **Graph (`/graph`)**: loads on demand; nodes can be dragged after a small threshold while clicks open notes in the main editor. Controls include center/repel/link-distance sliders, tag filter, and “Recalculate”.
- **Search overlay**: global palette triggered via `/` or nav button; results limited to 12 items with snippet highlighting and direct opening into the home editor even from other routes.
- **Tags (`/tags`, `/tags/{tag}`)**: sortable directory (count / alphabetic) with chips linking into tag-specific listings.
- **About (`/about`)**: project overview, arquitectura, accessibility checklist, new “Demo limitations” panel explaining lack of persistence, and usage steps.

## Testing & quality

- `pnpm --dir frontend test` for unit/component tests (Vitest + Testing Library).
- `pnpm --dir frontend test:e2e` for Playwright (chromium) covering home/search/graph flows. A dev server must be running; the Playwright config expects `http://127.0.0.1:3100`.
- CI recommendation: lint → type-check → test → build (same scripts as above).

## Deployment

1. `pnpm --dir frontend run vault:build`
2. `pnpm --dir frontend build`
3. Deploy `frontend/out` to Vercel (Framework: “Other”, output directory `frontend/out`, no Node functions) or any static hosting/CDN.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| **Explorer shows “No hay notas”** | Ensure `frontend/content/<vault>` exists and rerun `pnpm --dir frontend run vault:build`. |
| **Warnings `[link]`/`[asset]`** | Verify wikilinks/aliases and copy assets under `content/<vault>/assets/`. These warnings are non-blocking. |
| **Graph stays empty** | Click “Cargar grafo” inside `/graph`; confirm `public/data/graph.json` exists. |
| **Search yields nothing** | Remove exclusion terms (`-foo`) or try `tag:#meta`. The overlay only indexes generated `notes.index.json`. |
| **Playwright complains about browsers** | Run `pnpm exec playwright install` once. |

## Roadmap ideas

1. Add persistence (backend + DB) to sync new notes, backlinks and graph updates.
2. Expand tests (component + visual regression) and add CI workflow.
3. Integrate analytics (Plausible/Umami) via `NEXT_PUBLIC_*` flags and document privacy policy.
4. Enrich documentation (architecture diagrams, content governance, release playbook).

---

**Disclaimer**: MAHOGANY Vault SSG is a demo. Notes created in the home editor live only in memory; graph/search JSON remain static until you rerun `vault:build`. Use this repo as a blueprint for static vault explorers or extend it with persistence for production.
