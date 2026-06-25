"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { wishlistSchema } from "@/validators/wishlist.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

const MAX_RESULTS = 500;

export async function getWishlistItems() {
  const user = await ensureUser();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
  });

  return items;
}

export async function createWishlistItem(data: unknown) {
  const user = await ensureUser();

  const rateCheck = checkRateLimit(`action:wishlist:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = wishlistSchema.parse(data);

  const item = await prisma.wishlistItem.create({
    data: {
      name: parsed.name,
      targetPrice: parsed.targetPrice,
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
      userId: user.id,
    },
  });

  revalidatePath("/wishlist");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: item };
}

export async function deleteWishlistItem(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:wishlist:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.wishlistItem.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Item wishlist tidak ditemukan" };
  }

  await prisma.wishlistItem.delete({ where: { id: validatedId } });

  revalidatePath("/wishlist");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getCurrentSavings() {
  const user = await ensureUser();

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    take: MAX_RESULTS,
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    initialBalance: user.initialBalance,
    totalIncome,
    totalExpense,
    currentSavings: user.initialBalance + totalIncome - totalExpense,
  };
}
