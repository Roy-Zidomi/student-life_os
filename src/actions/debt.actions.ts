"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { debtSchema } from "@/validators/debt.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_RESULTS = 500;

export async function getDebts() {
  const user = await ensureUser();

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
  });

  return debts;
}

export async function createDebt(data: unknown, recordTransaction: boolean) {
  const user = await ensureUser();

  const rateCheck = checkRateLimit(`action:debt:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = debtSchema.parse(data);

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    const debt = await tx.debt.create({
      data: {
        contactName: parsed.contactName,
        amount: parsed.amount,
        notes: parsed.notes,
        userId: user.id,
      },
    });

    if (recordTransaction) {
      await tx.transaction.create({
        data: {
          description: `Pinjaman kepada ${parsed.contactName}`,
          amount: parsed.amount,
          type: "EXPENSE",
          category: "OTHER",
          userId: user.id,
        },
      });
    }

    return debt;
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function payDebt(id: string, amountPaid: number, recordTransaction: boolean) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:debt:pay:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  // V-04 fix: Validate amountPaid to prevent negative payments or invalid values
  const validatedAmount = z
    .number()
    .min(1, "Jumlah pembayaran minimal Rp 1")
    .max(999_999_999_999, "Jumlah terlalu besar")
    .finite("Nilai tidak valid")
    .parse(amountPaid);

  const existing = await prisma.debt.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan utang tidak ditemukan" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const newAmount = Math.max(0, existing.amount - validatedAmount);
    
    const debt = await tx.debt.update({
      where: { id: validatedId },
      data: {
        amount: newAmount,
      },
    });

    if (recordTransaction) {
      await tx.transaction.create({
        data: {
          description: `Pembayaran utang oleh ${existing.contactName}`,
          amount: validatedAmount,
          type: "INCOME",
          category: "OTHER",
          userId: user.id,
        },
      });
    }

    return debt;
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function deleteDebt(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:debt:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.debt.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan utang tidak ditemukan" };
  }

  await prisma.debt.delete({ where: { id: validatedId } });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
