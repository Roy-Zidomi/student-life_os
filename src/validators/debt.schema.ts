import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const debtSchema = z.object({
  contactName: z.preprocess(sanitizePreprocess, z.string().min(1, "Nama kontak/teman wajib diisi").max(200)),
  amount: z.number().min(1, "Jumlah minimal Rp 1").max(999_999_999_999, "Jumlah terlalu besar").finite("Nilai tidak valid"),
  notes: z.preprocess(sanitizePreprocess, z.string().max(1000, "Catatan terlalu panjang")).optional().nullable(),
});

export type DebtFormData = z.infer<typeof debtSchema>;
