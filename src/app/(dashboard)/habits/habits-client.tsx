"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Target, Flame, Trophy } from "lucide-react";
import { createHabit, deleteHabit, toggleHabitLog } from "@/actions/habit.actions";
import { toast } from "sonner";
import { format, startOfDay, subDays, eachDayOfInterval, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface HabitItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  logs: { id: string; date: Date; completed: boolean }[];
}

function HabitHeatmap({ logs }: { logs: { date: Date; completed: boolean }[] }) {
  const today = new Date();
  const startDate = subDays(today, 364);
  const days = eachDayOfInterval({ start: startDate, end: today });

  const logDates = new Set(
    logs.map((l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd"))
  );

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="flex gap-[3px] overflow-x-auto py-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasLog = logDates.has(dateStr);
            return (
              <div
                key={dateStr}
                className={`h-3 w-3 rounded-sm transition-colors ${
                  hasLog ? "bg-emerald-500" : "bg-accent/50"
                }`}
                title={`${format(day, "dd MMM yyyy", { locale: localeId })}${hasLog ? " ✅" : ""}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function HabitsPageClient({ initialHabits }: { initialHabits: HabitItem[] }) {
  const [habits, setHabits] = useState<HabitItem[]>(initialHabits);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Nama kebiasaan wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createHabit({ name: name.trim(), icon });
        if (result.success && result.data) {
          setHabits((prev) => [...prev, { ...(result.data as any), logs: [] }]);
          toast.success("Kebiasaan berhasil dibuat");
          setDialogOpen(false);
          setName("");
          setIcon("✅");
        }
      } catch {
        toast.error("Gagal membuat kebiasaan");
      }
    });
  };

  const handleToggle = (habitId: string) => {
    startTransition(async () => {
      try {
        await toggleHabitLog(habitId, today);
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== habitId) return h;
            const hasLog = h.logs.some((l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd") === todayStr);
            if (hasLog) {
              return { ...h, logs: h.logs.filter((l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd") !== todayStr) };
            } else {
              return { ...h, logs: [...h.logs, { id: "temp", date: today, completed: true }] };
            }
          })
        );
      } catch {
        toast.error("Gagal mengubah status");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteHabit(id);
        if (result.success) {
          setHabits((prev) => prev.filter((h) => h.id !== id));
          toast.success("Kebiasaan berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus kebiasaan");
      }
    });
  };

  // Calculate streaks
  const getStreak = (logs: { date: Date }[]) => {
    const sortedDates = logs
      .map((l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd"))
      .sort()
      .reverse();

    let streak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = format(subDays(today, i), "yyyy-MM-dd");
      if (sortedDates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const completedToday = habits.filter((h) =>
    h.logs.some((l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd") === todayStr)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kebiasaan</h1>
          <p className="text-muted-foreground mt-1">Bangun kebiasaan baik setiap hari.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Kebiasaan Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buat Kebiasaan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Olahraga pagi" />
              </div>
              <div className="space-y-2">
                <Label>Ikon</Label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✅" className="w-20" />
              </div>
              <Button onClick={handleCreate} disabled={isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? "Membuat..." : "Buat Kebiasaan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="h-5 w-5 text-foreground/70" />
            <div>
              <p className="text-xs text-muted-foreground">Hari Ini</p>
              <p className="text-xl font-bold">{completedToday}/{habits.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Streak Terbaik</p>
              <p className="text-xl font-bold">
                {habits.length > 0 ? Math.max(...habits.map((h) => getStreak(h.logs))) : 0} hari
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Kebiasaan</p>
              <p className="text-xl font-bold">{habits.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Habits */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Kebiasaan Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {habits.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Belum ada kebiasaan. Buat satu untuk memulai!</p>
          ) : (
            habits.map((habit) => {
              const isCompleted = habit.logs.some(
                (l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd") === todayStr
              );
              const streak = getStreak(habit.logs);
              return (
                <div key={habit.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-3 group hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isCompleted} onCheckedChange={() => handleToggle(habit.id)} className="h-5 w-5" />
                    <span className="text-lg">{habit.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {habit.name}
                      </p>
                      {streak > 0 && (
                        <p className="text-xs text-orange-500">🔥 {streak} hari berturut-turut</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 lg:opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(habit.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Heatmaps */}
      {habits.map((habit) => (
        <Card key={habit.id} className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{habit.icon}</span> {habit.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HabitHeatmap logs={habit.logs} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
