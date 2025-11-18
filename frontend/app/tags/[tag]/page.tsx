import { notFound } from "next/navigation";

import { TagDetailView } from "@/components/views/tag-detail-view";
import { getNotesByTag, getTagStats } from "@/lib/vault/repository";
import type { NoteIndexItem } from "@/lib/vault/types";

type TagPageProps = {
  params: {
    tag: string;
  };
};

export async function generateStaticParams() {
  return getTagStats().map((tag) => ({ tag: tag.name }));
}

export default function TagPage({ params }: TagPageProps) {
  const tag = decodeURIComponent(params.tag);
  const notes = getNotesByTag(tag).map<NoteIndexItem>((note) => ({
    id: note.id,
    slug: note.slug,
    title: note.title,
    tags: note.tags,
    excerpt: note.excerpt,
    plainText: note.plainText,
    updatedAt: note.updatedAt,
  }));

  if (notes.length === 0) {
    notFound();
  }

  return <TagDetailView tag={tag} notes={notes} />;
}
