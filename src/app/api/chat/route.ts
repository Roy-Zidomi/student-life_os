import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: `Kamu adalah AI Assistant untuk Student Life OS, platform produktivitas mahasiswa.
Kamu membantu mahasiswa dengan:
- Menganalisis tugas dan deadline
- Memberikan saran jadwal belajar
- Menganalisis pengeluaran dan keuangan
- Memberikan insight produktivitas
- Membuat rencana belajar
Jawab dalam Bahasa Indonesia yang ramah. Gunakan emoji sesekali.`,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
