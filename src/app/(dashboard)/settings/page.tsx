import { Metadata } from "next";
import { getCurrentUser } from "@/lib/user";
import { SettingsClient } from "./settings-client";
import { getTelegramLinkStatus } from "@/actions/user.actions";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const [dbUser, telegramStatus] = await Promise.all([
    getCurrentUser(),
    getTelegramLinkStatus(),
  ]);

  const initialUser = dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
      }
    : null;

  return <SettingsClient initialUser={initialUser} initialTelegramStatus={telegramStatus} />;
}
