import { Metadata } from "next";
import { getTransactions, getFinanceStats } from "@/actions/finance.actions";
import { getWishlistItems } from "@/actions/wishlist.actions";
import FinancePageClient from "./finance-client";

export const metadata: Metadata = { title: "Keuangan" };

export default async function FinancePage() {
  const [transactions, stats, wishlist] = await Promise.all([
    getTransactions(),
    getFinanceStats(),
    getWishlistItems(),
  ]);
  return (
    <FinancePageClient
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
      initialStats={JSON.parse(JSON.stringify(stats))}
      initialWishlist={JSON.parse(JSON.stringify(wishlist))}
    />
  );
}
