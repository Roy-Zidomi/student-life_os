import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Clock, Flame, Wallet, GraduationCap,
  BarChart3, TrendingUp, Target,
} from "lucide-react";

export const metadata: Metadata = { title: "Analitik" };

// This page uses static demo data for now. Will be wired with real data from actions.
export default function AnalyticsPage() {
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tugas Selesai</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-emerald-500">+3 minggu ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jam Belajar</p>
                  <p className="text-2xl font-bold">18.5</p>
                  <p className="text-xs text-blue-500">jam minggu ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Streak Terbaik</p>
                  <p className="text-2xl font-bold">7</p>
                  <p className="text-xs text-orange-500">hari berturut-turut</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kebiasaan Hari Ini</p>
                  <p className="text-2xl font-bold">4/5</p>
                  <p className="text-xs text-purple-500">80% selesai</p>
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
              <p className="text-2xl font-bold text-emerald-500 mt-1">Rp 2.500.000</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-red-500 mt-1">Rp 850.000</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-2xl font-bold text-indigo-500 mt-1">Rp 1.650.000</p>
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
              <div className="flex items-end gap-4 h-32">
                {[3.45, 3.55, 3.60, 3.75, 3.65].map((gpa, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-xs font-bold mb-1">{gpa}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400"
                      style={{ height: `${(gpa / 4) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">Sem {i + 1}</span>
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
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">3.65</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">IPS Terakhir</span>
                <span className="font-medium">3.75</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total SKS</span>
                <span className="font-medium">96 SKS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mata Kuliah</span>
                <span className="font-medium">32</span>
              </div>
              <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">IPK meningkat 0.10 dari semester lalu</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
