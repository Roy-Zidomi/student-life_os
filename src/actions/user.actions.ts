"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

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
