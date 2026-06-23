import { z } from "zod";

export const wishlistSchema = z.object({
  name: z.string().min(1, "Nama barang wajib diisi").max(200),
  targetPrice: z.number().min(1, "Target harga minimal Rp 1"),
  savedAmount: z.number().min(0, "Tabungan awal minimal Rp 0").default(0),
});

export type WishlistFormData = z.infer<typeof wishlistSchema>;
