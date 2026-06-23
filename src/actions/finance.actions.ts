"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { transactionSchema } from "@/validators/finance.schema";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getTransactions(filters?: {
  type?: "INCOME" | "EXPENSE";
  month?: Date;
}) {
  const user = await ensureUser();

  const where: Record<string, unknown> = { userId: user.id };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.month) {
    where.date = {
      gte: startOfMonth(filters.month),
      lte: endOfMonth(filters.month),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return transactions;
}

export async function createTransaction(data: unknown) {
  const user = await ensureUser();
  const parsed = transactionSchema.parse(data);

  const transaction = await prisma.transaction.create({
    data: {
      description: parsed.description,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      date: parsed.date,
      userId: user.id,
    },
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: transaction };
}

export async function updateTransaction(id: string, data: unknown) {
  const user = await ensureUser();
  const parsed = transactionSchema.partial().parse(data);

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Transaksi tidak ditemukan" };
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: transaction };
}

export async function deleteTransaction(id: string) {
  const user = await ensureUser();

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Transaksi tidak ditemukan" };
  }

  await prisma.transaction.delete({ where: { id } });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getFinanceStats(month?: Date) {
  const user = await ensureUser();
  const targetMonth = month || new Date();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfMonth(targetMonth),
        lte: endOfMonth(targetMonth),
      },
    },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount: transactions.length,
    categoryBreakdown,
  };
}

export async function updateInitialBalance(amount: number) {
  const user = await ensureUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { initialBalance: amount },
  });
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  revalidatePath("/wishlist");
  return { success: true };
}
