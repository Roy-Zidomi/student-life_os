import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const user = await ensureUser();
    const { messages } = await req.json();

    // Fetch user context in parallel
    const [tasks, transactions, courses, habits] = await Promise.all([
      prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { deadline: "asc" },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 15,
      }),
      prisma.course.findMany({
        where: { userId: user.id },
        orderBy: { semester: "asc" },
      }),
      prisma.habit.findMany({
        where: { userId: user.id },
        include: { logs: true },
      }),
    ]);

    // Format tasks summary
    const taskList = tasks.map(
      (t) => `- [${t.status}] ${t.title} (Prioritas: ${t.priority || "MEDIUM"}${
        t.deadline ? `, Deadline: ${t.deadline.toLocaleDateString("id-ID")}` : ""
      })`
    ).join("\n");

    // Format transactions summary
    const transactionList = transactions.map(
      (t) => `- ${t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}: Rp ${t.amount.toLocaleString("id-ID")} untuk ${
        t.category
      } (${t.description || "Tanpa deskripsi"}) pada ${t.date.toLocaleDateString("id-ID")}`
    ).join("\n");

    // Format courses summary
    const courseList = courses.map(
      (c) => `- Sem ${c.semester}: ${c.name} (${c.credits} SKS, Nilai: ${c.grade || "Belum ada"})`
    ).join("\n");

    // Format habits summary
    const habitList = habits.map(
      (h) => `- ${h.name} (Icon: ${h.icon || "✅"}, Total diselesaikan: ${h.logs.filter(l => l.completed).length} kali)`
    ).join("\n");

    // Construct the context-rich system prompt
    const systemPrompt = `Kamu adalah AI Assistant pribadi untuk platform Student Life OS.
Kamu membantu mahasiswa menganalisis, mengelola, dan meningkatkan performa akademis serta produktivitas harian mereka.

Berikut adalah data aktual mahasiswa yang sedang chat denganmu saat ini:
- Nama: ${user.name || "Mahasiswa"}
- Email: ${user.email}

DATA AKADEMIK (MATA KULIAH):
${courseList || "Tidak ada mata kuliah terdaftar saat ini."}

DAFTAR TUGAS DAN DEADLINE:
${taskList || "Tidak ada tugas terdaftar saat ini."}

KEUANGAN TERBARU (TRANSAKSI TERAKHIR):
${transactionList || "Tidak ada transaksi keuangan terdaftar saat ini."}

KEBIASAAN (HABITS):
${habitList || "Tidak ada kebiasaan terdaftar saat ini."}

Pedoman menjawab:
1. Gunakan data di atas untuk menjawab pertanyaan yang relevan (misal: "Apa tugas terdekat?", "Kenapa uangku cepat habis?", "Bagaimana nilai IPS-ku?").
2. Jika ada data yang kosong, beri tahu dengan sopan dan berikan saran bagaimana cara menambahkannya di aplikasi.
3. Jawab dalam Bahasa Indonesia yang santun, ramah, memotivasi, dan bersahabat. Gunakan emoji secara wajar.
4. Berikan saran yang solutif, terstruktur, dan mudah dipahami mahasiswa.`;

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("AI Assistant Route Error:", error);
    
    // Check if it's an API quota / rate limit failure from Google
    const isQuotaError = error?.message?.includes("quota") || error?.message?.includes("limit");
    const errorMessage = isQuotaError
      ? "Batas kuota gratis (Free Tier) dari Gemini API Key Anda telah habis. Silakan coba lagi nanti atau gunakan kunci API dengan batas limit yang lebih besar."
      : "Terjadi kesalahan pada AI Assistant. Silakan periksa kembali konfigurasi Gemini API Key Anda di file .env.";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
