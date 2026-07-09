import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

type ReminderType = "H24" | "H1";

const REMINDER_CONFIG: Array<{
  type: ReminderType;
  label: string;
  offsetMs: number;
  windowMs: number;
}> = [
  {
    type: "H24",
    label: "Besok",
    offsetMs: 24 * 60 * 60 * 1000,
    windowMs: 15 * 60 * 1000,
  },
  {
    type: "H1",
    label: "1 jam lagi",
    offsetMs: 60 * 60 * 1000,
    windowMs: 10 * 60 * 1000,
  },
];

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return authHeader === `Bearer ${secret}` || querySecret === secret;
}

function formatJakartaDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildReminderMessage(event: {
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
}, label: string) {
  return [
    `<b>Pengingat Jadwal - ${label}</b>`,
    "",
    `<b>${escapeHtml(event.title)}</b>`,
    `Mulai: ${formatJakartaDateTime(event.startDate)}`,
    `Selesai: ${formatJakartaDateTime(event.endDate)}`,
    event.location ? `Lokasi: ${escapeHtml(event.location)}` : null,
    event.description ? `Catatan: ${escapeHtml(event.description)}` : null,
  ].filter(Boolean).join("\n");
}

async function sendReminderBatch(type: ReminderType, label: string, offsetMs: number, windowMs: number) {
  const now = Date.now();
  const target = now + offsetMs;
  const start = new Date(target - windowMs);
  const end = new Date(target + windowMs);

  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: start,
        lte: end,
      },
      user: {
        telegramAccount: {
          isNot: null,
        },
      },
      reminderLogs: {
        none: {
          channel: "TELEGRAM",
          type,
        },
      },
    },
    include: {
      user: {
        include: {
          telegramAccount: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
    take: 100,
  });

  let sent = 0;
  let failed = 0;

  for (const event of events) {
    const chatId = event.user.telegramAccount?.chatId;
    if (!chatId) continue;

    try {
      await sendTelegramMessage(chatId, buildReminderMessage(event, label));
      await prisma.eventReminderLog.create({
        data: {
          eventId: event.id,
          channel: "TELEGRAM",
          type,
        },
      });
      sent++;
    } catch (error: unknown) {
      failed++;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to send ${type} reminder for event ${event.id}:`, message);
    }
  }

  return { type, checked: events.length, sent, failed };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all(
    REMINDER_CONFIG.map((config) =>
      sendReminderBatch(config.type, config.label, config.offsetMs, config.windowMs)
    )
  );

  return NextResponse.json({
    ok: true,
    results,
  });
}
