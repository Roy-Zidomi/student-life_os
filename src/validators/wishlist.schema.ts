import { z } from "zod";

export const wishlistSchema = z.object({
  name: z.string().min(1, "Nama barang wajib diisi").max(200),
  targetPrice: z.number().min(1, "Target harga minimal Rp 1"),
  targetDate: z.string().optional().nullable(),
});

export type WishlistFormData = z.infer<typeof wishlistSchema>;
