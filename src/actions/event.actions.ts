"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { eventSchema } from "@/validators/event.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

const MAX_RESULTS = 500;

export async function getEvents(startDate?: Date, endDate?: Date) {
  const user = await ensureUser();

  const where: Record<string, unknown> = { userId: user.id };

  if (startDate && endDate) {
    where.OR = [
      {
        startDate: { gte: startDate, lte: endDate },
      },
      {
        endDate: { gte: startDate, lte: endDate },
      },
      {
        AND: [
          { startDate: { lte: startDate } },
          { endDate: { gte: endDate } },
        ],
      },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: MAX_RESULTS,
  });

  return events;
}

export async function createEvent(data: unknown) {
  const user = await ensureUser();

  const rateCheck = checkRateLimit(`action:event:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = eventSchema.parse(data);

  const event = await prisma.event.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      location: parsed.location,
      type: parsed.type,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      color: parsed.color,
      userId: user.id,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, data: event };
}

export async function updateEvent(id: string, data: unknown) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:event:update:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = eventSchema.partial().parse(data);

  const existing = await prisma.event.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Event tidak ditemukan" };
  }

  const updateData: Record<string, unknown> = { ...parsed };
  if (parsed.startDate) updateData.startDate = new Date(parsed.startDate);
  if (parsed.endDate) updateData.endDate = new Date(parsed.endDate);

  const event = await prisma.event.update({
    where: { id: validatedId },
    data: updateData,
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, data: event };
}

export async function deleteEvent(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:event:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.event.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Event tidak ditemukan" };
  }

  await prisma.event.delete({ where: { id: validatedId } });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}
