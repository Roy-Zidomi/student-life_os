"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";
import { createTask, updateTask, deleteTask, toggleTaskStatus } from "@/actions/task.actions";
import { toast } from "sonner";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function DeadlineText({ deadline }: { deadline: Date | null }) {
  if (!deadline) return <span className="text-xs text-muted-foreground">Tanpa deadline</span>;

  const d = new Date(deadline);
  if (isPast(d) && !isToday(d)) {
    return <span className="text-xs text-red-500 font-medium">Terlambat</span>;
  }
  if (isToday(d)) {
    return <span className="text-xs text-amber-500 font-medium">Hari ini</span>;
  }
  if (isTomorrow(d)) {
    return <span className="text-xs text-amber-500 font-medium">Besok</span>;
  }
  const days = differenceInDays(d, new Date());
  return <span className="text-xs text-muted-foreground">{days} hari lagi</span>;
}

export default function TasksPageClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [status, setStatus] = useState<string>("TODO");
  const [deadline, setDeadline] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "ALL" && task.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && task.priority !== filterPriority) return false;
    return true;
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setDeadline("");
    setEditingTask(null);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setStatus(task.status);
    setDeadline(task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Judul tugas wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          deadline: deadline || undefined,
        };

        if (editingTask) {
          const result = await updateTask(editingTask.id, data);
          if (result.success && result.data) {
            setTasks((prev) =>
              prev.map((t) => (t.id === editingTask.id ? (result.data as Task) : t))
            );
            toast.success("Tugas berhasil diperbarui");
          }
        } else {
          const result = await createTask(data);
          if (result.success && result.data) {
            setTasks((prev) => [result.data as Task, ...prev]);
            toast.success("Tugas berhasil dibuat");
          }
        }

        setDialogOpen(false);
        resetForm();
      } catch {
        toast.error("Terjadi kesalahan");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteTask(id);
        if (result.success) {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          toast.success("Tugas berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus tugas");
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      try {
        const result = await toggleTaskStatus(id);
        if (result.success && result.data) {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? (result.data as Task) : t))
          );
        }
      } catch {
        toast.error("Gagal mengubah status");
      }
    });
  };

  const statsCount = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Tugas</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau semua tugasmu.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tugas Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Tugas" : "Buat Tugas Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Tugas Algoritma #5" />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detail tugas..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val || "LOW")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">🟢 Rendah</SelectItem>
                      <SelectItem value="MEDIUM">🟡 Sedang</SelectItem>
                      <SelectItem value="HIGH">🔴 Tinggi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val || "TODO")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">📋 To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">🔄 Dikerjakan</SelectItem>
                      <SelectItem value="DONE">✅ Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                {isPending ? "Menyimpan..." : editingTask ? "Perbarui" : "Buat Tugas"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{statsCount.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-xs text-muted-foreground">To Do</p>
              <p className="text-xl font-bold">{statsCount.todo}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Dikerjakan</p>
              <p className="text-xl font-bold">{statsCount.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Selesai</p>
              <p className="text-xl font-bold">{statsCount.done}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tugas..." className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "ALL")}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">Dikerjakan</SelectItem>
            <SelectItem value="DONE">Selesai</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(val) => setFilterPriority(val || "ALL")}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Prioritas</SelectItem>
            <SelectItem value="LOW">Rendah</SelectItem>
            <SelectItem value="MEDIUM">Sedang</SelectItem>
            <SelectItem value="HIGH">Tinggi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-12">
            <div className="text-center">
              <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Belum ada tugas</h3>
              <p className="text-sm text-muted-foreground mt-1">Klik &quot;Tugas Baru&quot; untuk membuat tugas pertamamu.</p>
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="border-border/50 bg-card/50 hover:bg-card/80 transition-all group">
              <CardContent className="p-4 flex items-center gap-4">
                <Checkbox
                  checked={task.status === "DONE"}
                  onCheckedChange={() => handleToggle(task.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority === "LOW" ? "Rendah" : task.priority === "MEDIUM" ? "Sedang" : "Tinggi"}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[task.status]}`}>
                      {task.status === "TODO" ? "To Do" : task.status === "IN_PROGRESS" ? "Dikerjakan" : "Selesai"}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {task.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.deadline), "dd MMM yyyy", { locale: localeId })}
                        </span>
                      </div>
                    )}
                    <DeadlineText deadline={task.deadline} />
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
