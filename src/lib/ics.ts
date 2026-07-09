type CalendarEventForIcs = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
  updatedAt: Date;
  createdAt: Date;
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldIcsLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }

  chunks.push(remaining);
  return chunks.join("\r\n");
}

export function buildCalendarIcs(events: CalendarEventForIcs[], calendarName = "Student Life OS") {
  const now = formatIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Student Life OS//Calendar//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "X-WR-TIMEZONE:Asia/Jakarta",
  ];

  for (const event of events) {
    const description = [
      event.description,
      "Reminder bawaan: 1 hari dan 1 jam sebelum jadwal.",
    ].filter(Boolean).join("\n\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@student-life-os`,
      `DTSTAMP:${now}`,
      `CREATED:${formatIcsDate(event.createdAt)}`,
      `LAST-MODIFIED:${formatIcsDate(event.updatedAt)}`,
      `DTSTART:${formatIcsDate(event.startDate)}`,
      `DTEND:${formatIcsDate(event.endDate)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      event.location ? `LOCATION:${escapeIcsText(event.location)}` : "",
      description ? `DESCRIPTION:${escapeIcsText(description)}` : "",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`Besok: ${event.title}`)}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`1 jam lagi: ${event.title}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return lines
    .filter(Boolean)
    .map(foldIcsLine)
    .join("\r\n");
}
