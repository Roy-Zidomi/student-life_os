import { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  Flame,
  GraduationCap,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGPAStats } from "@/actions/gpa.actions";
import { getTasks } from "@/actions/task.actions";
import { getFinanceStats } from "@/actions/finance.actions";
import { getStudyStats } from "@/actions/study.actions";
import { getEvents } from "@/actions/event.actions";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/user";

const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASS: "Kuliah",
  EXAM: "Ujian",
  PRESENTATION: "Presentasi",
  MEETING: "Rapat",
  OTHER: "Agenda Lain",
};

const EVENT_TYPE_COLORS: Record<string, { border: string; bg: string }> = {
  CLASS: { border: "border-l-[#0075FF]", bg: "bg-[#0075FF]/5" },
  EXAM: { border: "border-l-[#f87171]", bg: "bg-[#f87171]/5" },
  PRESENTATION: { border: "border-l-[#fbbf24]", bg: "bg-[#fbbf24]/5" },
  MEETING: { border: "border-l-[#38bdf8]", bg: "bg-[#38bdf8]/5" },
  OTHER: { border: "border-l-[#a78bfa]", bg: "bg-[#a78bfa]/5" },
};

export const metadata: Metadata = {
  title: "Dashboard",
};

// Hand-crafted Minimalist Stat Card with soft custom accent borders/tints
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accentClass: string;
}) {
  return (
    <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white tracking-tight">{value}</span>
            <span className="text-xs font-bold text-emerald-400">{subtitle}</span>
          </div>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md ${accentClass}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await currentUser();
  const dbUser = await getCurrentUser();
  const [gpaStats, tasks, financeStats, studyStats, events] = await Promise.all([
    getGPAStats(),
    getTasks(),
    getFinanceStats(),
    getStudyStats(),
    getEvents(),
  ]);

  // Tasks math
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Study hours math
  const studyHoursThisWeek = (studyStats.weekMinutes / 60).toFixed(1);

  // GPA math
  const latestIPS = gpaStats.semesterGPA.length > 0 
    ? gpaStats.semesterGPA[gpaStats.semesterGPA.length - 1].gpa 
    : 0;
  const currentSemester = gpaStats.semesterGPA.length > 0 
    ? Math.max(...gpaStats.semesterGPA.map((s) => s.semester)) 
    : 1;

  // Format rupiah
  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  // Filter today's events from calendar events
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayEvents = events.filter((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return start <= endOfToday && end >= startOfToday;
  });

  // Filter upcoming deadlines (tasks and exam/presentation events within 1 month from now)
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  const taskDeadlines = tasks
    .filter((t) => {
      if (t.status === "DONE" || !t.deadline) return false;
      const dl = new Date(t.deadline);
      return dl <= oneMonthFromNow;
    })
    .map((t) => ({
      id: t.id,
      title: t.title,
      date: new Date(t.deadline!),
      type: "TASK" as const,
      priority: t.priority,
    }));

  const eventDeadlines = events
    .filter((e) => {
      const isDeadlineType = e.type === "EXAM" || e.type === "PRESENTATION";
      if (!isDeadlineType) return false;
      const start = new Date(e.startDate);
      return start >= startOfToday && start <= oneMonthFromNow;
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      date: new Date(e.startDate),
      type: "EVENT" as const,
      eventType: e.type,
    }));

  const allUpcomingDeadlines = [...taskDeadlines, ...eventDeadlines].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return (
    <div className="space-y-6">
      {/* Page Header / Breadcrumb area */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pages / Dashboard</span>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Dashboard</h1>
      </div>

      {/* Welcome Banner and Academic progress row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Welcome Back Card */}
        <Card className="relative col-span-1 md:col-span-2 overflow-hidden border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55 mix-blend-screen"
            style={{ backgroundImage: `url('/images/welcome-bg.png')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b26]/90 via-[#060b26]/40 to-transparent" />
          
          <CardContent className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full min-h-[220px]">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Selamat Datang Kembali</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {dbUser?.name || user?.firstName || "Mahasiswa"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mt-2">
                Senang melihat Anda kembali! Ada tugas kuliah yang mendesak hari ini. Butuh bantuan merencanakannya?
              </p>
            </div>
            
            <div className="mt-6">
              <Link href="/ai-assistant">
                <Button className="bg-[#0075FF] hover:bg-[#0075FF]/90 text-white shadow-lg shadow-primary/20 text-xs px-5 py-2.5 rounded-xl font-bold transition-all">
                  Tanya AI Assistant &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* GPA Academic Progress Gauge Card */}
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300 p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-white tracking-tight">Academic Progress</h3>
            <p className="text-[10px] text-muted-foreground">Berdasarkan pencapaian SKS & IPK target.</p>
          </div>
          
          <div className="relative flex flex-col items-center justify-center py-2 my-auto">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              {/* Background Arc */}
              <path
                d="M 20 80 A 35 35 0 1 1 80 80"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Foreground Progress Arc */}
              <path
                d="M 20 80 A 35 35 0 1 1 80 80"
                fill="none"
                stroke="url(#blueGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="165"
                strokeDashoffset={165 - (165 * Math.min(1.0, gpaStats.cumulativeGPA / 4.0))}
              />
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0075FF" />
                  <stop offset="100%" stopColor="#00F0FF" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Info inside the gauge */}
            <div className="absolute top-[42%] flex flex-col items-center justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0075FF] text-white shadow-md shadow-primary/20">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            
            <div className="text-center mt-2">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {(gpaStats.cumulativeGPA).toFixed(2)}
              </span>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">IPK Kumulatif</p>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-left">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Total SKS</p>
              <p className="text-xs font-bold text-white">{gpaStats.totalCredits} SKS</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase">Target IPK</p>
              <p className="text-xs font-bold text-emerald-400">3.70</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tugas Selesai"
          value={`${completedTasks}/${totalTasks}`}
          subtitle={`${taskPercentage}%`}
          icon={CheckCircle2}
          accentClass="bg-[#0075FF] shadow-lg shadow-[#0075FF]/20"
        />
        <StatCard
          title="Jam Belajar"
          value={`${studyHoursThisWeek} jam`}
          subtitle="Minggu ini"
          icon={Clock}
          accentClass="bg-[#0075FF] shadow-lg shadow-[#0075FF]/20"
        />
        <StatCard
          title="Streak Kebiasaan"
          value="7 hari"
          subtitle="Tertinggi: 14h"
          icon={Flame}
          accentClass="bg-[#0075FF] shadow-lg shadow-[#0075FF]/20"
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(financeStats.totalExpense)}
          subtitle="Budget: 1.5jt"
          icon={Wallet}
          accentClass="bg-[#0075FF] shadow-lg shadow-[#0075FF]/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <CalendarDays className="h-4.5 w-4.5 text-[#0075FF]" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-muted-foreground">Tidak ada jadwal hari ini</p>
                </div>
              ) : (
                todayEvents.map((event) => {
                  const startTime = format(new Date(event.startDate), "HH:mm");
                  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.OTHER;
                  const label = EVENT_TYPE_LABELS[event.type] || event.type;
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-4 rounded-xl border-l-4 ${colors.border} ${colors.bg} p-3 transition-colors hover:bg-white/5`}
                    >
                      <span className="text-xs font-mono font-medium text-muted-foreground w-12">
                        {startTime}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {label} {event.location ? `• ${event.location}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <ListTodo className="h-4.5 w-4.5 text-red-500/80" />
              Deadline Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allUpcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-muted-foreground">Tidak ada deadline dalam 1 bulan ke depan</p>
                </div>
              ) : (
                allUpcomingDeadlines.slice(0, 5).map((item) => {
                  const formattedDate = format(item.date, "dd MMM yyyy, HH:mm", { locale: localeId });
                  
                  let badgeText = "";
                  let badgeColor = "";
                  let dotColor = "";
 
                  if (item.type === "TASK") {
                    const priorityText = item.priority === "HIGH" ? "Tinggi" : item.priority === "MEDIUM" ? "Sedang" : "Rendah";
                    badgeText = `Tugas (${priorityText})`;
                    badgeColor = item.priority === "HIGH"
                      ? "bg-red-500/10 text-red-400 border border-red-500/15"
                      : item.priority === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/15";
                    dotColor = item.priority === "HIGH" ? "bg-red-500/60" : item.priority === "MEDIUM" ? "bg-amber-500/60" : "bg-blue-500/60";
                  } else {
                    const typeLabel = item.eventType === "EXAM" ? "Ujian" : "Presentasi";
                    badgeText = typeLabel;
                    badgeColor = item.eventType === "EXAM"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/15";
                    dotColor = item.eventType === "EXAM" ? "bg-rose-500/60" : "bg-amber-500/60";
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                        <div>
                          <p className="text-xs font-semibold text-white">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Overview */}
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <TrendingUp className="h-4.5 w-4.5 text-[#0075FF]" />
              Ringkasan Produktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Tugas Selesai", value: `${completedTasks}`, total: `${totalTasks}`, percentage: taskPercentage, color: "bg-emerald-500/60" },
                { label: "Jam Belajar", value: `${studyHoursThisWeek}`, total: "25", percentage: Math.min(100, Math.round((Number(studyHoursThisWeek) / 25) * 100)), color: "bg-[#0075FF]" },
                { label: "Kebiasaan Hari Ini", value: "4", total: "5", percentage: 80, color: "bg-emerald-500/60" },
                { label: "Target Mingguan", value: "75%", total: "", percentage: 75, color: "bg-purple-500/60" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{item.label}</p>
                  <p className="text-base font-bold text-white">
                    {item.value}
                    {item.total && (
                      <span className="text-xs font-normal text-muted-foreground">
                        /{item.total}
                      </span>
                    )}
                  </p>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course / IPK details card */}
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <GraduationCap className="h-4.5 w-4.5 text-[#0075FF]" />
              Detail Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-muted-foreground">IPS Semester Ini</span>
                <span className="font-bold text-white">{latestIPS.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-muted-foreground">Total SKS Terambil</span>
                <span className="font-bold text-white">{gpaStats.totalCredits} SKS</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-muted-foreground">Semester Aktif</span>
                <span className="font-bold text-white">{currentSemester}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-muted-foreground">Evaluasi Hasil Studi</span>
                <span className="font-bold text-emerald-400">Sangat Memuaskan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
