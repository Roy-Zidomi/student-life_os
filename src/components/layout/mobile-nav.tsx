"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FileText,
  Timer,
  Target,
  Wallet,
  GraduationCap,
  BarChart3,
  Bot,
  Menu,
  Sparkles,
  Heart,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FileText,
  Timer,
  Target,
  Wallet,
  GraduationCap,
  BarChart3,
  Bot,
  Heart,
  Settings,
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            StudentOS
          </span>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-foreground" : "")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
