import { notFound } from "next/navigation";

import { NoteView } from "@/components/views/note-view";
import { getAllNotes, getNoteBySlug } from "@/lib/vault/repository";

type NotePageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export function generateMetadata({ params }: NotePageProps) {
  const note = getNoteBySlug(params.slug);
  if (!note) {
    return {
      title: "Note not found",
    };
  }
  return {
    title: `${note.title} · Vault`,
    description: note.excerpt,
  };
}

export default function NotePage({ params }: NotePageProps) {
  const note = getNoteBySlug(params.slug);
  if (!note) {
    notFound();
  }

  return <NoteView note={note} />;
}
