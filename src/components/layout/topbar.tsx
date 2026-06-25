"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { 
  Bell, 
  CheckSquare, 
  Calendar, 
  Heart, 
  Target, 
  X, 
  Trash2,
  Inbox,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, AppNotification } from "@/actions/notification.actions";
import Link from "next/link";

export function Topbar() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load dismissed notifications from localStorage on client side
  useEffect(() => {
    const saved = localStorage.getItem("dismissed_notifications");
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse dismissed notifications", e);
      }
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    const res = await getNotifications();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120_000);
    return () => clearInterval(interval);
  }, []);

  const activeNotifications = notifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  const dismissNotification = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    localStorage.setItem("dismissed_notifications", JSON.stringify(updated));
  };

  const getIcon = (type: AppNotification["type"], severity: AppNotification["severity"]) => {
    switch (type) {
      case "task":
        return <CheckSquare className={`h-4 w-4 ${severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />;
      case "event":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "wishlist":
        return <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500" />;
      case "habit":
        return <Target className="h-4 w-4 text-indigo-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getSeverityBg = (severity: AppNotification["severity"]) => {
    switch (severity) {
      case "danger":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20";
      default:
        return "bg-zinc-500/10 border-zinc-500/20";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Left - Page Title area */}
      <div className="flex items-center gap-4">
        {/* Dynamic page title will be handled by each page */}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {activeNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white animate-pulse">
                    {activeNotifications.length}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent className="w-80 p-0 sm:w-96 border border-border bg-popover text-popover-foreground shadow-lg rounded-xl overflow-hidden" align="end">
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/40">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-sm">Notifikasi</span>
              </div>
              {activeNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Bersihkan
                </Button>
              )}
            </div>

            <ScrollArea className="max-h-[350px]">
              {activeNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/60 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium text-foreground">Tidak ada notifikasi baru</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Semua tugas, jadwal, dan tabungan Anda terpantau aman!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {activeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="group flex gap-3 p-4 hover:bg-muted/50 transition relative"
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${getSeverityBg(notification.severity)}`}>
                        {getIcon(notification.type, notification.severity)}
                      </div>
                      
                      <div className="flex-1 space-y-1 pr-6">
                        <Link
                          href={notification.link}
                          onClick={() => dismissNotification(notification.id)}
                          className="font-medium text-sm leading-tight hover:underline text-foreground block"
                        >
                          {notification.title}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissNotification(notification.id)}
                        className="absolute right-3 top-3 h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted transition-opacity"
                        aria-label="Tutup"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="ml-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
