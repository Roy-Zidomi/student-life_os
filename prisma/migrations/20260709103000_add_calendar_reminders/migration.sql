-- Add Telegram event reminder logs and private iCalendar feed tokens.

CREATE TABLE "EventReminderLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarFeedToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarFeedToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventReminderLog_eventId_channel_type_key"
  ON "EventReminderLog"("eventId", "channel", "type");
CREATE INDEX "EventReminderLog_sentAt_idx" ON "EventReminderLog"("sentAt");

CREATE UNIQUE INDEX "CalendarFeedToken_token_key" ON "CalendarFeedToken"("token");
CREATE UNIQUE INDEX "CalendarFeedToken_userId_key" ON "CalendarFeedToken"("userId");
CREATE INDEX "CalendarFeedToken_token_idx" ON "CalendarFeedToken"("token");

ALTER TABLE "EventReminderLog" ADD CONSTRAINT "EventReminderLog_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarFeedToken" ADD CONSTRAINT "CalendarFeedToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
