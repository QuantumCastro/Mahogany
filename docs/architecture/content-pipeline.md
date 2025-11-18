# Content Pipeline Overview

```
content/<vault>/*.md --> scripts/generate-vault.ts
  --> .generated/notes-content.json   (HTML + backlinks + embeds for the App Router)
  --> public/data/vault.json          (vault metadata, build info)
  --> public/data/notes.index.json    (id, slug, tags, excerpt, plainText)
  --> public/data/links.json          (edges with kind/isBroken)
  --> public/data/graph.json          (nodes/edges for d3-force)
  --> public/vault/assets/*           (copied local embeds)
```

## Runtime consumption
1. App Router components import `.generated/notes-content.json` (note HTML/backlinks) and read `public/data/*.json` via `import` or `fetch`.
2. `generateStaticParams` for `/n/[slug]` and `/tags/[tag]` ensures every route is baked into `next export`.
3. `GraphPanel` lazily fetches `/data/graph.json` when the user clicks “Load graph”. Nodes stay lightweight so the payload remains <50 KB.
4. `SearchClient` consumes `notes.index.json` on the client for offline search with operators (`"phrase"`, `-exclude`, `tag:#meta`).

## Operational notes
- Keep `vault.json` minimal (vault name, default language, note count, build version/timestamp).
- Maintain `graph.json` under ~50 KB for the demo; for larger vaults we will need partitioning or incremental fetches.
- Assets must live under `content/<vault>/assets`; external embeds are blocked by design.
- To import a different vault, run `pnpm --dir frontend run sync-vault -- --source ../my-vault --vault demo --clean` followed by `pnpm --dir frontend run vault:build`.
