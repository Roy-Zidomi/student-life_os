"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { studySessionSchema } from "@/validators/study.schema";
import { cuidSchema, checkRateLimit } from "@/lib/sanitize";
import { ACTION_WRITE_LIMIT } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export async function createStudySession(data: unknown) {
  const user = await ensureUser();

  const rateCheck = checkRateLimit(`action:study:create:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const parsed = studySessionSchema.parse(data);

  const session = await prisma.studySession.create({
    data: {
      subject: parsed.subject,
      duration: parsed.duration,
      date: parsed.date,
      userId: user.id,
    },
  });

  revalidatePath("/study");
  revalidatePath("/dashboard");
  return { success: true, data: session };
}

export async function getStudySessions() {
  const user = await ensureUser();

  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 50,
  });

  return sessions;
}

export async function getStudyStats() {
  const user = await ensureUser();
  const now = new Date();

  // Today
  const todaySessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfDay(now), lte: endOfDay(now) },
    },
  });

  // This week
  const weekSessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) },
    },
  });

  // This month
  const monthSessions = await prisma.studySession.findMany({
    where: {
      userId: user.id,
      date: { gte: startOfMonth(now), lte: endOfMonth(now) },
    },
  });

  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const weekMinutes = weekSessions.reduce((acc, s) => acc + s.duration, 0);
  const monthMinutes = monthSessions.reduce((acc, s) => acc + s.duration, 0);

  // Subject breakdown
  const subjectMap: Record<string, number> = {};
  monthSessions.forEach((s) => {
    subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.duration;
  });

  const subjectBreakdown = Object.entries(subjectMap)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    todaySessions: todaySessions.length,
    weekSessions: weekSessions.length,
    monthSessions: monthSessions.length,
    subjectBreakdown,
  };
}

export async function deleteStudySession(id: string) {
  const user = await ensureUser();
  const validatedId = cuidSchema.parse(id);

  const rateCheck = checkRateLimit(`action:study:delete:${user.id}`, ACTION_WRITE_LIMIT);
  if (!rateCheck.allowed) {
    return { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };
  }

  const existing = await prisma.studySession.findFirst({
    where: { id: validatedId, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Sesi belajar tidak ditemukan" };
  }

  await prisma.studySession.delete({ where: { id: validatedId } });

  revalidatePath("/study");
  revalidatePath("/dashboard");
  return { success: true };
}
