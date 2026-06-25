import { z } from "zod";
import { sanitizePreprocess } from "@/lib/sanitize";

export const wishlistSchema = z.object({
  name: z.preprocess(sanitizePreprocess, z.string().min(1, "Nama barang wajib diisi").max(200)),
  targetPrice: z.number().min(1, "Target harga minimal Rp 1").max(999_999_999_999, "Harga terlalu besar").finite("Nilai tidak valid"),
  targetDate: z.string().optional().nullable(),
});

export type WishlistFormData = z.infer<typeof wishlistSchema>;
