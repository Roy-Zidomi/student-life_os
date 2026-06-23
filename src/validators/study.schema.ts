import { z } from "zod";

export const studySessionSchema = z.object({
  subject: z.string().min(1, "Mata kuliah wajib diisi").max(200),
  duration: z.number().min(1, "Durasi minimal 1 menit").max(480, "Durasi maksimal 8 jam"),
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
});

export type StudySessionFormData = z.infer<typeof studySessionSchema>;
