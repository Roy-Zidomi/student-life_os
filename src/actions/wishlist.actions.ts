"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { wishlistSchema } from "@/validators/wishlist.schema";
import { revalidatePath } from "next/cache";

export async function getWishlistItems() {
  const user = await ensureUser();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return items;
}

export async function createWishlistItem(data: unknown) {
  const user = await ensureUser();
  const parsed = wishlistSchema.parse(data);

  const item = await prisma.wishlistItem.create({
    data: {
      name: parsed.name,
      targetPrice: parsed.targetPrice,
      savedAmount: parsed.savedAmount,
      isCompleted: parsed.savedAmount >= parsed.targetPrice,
      userId: user.id,
    },
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: item };
}

export async function addSavingsToWishlist(id: string, amount: number) {
  const user = await ensureUser();

  const existing = await prisma.wishlistItem.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Item wishlist tidak ditemukan" };
  }

  const newSavedAmount = Math.max(0, existing.savedAmount + amount);
  const isCompleted = newSavedAmount >= existing.targetPrice;

  const item = await prisma.wishlistItem.update({
    where: { id },
    data: {
      savedAmount: newSavedAmount,
      isCompleted,
    },
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: item };
}

export async function deleteWishlistItem(id: string) {
  const user = await ensureUser();

  const existing = await prisma.wishlistItem.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Item wishlist tidak ditemukan" };
  }

  await prisma.wishlistItem.delete({ where: { id } });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
