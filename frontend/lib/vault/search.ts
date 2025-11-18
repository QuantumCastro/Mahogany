import type { NoteIndexItem } from "./types";

export type SearchQuery = {
  raw: string;
  terms: string[];
  phrases: string[];
  exclude: string[];
  tags: string[];
};

export type SearchResult = {
  note: NoteIndexItem;
  score: number;
  snippet: string;
  matches: string[];
};

export function parseSearchQuery(rawInput: string): SearchQuery {
  const tokens = rawInput.match(/"[^"]*"|\S+/g) ?? [];
  const query: SearchQuery = {
    raw: rawInput,
    terms: [],
    phrases: [],
    exclude: [],
    tags: [],
  };

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("-\"") && trimmed.endsWith("\"")) {
      query.exclude.push(trimmed.slice(2, -1).toLowerCase());
      continue;
    }

    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
      query.phrases.push(trimmed.slice(1, -1).toLowerCase());
      continue;
    }

    if (trimmed.startsWith("-tag:#")) {
      query.exclude.push(`#${trimmed.slice(6).toLowerCase()}`);
      continue;
    }

    if (trimmed.startsWith("tag:#")) {
      query.tags.push(trimmed.slice(5).toLowerCase());
      continue;
    }

    if (trimmed.startsWith("-")) {
      query.exclude.push(trimmed.slice(1).toLowerCase());
      continue;
    }

    query.terms.push(trimmed.toLowerCase());
  }

  return query;
}

export function runSearch(dataset: NoteIndexItem[], query: SearchQuery): SearchResult[] {
  const hasPositive =
    query.terms.length > 0 || query.phrases.length > 0 || query.tags.length > 0;
  if (!hasPositive) return [];

  const results: SearchResult[] = [];

  for (const note of dataset) {
    const textSource = buildSearchableText(note);
    const tagsNormalized = note.tags.map((tag) => tag.toLowerCase());
    const matches: string[] = [];

    if (!phrasesMatch(textSource, query.phrases, matches)) {
      continue;
    }

    if (!termsMatch(textSource, query.terms, matches)) {
      continue;
    }

    if (!tagsMatch(tagsNormalized, query.tags, matches)) {
      continue;
    }

    if (exclusionsHit(textSource, tagsNormalized, query.exclude)) {
      continue;
    }

    const score =
      matches.length * 4 +
      (tagsNormalized.includes("meta") ? 1 : 0) +
      recencyScore(note.updatedAt);

    results.push({
      note,
      score,
      snippet: buildSnippet(note, matches),
      matches,
    });
  }

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (
      new Date(b.note.updatedAt).getTime() - new Date(a.note.updatedAt).getTime()
    );
  });
}

function buildSearchableText(note: NoteIndexItem): string {
  const base = `${note.title} ${note.excerpt ?? ""} ${note.plainText ?? ""}`.toLowerCase();
  return base.replace(/\s+/g, " ");
}

function phrasesMatch(text: string, phrases: string[], matches: string[]): boolean {
  for (const phrase of phrases) {
    if (!text.includes(phrase)) {
      return false;
    }
    matches.push(phrase);
  }
  return true;
}

function termsMatch(text: string, terms: string[], matches: string[]): boolean {
  for (const term of terms) {
    if (!text.includes(term)) {
      return false;
    }
    matches.push(term);
  }
  return true;
}

function tagsMatch(tags: string[], required: string[], matches: string[]): boolean {
  for (const tag of required) {
    if (!tags.includes(tag)) {
      return false;
    }
    matches.push(`#${tag}`);
  }
  return true;
}

function exclusionsHit(text: string, tags: string[], exclusions: string[]): boolean {
  for (const token of exclusions) {
    if (token.startsWith("#")) {
      if (tags.includes(token.slice(1))) {
        return true;
      }
      continue;
    }
    if (text.includes(token)) {
      return true;
    }
  }
  return false;
}

function recencyScore(updatedAt: string): number {
  const days =
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(days)) return 0;
  if (days <= 7) return 6;
  if (days <= 30) return 3;
  return 1;
}

function buildSnippet(note: NoteIndexItem, matches: string[]): string {
  const reference = note.plainText ?? note.excerpt ?? note.title;
  if (!reference) return "";
  const lowerReference = reference.toLowerCase();
  let startIndex = 0;
  for (const match of matches) {
    const idx = lowerReference.indexOf(match.toLowerCase());
    if (idx !== -1) {
      startIndex = idx;
      break;
    }
  }

  const radius = 80;
  const start = Math.max(0, startIndex - radius);
  const end = Math.min(reference.length, startIndex + radius);
  let snippet = reference.slice(start, end).trim();

  for (const match of [...matches].sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(escapeRegex(match), "gi");
    snippet = snippet.replace(regex, (segment) => `<mark>${segment}</mark>`);
  }

  if (start > 0) snippet = `…${snippet}`;
  if (end < reference.length) snippet = `${snippet}…`;
  return snippet;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
