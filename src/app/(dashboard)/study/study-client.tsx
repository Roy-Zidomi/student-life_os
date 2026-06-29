"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Coffee, Brain, Clock, BookOpen, Trash2 } from "lucide-react";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { createStudySession, deleteStudySession } from "@/actions/study.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { POMODORO_FOCUS_MINUTES } from "@/lib/constants";

interface StudySessionItem {
  id: string;
  subject: string;
  duration: number;
  date: Date;
}

interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  subjectBreakdown: { subject: string; minutes: number }[];
}

export default function StudyPageClient({
  initialSessions,
  initialStats,
}: {
  initialSessions: StudySessionItem[];
  initialStats: StudyStats;
}) {
  const [sessions, setSessions] = useState<StudySessionItem[]>(initialSessions);
  const [stats, setStats] = useState<StudyStats>(initialStats);
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const pomodoro = usePomodoro();

  const handleSaveSession = () => {
    if (!subject.trim()) {
      toast.error("Mata kuliah wajib diisi sebelum menyimpan sesi");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createStudySession({
          subject: subject.trim(),
          duration: POMODORO_FOCUS_MINUTES,
        });
        if (result.success && result.data) {
          setSessions((prev) => [result.data as StudySessionItem, ...prev]);
          setStats((prev) => ({
            ...prev,
            todayMinutes: prev.todayMinutes + POMODORO_FOCUS_MINUTES,
            weekMinutes: prev.weekMinutes + POMODORO_FOCUS_MINUTES,
            monthMinutes: prev.monthMinutes + POMODORO_FOCUS_MINUTES,
          }));
          toast.success("Sesi belajar berhasil disimpan!");
        }
      } catch {
        toast.error("Gagal menyimpan sesi belajar");
      }
    });
  };

  const handleDeleteSession = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteStudySession(id);
        if (result.success) {
          setSessions((prev) => prev.filter((s) => s.id !== id));
          toast.success("Sesi dihapus");
        }
      } catch {
        toast.error("Gagal menghapus sesi");
      }
    });
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Belajar</h1>
        <p className="text-muted-foreground mt-1">Timer Pomodoro & statistik belajar.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pomodoro Timer */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {pomodoro.mode === "focus" ? (
                <><Brain className="h-5 w-5 text-primary" /> Mode Fokus</>
              ) : (
                <><Coffee className="h-5 w-5 text-emerald-500" /> Mode Istirahat</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            {/* Subject Input */}
            <div className="w-full space-y-2">
              <Label>Mata Kuliah</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Contoh: Algoritma & Pemrograman" />
            </div>

            {/* Timer Circle */}
            <div className="relative flex h-52 w-52 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - pomodoro.progress / 100)}`}
                  className={`transition-all duration-1000 ${pomodoro.mode === "focus" ? "text-primary" : "text-emerald-500"}`}
                />
              </svg>
              <div className="text-center">
                <span className="text-4xl font-bold font-mono">{pomodoro.displayTime}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {pomodoro.mode === "focus" ? "Fokus" : "Istirahat"}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {!pomodoro.isRunning ? (
                <Button onClick={pomodoro.start} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Play className="mr-2 h-4 w-4" /> Mulai
                </Button>
              ) : (
                <Button onClick={pomodoro.pause} size="lg" variant="outline">
                  <Pause className="mr-2 h-4 w-4" /> Jeda
                </Button>
              )}
              <Button onClick={pomodoro.reset} size="lg" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>

            {/* Save session when a focus session is complete */}
            {pomodoro.sessionsCompleted > 0 && (
              <Button onClick={handleSaveSession} disabled={isPending} variant="outline" className="w-full">
                💾 Simpan Sesi ({pomodoro.sessionsCompleted} selesai)
              </Button>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button size="sm" variant={pomodoro.mode === "focus" ? "default" : "ghost"} onClick={() => pomodoro.switchMode("focus")}>
                <Brain className="mr-1 h-3 w-3" /> Fokus
              </Button>
              <Button size="sm" variant={pomodoro.mode === "break" ? "default" : "ghost"} onClick={() => pomodoro.switchMode("break")}>
                <Coffee className="mr-1 h-3 w-3" /> Istirahat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          {/* Study Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Hari Ini</p>
                <p className="text-xl font-bold mt-1">{formatDuration(stats.todayMinutes)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Minggu Ini</p>
                <p className="text-xl font-bold mt-1">{formatDuration(stats.weekMinutes)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Bulan Ini</p>
                <p className="text-xl font-bold mt-1">{formatDuration(stats.monthMinutes)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Breakdown */}
          {stats.subjectBreakdown.length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-foreground/70" />
                  Breakdown per Mata Kuliah
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.subjectBreakdown.map((item) => (
                  <div key={item.subject} className="flex items-center justify-between">
                    <span className="text-sm">{item.subject}</span>
                    <span className="text-sm font-medium">{formatDuration(item.minutes)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Sessions */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground/70" />
                Riwayat Sesi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-2.5 group hover:bg-accent/50">
                  <div>
                    <p className="text-sm font-medium">{session.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.date), "dd MMM yyyy, HH:mm", { locale: localeId })} • {session.duration} menit
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 lg:opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDeleteSession(session.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Belum ada sesi belajar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
