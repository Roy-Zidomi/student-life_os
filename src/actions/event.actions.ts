"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { eventSchema } from "@/validators/event.schema";
import { revalidatePath } from "next/cache";

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
  });

  return events;
}

export async function createEvent(data: unknown) {
  const user = await ensureUser();
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
  const parsed = eventSchema.partial().parse(data);

  const existing = await prisma.event.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Event tidak ditemukan" };
  }

  const updateData: Record<string, unknown> = { ...parsed };
  if (parsed.startDate) updateData.startDate = new Date(parsed.startDate);
  if (parsed.endDate) updateData.endDate = new Date(parsed.endDate);

  const event = await prisma.event.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, data: event };
}

export async function deleteEvent(id: string) {
  const user = await ensureUser();

  const existing = await prisma.event.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Event tidak ditemukan" };
  }

  await prisma.event.delete({ where: { id } });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}
