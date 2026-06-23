import { Metadata } from "next";
import { getNoteById } from "@/actions/note.actions";
import NoteEditorClient from "./note-editor-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Catatan",
};

export default async function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    redirect("/notes");
  }

  return <NoteEditorClient note={JSON.parse(JSON.stringify(note))} />;
}
