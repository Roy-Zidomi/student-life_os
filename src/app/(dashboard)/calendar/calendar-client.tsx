"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { createEvent, deleteEvent } from "@/actions/event.actions";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { EVENT_TYPE_COLORS } from "@/lib/constants";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: "CLASS" | "EXAM" | "PRESENTATION" | "MEETING" | "OTHER";
  startDate: Date;
  endDate: Date;
  color: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASS: "Kuliah",
  EXAM: "Ujian",
  PRESENTATION: "Presentasi",
  MEETING: "Rapat",
  OTHER: "Lainnya",
};

export default function CalendarPageClient({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<string>("CLASS");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build calendar grid
  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (date: Date) =>
    events.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return date >= new Date(start.toDateString()) && date <= new Date(end.toDateString());
    });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setType("CLASS");
    setStartDateStr("");
    setEndDateStr("");
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setStartDateStr(format(date, "yyyy-MM-dd'T'09:00"));
    setEndDateStr(format(date, "yyyy-MM-dd'T'10:00"));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!title.trim() || !startDateStr || !endDateStr) {
      toast.error("Judul, tanggal mulai, dan tanggal selesai wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          type,
          startDate: startDateStr,
          endDate: endDateStr,
          color: EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS],
        });

        if (result.success && result.data) {
          setEvents((prev) => [...prev, result.data as CalendarEvent]);
          toast.success("Event berhasil dibuat");
          setDialogOpen(false);
          resetForm();
        }
      } catch {
        toast.error("Gagal membuat event");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteEvent(id);
        if (result.success) {
          setEvents((prev) => prev.filter((e) => e.id !== id));
          toast.success("Event berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus event");
      }
    });
  };

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground mt-1">Atur jadwal kuliah, ujian, dan kegiatan.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Event Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Event Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Kuliah Algoritma" />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={type} onValueChange={(val) => setType(val || "CLASS")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASS">📚 Kuliah</SelectItem>
                      <SelectItem value="EXAM">📝 Ujian</SelectItem>
                      <SelectItem value="PRESENTATION">🎤 Presentasi</SelectItem>
                      <SelectItem value="MEETING">🤝 Rapat</SelectItem>
                      <SelectItem value="OTHER">📌 Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lokasi</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ruang 301" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mulai *</Label>
                  <Input type="datetime-local" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Selesai *</Label>
                  <Input type="datetime-local" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? "Menyimpan..." : "Buat Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Navigation */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((name) => (
              <div key={name} className="text-center text-xs font-medium text-muted-foreground py-2">
                {name}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              const dayEvents = getEventsForDay(date);
              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(date)}
                  className={`relative min-h-[52px] md:min-h-[80px] rounded-lg border p-1 md:p-1.5 text-left transition-colors hover:bg-accent/50 ${
                    !isSameMonth(date, currentDate)
                      ? "border-transparent text-muted-foreground/30"
                      : isToday(date)
                      ? "border-primary bg-primary/5"
                      : "border-border/30"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday(date) ? "text-primary" : ""}`}>
                    {format(date, "d")}
                  </span>
                  
                  {/* On Mobile: Render compact dots/colors */}
                  <div className="mt-1 flex flex-wrap gap-0.5 justify-start md:hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: event.color || "#818cf8" }}
                      />
                    ))}
                  </div>

                  {/* On Desktop: Render event title text blocks */}
                  <div className="mt-1 space-y-0.5 hidden md:block">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: event.color || "#818cf8" }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 2} lagi
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Event Mendatang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events
              .filter((e) => new Date(e.startDate) >= new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 10)
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-3 group hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: event.color || "#818cf8" }} />
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.startDate), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{EVENT_TYPE_LABELS[event.type]}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 lg:opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            {events.filter((e) => new Date(e.startDate) >= new Date()).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Belum ada event mendatang.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
