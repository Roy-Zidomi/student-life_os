import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  CheckSquare,
  Calendar,
  FileText,
  Timer,
  Target,
  Wallet,
  GraduationCap,
  BarChart3,
  Bot,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: CheckSquare, title: "Manajemen Tugas", description: "Kelola tugas dengan prioritas, deadline, dan status.", color: "from-blue-500 to-cyan-500" },
  { icon: Calendar, title: "Kalender", description: "Atur jadwal kuliah, ujian, dan presentasi.", color: "from-indigo-500 to-purple-500" },
  { icon: FileText, title: "Catatan", description: "Buat catatan dengan format Markdown.", color: "from-pink-500 to-rose-500" },
  { icon: Timer, title: "Pomodoro", description: "Fokus belajar dengan teknik Pomodoro.", color: "from-orange-500 to-amber-500" },
  { icon: Target, title: "Kebiasaan", description: "Lacak kebiasaan harian dan bangun konsistensi.", color: "from-emerald-500 to-green-500" },
  { icon: Wallet, title: "Keuangan", description: "Pantau pemasukan dan pengeluaran.", color: "from-purple-500 to-violet-500" },
  { icon: GraduationCap, title: "IPK Predictor", description: "Hitung dan prediksi IPS & IPK.", color: "from-amber-500 to-yellow-500" },
  { icon: BarChart3, title: "Analitik", description: "Lihat statistik produktivitas lengkap.", color: "from-teal-500 to-cyan-500" },
  { icon: Bot, title: "AI Assistant", description: "Asisten AI yang memahami datamu.", color: "from-fuchsia-500 to-pink-500" },
];

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-indigo-950/20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-600/10 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />

      {/* Animated Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,theme(colors.border/3%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/3%)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-4 py-3 md:px-12 md:py-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              StudentOS
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {userId ? (
              <Link href="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
                  Dashboard
                  <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                    Masuk
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
                    Daftar Gratis
                    <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center px-4 pt-10 pb-16 text-center md:pt-16 md:pb-24">
          <h1 className="max-w-4xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight sm:leading-none">
            Kelola Hidupmu Sebagai{" "}
            <span className="text-primary">
              Mahasiswa
            </span>{" "}
            dalam Satu Platform
          </h1>

          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg md:text-xl text-muted-foreground">
            Tugas, jadwal, catatan, belajar, keuangan, dan IPK — semua terintegrasi 
            dengan bantuan AI yang memahami kebutuhan akademikmu.
          </p>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 justify-center">
            {userId ? (
              <Link href="/dashboard" className="w-full sm:w-auto block">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm sm:text-base px-4 sm:px-8 h-10 sm:h-12 w-full"
                >
                  Masuk ke Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="w-full sm:w-auto block">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm sm:text-base px-4 sm:px-8 h-10 sm:h-12 w-full"
                  >
                    Mulai Sekarang — Gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in" className="w-full sm:w-auto block">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-sm sm:text-base px-4 sm:px-8 h-10 sm:h-12 border-border/50 w-full"
                  >
                    Sudah Punya Akun? Masuk
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Semua yang Kamu Butuhkan
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                9 fitur terintegrasi untuk mendukung kehidupan akademikmu.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} shadow-md`}
                  >
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div
                    className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.02] bg-gradient-to-br ${feature.color}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-12 text-center backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Siap Meningkatkan Produktivitasmu?
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-lg">
              Bergabung sekarang dan rasakan kemudahan mengelola kehidupan akademik.
            </p>
            <Link href={userId ? "/dashboard" : "/sign-up"} className="inline-block mt-8 w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm sm:text-base px-4 sm:px-8 h-10 sm:h-12 w-full"
              >
                {userId ? "Pergi ke Dashboard" : "Daftar Gratis Sekarang"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 px-6 py-8 md:px-12">
          <div className="mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Student Life OS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Student Life OS. Built with ❤️ for students.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
