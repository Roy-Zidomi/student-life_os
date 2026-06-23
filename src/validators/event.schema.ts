import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Judul event wajib diisi").max(200, "Judul terlalu panjang"),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  type: z.enum(["CLASS", "EXAM", "PRESENTATION", "MEETING", "OTHER"]).default("OTHER"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  color: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;
