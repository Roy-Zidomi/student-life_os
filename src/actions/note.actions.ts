"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { noteSchema } from "@/validators/note.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

const MAX_RESULTS = 500;

export async function getNotes(search?: string) {
  const user = await ensureUser();

  const where: Record<string, unknown> = { userId: user.id };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: MAX_RESULTS,
  });

  return notes;
}

export async function getNoteById(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const note = await prisma.note.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  return note;
}

export async function createNote(data: unknown) {
  const user = await ensureUser();

  const rateCheck = checkRateLimit(`action:note:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = noteSchema.parse(data);

  const note = await prisma.note.create({
    data: {
      ...parsed,
      userId: user.id,
    },
  });

  revalidatePath("/notes");
  return { success: true, data: note };
}

export async function updateNote(id: string, data: unknown) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:note:update:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = noteSchema.partial().parse(data);

  const existing = await prisma.note.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan tidak ditemukan" };
  }

  const note = await prisma.note.update({
    where: { id: validatedId },
    data: parsed,
  });

  revalidatePath("/notes");
  revalidatePath(`/notes/${validatedId}`);
  return { success: true, data: note };
}

export async function deleteNote(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:note:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.note.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan tidak ditemukan" };
  }

  await prisma.note.delete({ where: { id: validatedId } });

  revalidatePath("/notes");
  return { success: true };
}

export async function togglePinNote(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:note:pin:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.note.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan tidak ditemukan" };
  }

  const note = await prisma.note.update({
    where: { id: validatedId },
    data: { isPinned: !existing.isPinned },
  });

  revalidatePath("/notes");
  return { success: true, data: note };
}
