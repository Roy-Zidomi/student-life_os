"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { taskSchema } from "@/validators/task.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import type { Priority, TaskStatus } from "@prisma/client";

const MAX_RESULTS = 500;

export async function getTasks(filters?: {
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
}) {
  const user = await ensureUser();

  const where: Record<string, unknown> = { userId: user.id };

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.priority) {
    where.priority = filters.priority;
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    take: MAX_RESULTS,
  });

  return tasks;
}

export async function createTask(data: unknown) {
  const user = await ensureUser();

  // Rate limiting on write operations
  const rateCheck = checkRateLimit(`action:task:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = taskSchema.parse(data);

  const task = await prisma.task.create({
    data: {
      ...parsed,
      userId: user.id,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: task };
}

export async function updateTask(id: string, data: unknown) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:task:update:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = taskSchema.partial().parse(data);

  // Verify ownership
  const existing = await prisma.task.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Tugas tidak ditemukan" };
  }

  const task = await prisma.task.update({
    where: { id: validatedId },
    data: parsed,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: task };
}

export async function deleteTask(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:task:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.task.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Tugas tidak ditemukan" };
  }

  await prisma.task.delete({ where: { id: validatedId } });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleTaskStatus(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:task:toggle:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.task.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Tugas tidak ditemukan" };
  }

  const statusMap: Record<string, TaskStatus> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: "TODO",
  };

  const task = await prisma.task.update({
    where: { id: validatedId },
    data: { status: statusMap[existing.status] },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: task };
}
