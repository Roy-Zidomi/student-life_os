"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { debtSchema } from "@/validators/debt.schema";
import { revalidatePath } from "next/cache";

export async function getDebts() {
  const user = await ensureUser();

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return debts;
}

export async function createDebt(data: unknown, recordTransaction: boolean) {
  const user = await ensureUser();
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

  const existing = await prisma.debt.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan utang tidak ditemukan" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const newAmount = Math.max(0, existing.amount - amountPaid);
    
    const debt = await tx.debt.update({
      where: { id },
      data: {
        amount: newAmount,
      },
    });

    if (recordTransaction) {
      await tx.transaction.create({
        data: {
          description: `Pembayaran utang oleh ${existing.contactName}`,
          amount: amountPaid,
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

  const existing = await prisma.debt.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan utang tidak ditemukan" };
  }

  await prisma.debt.delete({ where: { id } });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
