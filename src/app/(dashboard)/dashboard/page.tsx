import { Metadata } from "next";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  Flame,
  GraduationCap,
  ListTodo,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGPAStats } from "@/actions/gpa.actions";
import { getTasks } from "@/actions/task.actions";
import { getFinanceStats } from "@/actions/finance.actions";
import { getStudyStats } from "@/actions/study.actions";
import { getEvents } from "@/actions/event.actions";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const EVENT_TYPE_LABELS: Record<string, string> = {
  CLASS: "Kuliah",
  EXAM: "Ujian",
  PRESENTATION: "Presentasi",
  MEETING: "Rapat",
  OTHER: "Agenda Lain",
};

const EVENT_TYPE_COLORS: Record<string, { border: string; bg: string }> = {
  CLASS: { border: "border-l-[#818cf8]", bg: "bg-[#818cf8]/5" },
  EXAM: { border: "border-l-[#f87171]", bg: "bg-[#f87171]/5" },
  PRESENTATION: { border: "border-l-[#fbbf24]", bg: "bg-[#fbbf24]/5" },
  MEETING: { border: "border-l-[#60a5fa]", bg: "bg-[#60a5fa]/5" },
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
    <Card className="border-border/50 bg-card/45 shadow-xs transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Selamat Datang! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Berikut ringkasan aktivitasmu hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tugas Selesai"
          value={`${completedTasks}/${totalTasks}`}
          subtitle={`${taskPercentage}% selesai`}
          icon={CheckCircle2}
          accentClass="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/15"
        />
        <StatCard
          title="Jam Belajar"
          value={`${studyHoursThisWeek} jam`}
          subtitle="Minggu ini"
          icon={Clock}
          accentClass="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/15"
        />
        <StatCard
          title="Streak Kebiasaan"
          value="7 hari"
          subtitle="Tertinggi: 14 hari"
          icon={Flame}
          accentClass="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/15"
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(financeStats.totalExpense)}
          subtitle="Budget: Rp 1.500.000"
          icon={Wallet}
          accentClass="bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/15"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="border-border/50 bg-card/45">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">Tidak ada jadwal hari ini</p>
                </div>
              ) : (
                todayEvents.map((event) => {
                  const startTime = format(new Date(event.startDate), "HH:mm");
                  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.OTHER;
                  const label = EVENT_TYPE_LABELS[event.type] || event.type;
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-4 rounded-lg border-l-4 ${colors.border} ${colors.bg} p-3 transition-colors hover:bg-accent/20`}
                    >
                      <span className="text-sm font-mono font-medium text-muted-foreground w-12">
                        {startTime}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
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
        <Card className="border-border/50 bg-card/45">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListTodo className="h-5 w-5 text-red-500/80" />
              Deadline Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allUpcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">Tidak ada deadline dalam 1 bulan ke depan</p>
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
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15"
                      : item.priority === "MEDIUM"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15";
                    dotColor = item.priority === "HIGH" ? "bg-red-500/60" : item.priority === "MEDIUM" ? "bg-amber-500/60" : "bg-blue-500/60";
                  } else {
                    const typeLabel = item.eventType === "EXAM" ? "Ujian" : "Presentasi";
                    badgeText = typeLabel;
                    badgeColor = item.eventType === "EXAM"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15";
                    dotColor = item.eventType === "EXAM" ? "bg-rose-500/60" : "bg-amber-500/60";
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-accent/20 p-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{formattedDate}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor}`}>
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
        <Card className="border-border/50 bg-card/45">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ringkasan Produktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Tugas Selesai", value: `${completedTasks}`, total: `${totalTasks}`, percentage: taskPercentage, color: "bg-emerald-500/60" },
                { label: "Jam Belajar", value: `${studyHoursThisWeek}`, total: "25", percentage: Math.min(100, Math.round((Number(studyHoursThisWeek) / 25) * 100)), color: "bg-blue-500/60" },
                { label: "Kebiasaan Hari Ini", value: "4", total: "5", percentage: 80, color: "bg-amber-500/60" },
                { label: "Target Mingguan", value: "75%", total: "", percentage: 75, color: "bg-purple-500/60" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-bold">
                    {item.value}
                    {item.total && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{item.total}
                      </span>
                    )}
                  </p>
                  <div className="h-1.5 rounded-full bg-secondary">
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

        {/* IPK Summary */}
        <Card className="border-border/50 bg-card/45">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
              Ringkasan Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
                  <span className="text-2xl font-bold text-primary">
                    {gpaStats.cumulativeGPA.toFixed(2)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-2">IPK Saat Ini</span>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IPS Semester Ini</span>
                  <span className="font-medium">{latestIPS.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total SKS</span>
                  <span className="font-medium">{gpaStats.totalCredits} SKS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-medium">{currentSemester}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target IPK</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 font-semibold">3.70</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
