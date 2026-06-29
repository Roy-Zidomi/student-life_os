"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(name: string) {
  try {
    const user = await ensureUser();

    if (!name.trim()) {
      return { success: false, error: "Nama tidak boleh kosong" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Gagal memperbarui profil" };
  }
}
