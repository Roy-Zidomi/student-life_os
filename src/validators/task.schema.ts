import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi").max(200, "Judul terlalu panjang"),
  description: z.string().max(2000, "Deskripsi terlalu panjang").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  deadline: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export type TaskFormData = z.infer<typeof taskSchema>;
