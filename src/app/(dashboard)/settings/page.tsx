import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@clerk/nextjs";
import { Settings } from "lucide-react";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-indigo-500" />
          Pengaturan
        </h1>
        <p className="text-muted-foreground mt-1">Kelola profil dan preferensi akun.</p>
      </div>
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <UserProfile />
        </CardContent>
      </Card>
    </div>
  );
}
