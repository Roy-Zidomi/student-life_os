-- Add Telegram bot account linking and conversation session storage.

CREATE TABLE "TelegramAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramLinkCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLinkCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramBotSession" (
    "telegramUserId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'IDLE',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramBotSession_pkey" PRIMARY KEY ("telegramUserId")
);

CREATE UNIQUE INDEX "TelegramAccount_userId_key" ON "TelegramAccount"("userId");
CREATE UNIQUE INDEX "TelegramAccount_telegramUserId_key" ON "TelegramAccount"("telegramUserId");
CREATE UNIQUE INDEX "TelegramAccount_chatId_key" ON "TelegramAccount"("chatId");
CREATE INDEX "TelegramAccount_telegramUserId_idx" ON "TelegramAccount"("telegramUserId");
CREATE INDEX "TelegramAccount_chatId_idx" ON "TelegramAccount"("chatId");

CREATE UNIQUE INDEX "TelegramLinkCode_code_key" ON "TelegramLinkCode"("code");
CREATE INDEX "TelegramLinkCode_userId_idx" ON "TelegramLinkCode"("userId");
CREATE INDEX "TelegramLinkCode_expiresAt_idx" ON "TelegramLinkCode"("expiresAt");

CREATE INDEX "TelegramBotSession_chatId_idx" ON "TelegramBotSession"("chatId");
CREATE INDEX "TelegramBotSession_updatedAt_idx" ON "TelegramBotSession"("updatedAt");

ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelegramLinkCode" ADD CONSTRAINT "TelegramLinkCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
