"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { habitSchema } from "@/validators/habit.schema";
import { revalidatePath } from "next/cache";
import { startOfDay, subDays, differenceInDays } from "date-fns";

export async function getHabits() {
  const user = await ensureUser();

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    include: {
      logs: {
        where: {
          date: {
            gte: subDays(new Date(), 365),
          },
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return habits;
}

export async function createHabit(data: unknown) {
  const user = await ensureUser();
  const parsed = habitSchema.parse(data);

  const habit = await prisma.habit.create({
    data: {
      ...parsed,
      userId: user.id,
    },
  });

  revalidatePath("/habits");
  return { success: true, data: habit };
}

export async function deleteHabit(id: string) {
  const user = await ensureUser();

  const existing = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return { success: false, error: "Kebiasaan tidak ditemukan" };
  }

  await prisma.habit.delete({ where: { id } });

  revalidatePath("/habits");
  return { success: true };
}

export async function toggleHabitLog(habitId: string, date: Date) {
  const user = await ensureUser();
  const dayStart = startOfDay(date);

  // Verify habit ownership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
  });

  if (!habit) {
    return { success: false, error: "Kebiasaan tidak ditemukan" };
  }

  // Check if log already exists
  const existingLog = await prisma.habitLog.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: dayStart,
      },
    },
  });

  if (existingLog) {
    await prisma.habitLog.delete({ where: { id: existingLog.id } });
  } else {
    await prisma.habitLog.create({
      data: {
        habitId,
        userId: user.id,
        date: dayStart,
        completed: true,
      },
    });
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getHabitStats(habitId: string) {
  const user = await ensureUser();

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
    include: {
      logs: {
        where: { completed: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!habit) return null;

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = startOfDay(new Date());
  const sortedDates = habit.logs.map((l) => startOfDay(l.date)).sort((a, b) => b.getTime() - a.getTime());

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = startOfDay(subDays(today, i));
    if (differenceInDays(expectedDate, sortedDates[i]) === 0) {
      tempStreak++;
    } else {
      break;
    }
  }
  currentStreak = tempStreak;

  // Longest streak calculation
  tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = differenceInDays(sortedDates[i - 1], sortedDates[i]);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    totalDays: habit.logs.length,
  };
}
