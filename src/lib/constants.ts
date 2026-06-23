// App Constants

export const APP_NAME = "Student Life OS";
export const APP_DESCRIPTION = "Platform produktivitas all-in-one untuk mahasiswa";

// Grade mapping for Indonesian university system
export const GRADE_MAP: Record<string, number> = {
  "A": 4.0,
  "AB": 3.5,
  "B": 3.0,
  "BC": 2.5,
  "C": 2.0,
  "D": 1.0,
  "E": 0.0,
};

export const GRADE_OPTIONS = ["A", "AB", "B", "BC", "C", "D", "E"];

// Priority colors
export const PRIORITY_COLORS = {
  LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
} as const;

// Status colors
export const STATUS_COLORS = {
  TODO: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DONE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
} as const;

// Event type colors
export const EVENT_TYPE_COLORS = {
  CLASS: "#6366f1",
  EXAM: "#ef4444",
  PRESENTATION: "#f59e0b",
  MEETING: "#3b82f6",
  OTHER: "#8b5cf6",
} as const;

// Transaction categories
export const EXPENSE_CATEGORIES = [
  { value: "FOOD", label: "Makanan", icon: "🍔" },
  { value: "TRANSPORTATION", label: "Transportasi", icon: "🚗" },
  { value: "EDUCATION", label: "Pendidikan", icon: "📚" },
  { value: "ENTERTAINMENT", label: "Hiburan", icon: "🎮" },
  { value: "HEALTH", label: "Kesehatan", icon: "💊" },
  { value: "OTHER", label: "Lainnya", icon: "📦" },
] as const;

export const INCOME_CATEGORIES = [
  { value: "SCHOLARSHIP", label: "Beasiswa", icon: "🎓" },
  { value: "SALARY", label: "Gaji", icon: "💰" },
  { value: "ALLOWANCE", label: "Uang Saku", icon: "💵" },
  { value: "FREELANCE", label: "Freelance", icon: "💻" },
  { value: "OTHER", label: "Lainnya", icon: "📦" },
] as const;

// Pomodoro defaults
export const POMODORO_FOCUS_MINUTES = 25;
export const POMODORO_BREAK_MINUTES = 5;
export const POMODORO_LONG_BREAK_MINUTES = 15;

// Navigation items
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/tasks", label: "Tugas", icon: "CheckSquare" },
  { href: "/calendar", label: "Kalender", icon: "Calendar" },
  { href: "/notes", label: "Catatan", icon: "FileText" },
  { href: "/study", label: "Belajar", icon: "Timer" },
  { href: "/habits", label: "Kebiasaan", icon: "Target" },
  { href: "/finance", label: "Keuangan", icon: "Wallet" },
  { href: "/gpa", label: "IPK", icon: "GraduationCap" },
  { href: "/analytics", label: "Analitik", icon: "BarChart3" },
  { href: "/ai-assistant", label: "AI Assistant", icon: "Bot" },
] as const;
