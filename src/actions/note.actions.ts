"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { noteSchema } from "@/validators/note.schema";
import { revalidatePath } from "next/cache";

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
  });

  return notes;
}

export async function getNoteById(id: string) {
  const user = await ensureUser();

  const note = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });

  return note;
}

export async function createNote(data: unknown) {
  const user = await ensureUser();
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
  const parsed = noteSchema.partial().parse(data);

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan tidak ditemukan" };
  }

  const note = await prisma.note.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  return { success: true, data: note };
}

export async function deleteNote(id: string) {
  const user = await ensureUser();

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan tidak ditemukan" };
  }

  await prisma.note.delete({ where: { id } });

  revalidatePath("/notes");
  return { success: true };
}

export async function togglePinNote(id: string) {
  const user = await ensureUser();

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Catatan tidak ditemukan" };
  }

  const note = await prisma.note.update({
    where: { id },
    data: { isPinned: !existing.isPinned },
  });

  revalidatePath("/notes");
  return { success: true, data: note };
}
