import { Metadata } from "next";
import { getTransactions, getFinanceStats } from "@/actions/finance.actions";
import { ensureUser } from "@/lib/user";
import FinancePageClient from "./finance-client";

export const metadata: Metadata = { title: "Keuangan" };

export default async function FinancePage() {
  const user = await ensureUser();
  const [transactions, stats] = await Promise.all([
    getTransactions(),
    getFinanceStats(),
  ]);

  return (
    <FinancePageClient
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
      initialStats={JSON.parse(JSON.stringify(stats))}
      initialBalance={user.initialBalance}
    />
  );
}
