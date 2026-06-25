"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { startOfDay, endOfDay, addDays, isPast, isToday } from "date-fns";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: "task" | "event" | "wishlist" | "habit";
  link: string;
  severity: "info" | "warning" | "success" | "danger";
  date: string;
}

export async function getNotifications(): Promise<{ success: boolean; data: AppNotification[]; error?: string }> {
  try {
    const user = await ensureUser();
    const notifications: AppNotification[] = [];

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const fortyEightHoursLater = addDays(now, 2);

    // 1. Fetch Tasks (not DONE, with deadlines)
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { not: "DONE" },
        deadline: { not: null },
      },
      orderBy: { deadline: "asc" },
      take: 50,
    });

    tasks.forEach((task) => {
      if (task.deadline) {
        const isPastDue = isPast(task.deadline) && !isToday(task.deadline);
        const isNear = task.deadline <= fortyEightHoursLater;

        if (isPastDue) {
          notifications.push({
            id: `task-overdue-${task.id}`,
            title: `Tugas Terlambat: ${task.title}`,
            description: `Tugas ini telah melewati deadline (${task.deadline.toLocaleDateString("id-ID")}).`,
            type: "task",
            link: "/tasks",
            severity: "danger",
            date: task.deadline.toISOString(),
          });
        } else if (isNear) {
          notifications.push({
            id: `task-near-${task.id}`,
            title: `Tugas Mendekati Batas: ${task.title}`,
            description: `Deadline tugas ini dalam waktu dekat (${task.deadline.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} ${task.deadline.toLocaleDateString("id-ID")}).`,
            type: "task",
            link: "/tasks",
            severity: "warning",
            date: task.deadline.toISOString(),
          });
        }
      }
    });

    // 2. Fetch Events (starting today)
    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
        startDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { startDate: "asc" },
      take: 50,
    });

    events.forEach((event) => {
      notifications.push({
        id: `event-${event.id}`,
        title: `Agenda Hari Ini: ${event.title}`,
        description: `Mulai pukul ${event.startDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} ${event.location ? `@ ${event.location}` : ""}`,
        type: "event",
        link: "/calendar",
        severity: "info",
        date: event.startDate.toISOString(),
      });
    });

    // 3. Fetch Wishlist Items
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (wishlistItems.length > 0) {
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        select: { amount: true, type: true },
      });

      const totalIncome = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((acc, t) => acc + t.amount, 0);

      const totalExpense = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((acc, t) => acc + t.amount, 0);

      const currentSavings = user.initialBalance + totalIncome - totalExpense;

      wishlistItems.forEach((item) => {
        if (currentSavings >= item.targetPrice) {
          notifications.push({
            id: `wishlist-${item.id}`,
            title: `Target Tabungan Tercapai: ${item.name}`,
            description: `Saldo tabungan Anda saat ini (Rp ${currentSavings.toLocaleString("id-ID")}) sudah cukup untuk membeli barang ini!`,
            type: "wishlist",
            link: "/wishlist",
            severity: "success",
            date: item.createdAt.toISOString(),
          });
        }
      });
    }

    // 4. Fetch Habits (not completed today)
    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      include: {
        logs: {
          where: {
            date: todayStart,
          },
        },
      },
      take: 50,
    });

    habits.forEach((habit) => {
      const isCompletedToday = habit.logs.length > 0;
      if (!isCompletedToday) {
        notifications.push({
          id: `habit-${habit.id}-${todayStart.getTime()}`,
          title: `Lengkapi Kebiasaan: ${habit.name}`,
          description: `Anda belum menandai kebiasaan "${habit.name}" hari ini.`,
          type: "habit",
          link: "/habits",
          severity: "info",
          date: new Date().toISOString(),
        });
      }
    });

    // Sort: danger -> warning -> success -> info
    const severityWeight = { danger: 4, warning: 3, success: 2, info: 1 };
    notifications.sort((a, b) => {
      const weightDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return { success: true, data: notifications };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching notifications:", message);
    return { success: false, error: "Gagal memuat notifikasi", data: [] };
  }
}
