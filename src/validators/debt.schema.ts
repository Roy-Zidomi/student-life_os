import { z } from "zod";

export const debtSchema = z.object({
  contactName: z.string().min(1, "Nama kontak/teman wajib diisi").max(200),
  amount: z.number().min(1, "Jumlah minimal Rp 1"),
  notes: z.string().optional().nullable(),
});

export type DebtFormData = z.infer<typeof debtSchema>;
