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

export const metadata: Metadata = {
  title: "Dashboard",
};

// Stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${gradient}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
    </Card>
  );
}

export default async function DashboardPage() {
  const [gpaStats, tasks, financeStats, studyStats] = await Promise.all([
    getGPAStats(),
    getTasks(),
    getFinanceStats(),
    getStudyStats(),
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
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Jam Belajar"
          value={`${studyHoursThisWeek} jam`}
          subtitle="Minggu ini"
          icon={Clock}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Streak Kebiasaan"
          value="7 hari"
          subtitle="Tertinggi: 14 hari"
          icon={Flame}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(financeStats.totalExpense)}
          subtitle="Budget: Rp 1.500.000"
          icon={Wallet}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: "08:00", title: "Algoritma & Pemrograman", type: "CLASS", color: "border-l-indigo-500" },
                { time: "10:00", title: "Basis Data", type: "CLASS", color: "border-l-blue-500" },
                { time: "13:00", title: "Rapat Kelompok Proyek", type: "MEETING", color: "border-l-amber-500" },
                { time: "15:00", title: "Praktikum Jaringan", type: "CLASS", color: "border-l-emerald-500" },
              ].map((event, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-lg border-l-4 ${event.color} bg-accent/30 p-3 transition-colors hover:bg-accent/50`}
                >
                  <span className="text-sm font-mono font-medium text-muted-foreground w-12">
                    {event.time}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListTodo className="h-5 w-5 text-red-500" />
              Deadline Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Tugas Algoritma #5", deadline: "Besok", priority: "HIGH", color: "text-red-500" },
                { title: "Laporan Praktikum Jaringan", deadline: "2 hari lagi", priority: "HIGH", color: "text-red-500" },
                { title: "Quiz Basis Data", deadline: "3 hari lagi", priority: "MEDIUM", color: "text-amber-500" },
                { title: "Presentasi Proyek", deadline: "5 hari lagi", priority: "MEDIUM", color: "text-amber-500" },
              ].map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-accent/30 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${task.priority === "HIGH" ? "bg-red-500" : "bg-amber-500"}`} />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className={`text-xs ${task.color}`}>{task.deadline}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    task.priority === "HIGH"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {task.priority === "HIGH" ? "Tinggi" : "Sedang"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Overview */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Ringkasan Produktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Tugas Selesai", value: `${completedTasks}`, total: `${totalTasks}`, percentage: taskPercentage },
                { label: "Jam Belajar", value: `${studyHoursThisWeek}`, total: "25", percentage: Math.min(100, Math.round((Number(studyHoursThisWeek) / 25) * 100)) },
                { label: "Kebiasaan Hari Ini", value: "4", total: "5", percentage: 80 },
                { label: "Target Mingguan", value: "75%", total: "", percentage: 75 },
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
                  <div className="h-1.5 rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* IPK Summary */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              Ringkasan Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-indigo-500/20">
                  <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
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
                  <span className="font-medium text-emerald-500">3.70</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
