import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// V-12 fix: Changed from GET to POST to prevent unintended triggers
// via <img> tags, prefetch, or browser caching
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    const clerkName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    const finalName = clerkName || existingUser?.name || clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] || "User";

    // Upsert user in database
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: finalName,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: finalName,
        imageUrl: clerkUser.imageUrl,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync user error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
