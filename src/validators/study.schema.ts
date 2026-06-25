import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const studySessionSchema = z.object({
  subject: z.preprocess(sanitizePreprocess, z.string().min(1, "Mata kuliah wajib diisi").max(200)),
  duration: z.number().int("Durasi harus bilangan bulat").min(1, "Durasi minimal 1 menit").max(480, "Durasi maksimal 8 jam"),
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
});

export type StudySessionFormData = z.infer<typeof studySessionSchema>;
