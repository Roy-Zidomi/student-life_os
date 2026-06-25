"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pin, PinOff, Trash2, FileText, Clock, Pencil } from "lucide-react";
import { createNote, deleteNote, togglePinNote, updateNote } from "@/actions/note.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";

interface NoteItem {
  id: string;
  title: string;
  content: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesPageClient({ initialNotes }: { initialNotes: NoteItem[] }) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleEditSubmit = () => {
    if (!selectedNote) return;
    if (!editTitle.trim()) {
      toast.error("Judul catatan wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await updateNote(selectedNote.id, {
          title: editTitle.trim(),
          content: editContent.trim(),
        });
        if (result.success && result.data) {
          setNotes((prev) =>
            prev.map((n) => (n.id === selectedNote.id ? (result.data as NoteItem) : n))
          );
          toast.success("Catatan berhasil diperbarui");
          setEditDialogOpen(false);
          setSelectedNote(null);
        }
      } catch {
        toast.error("Gagal memperbarui catatan");
      }
    });
  };

  const filteredNotes = notes.filter((note) => {
    if (search && !note.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Judul catatan wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createNote({ title: title.trim(), content: content.trim() });
        if (result.success && result.data) {
          setNotes((prev) => [result.data as NoteItem, ...prev]);
          toast.success("Catatan berhasil dibuat");
          setDialogOpen(false);
          setTitle("");
          setContent("");
          router.push(`/notes/${result.data.id}`);
        }
      } catch {
        toast.error("Gagal membuat catatan");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteNote(id);
        if (result.success) {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          toast.success("Catatan berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus catatan");
      }
    });
  };

  const handleTogglePin = (id: string) => {
    startTransition(async () => {
      try {
        const result = await togglePinNote(id);
        if (result.success && result.data) {
          setNotes((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isPinned: (result.data as NoteItem).isPinned } : n))
          );
        }
      } catch {
        toast.error("Gagal mengubah pin");
      }
    });
  };

  const NoteCard = ({ note }: { note: NoteItem }) => (
    <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-all group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/notes/${note.id}`} className="flex-1 min-w-0">
            <h3 className="font-medium truncate hover:text-primary transition-colors">{note.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {note.content || "Catatan kosong..."}
            </p>
          </Link>
          <div className="flex items-center gap-1 ml-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedNote(note);
                setEditTitle(note.title);
                setEditContent(note.content || "");
                setEditDialogOpen(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTogglePin(note.id)}>
              {note.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(note.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(note.updatedAt), "dd MMM yyyy", { locale: localeId })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catatan</h1>
          <p className="text-muted-foreground mt-1">Buat dan kelola catatan dengan Markdown.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Catatan Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Catatan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul catatan..." />
              </div>
              <div className="space-y-2">
                <Label>Isi Catatan</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis isi catatan Anda di sini..." className="min-h-[150px]" />
              </div>
              <Button onClick={handleCreate} disabled={isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? "Membuat..." : "Buat Catatan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari catatan..." className="pl-9" />
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1">
            <Pin className="h-3 w-3" /> Disematkan
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* All Notes */}
      <div>
        {pinnedNotes.length > 0 && (
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Semua Catatan</h2>
        )}
        {unpinnedNotes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unpinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : pinnedNotes.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Belum ada catatan</h3>
              <p className="text-sm text-muted-foreground mt-1">Klik &quot;Catatan Baru&quot; untuk mulai menulis.</p>
            </div>
          </Card>
        ) : null}
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedNote(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Catatan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Judul catatan..." />
            </div>
            <div className="space-y-2">
              <Label>Isi Catatan</Label>
              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Tulis isi catatan Anda di sini..." className="min-h-[150px]" />
            </div>
            <Button onClick={handleEditSubmit} disabled={isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
