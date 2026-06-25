import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const transactionSchema = z.object({
  description: z.preprocess(sanitizePreprocess, z.string().min(1, "Deskripsi wajib diisi").max(200)),
  amount: z.number().min(1, "Jumlah minimal Rp 1").max(999_999_999_999, "Jumlah terlalu besar").finite("Nilai tidak valid"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.enum([
    "FOOD", "TRANSPORTATION", "EDUCATION", "ENTERTAINMENT", "HEALTH",
    "SCHOLARSHIP", "SALARY", "ALLOWANCE", "FREELANCE", "OTHER"
  ]).default("OTHER"),
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
