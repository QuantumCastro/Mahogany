import notesContentRaw from "../../.generated/notes-content.json";
import linksRaw from "../../public/data/links.json";
import notesIndexRaw from "../../public/data/notes.index.json";
import vaultRaw from "../../public/data/vault.json";

import type {
  LinksFile,
  NoteContent,
  NoteIndexItem,
  NotesContentFile,
  VaultJson,
} from "./types";

const notesContentFile = notesContentRaw as NotesContentFile;
const linksFile = linksRaw as LinksFile;
const notesIndexFile = notesIndexRaw as { items: NoteIndexItem[] };
const vaultInfo = vaultRaw as VaultJson;

export const NOTES_CONTENT: NoteContent[] = notesContentFile.items;
export const NOTES_INDEX: NoteIndexItem[] = notesIndexFile.items;
export const LINKS_DATA: LinksFile = linksFile;
export const VAULT_INFO: VaultJson = vaultInfo;
