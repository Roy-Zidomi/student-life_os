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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 z-40 flex flex-col rounded-3xl border border-white/8 bg-card/60 backdrop-blur-xl transition-all duration-300 shadow-xl",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center gap-2 border-b border-white/8 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/25">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        {!collapsed && (
          <span className="font-heading text-sm font-extrabold tracking-widest text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            STUDENTOS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-2 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#1a1f37]/70 text-white font-bold shadow-md"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-[#1a1f37] text-primary"
              )}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!collapsed && <span className="text-xs font-semibold tracking-wide">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Toggle Button */}
      <div className="border-t border-white/8 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-muted-foreground hover:text-white hover:bg-white/5"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Tutup</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
