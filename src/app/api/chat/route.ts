import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { checkRateLimit, CHAT_LIMIT } from "@/lib/rate-limit";
import { z } from "zod";

export const maxDuration = 30;

// V-01 fix: Zod validation for incoming chat messages
// Validates structure and bounds while allowing additional SDK-required fields
const chatMessageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(10_000, "Pesan terlalu panjang"),
      }).passthrough() // Allow additional fields from AI SDK UI format
    )
    .min(1, "Minimal 1 pesan")
    .max(50, "Terlalu banyak pesan dalam satu percakapan"),
}).passthrough();

export async function POST(req: Request) {
  try {
    const user = await ensureUser();

    // Rate limiting — 10 requests per minute per user
    const rateCheck = checkRateLimit(`chat:${user.id}`, CHAT_LIMIT);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Terlalu banyak permintaan. Silakan tunggu sebentar sebelum mengirim pesan lagi.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
          },
        }
      );
    }

    // V-01 fix: Validate request body with Zod
    const body = await req.json();
    const parseResult = chatMessageSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Format pesan tidak valid." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use the original body.messages to preserve full UIMessage type for AI SDK
    const { messages } = body;

    // Convert UI messages to model messages (required in Vercel AI SDK v6)
    const modelMessages = await convertToModelMessages(messages);

    // Fetch user context in parallel
    const [tasks, transactions, courses, habits] = await Promise.all([
      prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { deadline: "asc" },
        take: 50,
      }),
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 15,
      }),
      prisma.course.findMany({
        where: { userId: user.id },
        orderBy: { semester: "asc" },
        take: 100,
      }),
      prisma.habit.findMany({
        where: { userId: user.id },
        include: { logs: true },
        take: 50,
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
4. Berikan saran yang solutif, terstruktur, dan mudah dipahami mahasiswa.
5. JANGAN pernah menampilkan data sensitif seperti email, ID internal, atau informasi teknis database.`;

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("AI Assistant Route Error:", message);
    
    // Check if it's an API quota / rate limit failure from Google
    const isQuotaError = message.includes("quota") || message.includes("limit");
    const errorMessage = isQuotaError
      ? "Batas kuota API telah tercapai. Silakan coba lagi nanti."
      : "Terjadi kesalahan pada AI Assistant. Silakan coba lagi nanti.";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
