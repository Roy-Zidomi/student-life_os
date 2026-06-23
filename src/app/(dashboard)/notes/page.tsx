import { Metadata } from "next";
import { getNotes } from "@/actions/note.actions";
import NotesPageClient from "./notes-client";

export const metadata: Metadata = {
  title: "Catatan",
};

export default async function NotesPage() {
  const notes = await getNotes();
  return <NotesPageClient initialNotes={JSON.parse(JSON.stringify(notes))} />;
}
