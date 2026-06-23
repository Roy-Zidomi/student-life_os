import { Metadata } from "next";
import { getWishlistItems, getCurrentSavings } from "@/actions/wishlist.actions";
import WishlistPageClient from "./wishlist-client";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const [wishlist, savingsData] = await Promise.all([
    getWishlistItems(),
    getCurrentSavings(),
  ]);

  return (
    <WishlistPageClient
      initialWishlist={JSON.parse(JSON.stringify(wishlist))}
      initialSavingsData={savingsData}
    />
  );
}
