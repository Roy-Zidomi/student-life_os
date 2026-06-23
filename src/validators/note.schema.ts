import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "Judul catatan wajib diisi").max(200, "Judul terlalu panjang"),
  content: z.string().optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;
