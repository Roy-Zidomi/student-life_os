"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GraduationCap, TrendingUp } from "lucide-react";
import { createCourse, deleteCourse } from "@/actions/gpa.actions";
import { toast } from "sonner";
import { GRADE_OPTIONS, GRADE_MAP } from "@/lib/constants";

interface CourseItem {
  id: string;
  name: string;
  credits: number;
  grade: string | null;
  gradePoint: number | null;
  semester: number;
}

interface GPAStatsData {
  semesterGPA: { semester: number; gpa: number; totalCredits: number }[];
  cumulativeGPA: number;
  totalCredits: number;
  totalCourses: number;
}

export default function GPAPageClient({
  initialCourses,
  initialStats,
}: {
  initialCourses: CourseItem[];
  initialStats: GPAStatsData;
}) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [stats, setStats] = useState<GPAStatsData>(initialStats);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("1");

  const resetForm = () => { setName(""); setCredits("3"); setGrade(""); setSemester("1"); };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Nama mata kuliah wajib diisi"); return; }
    startTransition(async () => {
      try {
        const result = await createCourse({
          name: name.trim(),
          credits: Number(credits),
          grade: grade || undefined,
          semester: Number(semester),
        });
        if (result.success && result.data) {
          setCourses((prev) => [...prev, result.data as CourseItem]);
          toast.success("Mata kuliah berhasil ditambahkan");
          setDialogOpen(false);
          resetForm();
          // Refresh stats
          window.location.reload();
        }
      } catch { toast.error("Gagal menambahkan mata kuliah"); }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteCourse(id);
        if (result.success) {
          setCourses((prev) => prev.filter((c) => c.id !== id));
          toast.success("Mata kuliah dihapus");
          window.location.reload();
        }
      } catch { toast.error("Gagal menghapus"); }
    });
  };

  // Group courses by semester
  const semesters = [...new Set(courses.map((c) => c.semester))].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IPK Predictor</h1>
          <p className="text-muted-foreground mt-1">Hitung IPS dan IPK berdasarkan nilai.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mata Kuliah
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Mata Kuliah</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama Mata Kuliah *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Algoritma & Pemrograman" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>SKS</Label>
                  <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min="1" max="8" />
                </div>
                <div className="space-y-2">
                  <Label>Nilai</Label>
                  <Select value={grade} onValueChange={(val) => setGrade(val || "")}>
                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>{g} ({GRADE_MAP[g]})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input type="number" value={semester} onChange={(e) => setSemester(e.target.value)} min="1" max="14" />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                {isPending ? "Menyimpan..." : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* GPA Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5 text-center">
            <GraduationCap className="mx-auto h-6 w-6 text-indigo-500 mb-2" />
            <p className="text-xs text-muted-foreground">IPK (Kumulatif)</p>
            <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {stats.cumulativeGPA.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-emerald-500 mb-2" />
            <p className="text-xs text-muted-foreground">Total SKS</p>
            <p className="text-3xl font-bold mt-1">{stats.totalCredits}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-2">Total Mata Kuliah</p>
            <p className="text-3xl font-bold">{stats.totalCourses}</p>
          </CardContent>
        </Card>
      </div>

      {/* IPS per Semester */}
      {stats.semesterGPA.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">IPS per Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-40">
              {stats.semesterGPA.map((s) => (
                <div key={s.semester} className="flex flex-col items-center flex-1">
                  <span className="text-xs font-bold mb-1">{s.gpa.toFixed(2)}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                    style={{ height: `${(s.gpa / 4) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">Sem {s.semester}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semester Filter Bar */}
      {courses.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 pt-4">
          <h2 className="text-lg font-bold tracking-tight">Daftar Mata Kuliah</h2>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Filter Semester:</Label>
            <Select value={selectedSemester} onValueChange={(val) => setSelectedSemester(val || "all")}>
              <SelectTrigger className="w-[180px] h-9 bg-card border-border/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Courses by Semester */}
      {(selectedSemester === "all"
        ? semesters
        : semesters.filter((sem) => sem.toString() === selectedSemester)
      ).map((sem) => (
        <Card key={sem} className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">Semester {sem}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.filter((c) => c.semester === sem).map((course) => (
              <div key={course.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-3 group hover:bg-accent/50">
                <div>
                  <p className="text-sm font-medium">{course.name}</p>
                  <p className="text-xs text-muted-foreground">{course.credits} SKS</p>
                </div>
                <div className="flex items-center gap-2">
                  {course.grade ? (
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                      (course.gradePoint ?? 0) >= 3.5 ? "bg-emerald-500/10 text-emerald-500" :
                      (course.gradePoint ?? 0) >= 2.5 ? "bg-amber-500/10 text-amber-500" :
                      "bg-red-500/10 text-red-500"
                    }`}>
                      {course.grade} ({course.gradePoint?.toFixed(1)})
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Belum ada nilai</span>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {courses.length === 0 && (
        <Card className="border-border/50 bg-card/50 p-12">
          <div className="text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Belum ada mata kuliah</h3>
            <p className="text-sm text-muted-foreground mt-1">Tambahkan mata kuliah untuk menghitung IPK.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
