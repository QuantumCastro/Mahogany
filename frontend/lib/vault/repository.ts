import { NOTES_CONTENT, NOTES_INDEX, VAULT_INFO } from "./static-data";
import type { NoteContent, NoteIndexItem, VaultJson } from "./types";

export type TagStat = {
  name: string;
  count: number;
};

const notesBySlug = new Map<string, NoteContent>();
const notesById = new Map<string, NoteContent>();

for (const note of NOTES_CONTENT) {
  notesBySlug.set(note.slug, note);
  notesById.set(note.id, note);
}

const sortedNotesByUpdated = [...NOTES_CONTENT].sort((a, b) => {
  const dateDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  if (dateDiff !== 0) return dateDiff;
  return a.title.localeCompare(b.title);
});

const popularTags = buildTagStats(NOTES_CONTENT);

export function getVaultInfo(): VaultJson {
  return VAULT_INFO;
}

export function getAllNotes(): NoteContent[] {
  return NOTES_CONTENT;
}

export function getAllNoteSummaries(): NoteIndexItem[] {
  return NOTES_INDEX;
}

export function getNoteBySlug(slug: string): NoteContent | undefined {
  return notesBySlug.get(slug);
}

export function getNoteById(id: string): NoteContent | undefined {
  return notesById.get(id);
}

export function getRecentNotes(limit = 6): NoteContent[] {
  return sortedNotesByUpdated.slice(0, limit);
}

export function getTagStats(limit?: number): TagStat[] {
  return typeof limit === "number" ? popularTags.slice(0, limit) : popularTags;
}

export function getNotesByTag(tag: string): NoteContent[] {
  const normalized = tag.toLowerCase();
  return NOTES_CONTENT.filter((note) => note.tags.some((t) => t.toLowerCase() === normalized));
}

function buildTagStats(notes: NoteContent[]): TagStat[] {
  const map = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) {
      const current = map.get(tag) ?? 0;
      map.set(tag, current + 1);
    }
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count === a.count) {
        return a.name.localeCompare(b.name);
      }
      return b.count - a.count;
    });
}
