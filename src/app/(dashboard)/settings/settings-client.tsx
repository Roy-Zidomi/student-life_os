"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, User, Settings } from "lucide-react";
import { updateUserProfile } from "@/actions/user.actions";
import { UserProfile } from "@clerk/nextjs";

interface UserProfileData {
  name: string | null;
  email: string;
}

export function SettingsClient({ initialUser }: { initialUser: UserProfileData | null }) {
  const [name, setName] = useState(initialUser?.name || "");
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateUserProfile(name.trim());
        if (result.success) {
          toast.success("Profil berhasil diperbarui!");
        } else {
          toast.error(result.error || "Gagal memperbarui profil.");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat memperbarui profil.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Pages / Settings
        </span>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Pengaturan
        </h1>
        <p className="text-xs text-muted-foreground">Kelola profil dan preferensi akun Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 gap-4">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "profile"
              ? "border-primary text-white"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          Profil Aplikasi
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "account"
              ? "border-primary text-white"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          Akun & Keamanan
        </button>
      </div>

      {activeTab === "profile" ? (
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Detail Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Alamat Email (Clerk Auth)
              </Label>
              <Input
                id="email"
                type="email"
                value={initialUser?.email || ""}
                disabled
                className="border-white/8 bg-white/5 text-muted-foreground text-xs h-9 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-white">
                Nama Pengguna / Panggilan
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan nama panggilan Anda..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-white/8 bg-[#060b26]/60 text-white text-xs h-9 focus:border-primary/50"
              />
              <p className="text-[10px] text-muted-foreground">
                Nama ini akan digunakan sebagai nama sapaan di dashboard Anda.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg">
          <CardContent className="p-4 sm:p-6 overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              <UserProfile
                appearance={{
                  variables: {
                    colorBackground: "#060b26",
                    colorForeground: "#ffffff",
                    colorMutedForeground: "#a0aec0",
                    colorPrimary: "#0075ff",
                  },
                  elements: {
                    card: "bg-transparent border-none shadow-none p-0 w-full",
                    navbar: "hidden", // Hide navigation menu of UserProfile to save space
                    pageScrollable: "p-0 w-full",
                    profileSection__profile: "border-none",
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
