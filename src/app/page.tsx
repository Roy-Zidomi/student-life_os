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
  LayoutDashboard,
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Glow Orbs background */}
      <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#0075FF]/10 dark:bg-[#0075FF]/15 blur-[120px] animate-pulse-glow" />
      <div className="absolute top-[40%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-[#00F0FF]/10 dark:bg-[#00F0FF]/15 blur-[130px] animate-pulse-glow" style={{ animationDelay: "-4s" }} />
      <div className="absolute bottom-[10%] left-[20%] w-[30rem] h-[30rem] rounded-full bg-blue-600/10 dark:bg-blue-600/10 blur-[110px] animate-pulse-glow" style={{ animationDelay: "-8s" }} />

      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(0,117,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,117,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-background/30 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              StudentOS
            </span>
          </div>
          <div className="flex items-center gap-3">
            {userId ? (
              <Link href="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-sm h-9 px-4 rounded-lg font-medium transition-all">
                  Dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-sm h-9 px-3.5 font-medium hover:bg-accent/40 rounded-lg">
                    Masuk
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-sm h-9 px-4 rounded-lg font-medium transition-all">
                    Daftar Gratis
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center px-4 pt-16 pb-12 text-center md:pt-24 md:pb-16 max-w-5xl mx-auto">
          {/* Version Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary mb-6 animate-float">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Memperkenalkan StudentOS v1.0 — Platform Akademik All-in-One</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground">
            Kelola Hidupmu Sebagai{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
              Mahasiswa
            </span>
            <br />
            dalam Satu Platform
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Tugas, jadwal kuliah, catatan kuliah, sesi belajar Pomodoro, pelacak keuangan, dan IPK — semuanya terintegrasi dengan bantuan kecerdasan buatan (AI) yang memahami kebutuhan akademikmu.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0 justify-center">
            {userId ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 text-base px-8 h-12 w-full rounded-xl transition-all"
                >
                  Masuk ke Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 text-base px-8 h-12 w-full rounded-xl transition-all"
                  >
                    Mulai Sekarang — Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-in" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 h-12 border-border/80 hover:bg-accent/40 w-full rounded-xl transition-all"
                  >
                    Sudah Punya Akun? Masuk
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Interactive Dashboard Showcase (Window Mockup) */}
        <section className="px-4 pb-20 md:pb-28 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border/80 bg-glass shadow-2xl overflow-hidden animate-float">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-card/60 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-xs text-muted-foreground font-medium select-none bg-muted/50 px-6 py-0.5 rounded-md border border-border/30">
                demo.studentos.id/dashboard
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Window Content */}
            <div className="flex h-[420px] md:h-[460px] text-left">
              {/* Mock Sidebar */}
              <div className="hidden sm:flex flex-col w-[60px] md:w-[180px] border-r border-border/40 bg-card/30 p-2 md:p-3 shrink-0">
                <div className="flex items-center gap-2 mb-6 px-1 md:px-2">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="hidden md:inline font-bold text-xs">StudentOS</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: CheckSquare, label: "Tugas" },
                    { icon: Calendar, label: "Jadwal" },
                    { icon: FileText, label: "Catatan" },
                    { icon: Timer, label: "Pomodoro" },
                    { icon: Bot, label: "AI Chat" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        item.active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="hidden md:inline">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock Dashboard Area */}
              <div className="flex-1 bg-background/40 p-4 md:p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Halo, Mahasiswa! 👋</h4>
                    <p className="text-[10px] text-muted-foreground">Ini adalah simulasi dasbor belajarmu.</p>
                  </div>
                  <div className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                    Online
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Task / Pomodoro widget */}
                  <div className="rounded-xl border border-border/40 bg-card/45 p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">POMODORO TIMER</span>
                      <Timer className="h-3 w-3 text-orange-500" />
                    </div>
                    <div className="text-center py-2">
                      <div className="text-2xl font-mono font-bold tracking-tight">21:45</div>
                      <span className="text-[9px] text-muted-foreground">Fokus: Aljabar Linear</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      <span className="text-[9px] bg-primary text-primary-foreground px-2 py-1 rounded cursor-pointer hover:opacity-90">Start</span>
                      <span className="text-[9px] bg-secondary text-foreground px-2 py-1 rounded cursor-pointer hover:bg-muted">Pause</span>
                    </div>
                  </div>

                  {/* Savings / Finance Widget */}
                  <div className="rounded-xl border border-border/40 bg-card/45 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">WISHLIST / TABUNGAN</span>
                      <Wallet className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1 font-medium">
                        <span>iPad Pro M4</span>
                        <span className="text-emerald-500 font-bold">85%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "85%" }} />
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Terkumpul: Rp 12.750.000 / Rp 15.000.000
                    </div>
                  </div>

                  {/* GPA prediction Widget */}
                  <div className="rounded-xl border border-border/40 bg-card/45 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">ESTIMASI IPK</span>
                      <GraduationCap className="h-3 w-3 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full border-2 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-500 bg-indigo-500/5">
                        3.85
                      </div>
                      <div className="text-[9px] space-y-0.5">
                        <p className="font-semibold text-foreground">Target Semester: 3.90</p>
                        <p className="text-muted-foreground">Total: 22 SKS selesai</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Chat Widget */}
                <div className="rounded-xl border border-border/40 bg-card/45 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-border/20 pb-2">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-semibold text-muted-foreground">AI ASSISTANT</span>
                  </div>
                  <div className="space-y-2 text-[10px] max-h-[120px] overflow-y-auto pr-1">
                    <div className="flex gap-2">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center font-bold text-[8px] text-muted-foreground uppercase shrink-0">M</div>
                      <div className="bg-muted/40 p-2 rounded-lg max-w-[85%] text-foreground">
                        Bantu buatkan rencana belajar untuk ujian kalkulus besok pagi jam 8.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Sparkles className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="bg-primary/5 p-2 rounded-lg max-w-[85%] border border-primary/10 text-foreground">
                        Tentu! Saya merekomendasikan:
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          <li>14:00 - 15:30: Review Turunan & Integral Parsial (2 Pomodoro)</li>
                          <li>16:00 - 17:30: Latihan Soal Ujian Tahun Lalu</li>
                          <li>21:00: Istirahat yang cukup untuk mengoptimalkan memori</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/25 p-6 backdrop-blur-xs transition-all duration-300 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 glow-card"
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg shadow-black/10`}
                  >
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div
                    className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.02] bg-gradient-to-br ${feature.color} pointer-events-none`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Dicintai oleh Mahasiswa
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Apa kata mereka tentang StudentOS?
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[
                { name: "Andini Putri", role: "Mahasiswi Informatika UI", quote: "StudentOS membantu saya melacak tugas kuliah dan belajar dengan Pomodoro secara bersamaan. Sangat hemat waktu!", color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20" },
                { name: "Rian Hidayat", role: "Mahasiswa Akuntansi UNPAD", quote: "Fitur IPK Predictor dan Pelacak Keuangan sangat berguna. Sekarang saya bisa mengatur budget bulanan sekaligus target akademis.", color: "from-indigo-500/10 to-purple-500/10 border-indigo-500/20" },
                { name: "Dina Amelia", role: "Mahasiswi Kedokteran UGM", quote: "Catatan markdown dan AI assistant-nya juara! Sangat membantu merangkum materi kuliah kedokteran yang super padat.", color: "from-purple-500/10 to-pink-500/10 border-purple-500/20" }
              ].map((t, idx) => (
                <div key={idx} className={`relative overflow-hidden rounded-xl border p-6 bg-gradient-to-br ${t.color} backdrop-blur-sm`}>
                  <p className="text-sm italic leading-relaxed text-foreground/80">&quot;{t.quote}&quot;</p>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Pertanyaan Umum (FAQ)</h2>
              <p className="mt-2 text-muted-foreground text-sm">Masih punya pertanyaan? Kami punya jawabannya.</p>
            </div>
            <div className="space-y-4">
              {[
                { q: "Apakah platform ini sepenuhnya gratis?", a: "Ya! Anda dapat menikmati semua fitur utama StudentOS, termasuk manajemen tugas, catatan, dan keuangan secara gratis." },
                { q: "Bagaimana cara kerja AI Assistant?", a: "AI Assistant terhubung langsung dengan catatan, tugas, dan jadwal kuliah Anda untuk membantu merencanakan belajar, menjawab pertanyaan, dan memberikan insight akademis secara cerdas." },
                { q: "Apakah data saya aman?", a: "Tentu saja. Kami menggunakan enkripsi kelas industri dan Clerk Authentication untuk memastikan data pribadi dan akademik Anda tetap aman dan terlindungi." }
              ].map((faq, idx) => (
                <details key={idx} className="group border border-border/50 rounded-xl bg-card/20 p-4 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between gap-1.5 cursor-pointer">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">{faq.q}</h3>
                    <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                      <ArrowRight className="h-4 w-4 rotate-90 text-primary" />
                    </span>
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-12 text-center backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[20rem] h-[20rem] bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Siap Meningkatkan Produktivitasmu?
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-lg">
              Bergabung sekarang dan rasakan kemudahan mengelola kehidupan akademik.
            </p>
            <Link href={userId ? "/dashboard" : "/sign-up"} className="inline-block mt-8 w-full sm:w-auto relative z-10">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm sm:text-base px-8 h-12 w-full rounded-xl"
              >
                {userId ? "Pergi ke Dashboard" : "Daftar Gratis Sekarang"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 px-6 py-8 md:px-12 bg-background/25 backdrop-blur-md">
          <div className="mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">
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
