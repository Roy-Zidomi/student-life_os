"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { updateNote } from "@/actions/note.actions";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface NoteData {
  id: string;
  title: string;
  content: string | null;
}

export default function NoteEditorClient({ note }: { note: NoteData }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await updateNote(note.id, { title, content });
        if (result.success) {
          setSaved(true);
          toast.success("Catatan berhasil disimpan");
        }
      } catch {
        toast.error("Gagal menyimpan catatan");
      }
    });
  }, [note.id, title, content]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/notes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={isPending || saved}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Menyimpan..." : saved ? "Tersimpan" : "Simpan"}
        </Button>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
        placeholder="Judul catatan..."
        className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
      />

      {/* Markdown Editor */}
      <div data-color-mode="dark" className="min-h-[500px]">
        <MDEditor
          value={content}
          onChange={(val) => { setContent(val || ""); setSaved(false); }}
          height={500}
        />
      </div>
    </div>
  );
}
