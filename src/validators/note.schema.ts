import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const noteSchema = z.object({
  title: z.preprocess(sanitizePreprocess, z.string().min(1, "Judul catatan wajib diisi").max(200, "Judul terlalu panjang")),
  content: z.preprocess(sanitizePreprocess, z.string().max(50000, "Konten terlalu panjang")).optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;
