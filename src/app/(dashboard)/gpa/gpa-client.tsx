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
import { Plus, Trash2, GraduationCap, TrendingUp, Pencil, Upload, Loader2, Sparkles, FileText, Check, RotateCcw } from "lucide-react";
import { createCourse, deleteCourse, updateCourse, parseTranscriptAction, importCoursesAction } from "@/actions/gpa.actions";
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

  // AI Transcript Scanning States
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<{ semester: number; name: string; credits: number; grade: string | null }[]>([]);
  const [selectedParsedIndices, setSelectedParsedIndices] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCredits, setEditCredits] = useState("3");
  const [editGrade, setEditGrade] = useState("");
  const [editSemester, setEditSemester] = useState("1");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScanPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = async () => {
    if (!scanPreview || !scanFile) return;
    setIsScanning(true);
    try {
      const base64Data = scanPreview.split(",")[1];
      const mimeType = scanFile.type;
      
      const result = await parseTranscriptAction(base64Data, mimeType);
      if (result.success && result.courses) {
        setParsedCourses(result.courses);
        setSelectedParsedIndices(result.courses.map((_, i) => i)); // select all by default
        toast.success(`Berhasil mendeteksi ${result.courses.length} mata kuliah!`);
      } else {
        toast.error(result.error || "Gagal memproses gambar transkrip");
      }
    } catch (err: any) {
      toast.error("Gagal mendeteksi gambar transkrip");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveImport = async () => {
    const coursesToImport = parsedCourses.filter((_, idx) => selectedParsedIndices.includes(idx));
    if (coursesToImport.length === 0) {
      toast.error("Pilih minimal satu mata kuliah untuk diimpor");
      return;
    }
    startTransition(async () => {
      try {
        const result = await importCoursesAction(coursesToImport);
        if (result.success) {
          toast.success(`Berhasil mengimpor ${result.count} mata kuliah!`);
          setScanDialogOpen(false);
          setScanFile(null);
          setScanPreview(null);
          setParsedCourses([]);
          window.location.reload();
        } else {
          toast.error(result.error || "Gagal mengimpor mata kuliah");
        }
      } catch (err) {
        toast.error("Gagal mengimpor mata kuliah");
      }
    });
  };

  const handleEditSubmit = () => {
    if (!selectedCourse) return;
    if (!editName.trim()) { toast.error("Nama mata kuliah wajib diisi"); return; }
    startTransition(async () => {
      try {
        const result = await updateCourse(selectedCourse.id, {
          name: editName.trim(),
          credits: Number(editCredits),
          grade: editGrade || undefined,
          semester: Number(editSemester),
        });
        if (result.success && result.data) {
          setCourses((prev) => prev.map((c) => c.id === selectedCourse.id ? result.data as CourseItem : c));
          toast.success("Mata kuliah berhasil diperbarui");
          setEditDialogOpen(false);
          window.location.reload();
        }
      } catch { toast.error("Gagal memperbarui mata kuliah"); }
    });
  };
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
        <div className="flex items-center gap-3">
          {/* Scan Transcript AI Dialog */}
          <Dialog open={scanDialogOpen} onOpenChange={(open) => {
            setScanDialogOpen(open);
            if (!open) {
              setScanFile(null);
              setScanPreview(null);
              setParsedCourses([]);
            }
          }}>
            <DialogTrigger render={<Button variant="outline" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300" />}>
              <Sparkles className="mr-2 h-4 w-4 text-indigo-400" />
              Scan Transkrip (AI)
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  Scan Transkrip dengan AI
                </DialogTitle>
              </DialogHeader>

              {parsedCourses.length === 0 ? (
                <div className="space-y-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Unggah foto/screenshot Transkrip Nilai atau Kartu Hasil Studi (KHS) Anda. AI akan mendeteksi mata kuliah, SKS, dan nilai secara otomatis.
                  </p>

                  {!scanPreview ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 hover:bg-accent/30 cursor-pointer transition">
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      <span className="text-sm font-medium">Klik untuk pilih berkas</span>
                      <span className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, WEBP</span>
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border p-6 min-h-[150px] flex flex-col items-center justify-center bg-black/10">
                        {scanFile?.type === "application/pdf" ? (
                          <div className="flex flex-col items-center text-center gap-2">
                            <FileText className="h-14 w-14 text-indigo-500 animate-pulse" />
                            <span className="text-sm font-medium max-w-[250px] truncate">{scanFile.name}</span>
                            <span className="text-xs text-muted-foreground">Dokumen PDF</span>
                          </div>
                        ) : (
                          <img src={scanPreview} alt="Preview" className="max-h-[250px] object-contain" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setScanFile(null); setScanPreview(null); }} className="flex-1 text-xs">
                          Ganti Berkas
                        </Button>
                        <Button onClick={handleStartScan} disabled={isScanning} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs">
                          {isScanning ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Membaca Transkrip...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Mulai Scan AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Pilih dan verifikasi mata kuliah hasil scan AI sebelum disimpan ke database.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setParsedCourses([])} className="h-8 text-xs">
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Scan Ulang
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-xs font-semibold text-muted-foreground uppercase sticky top-0">
                        <tr>
                          <th className="p-2.5 text-left w-12">
                            <input
                              type="checkbox"
                              checked={selectedParsedIndices.length === parsedCourses.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedParsedIndices(parsedCourses.map((_, i) => i));
                                } else {
                                  setSelectedParsedIndices([]);
                                }
                              }}
                              className="rounded border-gray-300 bg-background"
                            />
                          </th>
                          <th className="p-2.5 text-center w-16">Sem</th>
                          <th className="p-2.5 text-left">Mata Kuliah</th>
                          <th className="p-2.5 text-center w-16">SKS</th>
                          <th className="p-2.5 text-center w-16">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedCourses.map((course, idx) => {
                          const isSelected = selectedParsedIndices.includes(idx);
                          return (
                            <tr key={idx} className={`hover:bg-accent/10 ${isSelected ? "" : "opacity-50"}`}>
                              <td className="p-2.5 text-left">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedParsedIndices((prev) => [...prev, idx]);
                                    } else {
                                      setSelectedParsedIndices((prev) => prev.filter((i) => i !== idx));
                                    }
                                  }}
                                  className="rounded border-gray-300 bg-background"
                                />
                              </td>
                              <td className="p-2.5 text-center font-semibold">{course.semester}</td>
                              <td className="p-2.5 text-left font-medium max-w-[200px] truncate">{course.name}</td>
                              <td className="p-2.5 text-center font-mono">{course.credits}</td>
                              <td className="p-2.5 text-center">
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400">
                                  {course.grade || "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setScanDialogOpen(false)} className="flex-1 text-xs">
                      Batal
                    </Button>
                    <Button onClick={handleSaveImport} disabled={isPending} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs">
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Simpan {selectedParsedIndices.length} Mata Kuliah
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add Course Dialog */}
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
            <div className="flex items-end justify-center gap-8 h-28 max-w-2xl mx-auto">
              {stats.semesterGPA.map((s) => (
                <div key={s.semester} className="flex flex-col items-center w-12">
                  <span className="text-xs font-bold mb-1">{s.gpa.toFixed(2)}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-600 transition-all shadow-md shadow-indigo-500/10"
                    style={{ height: `${(s.gpa / 4) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-2 font-medium">Sem {s.semester}</span>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSelectedCourse(course);
                      setEditName(course.name);
                      setEditCredits(course.credits.toString());
                      setEditGrade(course.grade || "");
                      setEditSemester(course.semester.toString());
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
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
      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedCourse(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Mata Kuliah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nama Mata Kuliah *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Contoh: Algoritma & Pemrograman" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKS</Label>
                <Input type="number" value={editCredits} onChange={(e) => setEditCredits(e.target.value)} min="1" max="8" />
              </div>
              <div className="space-y-2">
                <Label>Nilai</Label>
                <Select value={editGrade} onValueChange={(val) => setEditGrade(val || "")}>
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
                <Input type="number" value={editSemester} onChange={(e) => setEditSemester(e.target.value)} min="1" max="14" />
              </div>
            </div>
            <Button onClick={handleEditSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
