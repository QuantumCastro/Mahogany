export type NoteFrontmatter = {
  title: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

export type Heading = {
  id: string;
  title: string;
  level: number;
};

export type LinkContext = {
  sourceId: string;
  sourceSlug: string;
  sourceTitle: string;
  preview: string;
  targetLabel: string;
  targetSlug?: string;
  targetId?: string;
  headingId?: string;
  blockId?: string;
  kind: "link" | "embed";
  isBroken: boolean;
};

export type NoteContent = {
  id: string;
  slug: string;
  title: string;
  aliases: string[];
  tags: string[];
  properties: Record<string, string>;
  excerpt: string;
  updatedAt: string;
  headings: Heading[];
  html: string;
  plainText: string;
  backlinks: LinkContext[];
  outbound: LinkContext[];
};

export type VaultJson = {
  name: string;
  defaultLang: "es" | "en";
  noteCount: number;
  build: {
    version: string;
    builtAt: string;
  };
};

export type NoteIndexItem = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  plainText?: string;
  updatedAt: string;
};

export type GraphNode = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
};

export type GraphEdge = {
  source: string;
  target: string;
  weight: number;
};

export type GraphFile = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type LinkEdge = {
  source: string;
  target:
    | {
        type: "note";
        id: string;
      }
    | {
        type: "heading";
        id: string;
        heading: string;
      }
    | {
        type: "block";
        id: string;
        block: string;
      }
    | null;
  kind: "link" | "embed";
  isBroken: boolean;
};

export type LinksFile = {
  edges: LinkEdge[];
};

export type NotesContentFile = {
  items: NoteContent[];
};
