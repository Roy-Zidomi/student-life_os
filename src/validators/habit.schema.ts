import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().min(1, "Nama kebiasaan wajib diisi").max(100),
  icon: z.string().optional().default("✅"),
  color: z.string().optional().default("#6366f1"),
});

export type HabitFormData = z.infer<typeof habitSchema>;
