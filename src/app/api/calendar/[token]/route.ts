import { NextResponse } from "next/server";
import { addYears, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { buildCalendarIcs } from "@/lib/ics";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const feed = await prisma.calendarFeedToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          name: true,
          events: {
            where: {
              startDate: {
                gte: subMonths(new Date(), 1),
                lte: addYears(new Date(), 1),
              },
            },
            orderBy: { startDate: "asc" },
          },
        },
      },
    },
  });

  if (!feed) {
    return NextResponse.json({ error: "Calendar feed not found" }, { status: 404 });
  }

  const calendarName = feed.user.name
    ? `Student Life OS - ${feed.user.name}`
    : "Student Life OS";
  const ics = buildCalendarIcs(feed.user.events, calendarName);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="student-life-os.ics"',
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
