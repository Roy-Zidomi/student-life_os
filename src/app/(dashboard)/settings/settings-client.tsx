"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Copy, Loader2, RefreshCw, Save, Send, Settings, Trash2, Unlink, User } from "lucide-react";
import {
  createOrRotateCalendarFeedToken,
  createTelegramLinkCode,
  deleteCalendarFeedToken,
  disconnectTelegramAccount,
  updateUserProfile,
} from "@/actions/user.actions";
import { UserProfile } from "@clerk/nextjs";

interface UserProfileData {
  name: string | null;
  email: string;
}

interface TelegramStatusData {
  account: {
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    linkedAt: string;
  } | null;
  activeCode: {
    code: string;
    expiresAt: string;
  } | null;
  calendarFeed: {
    token: string;
    createdAt: string;
  } | null;
}

export function SettingsClient({
  initialUser,
  initialTelegramStatus,
}: {
  initialUser: UserProfileData | null;
  initialTelegramStatus: TelegramStatusData;
}) {
  const [name, setName] = useState(initialUser?.name || "");
  const [isPending, startTransition] = useTransition();
  const [isTelegramPending, startTelegramTransition] = useTransition();
  const [isCalendarPending, startCalendarTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"profile" | "telegram" | "calendar" | "account">("profile");
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusData>(initialTelegramStatus);

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
      } catch {
        toast.error("Terjadi kesalahan saat memperbarui profil.");
      }
    });
  };

  const handleCreateTelegramCode = () => {
    startTelegramTransition(async () => {
      try {
        const result = await createTelegramLinkCode();
        if (result.success && result.data) {
          setTelegramStatus((current) => ({
            ...current,
            activeCode: result.data,
          }));
          toast.success("Kode link Telegram berhasil dibuat.");
        } else {
          toast.error("Gagal membuat kode link Telegram.");
        }
      } catch {
        toast.error("Terjadi kesalahan saat membuat kode Telegram.");
      }
    });
  };

  const handleDisconnectTelegram = () => {
    startTelegramTransition(async () => {
      try {
        const result = await disconnectTelegramAccount();
        if (result.success) {
          setTelegramStatus((current) => ({ ...current, account: null, activeCode: null }));
          toast.success("Telegram berhasil diputuskan.");
        } else {
          toast.error("Gagal memutuskan Telegram.");
        }
      } catch {
        toast.error("Terjadi kesalahan saat memutuskan Telegram.");
      }
    });
  };

  const copyLinkCommand = async () => {
    if (!telegramStatus.activeCode) return;
    const command = `/link ${telegramStatus.activeCode.code}`;
    try {
      await navigator.clipboard.writeText(command);
      toast.success("Command link disalin.");
    } catch {
      toast.error("Gagal menyalin command.");
    }
  };

  const getCalendarFeedUrl = () => {
    if (!telegramStatus.calendarFeed) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/calendar/${telegramStatus.calendarFeed.token}`;
  };

  const handleCreateOrRotateCalendarFeed = () => {
    startCalendarTransition(async () => {
      try {
        const result = await createOrRotateCalendarFeedToken();
        if (result.success && result.data) {
          setTelegramStatus((current) => ({
            ...current,
            calendarFeed: result.data,
          }));
          toast.success("Link kalender berhasil dibuat.");
        } else {
          toast.error("Gagal membuat link kalender.");
        }
      } catch {
        toast.error("Terjadi kesalahan saat membuat link kalender.");
      }
    });
  };

  const handleDeleteCalendarFeed = () => {
    startCalendarTransition(async () => {
      try {
        const result = await deleteCalendarFeedToken();
        if (result.success) {
          setTelegramStatus((current) => ({
            ...current,
            calendarFeed: null,
          }));
          toast.success("Link kalender berhasil dimatikan.");
        } else {
          toast.error("Gagal mematikan link kalender.");
        }
      } catch {
        toast.error("Terjadi kesalahan saat mematikan link kalender.");
      }
    });
  };

  const copyCalendarFeedUrl = async () => {
    const url = getCalendarFeedUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link kalender disalin.");
    } catch {
      toast.error("Gagal menyalin link kalender.");
    }
  };

  const telegramDisplayName = telegramStatus.account
    ? telegramStatus.account.username
      ? `@${telegramStatus.account.username}`
      : [telegramStatus.account.firstName, telegramStatus.account.lastName].filter(Boolean).join(" ") || "Telegram user"
    : null;

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
          onClick={() => setActiveTab("telegram")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "telegram"
              ? "border-primary text-white"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          Telegram Bot
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "calendar"
              ? "border-primary text-white"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          Kalender HP
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
      ) : activeTab === "telegram" ? (
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Integrasi Telegram Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status Koneksi
              </p>
              {telegramStatus.account ? (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{telegramDisplayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Terhubung sejak{" "}
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(telegramStatus.account.linkedAt))}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnectTelegram}
                    disabled={isTelegramPending}
                    className="h-9 rounded-xl text-xs"
                  >
                    {isTelegramPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unlink className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Putuskan
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Belum ada akun Telegram yang terhubung.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white">Hubungkan Telegram</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Buat kode link sekali pakai, buka bot Telegram, lalu kirim command yang muncul di bawah.
                  Kode berlaku 10 menit.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleCreateTelegramCode}
                  disabled={isTelegramPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-5 py-2.5 rounded-xl font-bold"
                >
                  {isTelegramPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Membuat Kode...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Buat Kode Link
                    </>
                  )}
                </Button>

                {telegramStatus.activeCode && (
                  <Button
                    variant="outline"
                    onClick={copyLinkCommand}
                    className="text-xs px-5 py-2.5 rounded-xl font-bold"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Salin Command
                  </Button>
                )}
              </div>

              {telegramStatus.activeCode && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Command Telegram
                  </p>
                  <div className="mt-2 rounded-lg border border-white/8 bg-[#020617] px-3 py-2 font-mono text-sm text-white">
                    /link {telegramStatus.activeCode.code}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Kedaluwarsa:{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(telegramStatus.activeCode.expiresAt))}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : activeTab === "calendar" ? (
        <Card className="border-white/8 bg-[#060b26]/60 backdrop-blur-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Kalender HP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Link Subscribe Calendar
              </p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Gunakan link ini untuk subscribe jadwal Student Life OS di Google Calendar,
                Apple Calendar, atau aplikasi kalender lain yang mendukung iCalendar.
                Event berisi alarm bawaan 1 hari dan 1 jam sebelum jadwal.
              </p>

              {telegramStatus.calendarFeed ? (
                <div className="mt-4 space-y-3">
                  <div className="break-all rounded-lg border border-white/8 bg-[#020617] px-3 py-2 font-mono text-xs text-white">
                    {getCalendarFeedUrl()}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Dibuat:{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(telegramStatus.calendarFeed.createdAt))}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={copyCalendarFeedUrl}
                      className="h-9 rounded-xl text-xs"
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Salin Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCreateOrRotateCalendarFeed}
                      disabled={isCalendarPending}
                      className="h-9 rounded-xl text-xs"
                    >
                      {isCalendarPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Reset Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDeleteCalendarFeed}
                      disabled={isCalendarPending}
                      className="h-9 rounded-xl text-xs"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Matikan Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    onClick={handleCreateOrRotateCalendarFeed}
                    disabled={isCalendarPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-5 py-2.5 rounded-xl font-bold"
                  >
                    {isCalendarPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Membuat Link...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Buat Link Kalender
                      </>
                    )}
                  </Button>
                </div>
              )}
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
