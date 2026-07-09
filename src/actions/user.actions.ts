"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { randomInt } from "crypto";

export async function updateUserProfile(name: string) {
  try {
    const user = await ensureUser();

    if (!name.trim()) {
      return { success: false, error: "Nama tidak boleh kosong" };
    }

    // 1. Update in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });

    // 2. Sync to Clerk profile
    const client = await clerkClient();
    await client.users.updateUser(user.clerkId, {
      firstName: name.trim(),
      lastName: "", // Clear lastName to put the entire name into firstName
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Gagal memperbarui profil" };
  }
}

function generateNumericCode() {
  return String(randomInt(100000, 999999));
}

export async function getTelegramLinkStatus() {
  const user = await ensureUser();
  const now = new Date();

  const [account, activeCode] = await Promise.all([
    prisma.telegramAccount.findUnique({
      where: { userId: user.id },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        linkedAt: true,
      },
    }),
    prisma.telegramLinkCode.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        code: true,
        expiresAt: true,
      },
    }),
  ]);

  return {
    account: account
      ? {
          username: account.username,
          firstName: account.firstName,
          lastName: account.lastName,
          linkedAt: account.linkedAt.toISOString(),
        }
      : null,
    activeCode: activeCode
      ? {
          code: activeCode.code,
          expiresAt: activeCode.expiresAt.toISOString(),
        }
      : null,
  };
}

export async function createTelegramLinkCode() {
  const user = await ensureUser();

  await prisma.telegramLinkCode.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  let code = generateNumericCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.telegramLinkCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateNumericCode();
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const linkCode = await prisma.telegramLinkCode.create({
    data: {
      userId: user.id,
      code,
      expiresAt,
    },
    select: {
      code: true,
      expiresAt: true,
    },
  });

  revalidatePath("/settings");
  return {
    success: true,
    data: {
      code: linkCode.code,
      expiresAt: linkCode.expiresAt.toISOString(),
    },
  };
}

export async function disconnectTelegramAccount() {
  const user = await ensureUser();

  await prisma.telegramAccount.deleteMany({
    where: { userId: user.id },
  });

  await prisma.telegramLinkCode.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  revalidatePath("/settings");
  return { success: true };
}
