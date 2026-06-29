import { Metadata } from "next";
import { getCurrentUser } from "@/lib/user";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const dbUser = await getCurrentUser();

  const initialUser = dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
      }
    : null;

  return <SettingsClient initialUser={initialUser} />;
}
