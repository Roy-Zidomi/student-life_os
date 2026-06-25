import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Clock, Flame, Wallet, GraduationCap,
  BarChart3, TrendingUp, Target,
} from "lucide-react";
import { ensureUser } from "@/lib/user";
import { getGPAStats } from "@/actions/gpa.actions";
import { getTasks } from "@/actions/task.actions";
import { getFinanceStats, getTransactions } from "@/actions/finance.actions";
import { getStudyStats } from "@/actions/study.actions";
import { getHabits } from "@/actions/habit.actions";
import { startOfDay, subDays, differenceInDays, isToday } from "date-fns";

export const metadata: Metadata = { title: "Analitik" };

export default async function AnalyticsPage() {
  const user = await ensureUser();

  const [gpaStats, tasks, financeStats, studyStats, habits, transactions] = await Promise.all([
    getGPAStats(),
    getTasks(),
    getFinanceStats(),
    getStudyStats(),
    getHabits(),
    getTransactions(),
  ]);

  // 1. Productivity metrics
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const sevenDaysAgo = subDays(new Date(), 7);
  const completedThisWeek = tasks.filter(
    (t) => t.status === "DONE" && new Date(t.updatedAt) >= sevenDaysAgo
  ).length;

  const studyHoursThisWeek = (studyStats.weekMinutes / 60).toFixed(1);

  const totalHabitsToday = habits.length;
  const completedHabitsToday = habits.filter((h) =>
    h.logs.some((l) => isToday(new Date(l.date)))
  ).length;
  const habitCompletionRate = totalHabitsToday > 0 
    ? Math.round((completedHabitsToday / totalHabitsToday) * 100) 
    : 0;

  let maxLongestStreak = 0;
  habits.forEach((habit) => {
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = habit.logs
      .map((l) => startOfDay(new Date(l.date)))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length > 0) {
      tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInDays(sortedDates[i - 1], sortedDates[i]);
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }
    maxLongestStreak = Math.max(maxLongestStreak, longestStreak);
  });

  // 2. Financial metrics
  const totalAllTimeIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAllTimeExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const currentSavings = user.initialBalance + totalAllTimeIncome - totalAllTimeExpense;

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  // 3. Academic metrics
  const gpaTrend = gpaStats.semesterGPA.length > 0
    ? gpaStats.semesterGPA
    : [
        { semester: 1, gpa: 0, totalCredits: 0 },
      ];
  
  const latestIPS = gpaStats.semesterGPA.length > 0 
    ? gpaStats.semesterGPA[gpaStats.semesterGPA.length - 1].gpa 
    : 0;

  let gpaDiffText = "IPK stabil dibanding semester lalu";
  let isGpaDiffPositive = true;
  if (gpaStats.semesterGPA.length >= 2) {
    const len = gpaStats.semesterGPA.length;
    const diff = gpaStats.semesterGPA[len - 1].gpa - gpaStats.semesterGPA[len - 2].gpa;
    if (diff > 0) {
      gpaDiffText = `IPK meningkat ${diff.toFixed(2)} dari semester lalu`;
      isGpaDiffPositive = true;
    } else if (diff < 0) {
      gpaDiffText = `IPK menurun ${Math.abs(diff).toFixed(2)} dari semester lalu`;
      isGpaDiffPositive = false;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analitik</h1>
        <p className="text-muted-foreground mt-1">Ringkasan lengkap produktivitas dan akademikmu.</p>
      </div>

      {/* Productivity Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Metrik Produktivitas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tugas Selesai</p>
                  <p className="text-2xl font-bold">{completedTasks}</p>
                  <p className="text-xs text-emerald-500">+{completedThisWeek} minggu ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/15">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jam Belajar</p>
                  <p className="text-2xl font-bold">{studyHoursThisWeek}</p>
                  <p className="text-xs text-blue-500">jam minggu ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/15">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Streak Terbaik</p>
                  <p className="text-2xl font-bold">{maxLongestStreak}</p>
                  <p className="text-xs text-amber-500">hari berturut-turut</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/15">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kebiasaan Hari Ini</p>
                  <p className="text-2xl font-bold">{completedHabitsToday}/{totalHabitsToday}</p>
                  <p className="text-xs text-purple-500">{habitCompletionRate}% selesai</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-500" />
          Metrik Keuangan
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Pemasukan Bulan Ini</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(financeStats.totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatRupiah(financeStats.totalExpense)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatRupiah(currentSavings)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Academic Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-amber-500" />
          Metrik Akademik
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Tren IPK</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-32 pt-4">
                {gpaTrend.map((item, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-xs font-bold mb-1">{item.gpa.toFixed(2)}</span>
                    <div
                      className="w-full rounded-t-md bg-[#818cf8]"
                      style={{ height: `${(item.gpa / 4) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">Sem {item.semester}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Ringkasan Akademik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">IPK Saat Ini</span>
                <span className="font-bold text-lg text-primary">{gpaStats.cumulativeGPA.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">IPS Terakhir</span>
                <span className="font-medium">{latestIPS.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total SKS</span>
                <span className="font-medium">{gpaStats.totalCredits} SKS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mata Kuliah</span>
                <span className="font-medium">{gpaStats.totalCourses}</span>
              </div>
              <div className={`flex items-center gap-2 mt-2 p-3 rounded-lg ${
                isGpaDiffPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{gpaDiffText}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
