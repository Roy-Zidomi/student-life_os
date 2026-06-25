import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const habitSchema = z.object({
  name: z.preprocess(sanitizePreprocess, z.string().min(1, "Nama kebiasaan wajib diisi").max(100)),
  icon: z.string().max(10).optional().default("✅"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format warna tidak valid").optional().default("#6366f1"),
});

export type HabitFormData = z.infer<typeof habitSchema>;
