import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

export async function ensureUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    // Auto-create user from Clerk data
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || "User",
        imageUrl: clerkUser?.imageUrl,
      },
    });
  }

  return user;
}
