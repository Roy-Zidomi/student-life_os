import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 30;

function isValidTelegramSecret(request: NextRequest) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret) return false;

  const incomingSecret = request.headers.get("x-telegram-bot-api-secret-token");
  return incomingSecret === configuredSecret;
}

function isTelegramUpdate(value: unknown): value is TelegramUpdate {
  if (!value || typeof value !== "object") return false;
  return "update_id" in value;
}

export async function POST(request: NextRequest) {
  if (!isValidTelegramSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!isTelegramUpdate(body)) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    await handleTelegramUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Telegram webhook error:", message);
    return NextResponse.json({ error: "Telegram webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Student Life OS Telegram webhook",
  });
}
