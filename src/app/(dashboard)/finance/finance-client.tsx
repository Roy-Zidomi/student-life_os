"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Target, Coins } from "lucide-react";
import { createTransaction, deleteTransaction } from "@/actions/finance.actions";
import { createWishlistItem, addSavingsToWishlist, deleteWishlistItem } from "@/actions/wishlist.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
}

interface FinanceStatsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; amount: number }[];
}

interface WishlistItem {
  id: string;
  name: string;
  targetPrice: number;
  savedAmount: number;
  isCompleted: boolean;
  createdAt: Date;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Makanan", TRANSPORTATION: "Transportasi", EDUCATION: "Pendidikan",
  ENTERTAINMENT: "Hiburan", HEALTH: "Kesehatan", SCHOLARSHIP: "Beasiswa",
  SALARY: "Gaji", ALLOWANCE: "Uang Saku", FREELANCE: "Freelance", OTHER: "Lainnya",
};

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: "🍔", TRANSPORTATION: "🚗", EDUCATION: "📚", ENTERTAINMENT: "🎮",
  HEALTH: "💊", SCHOLARSHIP: "🎓", SALARY: "💰", ALLOWANCE: "💵",
  FREELANCE: "💻", OTHER: "📦",
};

export default function FinancePageClient({
  initialTransactions,
  initialStats,
  initialWishlist,
}: {
  initialTransactions: TransactionItem[];
  initialStats: FinanceStatsData;
  initialWishlist: WishlistItem[];
}) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);
  const [stats, setStats] = useState<FinanceStatsData>(initialStats);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(initialWishlist);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Wishlist dialog states
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlistName, setWishlistName] = useState("");
  const [wishlistTarget, setWishlistTarget] = useState("");
  const [wishlistInitialSaved, setWishlistInitialSaved] = useState("");

  // Add savings dialog states
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [savingsAmount, setSavingsAmount] = useState("");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [category, setCategory] = useState("OTHER");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleAddWishlistSubmit = () => {
    if (!wishlistName.trim() || !wishlistTarget) {
      toast.error("Nama barang dan target harga wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createWishlistItem({
          name: wishlistName.trim(),
          targetPrice: Number(wishlistTarget),
          savedAmount: Number(wishlistInitialSaved || 0),
        });
        if (result.success && result.data) {
          setWishlist((prev) => [result.data as WishlistItem, ...prev]);
          toast.success("Item wishlist berhasil ditambahkan");
          setWishlistDialogOpen(false);
          setWishlistName("");
          setWishlistTarget("");
          setWishlistInitialSaved("");
        }
      } catch {
        toast.error("Gagal menambahkan item wishlist");
      }
    });
  };

  const handleAddSavingsSubmit = () => {
    if (!selectedWishlistItem || !savingsAmount) {
      toast.error("Jumlah tabungan wajib diisi");
      return;
    }
    const amt = Number(savingsAmount);
    startTransition(async () => {
      try {
        const result = await addSavingsToWishlist(selectedWishlistItem.id, amt);
        if (result.success && result.data) {
          setWishlist((prev) =>
            prev.map((item) => (item.id === selectedWishlistItem.id ? (result.data as WishlistItem) : item))
          );
          toast.success(amt >= 0 ? "Tabungan berhasil ditambahkan" : "Tabungan berhasil ditarik");
          setSavingsDialogOpen(false);
          setSelectedWishlistItem(null);
          setSavingsAmount("");
        } else if (!result.success) {
          toast.error(result.error || "Gagal memperbarui tabungan");
        }
      } catch {
        toast.error("Gagal memperbarui tabungan");
      }
    });
  };

  const handleDeleteWishlist = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteWishlistItem(id);
        if (result.success) {
          setWishlist((prev) => prev.filter((item) => item.id !== id));
          toast.success("Item wishlist berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus item wishlist");
      }
    });
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("EXPENSE");
    setCategory("OTHER");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = () => {
    if (!description.trim() || !amount) {
      toast.error("Deskripsi dan jumlah wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createTransaction({
          description: description.trim(),
          amount: Number(amount),
          type,
          category,
          date,
        });
        if (result.success && result.data) {
          setTransactions((prev) => [result.data as TransactionItem, ...prev]);
          // Update stats
          const amt = Number(amount);
          setStats((prev) => ({
            ...prev,
            totalIncome: type === "INCOME" ? prev.totalIncome + amt : prev.totalIncome,
            totalExpense: type === "EXPENSE" ? prev.totalExpense + amt : prev.totalExpense,
            balance: type === "INCOME" ? prev.balance + amt : prev.balance - amt,
          }));
          toast.success("Transaksi berhasil ditambahkan");
          setDialogOpen(false);
          resetForm();
        }
      } catch {
        toast.error("Gagal menambahkan transaksi");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteTransaction(id);
        if (result.success) {
          const deleted = transactions.find((t) => t.id === id);
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          if (deleted) {
            setStats((prev) => ({
              ...prev,
              totalIncome: deleted.type === "INCOME" ? prev.totalIncome - deleted.amount : prev.totalIncome,
              totalExpense: deleted.type === "EXPENSE" ? prev.totalExpense - deleted.amount : prev.totalExpense,
              balance: deleted.type === "INCOME" ? prev.balance - deleted.amount : prev.balance + deleted.amount,
            }));
          }
          toast.success("Transaksi berhasil dihapus");
        }
      } catch {
        toast.error("Gagal menghapus transaksi");
      }
    });
  };

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Simple pie chart using CSS conic-gradient
  const totalExpense = stats.categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const totalSaved = wishlist.reduce((acc, item) => acc + item.savedAmount, 0);
  const totalTarget = wishlist.reduce((acc, item) => acc + item.targetPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keuangan</h1>
          <p className="text-muted-foreground mt-1">Lacak pemasukan dan pengeluaranmu.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25" />}>
            <Plus className="mr-2 h-4 w-4" />
            Transaksi Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Transaksi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Tabs value={type} onValueChange={(v) => { setType(v as "INCOME" | "EXPENSE"); setCategory("OTHER"); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="EXPENSE">💸 Pengeluaran</TabsTrigger>
                  <TabsTrigger value="INCOME">💰 Pemasukan</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-2">
                <Label>Deskripsi *</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Makan siang" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah (Rp) *</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val || "OTHER")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                {isPending ? "Menyimpan..." : "Tambah Transaksi"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pemasukan</p>
                <p className="text-xl font-bold text-emerald-500 mt-1">{formatRupiah(stats.totalIncome)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pengeluaran</p>
                <p className="text-xl font-bold text-red-500 mt-1">{formatRupiah(stats.totalExpense)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold mt-1 ${stats.balance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatRupiah(stats.balance)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <Wallet className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tabungan</p>
                <p className="text-xl font-bold text-indigo-400 mt-1">
                  {formatRupiah(totalSaved)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Target: {formatRupiah(totalTarget)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <Target className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="transactions">📊 Transaksi & Analitik</TabsTrigger>
            <TabsTrigger value="wishlist">🎯 Wishlist & Tabungan</TabsTrigger>
          </TabsList>

          <TabsContent value="wishlist" className="m-0">
            <Dialog open={wishlistDialogOpen} onOpenChange={setWishlistDialogOpen}>
              <DialogTrigger render={<Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Wishlist
              </Button>} />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Item Wishlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nama Barang *</Label>
                    <Input value={wishlistName} onChange={(e) => setWishlistName(e.target.value)} placeholder="Contoh: Laptop Baru, Liburan" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Harga (Rp) *</Label>
                      <Input type="number" value={wishlistTarget} onChange={(e) => setWishlistTarget(e.target.value)} placeholder="15000000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tabungan Awal (Rp)</Label>
                      <Input type="number" value={wishlistInitialSaved} onChange={(e) => setWishlistInitialSaved(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <Button onClick={handleAddWishlistSubmit} disabled={isPending} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    {isPending ? "Menyimpan..." : "Tambah ke Wishlist"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </div>

        <TabsContent value="transactions" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Category Breakdown */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm">Distribusi Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada data pengeluaran.</p>
                ) : (
                  stats.categoryBreakdown.map((item) => {
                    const percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category] || item.category}</span>
                          <span className="font-medium">{formatRupiah(item.amount)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-accent">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Transaction List */}
            <Card className="border-border/50 bg-card/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Riwayat Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {transactions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Belum ada transaksi.</p>
                ) : (
                  transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg bg-accent/30 p-3 group hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{CATEGORY_ICONS[tx.category] || "📦"}</span>
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.date), "dd MMM yyyy", { locale: localeId })} • {CATEGORY_LABELS[tx.category] || tx.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${tx.type === "INCOME" ? "text-emerald-500" : "text-red-500"}`}>
                          {tx.type === "INCOME" ? "+" : "-"}{formatRupiah(tx.amount)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(tx.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wishlist" className="mt-0">
          {wishlist.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 mb-4">
                <Target className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold">Wishlist Kosong</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                Mulai menabung dengan menambahkan item impianmu! Uang yang terkumpul akan terhitung dalam total tabungan Anda.
              </p>
              <Button onClick={() => setWishlistDialogOpen(true)} className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <Plus className="mr-2 h-4 w-4" /> Tambah Item Pertama
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((item) => {
                const percent = Math.min(100, Math.round((item.savedAmount / item.targetPrice) * 100));
                return (
                  <Card key={item.id} className="border-border/50 bg-card/50 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Dibuat: {format(new Date(item.createdAt), "dd MMM yyyy", { locale: localeId })}
                          </p>
                        </div>
                        {item.isCompleted && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30">
                            Tercapai 🎉
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Uang Terkumpul</span>
                          <span className="font-semibold text-indigo-400">
                            {formatRupiah(item.savedAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Target: {formatRupiah(item.targetPrice)}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-accent overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              item.isCompleted ? "from-emerald-500 to-green-500" : "from-indigo-500 to-purple-500"
                            } transition-all duration-300`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setSelectedWishlistItem(item);
                            setSavingsAmount("");
                            setSavingsDialogOpen(true);
                          }}
                        >
                          <Coins className="mr-1 h-3.5 w-3.5" />
                          Update Tabungan
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-9 w-9"
                          onClick={() => handleDeleteWishlist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Withdraw Savings Dialog */}
      <Dialog open={savingsDialogOpen} onOpenChange={(open) => { setSavingsDialogOpen(open); if (!open) setSelectedWishlistItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Tabungan: {selectedWishlistItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Jumlah Dana (Rp) *</Label>
              <Input
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                placeholder="500000"
              />
              <p className="text-xs text-muted-foreground">
                Gunakan nilai positif (+) untuk menambah tabungan, atau negatif (-) untuk menarik tabungan.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (savingsAmount) {
                    setSavingsAmount(`-${Math.abs(Number(savingsAmount))}`);
                  }
                }}
                variant="outline"
                className="flex-1 text-red-500 hover:text-red-600"
                disabled={isPending}
              >
                Tarik Dana
              </Button>
              <Button
                onClick={handleAddSavingsSubmit}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                disabled={isPending}
              >
                {isPending ? "Menyimpan..." : "Tambah Dana"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
